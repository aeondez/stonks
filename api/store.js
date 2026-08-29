import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 90;
const MAX_BODY_BYTES = 512 * 1024;
const MAX_FAILURES = 5;
const LOCKOUT_TTL = 60 * 30;
const IP_LIMIT = 20;
const IP_WINDOW = 60;

// Player-readable — no auth required. Shared campaign data the Player view
// displays directly (debt/crew/settings drive the Downtime tab and payout
// calculator) must be public-read; only writes are Warden-gated (see POST below).
const PUBLIC_SUBKEYS = new Set([
  "stocks", "headlines", "history", "date", "jobs", "catalogs", "_active", "blackmarket", "houseRules",
  "settings", "crew", "debt", "portfolio",
]);

// Warden-only — valid session token required to read or write.
// Kept minimal: "mergers" is GM-facing pending-merger data players shouldn't see early.
const WARDEN_SUBKEYS = new Set([
  "pin", "mergers",
]);

const VALID_SUBKEYS = new Set([...PUBLIC_SUBKEYS, ...WARDEN_SUBKEYS]);

function getRoomCode(key) { return key.split(":")[0]; }

function isValidKey(key) {
  if (!key || typeof key !== "string") return false;
  const parts = key.split(":");
  if (parts.length !== 2) return false;
  const [room, subkey] = parts;
  if (!/^[A-Z0-9]{6}$/i.test(room)) return false;
  return VALID_SUBKEYS.has(subkey);
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
    await redis.set(`${roomCode}:headlines`, [{
      headline: "UNAUTHORIZED ACCESS ATTEMPT DETECTED AND LOGGED",
      subtext: "Security incident filed. Stellar Financial Network monitoring team has been notified. Have a nice day.",
      date: { year: 2122, cycle: 0 },
      id: Date.now(),
    }, ...headlines], { ex: TTL });
  } catch {}
}

async function verifySession(roomCode, token) {
  if (!token) return false;
  const val = await redis.get(`session:${roomCode}:${token}`);
  // Upstash's client auto-deserializes "1" to the number 1 on read, so a
  // strict string comparison here always fails even for a valid session.
  return String(val) === "1";
}

export default async function handler(req, res) {
  const key = req.query.k;
  if (!key) return res.status(400).json({ error: "missing key" });
  if (!isValidKey(key)) return res.status(400).json({ error: "invalid key" });

  const subkey = key.split(":")[1];
  const roomCode = getRoomCode(key);

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    // PIN is never readable
    if (subkey === "pin") return res.status(403).json({ error: "forbidden" });

    if (WARDEN_SUBKEYS.has(subkey)) {
      const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";
      const ipCount = await checkIpRateLimit(ip);
      if (ipCount > IP_LIMIT) return res.status(429).json({ error: "rate limited" });

      const lockout = await checkRoomLockout(roomCode);
      if (lockout >= MAX_FAILURES) {
        return res.status(423).json({ error: "room locked" });
      }

      const token = req.headers["x-session-token"];
      const valid = await verifySession(roomCode, token);
      if (!valid) {
        await recordFailure(roomCode);
        await pushHoneypotHeadline(roomCode);
        return res.status(403).json({ error: "unauthorized" });
      }
      await clearFailures(roomCode);
    }

    const value = await redis.get(key);
    if (value === null) return res.json({ value: null });
    return res.json({ value });
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";
    const ipCount = await checkIpRateLimit(ip);
    if (ipCount > IP_LIMIT) return res.status(429).json({ error: "rate limited" });

    const body = req.body;
    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
      return res.status(413).json({ error: "payload too large" });
    }

    const lockout = await checkRoomLockout(roomCode);
    if (lockout >= MAX_FAILURES) {
      return res.status(423).json({ error: "room locked" });
    }

    const token = req.headers["x-session-token"];
    const valid = await verifySession(roomCode, token);
    if (!valid) {
      await recordFailure(roomCode);
      await pushHoneypotHeadline(roomCode);
      return res.status(403).json({ error: "unauthorized" });
    }
    await clearFailures(roomCode);

    const { value } = body;
    await redis.set(key, value, { ex: TTL });
    await redis.set(`${roomCode}:_active`, Date.now(), { ex: TTL });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
