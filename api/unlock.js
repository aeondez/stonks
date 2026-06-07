import { applyCors } from "./_cors.js";
import { Redis } from "@upstash/redis";
import { timingSafeEqual, randomBytes } from "crypto";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const RECOVERY = process.env.RECOVERY_PASSPHRASE || "omnicorp-is-watching";

const RL_MAX = 5;
const RL_WINDOW = 60 * 15; // 15 minutes per IP

function safeCompare(a, b) {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    // Must be same length for timingSafeEqual — pad to avoid length oracle
    if (bufA.length !== bufB.length) {
      // Still do a comparison to consume constant time, then return false
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const { room, passphrase } = req.body;
  if (!room || !passphrase) return res.status(400).json({ error: "missing fields" });
  if (!/^[A-Z0-9]{6}$/i.test(room)) return res.status(400).json({ error: "invalid room" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";
  const rlKey = `unlock-rl:${ip}`;
  const count = await redis.incr(rlKey);
  if (count === 1) await redis.expire(rlKey, RL_WINDOW);
  if (count > RL_MAX) return res.status(429).json({ error: "rate limited" });

  // Direct constant-time comparison — no HMAC with a known key
  if (!safeCompare(passphrase, RECOVERY)) {
    return res.status(403).json({ error: "invalid passphrase" });
  }

  await redis.del(`lockout:${room}`);
  await redis.del(`failures:${room}`);
  return res.json({ ok: true });
}
