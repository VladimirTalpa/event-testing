require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  StringSelectMenuBuilder,
} = require("discord.js");

const { createClient } = require("redis");

/* ===================== CONFIG ===================== */

// Roles that can manually spawn events
const EVENT_ROLE_IDS = ["1259865441405501571", "1287879457025163325"];

// Ping roles on spawn
const PING_BOSS_ROLE_ID = "1467575062826586205";
const PING_HOLLOW_ROLE_ID = "1467575020275368131";

// Booster role for daily
const BOOSTER_ROLE_ID = "1267266564961341501";

// Emojis
const E_VASTO = "<:event:1467502793869885563>";
const E_MEMBERS = "<:event:1467501718630568118>";
const E_REIATSU = "<:event:1467497975101128724>";

// Auto spawn channel + timers
const AUTO_EVENT_CHANNEL_ID = "1358096447467294790";
const AUTO_HOLLOW_EVERY_MS = 20 * 60 * 1000; // 20 min
const AUTO_BOSS_EVERY_MS = 2 * 60 * 60 * 1000; // 2 hours

// Theme
const COLOR = 0x7b2cff;

// Between rounds
const ROUND_COOLDOWN_MS = 10 * 1000;

// 2 hits = out
const MAX_HITS = 2;

// PvP
const CLASH_RESPONSE_MS = 20 * 1000;
const CLASH_COOLDOWN_MS = 5 * 60 * 1000;

// Daily
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_NORMAL = 100;
const DAILY_BOOSTER = 200;

// ✅ Drako exchange
const DRAKO_RATE = 47; // 47 Reiatsu -> 1 Drako
const E_DRAKO = "🪙";

/* ===================== MEDIA ===================== */
const VASTO_SPAWN_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467277181955604572/Your_paragraph_text_4.gif?ex=6980749c&is=697f231c&hm=d06365f2194faceee52207192f81db418aa5a485aaa498f154553dc5e62f6d79&=";

const VASTO_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1467276870784520326/Your_paragraph_text_3.gif?ex=69807452&is=697f22d2&hm=893ba1888e2ea579e71f442f158cfc25e06ed5371b59c978dd1afae3f61d480f&=";
const VASTO_R2 = VASTO_R1;
const VASTO_R3 =
  "https://media.discordapp.net/attachments/1405973335979851877/1467276903160483995/Your_paragraph_text_1.gif?ex=6980745a&is=697f22da&hm=52decaeaf342973a4930a1d7a0f09ac5fb38358650e5607c40e9c821d7596a88&=";
const VASTO_R4 =
  "https://media.discordapp.net/attachments/1405973335979851877/1467276984257220795/Your_paragraph_text_6.gif?ex=6980746d&is=697f22ed&hm=2a22d2df088318c7bfb1ddcb1601caea0ea248a19e6db909f741895b769ce7bb&=";

const VASTO_VICTORY_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467278760901345313/Your_paragraph_text_7.gif?ex=69807615&is=697f2495&hm=b6f4546141fb8a52e480992b5c029cd1c675072df0e71b1f3ed50ebee65b01eb&=";

const VASTO_DEFEAT_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467276974589218941/Your_paragraph_text_5.gif?ex=6980746b&is=697f22eb&hm=4f8a5f7867d5366e2a473a6d84a13e051544ebc5c56bee5dc34a4ae727c00f20&=";

// ULQ placeholders (можешь заменить позже на свои)
const ULQ_SPAWN_MEDIA = VASTO_SPAWN_MEDIA;
const ULQ_R1 = VASTO_R1;
const ULQ_R2 = VASTO_R2;
const ULQ_R3 = VASTO_R3;
const ULQ_R4 = VASTO_R4;
const ULQ_R5 = VASTO_R4;
const ULQ_R6 = VASTO_R4;
const ULQ_R7 = VASTO_R4;
const ULQ_VICTORY_MEDIA = VASTO_VICTORY_MEDIA;
const ULQ_DEFEAT_MEDIA = VASTO_DEFEAT_MEDIA;

// Hollow
const HOLLOW_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467508068303638540/Your_paragraph_text_10.gif?ex=6980a2e4&is=697f5164&hm=451cc0ec6edd18799593cf138549ddb86934217f6bee1e6364814d23153ead78&=";

/* ===================== Hollow mini-event ===================== */
const HOLLOW_EVENT_MS = 2 * 60 * 1000;
const HOLLOW_HIT_REIATSU = 25;
const HOLLOW_MISS_REIATSU = 10;
const BONUS_PER_HOLLOW_KILL = 1;
const BONUS_MAX = 30;

/* ===================== Drops / Shop roles ===================== */
const BOSS_DROP_ROLE_ID = "1467426528584405103";

const DROP_ROLE_CHANCE_BASE = 0.05;
const DROP_ROLE_CHANCE_CAP = 0.12;

const DROP_ROBUX_CHANCE_REAL_BASE = 0.005;
const DROP_ROBUX_CHANCE_DISPLAY = 0.025;
const DROP_ROBUX_CHANCE_CAP = 0.01;
const ROBUX_CLAIM_TEXT = "To claim: contact **daez063**.";

const SHOP_COSMETIC_ROLE_ID = "1467438527200497768";

/* ===================== REDIS ===================== */
const REDIS_PLAYERS_KEY = "bleach:players";
let redis;

async function initRedis() {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error("❌ Missing REDIS_URL in Railway variables.");
    process.exit(1);
  }
  redis = createClient({ url });
  redis.on("error", (err) => console.error("Redis error:", err));
  await redis.connect();
  console.log("✅ Redis connected");
  return redis;
}

