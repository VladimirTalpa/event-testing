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
  return { ok: true, messageId: msg.id };
}

async function scheduleExpedition(userId) {
  clearUserTimers(userId);

  const p = await getPlayer(userId);
  const active = p.expeditions?.active;
  if (!active) return;

  const timeouts = [];
  activeTimers.set(userId, { timeouts });

  const now = Date.now();
  const delayToStart = Math.max(0, active.startAt - now);

  // start timer
  timeouts.push(setTimeout(async () => {
    await onStart(userId).catch(() => {});
  }, delayToStart));
}

async function onStart(userId) {
  const p = await getPlayer(userId);
  const expe = p.expeditions?.active;
  if (!expe) return;

  expe.status = "running";
  expe.log.push(`✅ Expedition started.`);
  await setPlayer(userId, p);

  await tick(userId).catch(() => {});
}

function removeCardForever(player, cardId) {
  const idx = (player.cards || []).findIndex((c) => c.id === cardId);
  if (idx >= 0) player.cards.splice(idx, 1);
}

async function tick(userId) {
  const p = await getPlayer(userId);
  const expe = p.expeditions?.active;
  if (!expe) return;

  const channel = await (async () => {
    try {
      const guild = await globalThis.__botClient?.guilds?.fetch(expe.guildId);
      return guild?.channels?.fetch(expe.channelId);
    } catch {
      return null;
    }
  })();

  // We may not have bot client globally; we update via interaction flow mostly.
  // We'll still update message by fetching channel from cached client if available.
  const client = globalThis.__botClient;
  const ch = client ? await client.channels.fetch(expe.channelId).catch(() => null) : null;

  const partyCards = (p.cards || []).filter((c) => expe.party.includes(c.id));
  const partyAlive = partyCards.filter((c) => c.status === "expedition");

  // if none alive => fail
  if (!partyAlive.length) {
    expe.status = "failed";
    expe.log.push(`💀 All heroes died. Expedition failed.`);
    // clear active + finalize
    p.expeditions.active = null;
    await setPlayer(userId, p);

    if (ch) {
      const embed = mkEmbed(`❌ Expedition Failed`, [
        `Owner: <@${userId}>`,
        `Reason: all heroes died.`,
      ]);
      await updateMessage(ch, expe.messageId, embed);
    }
    clearUserTimers(userId);
    return;
  }

  // finished?
  if (expe.tickIndex >= expe.ticksTotal) {
    // grant rewards based on anime
    if (expe.anime === "bleach") {
      p.bleach.reiatsu += expe.rewards.currency;
      p.bleach.shards += expe.rewards.shards;
    } else {
      p.jjk.cursedEnergy += expe.rewards.currency;
      p.jjk.shards += expe.rewards.shards;
    }

    // return heroes to idle
    for (const c of p.cards) {
      if (expe.party.includes(c.id) && c.status === "expedition") c.status = "idle";
    }

    const lines = [
      `Owner: <@${userId}>`,
      `✅ Completed.`,
      "",
      `Rewards:`,
      `• Currency: **${expe.rewards.currency}**`,
      `• Shards: **${expe.rewards.shards}**`,
      "",
      `Log:`,
      ...expe.log.slice(-10).map((x) => `• ${x}`),
    ];

    const embed = mkEmbed(`✅ Expedition Completed`, lines);
    p.expeditions.active = null;
    await setPlayer(userId, p);

    if (ch) await updateMessage(ch, expe.messageId, embed);
    clearUserTimers(userId);
    return;
  }

  // do one tick
  const ev = eventRoll();
  expe.tickIndex += 1;
  expe.nextTickAt = Date.now() + EXPE_TICK_MS;

  // compute party power
  let power = 0;
  for (const c of partyAlive) {
    const st = calcStats(c);
    power += (st.atk + st.def) * rarityPower(c.rarity);
  }

  let tickText = "";
  if (ev === "quiet") {
    tickText = "🌙 Quiet path. No events.";
  }

  if (ev === "material") {
    const gained = 8 + Math.floor(Math.random() * 10); // 8-17 shards
    expe.rewards.shards += gained;
    tickText = `🧩 Found materials: **+${gained} shards**.`;
  }

  if (ev === "fight") {
    // success chance depends on party power
    const base = 0.45;
    const chance = Math.min(0.95, base + Math.min(0.40, power / 1200));
    const ok = Math.random() < chance;

    if (ok) {
      const gained = 25 + Math.floor(Math.random() * 26); // 25-50 currency
      expe.rewards.currency += gained;
      tickText = `⚔️ Fight won! **+${gained} currency**.`;
    } else {
      tickText = `⚠️ Fight was rough...`;
      // on fail: someone may die
      const victim = partyAlive[Math.floor(Math.random() * partyAlive.length)];
      const dChance = deathChanceBase(victim.rarity);
      const died = Math.random() < dChance;

      if (died) {
        tickText += ` 💀 **${victim.charKey}** died and the card was destroyed.`;
        expe.log.push(`💀 ${victim.charKey} died (card removed).`);
        // remove forever
        removeCardForever(p, victim.id);
      } else {
        tickText += ` ✅ Everyone survived.`;
        expe.log.push(`✅ Survived a hard fight.`);
      }
    }
  }

  if (ev === "miniboss") {
    const base = 0.30;
    const chance = Math.min(0.90, base + Math.min(0.45, power / 1500));
    const ok = Math.random() < chance;

    if (ok) {
      const gainedCur = 60 + Math.floor(Math.random() * 41); // 60-100
      const gainedSh = 10 + Math.floor(Math.random() * 11); // 10-20
      expe.rewards.currency += gainedCur;
      expe.rewards.shards += gainedSh;
      tickText = `👹 Mini-boss defeated! **+${gainedCur} currency**, **+${gainedSh} shards**.`;
      expe.log.push(`👹 Mini-boss defeated.`);
    } else {
      tickText = `👹 Mini-boss overwhelmed the team...`;
      // higher death risk
      const victim = partyAlive[Math.floor(Math.random() * partyAlive.length)];
      const dChance = Math.min(0.25, deathChanceBase(victim.rarity) + 0.06);
      const died = Math.random() < dChance;

      if (died) {
        tickText += ` 💀 **${victim.charKey}** died and the card was destroyed.`;
        expe.log.push(`💀 ${victim.charKey} died to mini-boss (card removed).`);
        removeCardForever(p, victim.id);
      } else {
        tickText += ` ✅ Barely escaped.`;
        expe.log.push(`✅ Escaped mini-boss.`);
      }
    }
  }

  expe.log.push(tickText);

  // if cards survived, keep them expedition
  for (const c of p.cards || []) {
    if (expe.party.includes(c.id) && c.status === "expedition") {
      // still on expedition
    }
  }

  await setPlayer(userId, p);

  // update message
  if (ch) {
    const tag = expe.anime === "bleach" ? "🩸 Bleach" : "🟣 JJK";
    const partyLine = (p.cards || [])
      .filter((c) => expe.party.includes(c.id))
      .map((c) => `• **${c.charKey}** (${c.rarity})`)
      .join("\n") || "_No heroes left._";

    const embed = mkEmbed(`🧭 Expedition — ${tag}`, [
      `Owner: <@${userId}>`,
      `Status: **${expe.status}**`,
      `Tick: **${expe.tickIndex}/${expe.ticksTotal}**`,
      `Next update: <t:${Math.floor(expe.nextTickAt / 1000)}:R>`,
      "",
      `Party:`,
      partyLine,
      "",
      `Latest: ${tickText}`,
      "",
      `Rewards so far:`,
      `• Currency: **${expe.rewards.currency}**`,
      `• Shards: **${expe.rewards.shards}**`,
    ]);

    await updateMessage(ch, expe.messageId, embed);
  }

  // schedule next tick
  clearUserTimers(userId);
  const t = { timeouts: [] };
  activeTimers.set(userId, t);

  t.timeouts.push(setTimeout(async () => {
    await tick(userId).catch(() => {});
  }, EXPE_TICK_MS));
}

/**
 * Hook client globally so expeditions can fetch channels.
 * Call once in your index.js after login (we will do it in buttons handler too as fallback).
 */
function bindClient(client) {
  globalThis.__botClient = client;
}

module.exports = {
  startExpedition,
  scheduleExpedition,
  bindClient,
};
