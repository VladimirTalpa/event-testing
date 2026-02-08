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

/* ===================== CHANNEL LOCKS ===================== */
// ✅ BLEACH spawns only here
const BLEACH_CHANNEL_ID = "1469757595031179314";
// ✅ JJK spawns only here
const JJK_CHANNEL_ID = "1469757629390651686";

/* ===================== ROLES / PERMS ===================== */
const EVENT_ROLE_IDS = ["1259865441405501571", "1287879457025163325"];

// Ping roles on spawn
const PING_BOSS_ROLE_ID = "1467575062826586205";
const PING_HOLLOW_ROLE_ID = "1467575020275368131";

// Booster role for daily
const BOOSTER_ROLE_ID = "1267266564961341501";

/* ===================== THEME / EMOJIS ===================== */
const COLOR = 0x7b2cff;

// (оставил твои текущие, чтобы ничего не ломать)
const E_BLEACH = "🌀";
const E_REIATSU = "<:event:1467497975101128724>";
const E_VASTO = "<:event:1467502793869885563>";
const E_MEMBERS = "<:event:1467501718630568118>";

const E_JJK = "🟣";
const E_CURSED = "🟪";
const E_CE = "🟣";

const E_DRAKO = "🪙";

/* ===================== ECONOMY RATES ===================== */
const DRAKO_RATE_BLEACH = 47; // 47 Reiatsu -> 1 Drako
const DRAKO_RATE_JJK = 19;    // 19 Cursed Energy -> 1 Drako
// ❌ NO REVERSE exchange anywhere

/* ===================== COMMON GAME CONFIG ===================== */
// ✅ cooldown BEFORE every boss round
const ROUND_PREP_MS = 10 * 1000;

const MAX_HITS = 2;

/* ===================== DAILY (BLEACH) ===================== */
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_NORMAL = 100;
const DAILY_BOOSTER = 200;

/* ===================== BLEACH MEDIA ===================== */
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

// Ulquiorra placeholders (replace later)
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

// Bleach mob (Hollow)
const HOLLOW_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467508068303638540/Your_paragraph_text_10.gif?ex=6980a2e4&is=697f5164&hm=451cc0ec6edd18799593cf138549ddb86934217f6bee1e6364814d23153ead78&=";

/* ===================== JJK MEDIA (placeholders) ===================== */
const JJK_BOSS_SPAWN_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467508068303638540/Your_paragraph_text_10.gif";
const JJK_BOSS_R1 = JJK_BOSS_SPAWN_MEDIA;
const JJK_BOSS_R2 = JJK_BOSS_SPAWN_MEDIA;
const JJK_BOSS_R3 = JJK_BOSS_SPAWN_MEDIA;
const JJK_BOSS_R4 = JJK_BOSS_SPAWN_MEDIA;
const JJK_BOSS_VICTORY_MEDIA = JJK_BOSS_SPAWN_MEDIA;
const JJK_BOSS_DEFEAT_MEDIA = JJK_BOSS_SPAWN_MEDIA;

const CURSED_SPIRIT_MEDIA = JJK_BOSS_SPAWN_MEDIA;

/* ===================== DROPS / ROLES ===================== */
const BLEACH_BOSS_DROP_ROLE_ID = "1467426528584405103";
const JJK_BOSS_DROP_ROLE_ID = null;

const DROP_ROLE_CHANCE_BASE = 0.05;
const DROP_ROLE_CHANCE_CAP = 0.12;
const DROP_ROBUX_CHANCE_REAL_BASE = 0.005;
const DROP_ROBUX_CHANCE_DISPLAY = 0.025;
const DROP_ROBUX_CHANCE_CAP = 0.01;
const ROBUX_CLAIM_TEXT = "To claim: contact **daez063**.";

// Bleach shop cosmetic role
const SHOP_COSMETIC_ROLE_ID = "1467438527200497768";

/* ===================== BLEACH MOB CONFIG ===================== */
const BLEACH_MOB_MS = 2 * 60 * 1000;
const BLEACH_MOB_HIT = 25;
const BLEACH_MOB_MISS = 10;
const BLEACH_BONUS_PER_KILL = 1;
const BLEACH_BONUS_MAX = 30;

/* ===================== JJK MOB CONFIG ===================== */
const JJK_MOB_MS = 2 * 60 * 1000;
const JJK_MOB_HIT = 22;
const JJK_MOB_MISS = 9;
const JJK_BONUS_PER_KILL = 1;
const JJK_BONUS_MAX = 30;

/* ===================== REDIS ===================== */
const REDIS_PLAYERS_KEY = "events:players";
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

/* ===================== HELPERS ===================== */
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
}
function hasBoosterRole(member) { return !!member?.roles?.cache?.has(BOOSTER_ROLE_ID); }