function normalizePlayer(raw = {}) {
  const reiatsu = Number.isFinite(raw.reiatsu)
    ? raw.reiatsu
    : Number.isFinite(raw.reatsu)
      ? raw.reatsu
      : 0;

  const drako = Number.isFinite(raw.drako) ? raw.drako : 0;

  const items = raw.items && typeof raw.items === "object" ? raw.items : {};
  const ownedRoles = Array.isArray(raw.ownedRoles) ? raw.ownedRoles.filter(Boolean) : [];

  return {
    reiatsu,
    drako,
    survivalBonus: Number.isFinite(raw.survivalBonus) ? raw.survivalBonus : 0,
    lastDaily: Number.isFinite(raw.lastDaily) ? raw.lastDaily : 0,

    // ✅ шкафчик ролей — хранит ownership навсегда
    ownedRoles: [...new Set(ownedRoles.map(String))],

    items: {
      zanpakuto_basic: !!items.zanpakuto_basic,
      hollow_mask_fragment: !!items.hollow_mask_fragment,
      soul_reaper_cloak: !!items.soul_reaper_cloak,
      reiatsu_amplifier: !!items.reiatsu_amplifier,
      cosmetic_role: !!items.cosmetic_role,
    },
  };
}

async function getPlayer(userId) {
  await initRedis();
  const raw = await redis.hGet(REDIS_PLAYERS_KEY, userId);
  if (!raw) {
    const fresh = normalizePlayer({});
    await redis.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(fresh));
    return fresh;
  }
  try {
    return normalizePlayer(JSON.parse(raw));
  } catch {
    const fresh = normalizePlayer({});
    await redis.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(fresh));
    return fresh;
  }
}

async function setPlayer(userId, obj) {
  await initRedis();
  const p = normalizePlayer(obj);
  await redis.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(p));
  return p;
}

async function getTopPlayers(limit = 10) {
  await initRedis();
  const all = await redis.hGetAll(REDIS_PLAYERS_KEY);
  const rows = Object.entries(all).map(([userId, json]) => {
    let p = {};
    try { p = normalizePlayer(JSON.parse(json)); } catch {}
    return { userId, reiatsu: p.reiatsu || 0 };
  });
  rows.sort((a, b) => b.reiatsu - a.reiatsu);
  return rows.slice(0, limit);
}

/* ===================== SHOP ===================== */
const SHOP_ITEMS = [
  { key: "zanpakuto_basic", name: "Zanpakutō (basic)", price: 350, desc: `+4% survive vs bosses • +5% drop luck` },
  { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: `+7% survive vs bosses • +10% drop luck` },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: `+9% survive vs bosses • +6% drop luck` },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: `${E_REIATSU} +25% Reiatsu rewards • +2% survive vs bosses` },
  { key: "cosmetic_role", name: "Sousuke Aizen role", price: 6000, desc: "Cosmetic Discord role (no stats).", roleId: SHOP_COSMETIC_ROLE_ID },
];

function calcItemSurvivalBonus(items) {
  let bonus = 0;
  if (items.zanpakuto_basic) bonus += 4;
  if (items.hollow_mask_fragment) bonus += 7;
  if (items.soul_reaper_cloak) bonus += 9;
  if (items.reiatsu_amplifier) bonus += 2;
  return bonus;
}
function calcReiatsuMultiplier(items) {
  return items.reiatsu_amplifier ? 1.25 : 1.0;
}
function calcDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.zanpakuto_basic) mult += 0.05;
  if (items.hollow_mask_fragment) mult += 0.10;
  if (items.soul_reaper_cloak) mult += 0.06;
  return mult;
}

/* ===================== HELPERS ===================== */
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
}
function hasBoosterRole(member) {
  return !!member?.roles?.cache?.has(BOOSTER_ROLE_ID);
}

async function editMessageSafe(channel, messageId, payload) {
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return null;
  await msg.edit(payload).catch(() => {});
  return msg;
}

async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return { ok: false, reason: "Bot has no Manage Roles permission." };
    }
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role add (permissions/hierarchy)." };
  }
}

async function tryRemoveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return { ok: false, reason: "Bot has no Manage Roles permission." };
    }
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.remove(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role remove (permissions/hierarchy)." };
  }
}

/* ===================== WARDROBE (ROLE LOCKER) ===================== */
function ensureOwnedRole(player, roleId) {
  const id = String(roleId);
  if (!player.ownedRoles.includes(id)) player.ownedRoles.push(id);
}

function wardrobeEmbed(guild, player) {
  const roles = player.ownedRoles
    .map((rid) => guild.roles.cache.get(rid))
    .filter(Boolean);

  const lines = roles.length
    ? roles.map((r) => `• <@&${r.id}>`).join("\n")
    : "_No saved roles yet. Get roles from bosses/shop first._";

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🧥 Wardrobe")
    .setDescription(
      `Saved roles never disappear.\n` +
      `Select a role below to **equip/unequip** it.\n\n` +
      `${lines}`
    );
}

