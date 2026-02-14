// src/services/db.js
const Redis = require("ioredis");
const { REDIS_URL } = require("../config");

const memory = new Map();
let redis = null;

function hasRedis() {
  return !!redis;
}

async function initDB() {
  if (!REDIS_URL) return;
  redis = new Redis(REDIS_URL, { lazyConnect: true });
  await redis.connect();
  console.log("✅ Redis connected");
}

function keyUser(userId) {
  return `user:${userId}`;
}

async function getUser(userId) {
  if (hasRedis()) {
    const raw = await redis.get(keyUser(userId));
    return raw ? JSON.parse(raw) : null;
  }
  return memory.get(userId) || null;
}

async function setUser(userId, data) {
  if (hasRedis()) {
    await redis.set(keyUser(userId), JSON.stringify(data));
    return;
  }
  memory.set(userId, data);
}

function defaultUser() {
  return {
    money: 0,
    bleach: 0,
    jjk: 0,
    bleachShards: 0,
    cursedShards: 0,
    cards: [],       // твои карточки
    gears: [],       // твои предметы
    titles: [],      // список титлов
    equippedTitle: null,
    dailyLast: 0,
  };
}

async function getOrCreateUser(userId) {
  let u = await getUser(userId);
  if (!u) {
    u = defaultUser();
    await setUser(userId, u);
  }
  return u;
}

module.exports = {
  initDB,
  getOrCreateUser,
  getUser,
  setUser,
};