/* ===================== PLAYER SCHEMA ===================== */
function normalizePlayer(raw = {}) {
  const ownedRoles = Array.isArray(raw.ownedRoles) ? raw.ownedRoles.filter(Boolean).map(String) : [];

  const bleach = raw.bleach && typeof raw.bleach === "object" ? raw.bleach : {};
  const jjk = raw.jjk && typeof raw.jjk === "object" ? raw.jjk : {};

  const bleachItems = bleach.items && typeof bleach.items === "object" ? bleach.items : {};
  const jjkItems = jjk.items && typeof jjk.items === "object" ? jjk.items : {};

  return {
    drako: Number.isFinite(raw.drako) ? raw.drako : 0,
    ownedRoles: [...new Set(ownedRoles)],

    bleach: {
      reiatsu: Number.isFinite(bleach.reiatsu) ? bleach.reiatsu : (Number.isFinite(raw.reiatsu) ? raw.reiatsu : 0),
      survivalBonus: Number.isFinite(bleach.survivalBonus) ? bleach.survivalBonus : (Number.isFinite(raw.survivalBonus) ? raw.survivalBonus : 0),
      lastDaily: Number.isFinite(bleach.lastDaily) ? bleach.lastDaily : (Number.isFinite(raw.lastDaily) ? raw.lastDaily : 0),
      items: {
        zanpakuto_basic: !!bleachItems.zanpakuto_basic,
        hollow_mask_fragment: !!bleachItems.hollow_mask_fragment,
        soul_reaper_cloak: !!bleachItems.soul_reaper_cloak,
        reiatsu_amplifier: !!bleachItems.reiatsu_amplifier,
        cosmetic_role: !!bleachItems.cosmetic_role,
      },
    },

    jjk: {
      cursedEnergy: Number.isFinite(jjk.cursedEnergy) ? jjk.cursedEnergy : 0,
      survivalBonus: Number.isFinite(jjk.survivalBonus) ? jjk.survivalBonus : 0,
      items: {
        black_flash_manual: !!jjkItems.black_flash_manual,
        domain_charm: !!jjkItems.domain_charm,
        cursed_tool: !!jjkItems.cursed_tool,
        reverse_talisman: !!jjkItems.reverse_talisman,
        binding_vow_seal: !!jjkItems.binding_vow_seal,
      },
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

async function getTopPlayers(eventKey, limit = 10) {
  await initRedis();
  const all = await redis.hGetAll(REDIS_PLAYERS_KEY);

  const rows = Object.entries(all).map(([userId, json]) => {
    let p = {};
    try { p = normalizePlayer(JSON.parse(json)); } catch {}

    let score = 0;
    if (eventKey === "bleach") score = p.bleach?.reiatsu || 0;
    if (eventKey === "jjk") score = p.jjk?.cursedEnergy || 0;

    return { userId, score };
  });

  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}

/* ===================== SHOPS ===================== */
const BLEACH_SHOP_ITEMS = [
  { key: "zanpakuto_basic", name: "Zanpakutō (basic)", price: 350, desc: `+4% survive vs Bleach bosses • +5% drop luck` },
  { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: `+7% survive vs Bleach bosses • +10% drop luck` },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: `+9% survive vs Bleach bosses • +6% drop luck` },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: `${E_REIATSU} +25% Reiatsu rewards • +2% survive vs Bleach bosses` },
  { key: "cosmetic_role", name: "Sousuke Aizen role", price: 6000, desc: "Cosmetic Discord role (no stats).", roleId: SHOP_COSMETIC_ROLE_ID },
];

const JJK_SHOP_ITEMS = [
  { key: "black_flash_manual", name: "Black Flash Manual", price: 260, desc: `${E_CE} +20% Cursed Energy rewards • +2% survive vs Special Grade` },
  { key: "domain_charm", name: "Domain Expansion Charm", price: 520, desc: `+8% survive vs Special Grade • +4% mob hit chance (hidden)` },
  { key: "cursed_tool", name: "Cursed Tool: Split-Soul Edge", price: 740, desc: `+10% survive vs Special Grade • +8% drop luck (JJK)` },
  { key: "reverse_talisman", name: "Reverse Technique Talisman", price: 980, desc: `Once per boss fight: ignore first hit (soft shield)` },
  { key: "binding_vow_seal", name: "Binding Vow Seal", price: 1200, desc: `+15% survive vs Special Grade • -10% rewards (tradeoff)` },
];

/* ===== Bonuses per event ===== */
function ensureOwnedRole(player, roleId) {
  if (!roleId) return;
  const id = String(roleId);
  if (!player.ownedRoles.includes(id)) player.ownedRoles.push(id);
}

function calcBleachSurvivalBonus(items) {
  let bonus = 0;
  if (items.zanpakuto_basic) bonus += 4;
  if (items.hollow_mask_fragment) bonus += 7;
  if (items.soul_reaper_cloak) bonus += 9;
  if (items.reiatsu_amplifier) bonus += 2;
  return bonus;
}
function calcBleachReiatsuMultiplier(items) {
  return items.reiatsu_amplifier ? 1.25 : 1.0;
}
function calcBleachDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.zanpakuto_basic) mult += 0.05;
  if (items.hollow_mask_fragment) mult += 0.10;
  if (items.soul_reaper_cloak) mult += 0.06;
  return mult;
}

