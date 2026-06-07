import { applyCors } from "./_cors.js";
import { Redis } from "@upstash/redis";
import { timingSafeEqual } from "crypto";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const TTL = 60 * 60 * 24 * 90; // 90 days
const MAX_BODY_BYTES = 512 * 1024; // 512KB max payload

const MAX_FAILURES = 5;
const LOCKOUT_TTL = 60 * 30; // 30 minutes per lockout
const IP_LIMIT = 20;
const IP_WINDOW = 60; // per minute

// Keys any connected player can read — market data, news, public job board
const PUBLIC_SUBKEYS = new Set([
  "stocks", "headlines", "history", "date", "jobs", "catalogs", "_active",
]);

// Keys only the Warden can read or write
const WARDEN_SUBKEYS = new Set([
  "pin", "mergers", "settings", "crew", "debt", "portfolio", "blackmarket",
  "houseRules",
]);

const VALID_SUBKEYS = new Set([...PUBLIC_SUBKEYS, ...WARDEN_SUBKEYS]);

function getRoomCode(key) {
  return key.split(":")[0];
}

function isValidKey(key) {
  if (!key || typeof key !== "string") return false;
  const parts = key.split(":");
  if (parts.length !== 2) return false;
  const [room, subkey] = parts;
  if (!/^[A-Z0-9]{6}$/i.test(room)) return false;
  if (!VALID_SUBKEYS.has(subkey)) return false;
  return true;
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

function pinEqual(a, b) {
  try {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) { timingSafeEqual(bufA, bufA); return false; }
    return timingSafeEqual(bufA, bufB);
  } catch { return false; }
}

async function verifyPin(roomCode, submittedPin) {
  const rawStored = await redis.get(`${roomCode}:pin`);
  // Fresh room — no PIN set yet. Only allow through if no pin header was sent at all,
  // meaning this is the Warden's first load, not an unauthenticated probe.
  if (rawStored === null) {
    return submittedPin === undefined || submittedPin === null
      ? { ok: true, fresh: true }
      : { ok: false };
  }
  const storedPin = cleanPin(rawStored);
  if (!submittedPin || !pinEqual(submittedPin, storedPin)) return { ok: false };
  return { ok: true };
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  const key = req.query.k;
  if (!key) return res.status(400).json({ error: "missing key" });
  if (!isValidKey(key)) return res.status(400).json({ error: "invalid key" });

  const subkey = key.split(":")[1];
  const roomCode = getRoomCode(key);

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    // PIN is never readable
    if (subkey === "pin") return res.status(403).json({ error: "forbidden" });

    // Warden-only keys require PIN auth on read
    if (WARDEN_SUBKEYS.has(subkey)) {
      const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";

      const ipCount = await checkIpRateLimit(ip);
      if (ipCount > IP_LIMIT) return res.status(429).json({ error: "rate limited" });

      const lockout = await checkRoomLockout(roomCode);
      if (lockout >= MAX_FAILURES) {
        return res.status(423).json({ error: "room locked — too many failed attempts. Try again in 30 minutes." });
      }

      const submittedPin = req.headers["x-warden-pin"];
      const { ok, fresh } = await verifyPin(roomCode, submittedPin);

      if (!ok) {
        const failures = await recordFailure(roomCode);
        await pushHoneypotHeadline(roomCode);
        const remaining = Math.max(0, MAX_FAILURES - failures);
        return res.status(403).json({
          error: "unauthorized",
          remaining: remaining > 0
            ? `${remaining} attempts before 30-minute lockout`
            : "room now locked for 30 minutes",
        });
      }

      if (!fresh) await clearFailures(roomCode);
    }

    // Public keys or authenticated Warden read — return value
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
      return res.status(423).json({ error: "room locked — too many failed attempts. Try again in 30 minutes." });
    }

    const submittedPin = req.headers["x-warden-pin"];
    const { ok, fresh } = await verifyPin(roomCode, submittedPin);

    if (!ok) {
      const failures = await recordFailure(roomCode);
      await pushHoneypotHeadline(roomCode);
      const remaining = Math.max(0, MAX_FAILURES - failures);
      return res.status(403).json({
        error: "unauthorized",
        remaining: remaining > 0
          ? `${remaining} attempts before 30-minute lockout`
          : "room now locked for 30 minutes",
      });
    }

    if (!fresh) await clearFailures(roomCode);

    const { value } = body;
    await redis.set(key, value, { ex: TTL });
    await redis.set(`${roomCode}:_active`, Date.now(), { ex: TTL });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
