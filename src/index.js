// src/index.js
require("dotenv").config();
const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const { initRedis } = require("./core/redis");

const onInteraction = require("./handlers/interactions");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await initRedis();
});

client.on(Events.InteractionCreate, onInteraction);

client.login(process.env.DISCORD_TOKEN);


