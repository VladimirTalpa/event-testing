const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const cfg = require("../config");
const { getPlayer, setPlayer } = require("../core/players");
const { CARD_BY_ID } = require("../data/cards");

let CLIENT = null;

function color() {
  return cfg.COLOR || 0x8a2be2;
}

function now() {
  return Date.now();
}

function dayKey(t) {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function resetDailyIfNeeded(p) {
  const key = dayKey(now());
  if (p.expedition.dailyReset !== key) {
    p.expedition.dailyReset = key;
    p.expedition.dailyCount = 0;
  }
}

function buildPartyMenu(player) {
  const cards = (player.cards || []).filter((c) => !c.dead);
  const options = cards.slice(0, 25).map((ci) => {
    const base = CARD_BY_ID.get(ci.cardId);
    const label = base ? `${base.name} (Lv.${ci.level} ⭐${ci.stars})` : `Unknown (${ci.cardId})`;
    const desc = base ? `${base.rarity} • ${base.role}` : "Unknown";
    return { label, value: ci.instanceId, description: desc };
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("expedition:party:select")
    .setPlaceholder("Pick up to 3 heroes…")
    .setMinValues(1)
    .setMaxValues(3)
    .addOptions(options.length ? options : [{ label: "No cards", value: "none", description: "You need cards" }]);

  return new ActionRowBuilder().addComponents(menu);
}

function partyConfirmRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("expedition:confirm").setLabel("✅ Confirm").setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId("expedition:cancel").setLabel("✖ Cancel").setStyle(ButtonStyle.Secondary),
  );
}

function rarityWeight(r) {
  if (r === "Mythic") return 4;
  if (r === "Legendary") return 3;
  if (r === "Rare") return 2;
  return 1;
}

function randomEvent() {
  // weighted events
  const table = [
    { t: "found_material", w: 35 },
    { t: "combat", w: 35 },
    { t: "miniboss", w: 15 },
    { t: "death_check", w: 15 },
  ];
  const total = table.reduce((a, x) => a + x.w, 0);
  let r = Math.random() * total;
  for (const x of table) {
    r -= x.w;
    if (r <= 0) return x.t;
  }
  return "combat";
}

function calcPartyPower(player, partyInstanceIds) {
  let power = 0;
  for (const id of partyInstanceIds) {
    const inst = (player.cards || []).find((c) => c.instanceId === id);
    if (!inst) continue;
    const base = CARD_BY_ID.get(inst.cardId);
    if (!base) continue;
    power += rarityWeight(base.rarity) * (1 + inst.stars * 0.2);
  }
  return power;
}

function deathChanceForInstance(player, instanceId) {
  const inst = (player.cards || []).find((c) => c.instanceId === instanceId);
  if (!inst) return 0.25;
  const base = CARD_BY_ID.get(inst.cardId);
  if (!base) return 0.25;

  // Common risky, Mythic safest
  if (base.rarity === "Common") return 0.22;
  if (base.rarity === "Rare") return 0.14;
  if (base.rarity === "Legendary") return 0.08;
  return 0.04;
}

function makeEmbedForExpedition(player) {
  const e = player.expedition;
  const lines = (e.log || []).slice(-8).map((x) => `• ${x}`);

  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle("🧭 Expedition")
    .setDescription(
      [
        e.active
          ? `Status: **ACTIVE**`
          : `Status: **NOT ACTIVE**`,
        `Starts: <t:${Math.floor((e.startingAt || 0) / 1000)}:R>`,
        `Ticks: **${e.ticksDone || 0}/${e.totalTicks || 0}**`,
        `Party: ${(e.party || []).map((id) => {
          const inst = (player.cards || []).find((c) => c.instanceId === id);
          const base = inst ? CARD_BY_ID.get(inst.cardId) : null;
          return base ? `${base.name}` : "Unknown";
        }).join(", ") || "—"}`,
        "",
        lines.length ? "**Log:**\n" + lines.join("\n") : "No events yet.",
      ].join("\n")
    );

  return embed;
}

async function postOrUpdateMessage(userId) {
  const p = await getPlayer(userId);
  const e = p.expedition;

  if (!CLIENT || !e.channelId) return;

  const ch = await CLIENT.channels.fetch(e.channelId).catch(() => null);
  if (!ch) return;

  const embed = makeEmbedForExpedition(p);

  if (!e.messageId) {
    const msg = await ch.send({ embeds: [embed] }).catch(() => null);
    if (msg) {
      e.messageId = msg.id;
      await setPlayer(userId, p);
    }
    return;
  }

  const msg = await ch.messages.fetch(e.messageId).catch(() => null);
  if (!msg) {
    e.messageId = null;
    await setPlayer(userId, p);
    return postOrUpdateMessage(userId);
  }

  await msg.edit({ embeds: [embed] }).catch(() => {});
}

async function tickUser(userId) {
  const p = await getPlayer(userId);
  const e = p.expedition;

  if (!e.active) return;

  // wait start delay
  if (now() < e.startingAt) {
    await postOrUpdateMessage(userId);
    return;
  }

  if ((e.ticksDone || 0) >= (e.totalTicks || 0)) {
    e.active = false;
    e.log.push("✅ Expedition finished!");
    // rewards
    const partyPower = calcPartyPower(p, e.party || []);
    const reward = Math.max(50, Math.floor(80 + partyPower * 25));

    // reward currency + shards based on main anime majority
    // (простая логика)
    const countBleach = (e.party || []).filter((id) => {
      const inst = (p.cards || []).find((c) => c.instanceId === id);
      const base = inst ? CARD_BY_ID.get(inst.cardId) : null;
      return base?.anime === "bleach";
    }).length;

    const event = countBleach >= 2 ? "bleach" : "jjk";
    if (event === "bleach") p.bleach.reiatsu += reward;
    else p.jjk.cursedEnergy += reward;

    if (event === "bleach") p.shards.bleach += 6;
    else p.shards.jjk += 6;

    e.log.push(`🎁 Rewards: +${reward} ${event === "bleach" ? "Reiatsu" : "Cursed Energy"} +6 shards`);

    // reset party statuses
    for (const id of e.party || []) {
      const inst = (p.cards || []).find((c) => c.instanceId === id);
      if (inst && !inst.dead) inst.status = "idle";
    }

    e.party = [];
    e.channelId = null;
    e.messageId = null;

    await setPlayer(userId, p);
    return;
  }

  // run one tick
  e.ticksDone += 1;
  const ev = randomEvent();

  if (ev === "found_material") {
    const add = Math.random() < 0.5 ? 2 : 3;
    const countBleach = (e.party || []).filter((id) => {
      const inst = (p.cards || []).find((c) => c.instanceId === id);
      const base = inst ? CARD_BY_ID.get(inst.cardId) : null;
      return base?.anime === "bleach";
    }).length;
    const event = countBleach >= 2 ? "bleach" : "jjk";
    if (event === "bleach") p.shards.bleach += add;
    else p.shards.jjk += add;
    e.log.push(`📦 Found materials: +${add} ${event} shards`);
  }

  if (ev === "combat") {
    const power = calcPartyPower(p, e.party || []);
    const success = Math.random() < Math.min(0.9, 0.35 + power * 0.08);
    e.log.push(success ? "⚔️ Combat: ✅ success" : "⚔️ Combat: ❌ hit taken");
    if (!success) {
      // small death check on a random member
      const pick = (e.party || [])[Math.floor(Math.random() * (e.party || []).length)];
      if (pick) {
        const chance = deathChanceForInstance(p, pick) * 0.5; // combat smaller death chance
        if (Math.random() < chance) {
          // delete card permanently
          const idx = (p.cards || []).findIndex((x) => x.instanceId === pick);
          if (idx !== -1) {
            const inst = p.cards[idx];
            const base = CARD_BY_ID.get(inst.cardId);
            p.cards.splice(idx, 1);
            e.party = e.party.filter((x) => x !== pick);
            e.log.push(`☠ ${base ? base.name : "A hero"} died. Card deleted forever.`);
          }
        }
      }
    }
  }

  if (ev === "miniboss") {
    const power = calcPartyPower(p, e.party || []);
    const success = Math.random() < Math.min(0.85, 0.25 + power * 0.07);
    e.log.push(success ? "👹 Mini-boss: ✅ defeated" : "👹 Mini-boss: ❌ party hurt");
    if (!success) {
      // bigger death check
      const pick = (e.party || [])[Math.floor(Math.random() * (e.party || []).length)];
      if (pick) {
        const chance = deathChanceForInstance(p, pick);
        if (Math.random() < chance) {
          const idx = (p.cards || []).findIndex((x) => x.instanceId === pick);
          if (idx !== -1) {
            const inst = p.cards[idx];
            const base = CARD_BY_ID.get(inst.cardId);
            p.cards.splice(idx, 1);
            e.party = e.party.filter((x) => x !== pick);
            e.log.push(`☠ ${base ? base.name : "A hero"} died to mini-boss. Card deleted forever.`);
          }
        }
      }
    }
  }

  if (ev === "death_check") {
    // random danger event
    const pick = (e.party || [])[Math.floor(Math.random() * (e.party || []).length)];
    if (pick) {
      const chance = deathChanceForInstance(p, pick) * 0.85;
      const inst = (p.cards || []).find((x) => x.instanceId === pick);
      const base = inst ? CARD_BY_ID.get(inst.cardId) : null;
      if (Math.random() < chance) {
        const idx = (p.cards || []).findIndex((x) => x.instanceId === pick);
        if (idx !== -1) p.cards.splice(idx, 1);
        e.party = e.party.filter((x) => x !== pick);
        e.log.push(`☠ Fatal event: ${base ? base.name : "A hero"} died. Card deleted forever.`);
      } else {
        e.log.push(`⚠️ Danger event: ${base ? base.name : "A hero"} survived.`);
      }
    }
  }

  // if party empty => end expedition
  if (!e.party.length) {
    e.active = false;
    e.log.push("❌ Expedition failed: party wiped.");
    e.channelId = null;
    e.messageId = null;
  }

  await setPlayer(userId, p);
  await postOrUpdateMessage(userId);
}

async function scanAllAndTick() {
  // пробегаем по players.json (без отдельного индекса)
  const fs = require("fs");
  const path = require("path");
  const dbPath = path.join(process.cwd(), "data", "players.json");
  if (!fs.existsSync(dbPath)) return;
  const all = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const ids = Object.keys(all);

  for (const userId of ids) {
    // eslint-disable-next-line no-await-in-loop
    await tickUser(userId).catch(() => {});
  }
}

function init(client) {
  CLIENT = client;

  const ms = (cfg.EXPEDITION_TICK_MIN || 10) * 60 * 1000;

  // сразу один проход
  scanAllAndTick().catch(() => {});

  setInterval(() => {
    scanAllAndTick().catch(() => {});
  }, ms);
}

async function startFlow(interaction) {
  const p = await getPlayer(interaction.user.id);
  resetDailyIfNeeded(p);

  if (p.expedition.active) {
    return { content: "❌ You already have an active expedition.", embeds: [], components: [] };
  }

  if (p.expedition.dailyCount >= (cfg.EXPEDITION_DAILY_LIMIT || 2)) {
    return { content: `❌ Daily limit reached (${cfg.EXPEDITION_DAILY_LIMIT}).`, embeds: [], components: [] };
  }

  const alive = (p.cards || []).filter((c) => !c.dead);
  if (alive.length < 1) return { content: "❌ You need cards to start expeditions.", embeds: [], components: [] };

  // подготовка “pending” выбора партии
  p.expedition.pendingParty = [];
  await setPlayer(interaction.user.id, p);

  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle("🧭 Start Expedition")
    .setDescription(
      [
        "Pick **up to 3** heroes.",
        `Start delay: **${cfg.EXPEDITION_START_DELAY_MIN} minutes**`,
        `Tick: **every ${cfg.EXPEDITION_TICK_MIN} minutes**`,
        "",
        "⚠️ If a hero dies → the **card is deleted forever**.",
      ].join("\n")
    );

  return {
    embeds: [embed],
    components: [buildPartyMenu(p), partyConfirmRow(true)],
  };
}

async function partySelected(interaction) {
  const p = await getPlayer(interaction.user.id);

  const values = interaction.values || [];
  const valid = values.filter((v) => v !== "none");

  p.expedition.pendingParty = valid;
  await setPlayer(interaction.user.id, p);

  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle("🧭 Start Expedition")
    .setDescription(
      [
        `Selected: **${valid.length}**`,
        valid.map((id) => {
          const inst = (p.cards || []).find((c) => c.instanceId === id);
          const base = inst ? CARD_BY_ID.get(inst.cardId) : null;
          return `• ${base ? base.name : "Unknown"}`;
        }).join("\n") || "—",
        "",
        "Press **Confirm** to start.",
      ].join("\n")
    );

  return {
    embeds: [embed],
    components: [buildPartyMenu(p), partyConfirmRow(valid.length === 0)],
  };
}

async function confirmParty(interaction) {
  const p = await getPlayer(interaction.user.id);
  resetDailyIfNeeded(p);

  const party = p.expedition.pendingParty || [];
  if (!party.length) {
    return { content: "❌ Select at least 1 hero.", embeds: [], components: [] };
  }

  // mark statuses
  for (const id of party) {
    const inst = (p.cards || []).find((c) => c.instanceId === id);
    if (inst) inst.status = "expedition";
  }

  p.expedition.active = true;
  p.expedition.party = party;
  p.expedition.pendingParty = [];
  p.expedition.ticksDone = 0;
  p.expedition.totalTicks = cfg.EXPEDITION_TOTAL_TICKS || 6;
  p.expedition.startingAt = now() + (cfg.EXPEDITION_START_DELAY_MIN || 60) * 60 * 1000;
  p.expedition.channelId = interaction.channelId;
  p.expedition.messageId = null;
  p.expedition.log = [`🟢 Expedition scheduled. Starts in ${cfg.EXPEDITION_START_DELAY_MIN} min.`];

  p.expedition.dailyCount += 1;

  await setPlayer(interaction.user.id, p);
  await postOrUpdateMessage(interaction.user.id);

  return {
    content: "✅ Expedition started (scheduled). I’ll update the message every 10 minutes.",
    embeds: [makeEmbedForExpedition(p)],
    components: [],
  };
}

module.exports = {
  init,
  startFlow,
  partySelected,
  confirmParty,
};