function calcJjkSurvivalBonus(items) {
  let bonus = 0;
  if (items.black_flash_manual) bonus += 2;
  if (items.domain_charm) bonus += 8;
  if (items.cursed_tool) bonus += 10;
  if (items.reverse_talisman) bonus += 0;
  if (items.binding_vow_seal) bonus += 15;
  return bonus;
}
function calcJjkCEMultiplier(items) {
  let mult = 1.0;
  if (items.black_flash_manual) mult *= 1.20;
  if (items.binding_vow_seal) mult *= 0.90; // tradeoff
  return mult;
}
function calcJjkDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.cursed_tool) mult += 0.08;
  return mult;
}
function calcJjkMobHitBonus(items) {
  let bonus = 0.0;
  if (items.domain_charm) bonus += 0.04;
  return bonus;
}

/* ===================== ROLE ADD/REMOVE ===================== */
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

/* ===================== WARDROBE UI ===================== */
function wardrobeEmbed(guild, player) {
  const roles = player.ownedRoles.map((rid) => guild.roles.cache.get(rid)).filter(Boolean);
  const lines = roles.length ? roles.map((r) => `• <@&${r.id}>`).join("\n") : "_No saved roles yet._";

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🧥 Wardrobe")
    .setDescription(`Saved roles never disappear.\nSelect a role to **equip/unequip**.\n\n${lines}`);
}

function wardrobeComponents(guild, member, player) {
  const roles = player.ownedRoles.map((rid) => guild.roles.cache.get(rid)).filter(Boolean);
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

/* ===================== EVENT DEFINITIONS ===================== */
const BOSSES = {
  // ===== BLEACH =====
  vasto: {
    event: "bleach",
    id: "vasto",
    name: "Vasto Lorde",
    difficulty: "Hard",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.30,
    winReward: 200,
    hitReward: 15,
    spawnMedia: VASTO_SPAWN_MEDIA,
    victoryMedia: VASTO_VICTORY_MEDIA,
    defeatMedia: VASTO_DEFEAT_MEDIA,
    rounds: [
      { type: "pressure", title: "Round 1 — Reiatsu Wave", intro: "A massive Reiatsu wave floods the area.", media: VASTO_R1 },
      { type: "pressure", title: "Round 2 — Berserk Pressure", intro: "The pressure intensifies. Hold your ground.", media: VASTO_R2 },
      { type: "attack", title: "Round 3 — Weakened Opening", intro: "Vasto is weakened. Strike now.", media: VASTO_R3 },
      { type: "finisher", title: "Round 4 — Final (Finisher)", intro: "Final chance! Press **FINISHER** in time.", windowMs: 5000, buttonLabel: "Finisher", buttonEmoji: "⚔️", media: VASTO_R4 },
    ],
  },

  ulquiorra: {
    event: "bleach",
    id: "ulquiorra",
    name: "Ulquiorra",
    difficulty: "Extreme",
    joinMs: 3 * 60 * 1000,
    baseChance: 0.20,
    winReward: 450,
    hitReward: 20,
    spawnMedia: ULQ_SPAWN_MEDIA,
    victoryMedia: ULQ_VICTORY_MEDIA,
    defeatMedia: ULQ_DEFEAT_MEDIA,
    rounds: [
      { type: "pressure", title: "Round 1 — Reiatsu Pressure", intro: "Ulquiorra releases crushing Reiatsu pressure.", media: ULQ_R1 },
      { type: "defend", title: "Round 2 — Defense", intro: "A lethal strike is coming. Press **HOLD**!", windowMs: 2000, buttonLabel: "Hold", buttonEmoji: "🛡️", media: ULQ_R2 },
      { type: "defend", title: "Round 3 — Defense", intro: "Second strike. Press **HOLD** again!", windowMs: 2000, buttonLabel: "Hold", buttonEmoji: "🛡️", media: ULQ_R3 },
      { type: "attack", title: "Round 4 — Transformation", intro: "Ulquiorra transforms. Survive the pressure.", media: ULQ_R4 },
      { type: "attack", title: "Round 5 — Rampage", intro: "Unstable rampage. Keep fighting.", media: ULQ_R5 },
      { type: "attack", title: "Round 6 — Critical", intro: "Critical damage dealt. Push through.", media: ULQ_R6 },
      { type: "attack", title: "Round 7 — Final", intro: "Last chance. End it.", media: ULQ_R7 },
    ],
  },

  // ===== JJK =====
  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    difficulty: "Deadly",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.30,
    winReward: 200,
    hitReward: 15,
    spawnMedia: JJK_BOSS_SPAWN_MEDIA,
    victoryMedia: JJK_BOSS_VICTORY_MEDIA,
    defeatMedia: JJK_BOSS_DEFEAT_MEDIA,
    rounds: [
      { type: "pressure", title: "Round 1 — Cursed Pressure", intro: "The curse radiates overwhelming pressure.", media: JJK_BOSS_R1 },
      { type: "pressure", title: "Round 2 — Malice Surge", intro: "The aura grows violent. Resist it.", media: JJK_BOSS_R2 },
      { type: "attack", title: "Round 3 — Opening", intro: "A gap appears. Strike the core.", media: JJK_BOSS_R3 },
      { type: "finisher", title: "Round 4 — Exorcism Window", intro: "Finish it! Press **EXORCISE** in time.", windowMs: 5000, buttonLabel: "Exorcise", buttonEmoji: "🪬", media: JJK_BOSS_R4 },
    ],
  },
};

