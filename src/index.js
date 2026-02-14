// src/index.js
const { Client, GatewayIntentBits } = require("discord.js");
const { TOKEN } = require("./config");
const { initDB } = require("./services/db");
const { loadCommands, handleInteraction } = require("./handlers/slash");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const registry = loadCommands();

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await initDB().catch((e) => console.log("⚠️ Redis init skipped/failed:", e?.message));
});

client.on("interactionCreate", async (interaction) => {
  await handleInteraction(interaction, registry);
});

client.login(TOKEN);
