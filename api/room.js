import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// No confusable characters: excludes 0/O, 1/I/L
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const TTL = 60 * 60 * 24 * 90;

function generateCode() {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let code;
  for (let attempts = 0; attempts < 10; attempts++) {
    code = generateCode();
    const exists = await redis.exists(`${code}:_active`);
    if (!exists) break;
  }

  await redis.set(`${code}:_active`, Date.now(), { ex: TTL });
  return res.json({ code });
}