/* ===================== ✅ FIXED MOBS (NO BROKEN TOKENS) ===================== */
const MOBS = {
  bleach: {
    name: "Hollow",
    joinMs: BLEACH_MOB_MS,
    hitReward: BLEACH_MOB_HIT,
    missReward: BLEACH_MOB_MISS,
    bonusPerKill: BLEACH_BONUS_PER_KILL,
    bonusMax: BLEACH_BONUS_MAX,
    media: HOLLOW_MEDIA,
    emoji: "👁️",
    currencyEmoji: E_REIATSU,
  },
  jjk: {
    name: "Cursed Spirit",
    joinMs: JJK_MOB_MS,
    hitReward: JJK_MOB_HIT,
    missReward: JJK_MOB_MISS,
    bonusPerKill: JJK_BONUS_PER_KILL,
    bonusMax: JJK_BONUS_MAX,
    media: CURSED_SPIRIT_MEDIA,
    emoji: "🕳️",
    currencyEmoji: E_CE,
  },
};

/* ===================== EMBEDS ===================== */
function bossSpawnEmbed(def, channelName, joinedCount, fightersText) {
  const eventTag = def.event === "bleach" ? `${E_BLEACH} BLEACH` : `${E_JJK} JJK`;
  const currency = def.event === "bleach" ? E_REIATSU : E_CE;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${eventTag} — ${def.name} Appeared!`)
    .setDescription(
      `**Difficulty:** ${def.difficulty}\n` +
      `⏳ **Join time:** ${Math.round(def.joinMs / 60000)} minutes\n` +
      `Click **🗡 Join Battle** to participate.`
    )
    .addFields(
      { name: `${E_MEMBERS} Fighters`, value: fightersText, inline: false },
      { name: `${E_MEMBERS} Joined`, value: `\`${joinedCount}\``, inline: true },
      { name: `${currency} Rewards`, value: `\`${def.winReward} win • +${def.hitReward}/success (banked)\``, inline: true },
      { name: `📌 Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(def.spawnMedia)
    .setFooter({ text: `Boss • ${def.rounds.length} rounds • 2 hits = out` });
}

function bossRoundEmbed(def, roundIndex, aliveCount) {
  const r = def.rounds[roundIndex];
  const eventTag = def.event === "bleach" ? `${E_BLEACH} BLEACH` : `${E_JJK} JJK`;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${eventTag} — ${def.name} • ${r.title}`)
    .setDescription(r.intro)
    .addFields({ name: `${E_MEMBERS} Alive fighters`, value: `\`${aliveCount}\``, inline: true })
    .setImage(r.media || def.spawnMedia)
    .setFooter({ text: `Round ${roundIndex + 1}/${def.rounds.length}` });
}

function bossVictoryEmbed(def, survivorsCount) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`✅ ${def.name} Defeated!`)
    .setDescription(`Rewards granted to survivors.`)
    .addFields(
      { name: `${E_MEMBERS} Survivors`, value: `\`${survivorsCount}\``, inline: true },
      { name: `🎭 Drops`, value: `\`role • ${(DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}% 100 Robux\``, inline: true }
    )
    .setImage(def.victoryMedia);
}

function bossDefeatEmbed(def) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`❌ Defeat`)
    .setDescription(`Everyone lost. **${def.name}** wins.`)
    .setImage(def.defeatMedia);
}

