require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { initRedis } = require("./core/redis");
const handleInteractions = require("./handlers/interactions");

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ DISCORD_TOKEN missing in .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // нужен для ролей (Titles)
  ],
  partials: [Partials.GuildMember],
});

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  try {
    await initRedis();
    console.log("✅ Redis connected");
  } catch (e) {
    console.error("❌ Redis init failed:", e);
  }
});

client.on("interactionCreate", (interaction) => handleInteractions(interaction));

client.login(token);
