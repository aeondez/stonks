import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 90;

// Tight limits — market cap is a small number, brute-forceable if loose
const IP_LIMIT = 5;
const IP_WINDOW = 60 * 10;   // 5 attempts per 10 minutes per IP
const ROOM_LIMIT = 8;
const ROOM_WINDOW = 60 * 10; // 8 attempts per 10 minutes per room

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { room, guess } = req.body || {};
  if (!room || !/^[A-Z0-9]{6}$/i.test(room)) return res.status(400).json({ error: "invalid room" });
  if (guess === undefined || guess === null) return res.status(400).json({ error: "missing guess" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";

  // IP rate limit
  const ipKey = `bm-ip-rl:${ip}`;
  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) await redis.expire(ipKey, IP_WINDOW);
  if (ipCount > IP_LIMIT) return res.status(429).json({ error: "rate limited" });

  // Per-room rate limit
  const roomKey = `bm-room-rl:${room}`;
  const roomCount = await redis.incr(roomKey);
  if (roomCount === 1) await redis.expire(roomKey, ROOM_WINDOW);
  if (roomCount > ROOM_LIMIT) return res.status(429).json({ error: "rate limited" });

  try {
    const [stocksRaw, headlinesRaw, dateRaw] = await Promise.all([
      redis.get(`${room}:stocks`),
      redis.get(`${room}:headlines`),
      redis.get(`${room}:date`),
    ]);

    const stocks = Array.isArray(stocksRaw) ? stocksRaw : [];
    const marketCap = Math.floor(
      stocks
        .filter(s => !s.is_collapsed && !s.is_omnicorp)
        .reduce((sum, s) => sum + (s.price || 0), 0)
    );

    const guessNum = parseInt(String(guess).replace(/[^0-9]/g, ""), 10);
    const granted = !isNaN(guessNum) && guessNum === marketCap;

    // Only push the security headline on failed attempts
    if (!granted) {
      const roomDate = (dateRaw && typeof dateRaw === "object" && dateRaw.year)
        ? dateRaw : { year: 2122, cycle: 1 };
      const headlines = Array.isArray(headlinesRaw) ? headlinesRaw : [];
      await redis.set(`${room}:headlines`, [{
        headline: "UNAUTHORIZED ACCESS ATTEMPT DETECTED AND LOGGED",
        subtext: "Security incident filed. Stellar Financial Network monitoring team has been notified. Have a nice day.",
        date: roomDate,
        id: Date.now(),
      }, ...headlines], { ex: TTL });
    }

    return res.json({ granted });
  } catch {
    return res.status(500).json({ error: "internal error" });
  }
}