function wardrobeComponents(guild, member, player) {
  const roles = player.ownedRoles
    .map((rid) => guild.roles.cache.get(rid))
    .filter(Boolean);

  if (!roles.length) return [];

  const options = roles.slice(0, 25).map((r) => {
    const equipped = member.roles.cache.has(r.id);
    return {
      label: r.name.slice(0, 100),
      value: r.id,
      description: equipped ? "Equipped (select to remove)" : "Not equipped (select to wear)",
    };
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("wardrobe_select")
    .setPlaceholder("Choose a role to equip/unequip")
    .addOptions(options);

  return [new ActionRowBuilder().addComponents(menu)];
}

/* ===================== BOSSES DEFINITIONS (scenario) ===================== */
const BOSSES = {
  vasto: {
    id: "vasto",
    name: "Vasto Lorde",
    difficulty: "Hard",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.30,
    winReward: 200,
    hitReward: 15, // banked, paid only on victory
    spawnMedia: VASTO_SPAWN_MEDIA,
    victoryMedia: VASTO_VICTORY_MEDIA,
    defeatMedia: VASTO_DEFEAT_MEDIA,
    rounds: [
      { type: "pressure", title: "Round 1 — Reiatsu Wave", intro: "Vasto Lorde releases a powerful Reiatsu wave.", media: VASTO_R1 },
      { type: "pressure", title: "Round 2 — Berserk Pressure", intro: "Vasto Lorde enters a frenzy. The pressure intensifies.", media: VASTO_R2 },
      { type: "attack", title: "Round 3 — Weakened", intro: "Vasto Lorde is weakened. Strike now.", media: VASTO_R3 },
      { type: "finisher", title: "Round 4 — Final (Finisher)", intro: "Vasto Lorde is almost defeated. **Press FINISHER in time!**", windowMs: 5000, buttonLabel: "Finisher", buttonEmoji: "⚔️", media: VASTO_R4 },
    ],
  },

  ulquiorra: {
    id: "ulquiorra",
    name: "Ulquiorra",
    difficulty: "Extreme",
    joinMs: 3 * 60 * 1000,
    baseChance: 0.20,
    // можешь поменять цифры как хочешь
    winReward: 450,
    hitReward: 20,
    spawnMedia: ULQ_SPAWN_MEDIA,
    victoryMedia: ULQ_VICTORY_MEDIA,
    defeatMedia: ULQ_DEFEAT_MEDIA,
    rounds: [
      { type: "pressure", title: "Round 1 — Reiatsu Wave", intro: "Ulquiorra releases a Reiatsu wave. Endure it.", media: ULQ_R1 },
      { type: "defend", title: "Round 2 — Defense", intro: "Ulquiorra prepares a powerful strike. **Hold!**", windowMs: 2000, buttonLabel: "Hold", buttonEmoji: "🛡️", media: ULQ_R2 },
      { type: "defend", title: "Round 3 — Defense", intro: "Second strike. **Hold again!**", windowMs: 2000, buttonLabel: "Hold", buttonEmoji: "🛡️", media: ULQ_R3 },
      { type: "attack", title: "Round 4 — Transformation", intro: "Ulquiorra transforms. Pressure becomes unbearable.", media: ULQ_R4 },
      { type: "attack", title: "Round 5 — Rampage", intro: "Ulquiorra goes berserk. Survive the assault.", media: ULQ_R5 },
      { type: "attack", title: "Round 6 — Critical Damage", intro: "Ulquiorra took critical damage. Finish the fight.", media: ULQ_R6 },
      { type: "attack", title: "Round 7 — Final", intro: "Last chance. Ulquiorra is at his limit.", media: ULQ_R7 },
    ],
  },
};

/* ===================== EMBEDS ===================== */
function bossSpawnEmbed(bossDef, channelName, joinedCount, fightersText) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_VASTO} ${bossDef.name} Appeared!`)
    .setDescription(
      `**Difficulty:** ${bossDef.difficulty}\n` +
      `⏳ **Join time:** ${Math.round(bossDef.joinMs / 60000)} minutes\n` +
      `Click **🗡 Join Battle** to participate.`
    )
    .addFields(
      { name: `${E_MEMBERS} Fighters`, value: fightersText, inline: false },
      { name: `${E_MEMBERS} Joined`, value: `\`${joinedCount}\``, inline: true },
      { name: `${E_REIATSU} Rewards`, value: `\`${bossDef.winReward} win • +${bossDef.hitReward}/success (banked)\``, inline: true },
      { name: `📌 Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(bossDef.spawnMedia)
    .setFooter({ text: `Boss • ${bossDef.rounds.length} rounds • 2 hits = out` });
}

function bossRoundEmbed(bossDef, roundIndex, aliveCount) {
  const r = bossDef.rounds[roundIndex];
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_VASTO} ${bossDef.name} — ${r.title}`)
    .setDescription(r.intro)
    .addFields({ name: `${E_MEMBERS} Alive fighters`, value: `\`${aliveCount}\``, inline: true })
    .setImage(r.media || bossDef.spawnMedia)
    .setFooter({ text: `Round ${roundIndex + 1}/${bossDef.rounds.length}` });
}

function bossVictoryEmbed(bossDef, survivorsCount) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`${E_VASTO} ${bossDef.name} Defeated!`)
    .setDescription(`✅ Rewards granted to survivors.`)
    .addFields(
      { name: `${E_MEMBERS} Survivors`, value: `\`${survivorsCount}\``, inline: true },
      { name: `🎭 Drops`, value: `\`5% role • ${(DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}% 100 Robux\``, inline: true }
    )
    .setImage(bossDef.victoryMedia);
}

function bossDefeatEmbed(bossDef) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`${E_VASTO} Defeat`)
    .setDescription(`❌ Everyone lost. **${bossDef.name}** wins.`)
    .setImage(bossDef.defeatMedia);
}

