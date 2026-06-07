import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 90;

export default async function handler(req, res) {
  const room = req.query.room;
  if (!room || !/^[A-Z0-9]{6}$/i.test(room)) return res.status(400).end();

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

  res.status(200).end();
}
