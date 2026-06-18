import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { room } = req.body || {};
  if (!room || !/^[A-Z0-9]{6}$/i.test(room)) return res.status(400).end();

  const token = req.headers["x-session-token"];
  if (token) {
    await redis.del(`session:${room}:${token}`);
  }

  return res.json({ ok: true });
}
