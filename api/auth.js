import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const MAX_FAILURES = 5;
const LOCKOUT_TTL = 60 * 30; // 30 minutes

function cleanPin(raw) {
  return String(raw || "000000").replace(/^"+|"+$/g, "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { room, pin } = req.body;
  if (!room || !pin) return res.status(400).json({ error: "missing fields" });
  if (!/^[A-Z0-9]{6}$/i.test(room)) return res.status(400).json({ error: "invalid room" });

  // Check lockout first
  const lockout = await redis.get(`lockout:${room}`);
  if (lockout) {
    return res.status(423).json({ error: "locked" });
  }

  // Fetch stored PIN
  const rawStored = await redis.get(`${room}:pin`);
  const storedPin = rawStored ? cleanPin(rawStored) : "000000";

  if (pin !== storedPin) {
    // Record failure
    const failKey = `failures:${room}`;
    const count = await redis.incr(failKey);
    if (count === 1) await redis.expire(failKey, LOCKOUT_TTL);
    if (count >= MAX_FAILURES) {
      await redis.set(`lockout:${room}`, "1", { ex: LOCKOUT_TTL });
      await redis.del(failKey);
      return res.status(423).json({ error: "locked" });
    }
    return res.status(403).json({ error: "denied", remaining: MAX_FAILURES - count });
  }

  // Success — clear failures
  await redis.del(`failures:${room}`);
  await redis.del(`lockout:${room}`);
  return res.json({ ok: true });
}