function hollowEmbed(joinedCount) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`👁️ Hollow Appeared!`)
    .setDescription(
      [
        `⏳ **Time: 2 minutes**`,
        `🎲 50/50 chance to hit`,
        `${E_REIATSU} Hit: **${HOLLOW_HIT_REIATSU}** • Miss: **${HOLLOW_MISS_REIATSU}**`,
        `${E_VASTO} If defeated: hitters gain +${BONUS_PER_HOLLOW_KILL}% boss bonus (max ${BONUS_MAX}%).`,
      ].join("\n")
    )
    .addFields({ name: `${E_MEMBERS} Attackers`, value: `\`${joinedCount}\``, inline: true })
    .setImage(HOLLOW_MEDIA);
}

function shopEmbed(player) {
  const inv = player.items;
  const lines = SHOP_ITEMS.map((it) => {
    const owned = inv[it.key] ? "✅ Owned" : `${E_REIATSU} ${it.price} Reiatsu`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🛒 Shop")
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: `${E_REIATSU} Your Reiatsu`, value: `\`${player.reiatsu}\``, inline: true },
      { name: `${E_VASTO} Boss bonus`, value: `\`${player.survivalBonus}% / ${BONUS_MAX}%\``, inline: true },
      { name: `${E_DRAKO} Drako Coin`, value: `\`${player.drako}\``, inline: true }
    );
}

function inventoryEmbed(player) {
  const inv = player.items;
  const itemBonus = calcItemSurvivalBonus(inv);
  const mult = calcReiatsuMultiplier(inv);
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🎒 Inventory")
    .setDescription(
      [
        `${E_REIATSU} Reiatsu: **${player.reiatsu}**`,
        `${E_DRAKO} Drako Coin: **${player.drako}**`,
        `${E_VASTO} Permanent boss bonus: **${player.survivalBonus}% / ${BONUS_MAX}%**`,
        `🛡 Item boss bonus: **${itemBonus}%**`,
        `🍀 Drop luck: **x${calcDropLuckMultiplier(inv).toFixed(2)}**`,
        `💰 Reiatsu multiplier: **x${mult}**`,
        "",
        `• Zanpakutō: ${inv.zanpakuto_basic ? "✅" : "❌"}`,
        `• Mask Fragment: ${inv.hollow_mask_fragment ? "✅" : "❌"}`,
        `• Cloak: ${inv.soul_reaper_cloak ? "✅" : "❌"}`,
        `• Amplifier: ${inv.reiatsu_amplifier ? "✅" : "❌"}`,
        `• Sousuke Aizen role: ${inv.cosmetic_role ? "✅" : "❌"}`,
        "",
        `🧥 Wardrobe saved roles: **${player.ownedRoles.length}**`,
      ].join("\n")
    );
}

function leaderboardEmbed(entries) {
  const lines = entries.map((e, i) => `**#${i + 1}** — ${safeName(e.name)}: **${E_REIATSU} ${e.reiatsu}**`);
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🏆 Reiatsu Leaderboard")
    .setDescription(lines.join("\n") || "No data yet.");
}

/* ===================== COMPONENTS ===================== */
const CID = {
  BOSS_JOIN: ["boss_join"],
  BOSS_RULES: ["boss_rules"],
  BOSS_ACTION: "boss_action", // boss_action:<bossId>:<roundIndex>:<token>
  HOLLOW_ATTACK: ["hollow_attack"],
};

function bossButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("boss_join").setLabel("Join Battle").setEmoji("🗡").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId("boss_rules").setLabel("Rules").setEmoji("📜").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
  ];
}

function actionButtonRow(customId, label, emoji, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(customId).setLabel(label).setEmoji(emoji).setStyle(ButtonStyle.Danger).setDisabled(disabled)
    ),
  ];
}

function hollowButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("hollow_attack").setLabel("Attack Hollow").setEmoji("⚔️").setStyle(ButtonStyle.Primary).setDisabled(disabled)
    ),
  ];
}

function shopButtons(player) {
  const inv = player.items;
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_zanpakuto_basic").setLabel("Buy Zanpakutō").setStyle(ButtonStyle.Secondary).setDisabled(inv.zanpakuto_basic),
    new ButtonBuilder().setCustomId("buy_hollow_mask_fragment").setLabel("Buy Mask Fragment").setStyle(ButtonStyle.Secondary).setDisabled(inv.hollow_mask_fragment),
    new ButtonBuilder().setCustomId("buy_soul_reaper_cloak").setLabel("Buy Cloak").setStyle(ButtonStyle.Secondary).setDisabled(inv.soul_reaper_cloak)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_reiatsu_amplifier").setLabel("Buy Amplifier").setStyle(ButtonStyle.Secondary).setDisabled(inv.reiatsu_amplifier),
    new ButtonBuilder().setCustomId("buy_cosmetic_role").setLabel("Buy Sousuke Aizen role").setStyle(ButtonStyle.Danger).setDisabled(inv.cosmetic_role)
  );
  return [row1, row2];
}

/* ===================== RUNTIME STATE ===================== */
const bossByChannel = new Map();
const hollowByChannel = new Map();
const clashByChannel = new Map();
const lastClashByUser = new Map();

/* ===================== BOSS CORE ===================== */
function computeSurviveChance(player, baseChance) {
  const itemBonus = calcItemSurvivalBonus(player.items);
  const perm = clamp(player.survivalBonus, 0, BONUS_MAX);
  return Math.min(0.95, baseChance + (itemBonus + perm) / 100);
}

