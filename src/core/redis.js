const { createClient } = require("redis");

async function makeRedis() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("Missing REDIS_URL in Railway Variables");

  const client = createClient({ url });
  client.on("error", (e) => console.error("Redis error:", e));

  if (!client.isOpen) await client.connect();
  return client;
}

module.exports = { makeRedis };
