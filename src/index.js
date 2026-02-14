// src/index.js
require("dotenv").config();

const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const { initRedis } = require("./core/redis");

const handleSlash = require("./handlers/slash");
const handleButtons = require("./handlers/buttons");
const handleSelects = require("./handlers/selects");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await initRedis();
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) return await handleSlash(interaction, client);
    if (interaction.isButton()) return await handleButtons(interaction, client);
    if (interaction.isStringSelectMenu()) return await handleSelects(interaction, client);
  } catch (e) {
    console.error("Interaction error:", e);
    try {
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: "⚠️ Error handling this action.", ephemeral: true });
        } else {
          await interaction.reply({ content: "⚠️ Error handling this action.", ephemeral: true });
        }
      }
    } catch {}
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ Missing DISCORD_TOKEN in env");
  process.exit(1);
}
client.login(token);
