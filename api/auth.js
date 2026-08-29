import { Redis } from "@upstash/redis";
import { randomBytes } from "crypto";
import { takeSnapshot } from "./_backup.js";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const MAX_FAILURES = 5;
const LOCKOUT_TTL = 60 * 30;
const SESSION_TTL = 60 * 60 * 12; // 12 hours
const TTL = 60 * 60 * 24 * 90;
const IP_LIMIT = 10;
const IP_WINDOW = 60 * 5;

function cleanPin(raw) {
  return String(raw || "").replace(/^"+|"+$/g, "").trim();
}

async function pushHoneypotHeadline(room) {
  try {
    const existing = await redis.get(`${room}:headlines`);
    const headlines = Array.isArray(existing) ? existing : [];
    await redis.set(`${room}:headlines`, [{
      headline: "UNAUTHORIZED ACCESS ATTEMPT DETECTED AND LOGGED",
      subtext: "Security incident filed. Stellar Financial Network monitoring team has been notified. Have a nice day.",
      date: { year: 2122, cycle: 0 },
      id: Date.now(),
    }, ...headlines], { ex: TTL });
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { room, pin } = req.body;
  if (!room || !pin) return res.status(400).json({ error: "missing fields" });
  if (!/^[A-Z0-9]{6}$/i.test(room)) return res.status(400).json({ error: "invalid room" });

  // IP rate limit
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";
  const ipKey = `auth-ip-rl:${ip}`;
  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) await redis.expire(ipKey, IP_WINDOW);
  if (ipCount > IP_LIMIT) return res.status(429).json({ error: "rate limited" });

  // Room lockout
  const lockout = await redis.get(`lockout:${room}`);
  if (lockout) return res.status(423).json({ error: "locked" });

  // Fetch and compare PIN
  const rawStored = await redis.get(`${room}:pin`);
  if (!rawStored) return res.status(403).json({ error: "room not initialized" });
  const storedPin = cleanPin(rawStored);

  if (pin !== storedPin) {
    const failKey = `failures:${room}`;
    const count = await redis.incr(failKey);
    if (count === 1) await redis.expire(failKey, LOCKOUT_TTL);
    await pushHoneypotHeadline(room);
    if (count >= MAX_FAILURES) {
      await redis.set(`lockout:${room}`, "1", { ex: LOCKOUT_TTL });
      await redis.del(failKey);
      return res.status(423).json({ error: "locked" });
    }
    return res.status(403).json({ error: "denied", remaining: MAX_FAILURES - count });
  }

  // Success — clear failures, generate session token
  await redis.del(`failures:${room}`);
  await redis.del(`lockout:${room}`);
  await takeSnapshot(redis, room);

  const token = randomBytes(32).toString("hex");
  await redis.set(`session:${room}:${token}`, "1", { ex: SESSION_TTL });

  return res.json({ ok: true, token });
}