async function updateBossSpawnMessage(channel, boss) {
  const fighters = [...boss.participants.values()];
  const fightersText = fighters.length
    ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000)
    : "`No fighters yet`";

  await editMessageSafe(channel, boss.messageId, {
    embeds: [bossSpawnEmbed(boss.def, channel.name, fighters.length, fightersText)],
    components: bossButtons(!boss.joining),
  });
}

function aliveIds(boss) {
  return [...boss.participants.entries()]
    .filter(([, st]) => st.hits < MAX_HITS)
    .map(([uid]) => uid);
}

async function applyHit(uid, boss, channel, reasonText) {
  const st = boss.participants.get(uid);
  if (!st) return;
  st.hits++;
  const name = safeName(st.displayName);
  await channel.send(`💥 **${name}** ${reasonText} (${st.hits}/${MAX_HITS})`).catch(() => {});
  if (st.hits >= MAX_HITS) {
    await channel.send(`☠️ **${name}** was eliminated.`).catch(() => {});
  }
}

function bankSuccess(uid, boss, amount) {
  boss.hitBank.set(uid, (boss.hitBank.get(uid) || 0) + amount);
}

async function runBoss(channel, boss) {
  try {
    boss.joining = false;
    await updateBossSpawnMessage(channel, boss);

    let alive = aliveIds(boss);
    if (!alive.length) {
      await channel.send(`${E_VASTO} No one joined. **${boss.def.name}** vanished.`).catch(() => {});
      return;
    }

    for (let i = 0; i < boss.def.rounds.length; i++) {
      alive = aliveIds(boss);
      if (!alive.length) break;

      const r = boss.def.rounds[i];

      await channel.send({ embeds: [bossRoundEmbed(boss.def, i, alive.length)] }).catch(() => {});

      // RANDOM rounds
      if (r.type === "pressure" || r.type === "attack") {
        for (const uid of alive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(player, boss.def.baseChance);
          const ok = Math.random() < chance;

          if (!ok) {
            await applyHit(uid, boss, channel, `failed to withstand **${boss.def.name}**!`);
          } else {
            const mult = calcReiatsuMultiplier(player.items);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);

            const nm = safeName(boss.participants.get(uid)?.displayName);
            await channel.send(`⚔️ **${nm}** held on and counterattacked! (+${E_REIATSU} ${add} banked)`).catch(() => {});
          }

          await sleep(350);
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Cooldown: **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

      // BUTTON rounds: defend / finisher
      if (r.type === "defend" || r.type === "finisher") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = {
          token,
          roundIndex: i,
          pressed: new Set(),
        };

        const customId = `${CID.BOSS_ACTION}:${boss.def.id}:${i}:${token}`;
        const msg = await channel.send({
          content:
            r.type === "finisher"
              ? `⚠️ **FINISHER WINDOW: ${Math.round(r.windowMs / 1000)}s** — press **${r.buttonLabel}**!`
              : `🛡️ **DEFENSE WINDOW: ${Math.round(r.windowMs / 1000)}s** — press **${r.buttonLabel}**!`,
          components: actionButtonRow(customId, r.buttonLabel, r.buttonEmoji, false),
        }).catch(() => null);

        await sleep(r.windowMs);

        if (msg?.id) {
          await editMessageSafe(channel, msg.id, { components: actionButtonRow(customId, r.buttonLabel, r.buttonEmoji, true) });
        }

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const player = await getPlayer(uid);

          if (pressed.has(uid)) {
            const mult = calcReiatsuMultiplier(player.items);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);

            const nm = safeName(boss.participants.get(uid)?.displayName);
            await channel.send(`✅ **${nm}** succeeded! (+${E_REIATSU} ${add} banked)`).catch(() => {});
          } else {
            await applyHit(uid, boss, channel, `was too slow!`);
          }
          await sleep(250);
        }

        if (r.type === "finisher") break;

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Cooldown: **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
      }
    }

    const survivors = aliveIds(boss);
    if (!survivors.length) {
      await channel.send({ embeds: [bossDefeatEmbed(boss.def)] }).catch(() => {});
      return;
    }

    // ✅ PAYOUT only on victory
    const lines = [];
    for (const uid of survivors) {
      const player = await getPlayer(uid);
      const mult = calcReiatsuMultiplier(player.items);

      const win = Math.floor(boss.def.winReward * mult);
      const hits = boss.hitBank.get(uid) || 0;

      player.reiatsu += (win + hits);
      await setPlayer(uid, player);

      lines.push(`• <@${uid}> +${E_REIATSU} ${win} (Win) +${E_REIATSU} ${hits} (Success bank)`);

      // Drops: role + robux
      const luckMult = calcDropLuckMultiplier(player.items);

      const roleChance = Math.min(DROP_ROLE_CHANCE_CAP, DROP_ROLE_CHANCE_BASE * luckMult);
      if (Math.random() < roleChance) {
        // ✅ ownership saved even if role add fails
        ensureOwnedRole(player, BOSS_DROP_ROLE_ID);
        await setPlayer(uid, player);

        const res = await tryGiveRole(channel.guild, uid, BOSS_DROP_ROLE_ID);
        lines.push(
          res.ok
            ? `🎭 <@${uid}> obtained **Boss role**!`
            : `⚠️ <@${uid}> won role but bot couldn't assign: ${res.reason} (saved to wardrobe)`
        );
      }

      const robuxChance = Math.min(DROP_ROBUX_CHANCE_CAP, DROP_ROBUX_CHANCE_REAL_BASE * luckMult);
      if (Math.random() < robuxChance) {
        lines.push(`🎁 <@${uid}> won **100 Robux** (${(DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}%) — ${ROBUX_CLAIM_TEXT}`);
      }
    }

    await channel.send({ embeds: [bossVictoryEmbed(boss.def, survivors.length)] }).catch(() => {});
    await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
  } catch (e) {
    console.error("runBoss crashed:", e);
    await channel.send("⚠️ Boss event crashed. Please report to admin.").catch(() => {});
  } finally {
    bossByChannel.delete(channel.id);
  }
}

