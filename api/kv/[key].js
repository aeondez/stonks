import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 30; // 30 days

export default async function handler(req, res) {
  const key = decodeURIComponent(req.query.key);

  if (req.method === "GET") {
    const value = await redis.get(key);
    if (value === null) return res.status(404).json({ error: "not found" });
    return res.json({ value });
  }

  if (req.method === "POST") {
    const { value } = req.body;
    await redis.set(key, value, { ex: TTL });
    // Refresh the room's activity marker so the 30-day TTL resets on use
    const roomCode = key.split(":")[0];
    await redis.set(`${roomCode}:_active`, Date.now(), { ex: TTL });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
