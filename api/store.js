import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 90; // 90 days
const MAX_BODY_BYTES = 512 * 1024; // 512KB max payload

// After this many wrong PINs, lock the room for LOCKOUT_TTL seconds
const MAX_FAILURES = 5;
const LOCKOUT_TTL = 60 * 30; // 30 minutes per lockout
// Global IP rate limit — legitimate Warden saves ~7 keys per action
const IP_LIMIT = 20;
const IP_WINDOW = 60; // per minute

function getRoomCode(key) {
  return key.split(":")[0];
}

function cleanPin(raw) {
  return String(raw || "000000").replace(/^"+|"+$/g, "").trim();
}

async function checkIpRateLimit(ip) {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, IP_WINDOW);
  return count;
}

async function checkRoomLockout(roomCode) {
  const val = await redis.get(`lockout:${roomCode}`);
  return val ? parseInt(val) : 0;
}

async function recordFailure(roomCode) {
  const key = `failures:${roomCode}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, LOCKOUT_TTL);
  if (count >= MAX_FAILURES) {
    // Lock the room
    await redis.set(`lockout:${roomCode}`, count, { ex: LOCKOUT_TTL });
    await redis.del(key);
  }
  return count;
}

async function clearFailures(roomCode) {
  await redis.del(`failures:${roomCode}`);
  await redis.del(`lockout:${roomCode}`);
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
    await redis.set(`${roomCode}:headlines`, [entry, ...headlines], { ex: TTL });
  } catch {}
}

export default async function handler(req, res) {
  const key = req.query.k;
  if (!key) return res.status(400).json({ error: "missing key" });

  // GET — no auth required
  if (req.method === "GET") {
    const value = await redis.get(key);
    if (value === null) return res.status(404).json({ error: "not found" });
    return res.json({ value });
  }

  // POST — Warden writes require PIN auth
  if (req.method === "POST") {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";

    // IP rate limit
    const ipCount = await checkIpRateLimit(ip);
    if (ipCount > IP_LIMIT) {
      return res.status(429).json({ error: "rate limited" });
    }

    // Payload size check
    const body = req.body;
    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
      return res.status(413).json({ error: "payload too large" });
    }

    const roomCode = getRoomCode(key);
    const submittedPin = req.headers["x-warden-pin"];

    // Check room lockout
    const lockout = await checkRoomLockout(roomCode);
    if (lockout >= MAX_FAILURES) {
      return res.status(423).json({ error: "room locked — too many failed attempts. Try again in 30 minutes." });
    }

    // Fetch stored PIN
    const rawStored = await redis.get(`${roomCode}:pin`);
    const storedPin = rawStored ? cleanPin(rawStored) : null;

    // If no PIN stored yet (fresh room), allow through
    if (storedPin !== null) {
      if (!submittedPin || submittedPin !== storedPin) {
        const failures = await recordFailure(roomCode);
        await pushHoneypotHeadline(roomCode);
        const remaining = Math.max(0, MAX_FAILURES - failures);
        return res.status(403).json({
          error: "unauthorized",
          remaining: remaining > 0 ? `${remaining} attempts before 30-minute lockout` : "room now locked for 30 minutes"
        });
      }
    }

    // Success — clear any failure count
    await clearFailures(roomCode);

    const { value } = body;
    await redis.set(key, value, { ex: TTL });
    await redis.set(`${roomCode}:_active`, Date.now(), { ex: TTL });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
