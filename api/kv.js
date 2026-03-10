import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 90; // 90 days

export default async function handler(req, res) {
  const key = req.query.k;
  if (!key) return res.status(400).json({ error: "missing key" });

  if (req.method === "GET") {
    const value = await redis.get(key);
    if (value === null) return res.status(404).json({ error: "not found" });
    return res.json({ value });
  }

  if (req.method === "POST") {
    const { value } = req.body;
    await redis.set(key, value, { ex: TTL });
    const roomCode = key.split(":")[0];
    await redis.set(`${roomCode}:_active`, Date.now(), { ex: TTL });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
