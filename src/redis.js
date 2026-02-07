const { createClient } = require("redis");

let client;

async function getRedis() {
  if (client) return client;

  client = createClient({
    url: process.env.REDIS_URL,
  });

  client.on("error", (err) => console.error("Redis error:", err));
  await client.connect();

  return client;
}

// Ключи
const KEY_PLAYERS = "bleach:players"; // hash: field=userId, value=json

async function redisGetPlayerRaw(userId) {
  const r = await getRedis();
  return await r.hGet(KEY_PLAYERS, userId);
}

async function redisSetPlayerRaw(userId, json) {
  const r = await getRedis();
  await r.hSet(KEY_PLAYERS, userId, json);
}

async function redisGetAllPlayers() {
  const r = await getRedis();
  return await r.hGetAll(KEY_PLAYERS); // { userId: json, ... }
}

module.exports = {
  redisGetPlayerRaw,
  redisSetPlayerRaw,
  redisGetAllPlayers,
};
