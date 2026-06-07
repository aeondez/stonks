import { applyCors } from "./_cors.js";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 90;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  const { room } = req.query;
  if (!room || !/^[A-Z0-9]{6}$/i.test(room)) {
    return res.status(400).json({ error: "invalid room" });
  }

  // Verify the room actually exists before touching it
  const roomExists = await redis.exists(`${room.toUpperCase()}:_active`);
  if (!roomExists) return res.status(404).json({ error: "room not found" });

  // IP rate limit — prevents cross-room headline spam
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";
  const ipKey = `honeypot-ip-rl:${ip}`;
  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) await redis.expire(ipKey, 60);
  if (ipCount > 5) return res.status(429).json({ error: "rate limited" });

  // Per-room rate limit — belt and suspenders
  const rlKey = `honeypot-rl:${room}`;
  const count = await redis.incr(rlKey);
  if (count === 1) await redis.expire(rlKey, 60);
  if (count > 5) return res.status(429).json({ error: "rate limited" });

  try {
    const [existing, dateData] = await Promise.all([
      redis.get(`${room}:headlines`),
      redis.get(`${room}:date`),
    ]);
    const headlines = Array.isArray(existing) ? existing : [];
    const roomDate = (dateData && typeof dateData === "object" && dateData.year)
      ? dateData
      : { year: 2122, cycle: 1 };
    const entry = {
      headline: "UNAUTHORIZED ACCESS ATTEMPT DETECTED AND LOGGED",
      subtext: "Security incident filed. Stellar Financial Network monitoring team has been notified. Have a nice day.",
      date: roomDate,
      id: Date.now(),
    };
    const next = [entry, ...headlines];
    await redis.set(`${room}:headlines`, next, { ex: TTL });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "internal error" });
  }
}