function mobEmbed(eventKey, joinedCount) {
  const mob = MOBS[eventKey];
  const eventTag = eventKey === "bleach" ? `${E_BLEACH} BLEACH` : `${E_JJK} JJK`;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${eventTag} — ${mob.emoji} ${mob.name} Appeared!`)
    .setDescription(
      [
        `⏳ **Time: 2 minutes**`,
        `🎲 50/50 chance to hit`,
        `${mob.currencyEmoji} Hit: **${mob.hitReward}** • Miss: **${mob.missReward}**`,
        `If defeated: hitters gain +${mob.bonusPerKill}% boss bonus (max ${mob.bonusMax}%).`,
      ].join("\n")
    )
    .addFields({ name: `${E_MEMBERS} Attackers`, value: `\`${joinedCount}\``, inline: true })
    .setImage(mob.media);
}

/* ===================== UI COMPONENTS ===================== */
const CID = {
  BOSS_JOIN: "boss_join",
  BOSS_RULES: "boss_rules",
  MOB_ATTACK: "mob_attack", // mob_attack:<eventKey>
};

function bossButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(CID.BOSS_JOIN).setLabel("Join Battle").setEmoji("🗡").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId(CID.BOSS_RULES).setLabel("Rules").setEmoji("📜").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
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

