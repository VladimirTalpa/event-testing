const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const cfg = require("./config");

const handleSlash = require("./handlers/slash");
const handleButtons = require("./handlers/buttons");
const handleSelects = require("./handlers/selects");

const expeditions = require("./systems/expeditions");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // ✅ ВОТ ЭТО и есть “привязать client для экспедиций”
  expeditions.init(client);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) return handleSlash(interaction);
    if (interaction.isButton()) return handleButtons(interaction);
    if (interaction.isStringSelectMenu()) return handleSelects(interaction);
  } catch (e) {
    console.error("interactionCreate error:", e);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "❌ Error. Check console." });
      } else {
        await interaction.reply({ content: "❌ Error. Check console.", ephemeral: true });
      }
    } catch {}
  }
});

client.login(cfg.TOKEN);
