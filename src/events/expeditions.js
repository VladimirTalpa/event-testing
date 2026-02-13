// src/events/expeditions.js
const { EmbedBuilder } = require("discord.js");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName, sleep } = require("../core/utils");
const { CARDS, calcStats } = require("../core/rpg");

const {
  COLOR,
  CARD_PLACEHOLDER_GIF,
  EXPE_START_DELAY_MS,
  EXPE_TICK_MS,
  EXPE_MAX_DAILY,
} = require("../config");

const activeTimers = new Map(); // userId -> { timeouts: [] }

/* ===================== BALANCE RULES ===================== */
function rarityPower(rarity) {
  if (rarity === "Mythic") return 1.60;
  if (rarity === "Legendary") return 1.25;
  if (rarity === "Rare") return 1.05;
  return 0.90; // Common risky
}

function deathChanceBase(rarity) {
  // Common risk, Legendary can pass, Mythic easiest
  if (rarity === "Mythic") return 0.01;
  if (rarity === "Legendary") return 0.03;
  if (rarity === "Rare") return 0.06;
  return 0.12; // Common
}

function eventRoll() {
  // material / fight / miniboss / nothing
  const r = Math.random();
  if (r < 0.35) return "material";
  if (r < 0.70) return "fight";
  if (r < 0.85) return "miniboss";
  return "quiet";
}

function mkEmbed(title, lines) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(title)
    .setDescription(lines.join("\n"))
    .setImage(CARD_PLACEHOLDER_GIF);
}

function clearUserTimers(userId) {
  const t = activeTimers.get(userId);
  if (!t) return;
  for (const x of t.timeouts) clearTimeout(x);
  activeTimers.delete(userId);
}

async function updateMessage(channel, messageId, embed) {
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return null;
  await msg.edit({ embeds: [embed] }).catch(() => {});
  return msg;
}

/* ===================== EXPEDITION FLOW ===================== */
async function startExpedition(interaction, anime, cardIds) {
  const uid = interaction.user.id;
  const p = await getPlayer(uid);

  // daily limit
  if (p.expeditions.dailyUsed >= EXPE_MAX_DAILY) {
    return { ok: false, reason: `Daily limit reached (${EXPE_MAX_DAILY}/${EXPE_MAX_DAILY}).` };
  }
  if (p.keys < 1) return { ok: false, reason: "You need 1 Expedition Key." };
  if (p.expeditions?.active) return { ok: false, reason: "You already have an active expedition." };

  const party = (p.cards || []).filter((c) => cardIds.includes(c.id));
  if (party.length !== 3) return { ok: false, reason: "Party invalid (need 3 idle heroes)." };
  if (party.some((c) => c.status !== "idle")) return { ok: false, reason: "All heroes must be idle." };
  if (party.some((c) => c.anime !== anime)) return { ok: false, reason: "All heroes must match the faction." };

  // consume key
  p.keys -= 1;
  p.expeditions.dailyUsed += 1;

  // set status expedition
  for (const c of p.cards) {
    if (cardIds.includes(c.id)) c.status = "expedition";
  }

  const now = Date.now();
  const startAt = now + EXPE_START_DELAY_MS;

  const expe = {
    anime,
    status: "scheduled", // scheduled -> running -> finished/failed
    createdAt: now,
    startAt,
    tickIndex: 0,
    ticksTotal: 6, // 6 ticks = 60 minutes (every 10 min)
    nextTickAt: startAt + EXPE_TICK_MS,
    party: cardIds,
    log: [],
    rewards: { shards: 0, currency: 0 },
    channelId: interaction.channel.id,
    messageId: null,
  };

  // create public message
  const tag = anime === "bleach" ? "🩸 Bleach" : "🟣 JJK";
  const names = party.map((c) => `• **${c.charKey}** (${c.rarity})`).join("\n");
  const embed = mkEmbed(`🧭 Expedition Scheduled — ${tag}`, [
    `Owner: <@${uid}>`,
    `Starts: <t:${Math.floor(startAt / 1000)}:R>`,
    "",
    `Party:`,
    names,
    "",
    `Tick: **0/6**`,
  ]);

  const msg = await interaction.channel.send({ embeds: [embed] }).catch(() => null);
  if (!msg) return { ok: false, reason: "Couldn't create expedition message (missing permissions?)." };
  expe.messageId = msg.id;

  p.expeditions.active = expe;
  await setPlayer(uid, p);

  // schedule timers
  scheduleExpedition(uid).catch(() => {});
  return {
