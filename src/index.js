require("dotenv").config();
const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const cfg = require("./config");
const { getRedis } = require("./redis");
const handleSlash = require("./handlers/slash");
const handleButtons = require("./handlers/buttons");
const { spawnBoss } = require("./events/boss");
const { spawnHollow } = require("./events/hollow");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await getRedis();

  const autoChannel = await client.channels.fetch(cfg.AUTO_EVENT_CHANNEL_ID).catch(() => null);
  if (!autoChannel || !autoChannel.isTextBased()) {
    console.log("❌ Auto channel not accessible.");
    return;
  }

  setInterval(() => spawnHollow(autoChannel, true).catch(() => {}), cfg.AUTO_HOLLOW_EVERY_MS);
  setInterval(() => spawnBoss(autoChannel, true).catch(() => {}), cfg.AUTO_BOSS_EVERY_MS);

  console.log("⏰ Auto-spawn enabled", {
    channel: cfg.AUTO_EVENT_CHANNEL_ID,
    hollow_ms: cfg.AUTO_HOLLOW_EVERY_MS,
    boss_ms: cfg.AUTO_BOSS_EVERY_MS,
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) return handleSlash(interaction);
    if (interaction.isButton()) return handleButtons(interaction);
  } catch (e) {
    console.error("Interaction error:", e);
  }
});

client.login(process.env.DISCORD_TOKEN);
