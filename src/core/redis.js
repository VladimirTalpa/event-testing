// src/core/redis.js
const { createClient } = require("redis");

let redis;

async function initRedis() {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error("❌ Missing REDIS_URL in Railway variables.");
    process.exit(1);
  }
  redis = createClient({ url });
  redis.on("error", (err) => console.error("Redis error:", err));
  await redis.connect();
  console.log("✅ Redis connected");
  return redis;
}

function getRedis() {
  if (!redis) throw new Error("Redis is not initialized. Call initRedis() first.");
  return redis;
}

module.exports = { initRedis, getRedis };
