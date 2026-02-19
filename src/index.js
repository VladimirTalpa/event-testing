require("dotenv").config();

const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const { initRedis } = require("./core/redis");
const { registerCanvasFonts } = require("./ui/fonts");
const { buildErrorV2 } = require("./ui/feedback-v2");

const handleSlash = require("./handlers/slash");
const handleButtons = require("./handlers/buttons");
const handleSelects = require("./handlers/selects");
const handleModals = require("./handlers/modals");

registerCanvasFonts();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await initRedis();
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) return await handleSlash(interaction);
    if (interaction.isButton()) return await handleButtons(interaction);
    if (interaction.isStringSelectMenu()) return await handleSelects(interaction);
    if (interaction.isModalSubmit()) return await handleModals(interaction);
  } catch (e) {
    console.error("Interaction error:", e);
    try {
      if (interaction.isRepliable()) {
        const payload = buildErrorV2("Error handling this action. Please try again.", "Interaction Failed");
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      }
    } catch {}
  }
});

client.login(process.env.DISCORD_TOKEN);
