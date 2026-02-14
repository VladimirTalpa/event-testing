const Redis = require("ioredis");

let redis = null;
let memory = new Map();
let usingMemory = false;

async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    usingMemory = true;
    console.log("🟡 REDIS_URL not set → using in-memory storage (OK for testing).");
    return;
  }

  try {
    redis = new Redis(url, { lazyConnect: true });
    await redis.connect();
    usingMemory = false;
    console.log("✅ Redis connected.");
  } catch (e) {
    console.log("🟠 Redis failed → using in-memory storage:", e?.message || e);
    redis = null;
    usingMemory = true;
  }
}

async function get(key) {
  if (usingMemory) return memory.get(key) ?? null;
  return await redis.get(key);
}

async function set(key, value) {
  if (usingMemory) {
    memory.set(key, value);
    return "OK";
  }
  return await redis.set(key, value);
}

async function del(key) {
  if (usingMemory) {
    memory.delete(key);
    return 1;
  }
  return await redis.del(key);
}

module.exports = { initRedis, get, set, del };
