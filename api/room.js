import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const TTL = 60 * 60 * 24 * 90;
const CREATION_KEY = process.env.ROOM_CREATION_KEY || "stonks";

const IP_LIMIT = 30;
const IP_WINDOW = 60; // 30 lookups per minute per IP — enough for legit use, not enumeration

function generateCode() {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

function safeEqual(a, b) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";
  const ipKey = `room-ip-rl:${ip}`;
  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) await redis.expire(ipKey, IP_WINDOW);
  if (ipCount > IP_LIMIT) return res.status(429).json({ error: "rate limited" });

  // GET — check if room exists
  if (req.method === "GET") {
    const { code } = req.query;
    if (!code || !/^[A-Z0-9]{6}$/i.test(code)) {
      return res.status(400).json({ error: "invalid_code" });
    }
    const exists = await redis.exists(`${code.toUpperCase()}:_active`);
    return res.json({ exists: !!exists });
  }

  // POST — create room
  if (req.method !== "POST") return res.status(405).end();

  const { creationKey } = req.body || {};
  if (!safeEqual(String(creationKey || ""), CREATION_KEY)) {
    return res.status(403).json({ error: "invalid_key" });
  }

  let code;
  for (let attempts = 0; attempts < 10; attempts++) {
    code = generateCode();
    const exists = await redis.exists(`${code}:_active`);
    if (!exists) break;
  }

  await redis.set(`${code}:_active`, Date.now(), { ex: TTL });
  return res.json({ code });
}
