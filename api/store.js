import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 30; // 30 days
const MAX_BODY_BYTES = 512 * 1024; // 512KB max payload

function getRoomCode(key) {
  return key.split(":")[0];
}

function cleanPin(raw) {
  return String(raw || "000000").replace(/^"+|"+$/g, "").trim();
}

async function rateLimit(ip) {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count;
}

async function pushHoneypotHeadline(roomCode) {
  try {
    const existing = await redis.get(`${roomCode}:headlines`);
    const headlines = Array.isArray(existing) ? existing : [];
    const entry = {
      headline: "UNAUTHORIZED ACCESS ATTEMPT DETECTED AND LOGGED",
      subtext: "Security incident filed. Stellar Financial Network monitoring team has been notified. Have a nice day.",
      date: { year: 2122, cycle: 0 },
      id: Date.now(),
    };
    const next = [entry, ...headlines];
    await redis.set(`${roomCode}:headlines`, next, { ex: TTL });
  } catch {}
}

export default async function handler(req, res) {
  const key = req.query.k;
  if (!key) return res.status(400).json({ error: "missing key" });

  // GET — no auth required, players need to read freely
  if (req.method === "GET") {
    const value = await redis.get(key);
    if (value === null) return res.status(404).json({ error: "not found" });
    return res.json({ value });
  }

  // POST — Warden writes require PIN auth
  if (req.method === "POST") {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";

    // Rate limit: 60 writes per IP per minute
    const count = await rateLimit(ip);
    if (count > 60) {
      return res.status(429).json({ error: "rate limited" });
    }

    // Payload size check
    const body = req.body;
    const bodySize = JSON.stringify(body).length;
    if (bodySize > MAX_BODY_BYTES) {
      return res.status(413).json({ error: "payload too large" });
    }

    // PIN auth — except for the pin key itself on first set (bootstrapping)
    const roomCode = getRoomCode(key);
    const submittedPin = req.headers["x-warden-pin"];

    // Fetch stored PIN
    const rawStored = await redis.get(`${roomCode}:pin`);
    const storedPin = rawStored ? cleanPin(rawStored) : null;

    // If no PIN stored yet (fresh room), allow the first write through
    // Otherwise enforce auth
    if (storedPin !== null) {
      if (!submittedPin || submittedPin !== storedPin) {
        // Push honeypot headline and reject
        await pushHoneypotHeadline(roomCode);
        return res.status(403).json({ error: "unauthorized" });
      }
    }

    const { value } = body;
    await redis.set(key, value, { ex: TTL });
    await redis.set(`${roomCode}:_active`, Date.now(), { ex: TTL });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
