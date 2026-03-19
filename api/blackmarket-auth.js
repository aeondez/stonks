import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 90;
const RL_MAX = 10;
const RL_WINDOW = 60;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { room, guess } = req.body || {};
  if (!room || !/^[A-Z0-9]{6}$/i.test(room)) return res.status(400).json({ error: "invalid room" });
  if (guess === undefined || guess === null) return res.status(400).json({ error: "missing guess" });

  const rlKey = `bm-rl:${room}`;
  const count = await redis.incr(rlKey);
  if (count === 1) await redis.expire(rlKey, RL_WINDOW);
  if (count > RL_MAX) return res.status(429).json({ error: "rate limited" });

  try {
    const [stocksRaw, headlinesRaw, dateRaw] = await Promise.all([
      redis.get(`${room}:stocks`),
      redis.get(`${room}:headlines`),
      redis.get(`${room}:date`),
    ]);

    // Verify first — marketCap never sent to client
    const stocks = Array.isArray(stocksRaw) ? stocksRaw : [];
    const marketCap = Math.floor(
      stocks
        .filter(s => !s.is_collapsed && !s.is_omnicorp)
        .reduce((sum, s) => sum + (s.price || 0), 0)
    );
    const guessNum = parseInt(String(guess).replace(/[^0-9]/g, ""), 10);
    const granted = !isNaN(guessNum) && guessNum === marketCap;

    // Push unauthorized access headline after verification, regardless of outcome
    const roomDate = (dateRaw && typeof dateRaw === "object" && dateRaw.year)
      ? dateRaw : { year: 2122, cycle: 1 };
    const headlines = Array.isArray(headlinesRaw) ? headlinesRaw : [];
    await redis.set(`${room}:headlines`, [{
      headline: "UNAUTHORIZED ACCESS ATTEMPT DETECTED AND LOGGED",
      subtext: "Security incident filed. Stellar Financial Network monitoring team has been notified. Have a nice day.",
      date: roomDate, id: Date.now(),
    }, ...headlines], { ex: TTL });

    return res.json({ granted });
  } catch (e) {
    return res.status(500).json({ error: "internal error" });
  }
}
