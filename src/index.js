// src/index.js
const { Client, GatewayIntentBits } = require("discord.js");
const { handleSlash } = require("./handlers/slash");
const { TOKEN } = require("./config");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  await handleSlash(interaction);
});

client.login(TOKEN);