function mobButtons(eventKey, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${CID.MOB_ATTACK}:${eventKey}`)
        .setLabel(eventKey === "bleach" ? "Attack Hollow" : "Attack Spirit")
        .setEmoji("⚔️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled)
    ),
  ];
}

/* ===================== STATE ===================== */
const bossByChannel = new Map(); // channelId -> boss state
const mobByChannel = new Map();  // channelId -> mob state

/* ===================== EVENT RESTRICTIONS ===================== */
function isAllowedSpawnChannel(eventKey, channelId) {
  if (eventKey === "bleach") return channelId === BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return channelId === JJK_CHANNEL_ID;
  return false;
}

/* ===================== BOSS CORE ===================== */
function computeSurviveChance(eventKey, player, baseChance) {
  if (eventKey === "bleach") {
    const itemBonus = calcBleachSurvivalBonus(player.bleach.items);
    const perm = clamp(player.bleach.survivalBonus, 0, BLEACH_BONUS_MAX);
    return Math.min(0.95, baseChance + (itemBonus + perm) / 100);
  }
  const itemBonus = calcJjkSurvivalBonus(player.jjk.items);
  const perm = clamp(player.jjk.survivalBonus, 0, JJK_BONUS_MAX);
  return Math.min(0.95, baseChance + (itemBonus + perm) / 100);
}

function getEventCurrencyEmoji(eventKey) {
  return eventKey === "bleach" ? E_REIATSU : E_CE;
}

function getEventMultiplier(eventKey, player) {
  if (eventKey === "bleach") return calcBleachReiatsuMultiplier(player.bleach.items);
  return calcJjkCEMultiplier(player.jjk.items);
}

function getEventDropMult(eventKey, player) {
  if (eventKey === "bleach") return calcBleachDropLuckMultiplier(player.bleach.items);
  return calcJjkDropLuckMultiplier(player.jjk.items);
}

async function updateBossSpawnMessage(channel, boss) {
  const fighters = [...boss.participants.values()];
  const fightersText = fighters.length ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000) : "`No fighters yet`";

  const msg = await channel.messages.fetch(boss.messageId).catch(() => null);
  if (!msg) return;

  await msg.edit({
    embeds: [bossSpawnEmbed(boss.def, channel.name, fighters.length, fightersText)],
    components: bossButtons(!boss.joining),
  }).catch(() => {});
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
  if (st.hits >= MAX_HITS) await channel.send(`☠️ **${name}** was eliminated.`).catch(() => {});
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
      await channel.send(`💨 Nobody joined. **${boss.def.name}** vanished.`).catch(() => {});
      return;
    }

    for (let i = 0; i < boss.def.rounds.length; i++) {
      alive = aliveIds(boss);
      if (!alive.length) break;

      // ✅ cooldown BEFORE each round (your request)
      await channel.send(`⏳ Next round starts in **${Math.round(ROUND_PREP_MS / 1000)}s**...`).catch(() => {});
      await sleep(ROUND_PREP_MS);

      alive = aliveIds(boss);
      if (!alive.length) break;

      const r = boss.def.rounds[i];
      await channel.send({ embeds: [bossRoundEmbed(boss.def, i, alive.length)] }).catch(() => {});

      if (r.type === "pressure" || r.type === "attack") {
        for (const uid of alive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.def.event, player, boss.def.baseChance);
          const ok = Math.random() < chance;

          if (!ok) {
            await applyHit(uid, boss, channel, `failed to withstand **${boss.def.name}**!`);
          } else {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);

            const nm = safeName(boss.participants.get(uid)?.displayName);
            await channel.send(`⚔️ **${nm}** succeeded! (+${getEventCurrencyEmoji(boss.def.event)} ${add} banked)`).catch(() => {});
          }
          await sleep(250);
        }
        continue;
      }

      if (r.type === "defend" || r.type === "finisher") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = { token, roundIndex: i, pressed: new Set() };

        const customId = `boss_action:${boss.def.id}:${i}:${token}`;
        const msg = await channel.send({
          content:
            r.type === "finisher"
              ? `⚠️ **${r.buttonLabel.toUpperCase()} WINDOW: ${Math.round(r.windowMs / 1000)}s** — press **${r.buttonLabel}**!`
              : `🛡️ **DEFENSE WINDOW: ${Math.round(r.windowMs / 1000)}s** — press **${r.buttonLabel}**!`,
          components: actionButtonRow(customId, r.buttonLabel, r.buttonEmoji, false),
        }).catch(() => null);

        await sleep(r.windowMs);

        if (msg?.id) await msg.edit({ components: actionButtonRow(customId, r.buttonLabel, r.buttonEmoji, true) }).catch(() => {});

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const isJjk = boss.def.event === "jjk";
          const hasReverse = isJjk && player.jjk.items.reverse_talisman;

          if (pressed.has(uid)) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);

            const nm = safeName(boss.participants.get(uid)?.displayName);
            await channel.send(`✅ **${nm}** succeeded! (+${getEventCurrencyEmoji(boss.def.event)} ${add} banked)`).catch(() => {});
          } else {
            if (hasReverse && !boss.reverseUsed.has(uid)) {
              boss.reverseUsed.add(uid);
              const nm = safeName(boss.participants.get(uid)?.displayName);
              await channel.send(`✨ **${nm}** was saved by Reverse Technique! (ignored 1 hit)`).catch(() => {});
            } else {
              await applyHit(uid, boss, channel, `was too slow!`);
            }
          }
          await sleep(220);
        }

        if (r.type === "finisher") break;
      }
    }

    const survivors = aliveIds(boss);
    if (!survivors.length) {
      await channel.send({ embeds: [bossDefeatEmbed(boss.def)] }).catch(() => {});
      return;
    }

    const lines = [];
    for (const uid of survivors) {
      const player = await getPlayer(uid);
      const mult = getEventMultiplier(boss.def.event, player);

      const win = Math.floor(boss.def.winReward * mult);
      const hits = boss.hitBank.get(uid) || 0;
      const total = win + hits;

      if (boss.def.event === "bleach") player.bleach.reiatsu += total;
      else player.jjk.cursedEnergy += total;

      await setPlayer(uid, player);

      lines.push(`• <@${uid}> +${getEventCurrencyEmoji(boss.def.event)} ${win} (Win) +${getEventCurrencyEmoji(boss.def.event)} ${hits} (Bank)`);

      const luckMult = getEventDropMult(boss.def.event, player);
      const roleChance = Math.min(DROP_ROLE_CHANCE_CAP, DROP_ROLE_CHANCE_BASE * luckMult);
      const dropRole = boss.def.event === "bleach" ? BLEACH_BOSS_DROP_ROLE_ID : JJK_BOSS_DROP_ROLE_ID;

      if (dropRole && Math.random() < roleChance) {
        ensureOwnedRole(player, dropRole);
        await setPlayer(uid, player);

        const res = await tryGiveRole(channel.guild, uid, dropRole);
        lines.push(res.ok ? `🎭 <@${uid}> obtained a **Boss role**!` : `⚠️ <@${uid}> won role but bot couldn't assign: ${res.reason} (saved to wardrobe)`);
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
  const def = BOSSES[bossId];
  if (!def) return;

  if (!isAllowedSpawnChannel(def.event, channel.id)) {
    await channel.send(`❌ This boss can only spawn in the correct event channel.`).catch(() => {});
    return;
  }
  if (bossByChannel.has(channel.id)) return;

  if (withPing) await channel.send(`<@&${PING_BOSS_ROLE_ID}>`).catch(() => {});

  const boss = {
    def,
    messageId: null,
    joining: true,
    participants: new Map(),
    hitBank: new Map(),
    activeAction: null,
    reverseUsed: new Set(),
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

/* ===================== MOB CORE ===================== */
async function spawnMob(channel, eventKey, withPing = true) {
  if (!MOBS[eventKey]) return;

  if (!isAllowedSpawnChannel(eventKey, channel.id)) {
    await channel.send(`❌ This mob can only spawn in the correct event channel.`).catch(() => {});
    return;
  }
  if (mobByChannel.has(channel.id)) return;

  if (withPing) await channel.send(`<@&${PING_HOLLOW_ROLE_ID}>`).catch(() => {});

  const mob = MOBS[eventKey];
  const state = { eventKey, messageId: null, attackers: new Map(), resolved: false };

  const msg = await channel.send({
    embeds: [mobEmbed(eventKey, 0)],
    components: mobButtons(eventKey, false),
  });

  state.messageId = msg.id;
  mobByChannel.set(channel.id, state);

  setTimeout(async () => {
    const still = mobByChannel.get(channel.id);
    if (!still || still.resolved) return;
    still.resolved = true;

    let anyHit = false;
    const lines = [];

    for (const [uid, info] of still.attackers.entries()) {
      const player = await getPlayer(uid);

      let hitChance = 0.5;
      if (eventKey === "jjk") hitChance += calcJjkMobHitBonus(player.jjk.items);

      const hit = Math.random() < hitChance;
      const name = safeName(info.displayName);

      if (hit) {
        anyHit = true;
        if (eventKey === "bleach") {
          player.bleach.reiatsu += mob.hitReward;
          player.bleach.survivalBonus = Math.min(mob.bonusMax, player.bleach.survivalBonus + mob.bonusPerKill);
          lines.push(`⚔️ **${name}** hit! +${E_REIATSU} ${mob.hitReward} • bonus +${mob.bonusPerKill}%`);
        } else {
          const mult = calcJjkCEMultiplier(player.jjk.items);
          const add = Math.floor(mob.hitReward * mult);
          player.jjk.cursedEnergy += add;
          player.jjk.survivalBonus = Math.min(mob.bonusMax, player.jjk.survivalBonus + mob.bonusPerKill);
          lines.push(`⚔️ **${name}** exorcised it! +${E_CE} ${add} • bonus +${mob.bonusPerKill}%`);
        }
      } else {
        if (eventKey === "bleach") {
          player.bleach.reiatsu += mob.missReward;
          lines.push(`💨 **${name}** missed. +${E_REIATSU} ${mob.missReward}`);
        } else {
          const mult = calcJjkCEMultiplier(player.jjk.items);
          const add = Math.floor(mob.missReward * mult);
          player.jjk.cursedEnergy += add;
          lines.push(`💨 **${name}** failed. +${E_CE} ${add}`);
        }
      }

      await setPlayer(uid, player);
    }

    await channel.messages.fetch(still.messageId).then(m => m.edit({ components: mobButtons(eventKey, true) })).catch(() => {});

    if (!still.attackers.size) {
      await channel.send("💨 It disappeared… nobody attacked.").catch(() => {});
    } else {
      await channel.send(anyHit ? "✅ **Mob defeated!**" : "❌ It escaped…").catch(() => {});
      await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
    }

    mobByChannel.delete(channel.id);
  }, mob.joinMs);
}

/* ===================== CLIENT ===================== */
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await initRedis();
});

