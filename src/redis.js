const { createClient } = require("redis");

let client;

async function getRedis() {
  if (client) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
    console.error("❌ Missing REDIS_URL (set it in Railway bot service Variables).");
    process.exit(1);
  }

  client = createClient({ url });
  client.on("error", (err) => console.error("Redis error:", err));

  await client.connect();
  console.log("✅ Redis connected");
  return client;
}

module.exports = { getRedis };