async function spawnBoss(channel, bossId, withPing = true) {
  if (bossByChannel.has(channel.id)) return;
  const def = BOSSES[bossId];
  if (!def) return;

  if (withPing) await channel.send(`<@&${PING_BOSS_ROLE_ID}>`).catch(() => {});

  const boss = {
    def,
    messageId: null,
    joining: true,
    participants: new Map(), // uid -> {hits, displayName}
    hitBank: new Map(), // uid -> banked hits
    activeAction: null, // action window
  };

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(def, channel.name, 0, "`No fighters yet`")],
    components: bossButtons(false),
  });

  boss.messageId = msg.id;
  bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    const still = bossByChannel.get(channel.id);
    if (still && still.messageId === boss.messageId) runBoss(channel, still).catch(() => {});
  }, def.joinMs);
}

/* ---------------- Hollow ---------------- */
async function spawnHollow(channel, withPing = true) {
  if (hollowByChannel.has(channel.id)) return;

  if (withPing) await channel.send(`<@&${PING_HOLLOW_ROLE_ID}>`).catch(() => {});
  const hollow = { messageId: null, attackers: new Map(), resolved: false };

  const msg = await channel.send({
    embeds: [hollowEmbed(0)],
    components: hollowButtons(false),
  });

  hollow.messageId = msg.id;
  hollowByChannel.set(channel.id, hollow);

  setTimeout(async () => {
    const still = hollowByChannel.get(channel.id);
    if (!still || still.resolved) return;
    still.resolved = true;

    let anyHit = false;
    const lines = [];

    for (const [uid, info] of still.attackers.entries()) {
      const hit = Math.random() < 0.5;
      const player = await getPlayer(uid);
      const name = safeName(info.displayName);

      if (hit) {
        anyHit = true;
        player.reiatsu += HOLLOW_HIT_REIATSU;
        player.survivalBonus = Math.min(BONUS_MAX, player.survivalBonus + BONUS_PER_HOLLOW_KILL);
        lines.push(`⚔️ **${name}** hit! +${E_REIATSU} ${HOLLOW_HIT_REIATSU} • bonus +${BONUS_PER_HOLLOW_KILL}%`);
      } else {
        player.reiatsu += HOLLOW_MISS_REIATSU;
        lines.push(`💨 **${name}** missed. +${E_REIATSU} ${HOLLOW_MISS_REIATSU}`);
      }

      await setPlayer(uid, player);
    }

    await editMessageSafe(channel, still.messageId, { components: hollowButtons(true) });

    if (!still.attackers.size) {
      await channel.send("💨 The Hollow disappeared… nobody attacked.").catch(() => {});
    } else {
      await channel.send(anyHit ? "🕳️ **Hollow defeated!**" : "🕳️ The Hollow escaped…").catch(() => {});
      await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
    }

    hollowByChannel.delete(channel.id);
  }, HOLLOW_EVENT_MS);
}

/* ===================== CLIENT ===================== */
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await initRedis();

  const autoChannel = await client.channels.fetch(AUTO_EVENT_CHANNEL_ID).catch(() => null);
  if (!autoChannel || !autoChannel.isTextBased()) {
    console.log("❌ Auto channel not accessible.");
    return;
  }

  setInterval(() => spawnHollow(autoChannel, true).catch(() => {}), AUTO_HOLLOW_EVERY_MS);
  setInterval(() => spawnBoss(autoChannel, "vasto", true).catch(() => {}), AUTO_BOSS_EVERY_MS);

  console.log("⏰ Auto-spawn enabled", {
    channel: AUTO_EVENT_CHANNEL_ID,
    hollow_ms: AUTO_HOLLOW_EVERY_MS,
    boss_ms: AUTO_BOSS_EVERY_MS,
  });
});

