import { Redis } from "@upstash/redis";
import { createHmac } from "crypto";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Recovery passphrase is set via RECOVERY_PASSPHRASE env var in Vercel
// Falls back to a hardcoded default — change this in Vercel settings
const RECOVERY = process.env.RECOVERY_PASSPHRASE || "omnicorp-is-watching";

const RL_MAX = 5;
const RL_WINDOW = 60 * 15; // 15 minutes

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { room, passphrase } = req.body;
  if (!room || !passphrase) return res.status(400).json({ error: "missing fields" });
  if (!/^[A-Z0-9]{6}$/i.test(room)) return res.status(400).json({ error: "invalid room" });

  // Rate limit unlock attempts per IP
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";
  const rlKey = `unlock-rl:${ip}`;
  const count = await redis.incr(rlKey);
  if (count === 1) await redis.expire(rlKey, RL_WINDOW);
  if (count > RL_MAX) return res.status(429).json({ error: "rate limited" });

  // Constant-time comparison to prevent timing attacks
  const expected = createHmac("sha256", "stonks").update(RECOVERY).digest("hex");
  const submitted = createHmac("sha256", "stonks").update(passphrase).digest("hex");
  if (expected !== submitted) {
    return res.status(403).json({ error: "invalid passphrase" });
  }

  // Clear lockout and failure count
  await redis.del(`lockout:${room}`);
  await redis.del(`failures:${room}`);
  return res.json({ ok: true });
}
