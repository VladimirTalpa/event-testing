const { createClient } = require("redis");

let redis = null;

async function initRedis() {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL missing in .env");

  redis = createClient({ url });
  redis.on("error", (err) => console.error("Redis error:", err));

  if (!redis.isOpen) await redis.connect();
  return redis;
}

function getRedis() {
  if (!redis) throw new Error("Redis not initialized. Call initRedis() first.");
  return redis;
}

module.exports = { initRedis, getRedis };
