import { Redis } from "@upstash/redis";
import { takeSnapshot } from "./_backup.js";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const IP_LIMIT = 20;
const IP_WINDOW = 60;

async function checkIpRateLimit(ip) {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, IP_WINDOW);
  return count;
}

async function verifySession(roomCode, token) {
  if (!token) return false;
  const val = await redis.get(`session:${roomCode}:${token}`);
  return String(val) === "1";
}

export default async function handler(req, res) {
  const room = String(req.query.room || "").toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(room)) return res.status(400).json({ error: "invalid room" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";
  const ipCount = await checkIpRateLimit(ip);
  if (ipCount > IP_LIMIT) return res.status(429).json({ error: "rate limited" });

  const token = req.headers["x-session-token"];
  const valid = await verifySession(room, token);
  if (!valid) return res.status(403).json({ error: "unauthorized" });

  if (req.method === "GET") {
    const existing = await redis.get(`${room}:backups`);
    const backups = Array.isArray(existing) ? existing : [];
    return res.json({ backups });
  }

  if (req.method === "POST") {
    await takeSnapshot(redis, room);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