/* ===================== INTERACTIONS ===================== */
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    /* ---------- SLASH ---------- */
    if (interaction.isChatInputCommand()) {
      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) {
        return interaction.reply({ content: "❌ Use commands in a text channel.", ephemeral: true });
      }

      if (interaction.commandName === "spawnboss") {
        if (!hasEventRole(interaction.member)) {
          return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
        }
        const bossId = interaction.options.getString("boss", true);
        const def = BOSSES[bossId];
        if (!def) return interaction.reply({ content: "❌ Unknown boss.", ephemeral: true });

        await interaction.reply({ content: `✅ Spawned **${def.name}**.`, ephemeral: true });
        await spawnBoss(channel, bossId, true);
        return;
      }

      if (interaction.commandName === "spawn_hollow") {
        if (!hasEventRole(interaction.member)) {
          return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
        }
        await interaction.reply({ content: "✅ Hollow spawned.", ephemeral: true });
        await spawnHollow(channel, true);
        return;
      }

      if (interaction.commandName === "reatsu") {
        const target = interaction.options.getUser("user") || interaction.user;
        const p = await getPlayer(target.id);
        return interaction.reply({
          content: `${E_REIATSU} **${safeName(target.username)}** has **${p.reiatsu} Reiatsu**.\n${E_DRAKO} **Drako Coin:** **${p.drako}**`,
          ephemeral: false,
        });
      }

      if (interaction.commandName === "inventory") {
        const p = await getPlayer(interaction.user.id);
        return interaction.reply({ embeds: [inventoryEmbed(p)], ephemeral: true });
      }

      if (interaction.commandName === "shop") {
        const p = await getPlayer(interaction.user.id);
        return interaction.reply({ embeds: [shopEmbed(p)], components: shopButtons(p), ephemeral: true });
      }

      if (interaction.commandName === "leaderboard") {
        const rows = await getTopPlayers(10);
        const entries = [];
        for (const r of rows) {
          let name = r.userId;
          try {
            const m = await interaction.guild.members.fetch(r.userId);
            name = safeName(m?.displayName || m?.user?.username || r.userId);
          } catch {}
          entries.push({ name, reiatsu: r.reiatsu });
        }
        return interaction.reply({ embeds: [leaderboardEmbed(entries)], ephemeral: false });
      }

      if (interaction.commandName === "dailyclaim") {
        const p = await getPlayer(interaction.user.id);
        const now = Date.now();

        if (now - p.lastDaily < DAILY_COOLDOWN_MS) {
          const hrs = Math.ceil((DAILY_COOLDOWN_MS - (now - p.lastDaily)) / 3600000);
          return interaction.reply({ content: `⏳ Come back in **${hrs}h**.`, ephemeral: true });
        }

        const amount = hasBoosterRole(interaction.member) ? DAILY_BOOSTER : DAILY_NORMAL;
        p.reiatsu += amount;
        p.lastDaily = now;

        await setPlayer(interaction.user.id, p);
        return interaction.reply({ content: `🎁 You claimed **${E_REIATSU} ${amount} Reiatsu**!`, ephemeral: false });
      }

      // ✅ WARDROBE OPEN
      if (interaction.commandName === "wardrobe") {
        const p = await getPlayer(interaction.user.id);
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "❌ Can't read your member data.", ephemeral: true });

        return interaction.reply({
          embeds: [wardrobeEmbed(interaction.guild, p)],
          components: wardrobeComponents(interaction.guild, member, p),
          ephemeral: true,
        });
      }

      // ✅ EXCHANGE REIATSU -> DRAKO (NO REVERSE)
      if (interaction.commandName === "exchange_drako") {
        const drakoWanted = interaction.options.getInteger("drako", true);
        const cost = drakoWanted * DRAKO_RATE;

        const p = await getPlayer(interaction.user.id);
        if (p.reiatsu < cost) {
          return interaction.reply({
            content: `❌ Not enough Reiatsu. Need ${E_REIATSU} **${cost}** for ${E_DRAKO} **${drakoWanted} Drako**.\nYou have: ${E_REIATSU} **${p.reiatsu}**`,
            ephemeral: true,
          });
        }

        p.reiatsu -= cost;
        p.drako += drakoWanted;
        await setPlayer(interaction.user.id, p);

        return interaction.reply({
          content:
            `✅ Exchanged ${E_REIATSU} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako Coin**.\n` +
            `Now: ${E_REIATSU} **${p.reiatsu}** • ${E_DRAKO} **${p.drako}**\n` +
            `⚠️ Drako Coin cannot be exchanged back.`,
          ephemeral: false,
        });
      }

      // keep your give_reatsu etc if you already had them elsewhere
    }

    /* ---------- SELECT MENU (WARDROBE) ---------- */
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== "wardrobe_select") return;

      const roleId = interaction.values?.[0];
      if (!roleId) return;

      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) return interaction.reply({ content: "❌ Can't read your member data.", ephemeral: true });

      const p = await getPlayer(interaction.user.id);

      // security: only if owned
      if (!p.ownedRoles.includes(String(roleId))) {
        return interaction.reply({ content: "❌ This role is not in your wardrobe.", ephemeral: true });
      }

      const has = member.roles.cache.has(roleId);

      // toggle equip/unequip
      if (has) {
        const res = await tryRemoveRole(interaction.guild, interaction.user.id, roleId);
        if (!res.ok) {
          return interaction.reply({ content: `⚠️ Can't remove role: ${res.reason}`, ephemeral: true });
        }
        // IMPORTANT: do NOT remove from ownedRoles
        return interaction.update({
          embeds: [wardrobeEmbed(interaction.guild, p)],
          components: wardrobeComponents(interaction.guild, member, p),
        });
      } else {
        const res = await tryGiveRole(interaction.guild, interaction.user.id, roleId);
        if (!res.ok) {
          return interaction.reply({ content: `⚠️ Can't assign role: ${res.reason}`, ephemeral: true });
        }
        return interaction.update({
          embeds: [wardrobeEmbed(interaction.guild, p)],
          components: wardrobeComponents(interaction.guild, member, p),
        });
      }
    }

    /* ---------- BUTTONS ---------- */
    if (interaction.isButton()) {
      try { await interaction.deferUpdate(); } catch {}

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) return;

      const cid = interaction.customId;

      // Join boss
      if (CID.BOSS_JOIN.includes(cid)) {
        const boss = bossByChannel.get(channel.id);
        if (!boss || !boss.joining) {
          await interaction.followUp({ content: "❌ No active boss join.", ephemeral: true }).catch(() => {});
          return;
        }
        const uid = interaction.user.id;
        if (boss.participants.has(uid)) {
          await interaction.followUp({ content: "⚠️ You already joined.", ephemeral: true }).catch(() => {});
          return;
        }

        boss.participants.set(uid, { hits: 0, displayName: interaction.member?.displayName || interaction.user.username });
        await updateBossSpawnMessage(channel, boss);
        await interaction.followUp({ content: "✅ Joined the boss fight.", ephemeral: true }).catch(() => {});
        return;
      }

      // Rules
      if (CID.BOSS_RULES.includes(cid)) {
        const boss = bossByChannel.get(channel.id);
        const def = boss?.def;

        const txt = def
          ? `**${def.name}** • Difficulty: **${def.difficulty}** • Rounds: **${def.rounds.length}**\n` +
            `Win: **${E_REIATSU} ${def.winReward}**\n` +
            `Success per round: **+${E_REIATSU} ${def.hitReward}** (banked, paid only on victory)\n` +
            `2 hits = eliminated`
          : `Boss rules: 2 hits = out.`;

        await interaction.followUp({ content: txt, ephemeral: true }).catch(() => {});
        return;
      }

      // Boss action: boss_action:<bossId>:<roundIndex>:<token>
      if (cid.startsWith(`${CID.BOSS_ACTION}:`)) {
        const parts = cid.split(":");
        const bossId = parts[1];
        const roundIndex = Number(parts[2]);
        const token = parts[3];

        const boss = bossByChannel.get(channel.id);
        if (!boss || boss.def.id !== bossId) {
          await interaction.followUp({ content: "❌ No active boss action.", ephemeral: true }).catch(() => {});
          return;
        }
        if (!boss.activeAction || boss.activeAction.token !== token || boss.activeAction.roundIndex !== roundIndex) {
          await interaction.followUp({ content: "⌛ Too late.", ephemeral: true }).catch(() => {});
          return;
        }

        const uid = interaction.user.id;
        const st = boss.participants.get(uid);
        if (!st || st.hits >= MAX_HITS) {
          await interaction.followUp({ content: "❌ You are not in the fight.", ephemeral: true }).catch(() => {});
          return;
        }

        if (boss.activeAction.pressed.has(uid)) {
          await interaction.followUp({ content: "✅ Already pressed.", ephemeral: true }).catch(() => {});
          return;
        }

        boss.activeAction.pressed.add(uid);
        await interaction.followUp({ content: "✅ Registered!", ephemeral: true }).catch(() => {});
        return;
      }

      // Hollow attack
      if (CID.HOLLOW_ATTACK.includes(cid)) {
        const hollow = hollowByChannel.get(channel.id);
        if (!hollow || hollow.resolved) {
          await interaction.followUp({ content: "❌ No active Hollow event.", ephemeral: true }).catch(() => {});
          return;
        }

        const uid = interaction.user.id;
        if (hollow.attackers.has(uid)) {
          await interaction.followUp({ content: "⚠️ You already attacked.", ephemeral: true }).catch(() => {});
          return;
        }

        hollow.attackers.set(uid, { displayName: interaction.member?.displayName || interaction.user.username });

        await editMessageSafe(channel, hollow.messageId, {
          embeds: [hollowEmbed(hollow.attackers.size)],
          components: hollowButtons(false),
        });

        await interaction.followUp({ content: "⚔️ Attack registered!", ephemeral: true }).catch(() => {});
        return;
      }

      // Shop buys
      if (cid.startsWith("buy_")) {
        const player = await getPlayer(interaction.user.id);

        const map = {
          buy_zanpakuto_basic: "zanpakuto_basic",
          buy_hollow_mask_fragment: "hollow_mask_fragment",
          buy_soul_reaper_cloak: "soul_reaper_cloak",
          buy_reiatsu_amplifier: "reiatsu_amplifier",
          buy_cosmetic_role: "cosmetic_role",
        };

        const key = map[cid];
        const item = SHOP_ITEMS.find((x) => x.key === key);

        if (!key || !item) {
          await interaction.followUp({ content: "❌ Unknown item.", ephemeral: true }).catch(() => {});
          return;
        }

        if (player.items[key]) {
          await interaction.followUp({ content: "✅ You already own this item.", ephemeral: true }).catch(() => {});
          return;
        }

        if (player.reiatsu < item.price) {
          await interaction.followUp({ content: `❌ Not enough Reiatsu. Need ${E_REIATSU} ${item.price}.`, ephemeral: true }).catch(() => {});
          return;
        }

        player.reiatsu -= item.price;
        player.items[key] = true;

        // ✅ If item grants role -> save to wardrobe forever
        if (item.roleId) ensureOwnedRole(player, item.roleId);

        await setPlayer(interaction.user.id, player);

        if (item.roleId) {
          const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
          if (!res.ok) {
            await interaction.followUp({ content: `⚠️ Bought role, but bot couldn't assign it: ${res.reason} (saved to wardrobe)`, ephemeral: true }).catch(() => {});
          }
        }

        const msgId = interaction.message?.id;
        if (msgId) {
          await editMessageSafe(channel, msgId, { embeds: [shopEmbed(player)], components: shopButtons(player) });
        }

        await interaction.followUp({ content: "✅ Purchased!", ephemeral: true }).catch(() => {});
        return;
      }
    }
  } catch (e) {
    console.error("Interaction error:", e);
    try {
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: "⚠️ Error handling this action.", ephemeral: true });
        } else {
          await interaction.reply({ content: "⚠️ Error handling this action.", ephemeral: true });
        }
      }
    } catch {}
  }
});

client.login(process.env.DISCORD_TOKEN);