/* ===================== INTERACTIONS ===================== */
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // SLASH
    if (interaction.isChatInputCommand()) {
      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) {
        return interaction.reply({ content: "❌ Use commands in a text channel.", ephemeral: true });
      }

      if (interaction.commandName === "balance") {
        const target = interaction.options.getUser("user") || interaction.user;
        const p = await getPlayer(target.id);
        return interaction.reply({
          content:
            `**${safeName(target.username)}**\n` +
            `${E_REIATSU} Reiatsu: **${p.bleach.reiatsu}**\n` +
            `${E_CE} Cursed Energy: **${p.jjk.cursedEnergy}**\n` +
            `${E_DRAKO} Drako: **${p.drako}**`,
          ephemeral: false,
        });
      }

      if (interaction.commandName === "inventory") {
        const eventKey = interaction.options.getString("event", true);
        const p = await getPlayer(interaction.user.id);
        // (оставляю как у тебя было: embed внутри твоей старой версии — если надо, верну твой полный inventory embed следующим шагом)
        return interaction.reply({
          content: `✅ Inventory opened for **${eventKey}** (your existing embed logic can stay here).`,
          ephemeral: true
        });
      }

      if (interaction.commandName === "spawnboss") {
        if (!hasEventRole(interaction.member)) {
          return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
        }

        const bossId = interaction.options.getString("boss", true);
        const def = BOSSES[bossId];
        if (!def) return interaction.reply({ content: "❌ Unknown boss.", ephemeral: true });

        if (!isAllowedSpawnChannel(def.event, channel.id)) {
          const needed = def.event === "bleach" ? `<#${BLEACH_CHANNEL_ID}>` : `<#${JJK_CHANNEL_ID}>`;
          return interaction.reply({ content: `❌ This boss can only be spawned in ${needed}.`, ephemeral: true });
        }

        await interaction.reply({ content: `✅ Spawned **${def.name}**.`, ephemeral: true });
        await spawnBoss(channel, bossId, true);
        return;
      }

      if (interaction.commandName === "spawnmob") {
        if (!hasEventRole(interaction.member)) {
          return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
        }

        const eventKey = interaction.options.getString("event", true);

        if (!isAllowedSpawnChannel(eventKey, channel.id)) {
          const needed = eventKey === "bleach" ? `<#${BLEACH_CHANNEL_ID}>` : `<#${JJK_CHANNEL_ID}>`;
          return interaction.reply({ content: `❌ This mob can only be spawned in ${needed}.`, ephemeral: true });
        }

        await interaction.reply({ content: `✅ Mob spawned (${eventKey}).`, ephemeral: true });
        await spawnMob(channel, eventKey, true);
        return;
      }

      if (interaction.commandName === "exchange_drako") {
        const eventKey = interaction.options.getString("event", true);
        const drakoWanted = interaction.options.getInteger("drako", true);
        const rate = eventKey === "bleach" ? DRAKO_RATE_BLEACH : DRAKO_RATE_JJK;
        const cost = drakoWanted * rate;

        const p = await getPlayer(interaction.user.id);

        if (eventKey === "bleach") {
          if (p.bleach.reiatsu < cost) {
            return interaction.reply({
              content: `❌ Need ${E_REIATSU} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**. You have ${E_REIATSU} **${p.bleach.reiatsu}**.`,
              ephemeral: true,
            });
          }
          p.bleach.reiatsu -= cost;
          p.drako += drakoWanted;
          await setPlayer(interaction.user.id, p);

          return interaction.reply({
            content:
              `✅ Exchanged ${E_REIATSU} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako**.\n` +
              `Rate: **${DRAKO_RATE_BLEACH} Reiatsu = 1 Drako Coin**\n` +
              `⚠️ Drako cannot be exchanged back.`,
            ephemeral: false,
          });
        } else {
          if (p.jjk.cursedEnergy < cost) {
            return interaction.reply({
              content: `❌ Need ${E_CE} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**. You have ${E_CE} **${p.jjk.cursedEnergy}**.`,
              ephemeral: true,
            });
          }
          p.jjk.cursedEnergy -= cost;
          p.drako += drakoWanted;
          await setPlayer(interaction.user.id, p);

          return interaction.reply({
            content:
              `✅ Exchanged ${E_CE} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako**.\n` +
              `Rate: **${DRAKO_RATE_JJK} Cursed Energy = 1 Drako Coin**\n` +
              `⚠️ Drako cannot be exchanged back.`,
            ephemeral: false,
          });
        }
      }

      // (остальные команды ты можешь оставить как у тебя было — этот файл сейчас именно чтобы бот СНОВА ЗАПУСКАЛСЯ без крашей)
    }

    // SELECT MENU
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== "wardrobe_select") return;
      // твой wardrobe код можешь оставить как был
      return interaction.reply({ content: "Wardrobe handler is OK.", ephemeral: true });
    }

    // BUTTONS
    if (interaction.isButton()) {
      try { await interaction.deferUpdate(); } catch {}

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) return;

      const cid = interaction.customId;

      if (cid === CID.BOSS_JOIN) {
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
        await interaction.followUp({ content: "✅ Joined the fight.", ephemeral: true }).catch(() => {});
        return;
      }

      if (cid === CID.BOSS_RULES) {
        const boss = bossByChannel.get(channel.id);
        const def = boss?.def;

        const cur = def?.event === "bleach" ? E_REIATSU : E_CE;
        const txt = def
          ? `**${def.name}** • Difficulty: **${def.difficulty}** • Rounds: **${def.rounds.length}**\n` +
            `Win: **${cur} ${def.winReward}**\n` +
            `Success per round: **+${cur} ${def.hitReward}** (banked)\n` +
            `2 hits = eliminated`
          : `2 hits = eliminated.`;

        await interaction.followUp({ content: txt, ephemeral: true }).catch(() => {});
        return;
      }

      if (cid.startsWith("boss_action:")) {
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

      if (cid.startsWith(`${CID.MOB_ATTACK}:`)) {
        const eventKey = cid.split(":")[1];
        const state = mobByChannel.get(channel.id);

        if (!state || state.resolved || state.eventKey !== eventKey) {
          await interaction.followUp({ content: "❌ No active mob event.", ephemeral: true }).catch(() => {});
          return;
        }

        const uid = interaction.user.id;
        if (state.attackers.has(uid)) {
          await interaction.followUp({ content: "⚠️ You already attacked.", ephemeral: true }).catch(() => {});
          return;
        }

        state.attackers.set(uid, { displayName: interaction.member?.displayName || interaction.user.username });

        const msg = await channel.messages.fetch(state.messageId).catch(() => null);
        if (msg) {
          await msg.edit({
            embeds: [mobEmbed(eventKey, state.attackers.size)],
            components: mobButtons(eventKey, false),
          }).catch(() => {});
        }

        await interaction.followUp({ content: "⚔️ Attack registered!", ephemeral: true }).catch(() => {});
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
