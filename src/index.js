// src/index.js
require("dotenv").config();

const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const { initRedis } = require("./core/redis");
const interactionCreateHandler = require("./handlers/interactionCreate");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await initRedis();
});

client.on(Events.InteractionCreate, async (interaction) => {
  await interactionCreateHandler(client, interaction);
});

client.login(process.env.DISCORD_TOKEN);
