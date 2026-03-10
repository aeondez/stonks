import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 90;

export default async function handler(req, res) {
  const { room } = req.query;
  if (!room || !/^[A-Z0-9]{6}$/i.test(room)) {
    return res.status(400).json({ error: "invalid room" });
  }

  // Rate limit honeypot triggers per room (max 5 per minute)
  const rlKey = `honeypot-rl:${room}`;
  const count = await redis.incr(rlKey);
  if (count === 1) await redis.expire(rlKey, 60);
  if (count > 5) return res.status(429).json({ error: "rate limited" });

  try {
    const existing = await redis.get(`${room}:headlines`);
    const headlines = Array.isArray(existing) ? existing : [];
    const entry = {
      headline: "UNAUTHORIZED ACCESS ATTEMPT DETECTED AND LOGGED",
      subtext: "Security incident filed. Stellar Financial Network monitoring team has been notified. Have a nice day.",
      date: { year: 2122, cycle: 0 },
      id: Date.now(),
    };
    const next = [entry, ...headlines];
    await redis.set(`${room}:headlines`, next, { ex: TTL });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "internal error" });
  }
}
