require("dotenv").config();

const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const {
  AUTO_EVENT_CHANNEL_ID,
  AUTO_HOLLOW_EVERY_MS,
  AUTO_BOSS_EVERY_MS,
  PING_BOSS_ROLE_ID,
  PING_HOLLOW_ROLE_ID,
  BOSSES,
} = require("./config");

const { makeRedis } = require("./redis");
const { playersApi } = require("./players");
const { handleSlash } = require("./handlers/slash");
const { handleButtons } = require("./handlers/buttons");

const { spawnBoss } = require("./events/boss");
const { spawnHollow } = require("./events/hollow");

async function main() {
  const redis = await makeRedis();
  const players = playersApi(redis);

  const state = {
    players,
    bossByChannel: new Map(),
    hollowByChannel: new Map(),
    clashByChannel: new Map(),
    lastClashByUser: new Map(),
  };

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel],
  });

  client.once(Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const autoChannel = await client.channels.fetch(AUTO_EVENT_CHANNEL_ID).catch(() => null);
    if (!autoChannel || !autoChannel.isTextBased()) {
      console.log("❌ Auto channel not accessible.");
      return;
    }

    // Auto hollow
    setInterval(() => spawnHollow(autoChannel, state.hollowByChannel, players, PING_HOLLOW_ROLE_ID).catch(() => {}), AUTO_HOLLOW_EVERY_MS);

    // Auto boss (по умолчанию Vasto)
    setInterval(() => spawnBoss(autoChannel, BOSSES.vasto, state.bossByChannel, players, PING_BOSS_ROLE_ID).catch(() => {}), AUTO_BOSS_EVERY_MS);

    console.log("⏰ Auto-spawn enabled", {
      channel: AUTO_EVENT_CHANNEL_ID,
      hollow_ms: AUTO_HOLLOW_EVERY_MS,
      boss_ms: AUTO_BOSS_EVERY_MS,
    });
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) return handleSlash(interaction, state);
      if (interaction.isButton()) return handleButtons(interaction, state);
    } catch (e) {
      console.error("Interaction error:", e);
    }
  });

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("❌ Missing DISCORD_TOKEN");
    process.exit(1);
  }

  await client.login(token);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
