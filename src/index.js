require("dotenv").config();
const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const { initRedis } = require("./core/redis");

const handleSlash = require("./handlers/slash");
const handleButtons = require("./handlers/buttons");
const handleSelects = require("./handlers/selects");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel]
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await initRedis();
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) return await handleSlash(interaction);
    if (interaction.isButton()) return await handleButtons(interaction);
    if (interaction.isStringSelectMenu()) return await handleSelects(interaction);
  } catch (e) {
    console.error("Interaction error:", e);
    try {
      const msg = "⚠️ Error handling this action.";
      if (!interaction.isRepliable()) return;
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: msg, ephemeral: true });
      } else {
        await interaction.reply({ content: msg, ephemeral: true });
      }
    } catch {}
  }
});

client.login(process.env.DISCORD_TOKEN);
