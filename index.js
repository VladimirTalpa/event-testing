require("dotenv").config();

const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const bleach = require("./src/events/bleach");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await bleach.onReady(client);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) return bleach.onSlash(interaction);
    if (interaction.isButton()) return bleach.onButton(interaction);
  } catch (e) {
    console.error("Interaction error:", e);
    try {
      if (interaction.isRepliable() && !interaction.replied) {
        await interaction.reply({ content: "❌ Bot error (check console).", ephemeral: true });
      }
    } catch {}
  }
});

client.login(process.env.DISCORD_TOKEN);
