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
// Roles that can manually spawn / admin add
const EVENT_ROLE_IDS = ["1259865441405501571", "1287879457025163325"];

// Ping roles on spawn (keep your IDs)
const PING_BOSS_ROLE_ID = "1467575062826586205";
const PING_HOLLOW_ROLE_ID = "1467575020275368131";

// Booster role for daily
const BOOSTER_ROLE_ID = "1267266564961341501";

/* ===================== THEME / EMOJIS ===================== */
const COLOR = 0x7b2cff;

// ✅ New emojis (your IDs)
const E_VASTO = "<:event:1469832084418727979>";
const E_ULQ = "<:event:1469831975446511648>";
const E_GRIMJOW = "<:event:1469831949857325097>";

const E_REIATSU = "<:event:1469821285079978045>";
const E_CE = "<:event:1469821211872727040>";
const E_DRAKO = "<:event:1469812070542217389>";

const E_MEMBERS = "👥";

/* ===================== ECONOMY RATES ===================== */
const DRAKO_RATE_BLEACH = 47; // 47 Reiatsu -> 1 Drako
const DRAKO_RATE_JJK = 19; // 19 CE -> 1 Drako
// ❌ NO REVERSE exchange (Drako -> event currencies) anywhere in code

/* ===================== COMMON GAME CONFIG ===================== */
const ROUND_COOLDOWN_MS = 10 * 1000; // ✅ 10s BEFORE every boss round
const MAX_HITS = 2;

// Daily (Bleach only)
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_NORMAL = 100;
const DAILY_BOOSTER = 200;

/* ===================== BLEACH MEDIA (YOUR NEW GIFS) ===================== */
const VASTO_SPAWN_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842057219674194/Your_paragraph_text_13.gif?ex=69892096&is=6987cf16&hm=c31783bb0a9a57c197a3faf8d9314fb2a1d4621d424c8961bfcb2c0f0c753ef3&=";

const VASTO_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842005583462514/Your_paragraph_text_16.gif?ex=6989208a&is=6987cf0a&hm=f9a4c88976d44e3581b82d55c01fdefb03f1c7401697c8a663cf6aeeff68e8c3&=";

const VASTO_R2 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842043227341068/Your_paragraph_text_14.gif?ex=69892093&is=6987cf13&hm=117ea0c95417384a7b790f746a774d0778b9348257fd8ee7422ed8c4e908dd9a&=";

const VASTO_R3 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842024172884138/Your_paragraph_text_15.gif?ex=6989208e&is=6987cf0e&hm=ba70c2e8435df2b8aefb26205c5c0fc23386895da4837e5fcae10eb8fdd03d19&=";

const VASTO_R4 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842068024066068/Your_paragraph_text_12.gif?ex=69892099&is=6987cf19&hm=e1080c7bddf29f2e6edc23f9a083189bde2d417ea9ffb9d81e4b5dcd218227cc&=";

const VASTO_R5 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469841986705166347/Your_paragraph_text_18.gif?ex=69892085&is=6987cf05&hm=3b1a1520ace36d0ab11d4a443bed1f1321488192657b464da15ffb11d4f72700&=";

const VASTO_VICTORY_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469841996616040511/Your_paragraph_text_17.gif?ex=69892088&is=6987cf08&hm=c5adfce5d6fff70c659a87a43d9b1be1b56fdbd52031de45f6c15962306cf37f&=";

const VASTO_DEFEAT_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842262208020632/Your_paragraph_text_19.gif?ex=698920c7&is=6987cf47&hm=243b0dea5d8bec6a78a4efc223fa07e8e3656c4c301ca7521395bc935ef73b7b&=";

/* ===================== ULQUIORRA MEDIA (YOUR NEW GIFS) ===================== */
const ULQ_SPAWN_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843198812618782/Your_paragraph_text_25.gif?ex=698921a6&is=6987d026&hm=8ab0b38b1fafd210a7cbf589f54b37ce4c4e7117e5141a63d6d150e32f71096c&=";

const ULQ_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843217058103556/Your_paragraph_text_26.gif?ex=698921ab&is=6987d02b&hm=4499f79869465416007ef21580b08fdd8c6a8f597521ec484e22c023d3867586&=";

const ULQ_R2 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843235986866196/Your_paragraph_text_27.gif?ex=698921af&is=6987d02f&hm=d73e433123104264fb7797e32267d4af89dc7887fb2efdea42a41e578fc85bf4&=";

const ULQ_R3 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843247999353004/Your_paragraph_text_28.gif?ex=698921b2&is=6987d032&hm=03afda58f47e27975d3b6f5ee7a4af654e3bcc9ff89c8fc7488f3e905509dcbf&=";

const ULQ_R4 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843261139980308/Your_paragraph_text_29.gif?ex=698921b5&is=6987d035&hm=63d6429d4d618c3682ef4665c3b494200ccb031d4f450c38539ee8cde319a1ac&=";

const ULQ_R5 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843274737914123/Your_paragraph_text_30.gif?ex=698921b9&is=6987d039&hm=6274a0db6b1866c2d134fd4b9f200b68e968e97fd2ceb9ca7312c7a8cae804af&=";

const ULQ_R6 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843288277127219/Your_paragraph_text_31.gif?ex=698921bc&is=6987d03c&hm=88e3096454d50f1268761b18320c8d12a23d80cc49ff7c93240e3d7f553e4d6e&=";

const ULQ_VICTORY_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843303930527929/Your_paragraph_text_32.gif?ex=698921c0&is=6987d040&hm=2ad405fd31cd5be31faebe491f651ff5a1bb88a9816eebf0b6aa823808592df8&=";

const ULQ_DEFEAT_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843317087797279/Your_paragraph_text_33.gif?ex=698921c3&is=6987d043&hm=a9a78cb6e341b7d27c4d94b4f1c29c248811d77b206ad4ea7b6f7571fceabd2f&=";

/* ===================== MOBS ===================== */
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
const VASTO_DROP_ROLE_ID = "1467426528584405103"; // 2.5%
const ULQ_DROP_ROLE_ID = "1469573731301986367"; // 3%

// Optional JJK drop role if you want later:
const JJK_BOSS_DROP_ROLE_ID = null;

// Base drop scaling (kept from your previous logic)
const DROP_CHANCE_CAP = 0.12;
const ROBUX_CHANCE_REAL_BASE = 0.005;
const ROBUX_CHANCE_DISPLAY = 0.025;
const ROBUX_CHANCE_CAP = 0.01;
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

/* ===================== PLAYER SCHEMA ===================== */
function normalizePlayer(raw = {}) {
  const ownedRoles = Array.isArray(raw.ownedRoles)
    ? raw.ownedRoles.filter(Boolean).map(String)
    : [];

  const bleach = raw.bleach && typeof raw.bleach === "object" ? raw.bleach : {};
  const jjk = raw.jjk && typeof raw.jjk === "object" ? raw.jjk : {};

  const bleachItems = bleach.items && typeof bleach.items === "object" ? bleach.items : {};
  const jjkItems = jjk.items && typeof jjk.items === "object" ? jjk.items : {};

  return {
    drako: Number.isFinite(raw.drako) ? raw.drako : 0,
    ownedRoles: [...new Set(ownedRoles)],

    bleach: {
      reiatsu: Number.isFinite(bleach.reiatsu)
        ? bleach.reiatsu
        : Number.isFinite(raw.reiatsu)
          ? raw.reiatsu
          : 0,
      survivalBonus: Number.isFinite(bleach.survivalBonus)
        ? bleach.survivalBonus
        : Number.isFinite(raw.survivalBonus)
          ? raw.survivalBonus
          : 0,
      lastDaily: Number.isFinite(bleach.lastDaily)
        ? bleach.lastDaily
        : Number.isFinite(raw.lastDaily)
          ? raw.lastDaily
          : 0,
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
    try {
      p = normalizePlayer(JSON.parse(json));
    } catch {}

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
  { key: "zanpakuto_basic", name: "Zanpakutō (Basic)", price: 350, desc: `+4% boss survive • +5% drop luck` },
  { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: `+7% boss survive • +10% drop luck` },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: `+9% boss survive • +6% drop luck` },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: `${E_REIATSU} +25% rewards • +2% boss survive` },
  { key: "cosmetic_role", name: "Sōsuke Aizen Role", price: 6000, desc: "Cosmetic Discord role (no stats).", roleId: SHOP_COSMETIC_ROLE_ID },
];

const JJK_SHOP_ITEMS = [
  { key: "black_flash_manual", name: "Black Flash Manual", price: 260, desc: `${E_CE} +20% rewards • +2% survive vs boss` },
  { key: "domain_charm", name: "Domain Charm", price: 520, desc: `+8% boss survive • +4% mob hit chance` },
  { key: "cursed_tool", name: "Cursed Tool: Split-Soul Edge", price: 740, desc: `+10% boss survive • +8% drop luck` },
  { key: "reverse_talisman", name: "Reverse Technique Talisman", price: 980, desc: `Once per boss fight: ignore the first hit (shield)` },
  { key: "binding_vow_seal", name: "Binding Vow Seal", price: 1200, desc: `+15% boss survive • -10% rewards` },
];

/* ===================== HELPERS ===================== */
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
}
function hasBoosterRole(member) { return !!member?.roles?.cache?.has(BOOSTER_ROLE_ID); }

function ensureOwnedRole(player, roleId) {
  if (!roleId) return;
  const id = String(roleId);
  if (!player.ownedRoles.includes(id)) player.ownedRoles.push(id);
}

/* ===== Bonuses per event ===== */
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
  if (items.binding_vow_seal) mult *= 0.90;
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
    emoji: E_VASTO,
    difficulty: "Hard",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.30, // per-player survive/attack success
    winReward: 200, // paid only on victory
    hitReward: 15, // banked per success, paid only on victory
    roleDropId: VASTO_DROP_ROLE_ID,
    roleDropBase: 0.025, // 2.5%
    spawnMedia: VASTO_SPAWN_MEDIA,
    victoryMedia: VASTO_VICTORY_MEDIA,
    defeatMedia: VASTO_DEFEAT_MEDIA,
    rounds: [
      {
        type: "pressure",
        title: "Round 1 — Reiatsu Wave",
        intro: "Vasto Lorde releases a massive Reiatsu wave. Endure the pressure.",
        media: VASTO_R1,
      },
      {
        type: "pressure",
        title: "Round 2 — Berserk Pressure",
        intro: "Vasto Lorde goes berserk. The pressure intensifies. Hold your ground.",
        media: VASTO_R2,
      },
      {
        type: "coop_block",
        title: "Round 3 — Incoming Strike",
        intro: "Cooperate to block the attack! **At least 4 fighters** must press **BLOCK** within **5 seconds**.",
        media: VASTO_R3,
        windowMs: 5000,
        requiredPresses: 4,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
      },
      {
        type: "attack",
        title: "Round 4 — Counterattack",
        intro: "Vasto is weakened. Counterattack now!",
        media: VASTO_R4,
      },
      {
        type: "finisher",
        title: "Round 5 — Finish Him",
        intro: "Vasto took heavy damage. **Finish him!** Press **FINISH** within **10 seconds**.",
        media: VASTO_R5,
        windowMs: 10000,
        buttonLabel: "Finish",
        buttonEmoji: "⚔️",
      },
    ],
  },

  ulquiorra: {
    event: "bleach",
    id: "ulquiorra",
    name: "Ulquiorra",
    emoji: E_ULQ,
    difficulty: "Extreme",
    joinMs: 3 * 60 * 1000,
    baseChance: 0.20,
    winReward: 500,
    hitReward: 25,
    roleDropId: ULQ_DROP_ROLE_ID,
    roleDropBase: 0.03, // 3%
    spawnMedia: ULQ_SPAWN_MEDIA,
    victoryMedia: ULQ_VICTORY_MEDIA,
    defeatMedia: ULQ_DEFEAT_MEDIA,
    rounds: [
      {
        type: "coop_block",
        title: "Round 1 — Heavy Assault",
        intro: "Ulquiorra strikes immediately! **At least 4 fighters** must press **BLOCK** within **5 seconds**.",
        media: ULQ_R1,
        windowMs: 5000,
        requiredPresses: 4,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
      },
      {
        type: "combo_defense",
        title: "Round 2 — Combo Defense",
        intro: "A combo is coming! Press the buttons **in the correct order** within **5 seconds**.",
        media: ULQ_R2,
        windowMs: 5000,
      },
      {
        type: "pressure",
        title: "Round 3 — Transformation Pressure",
        intro: "Ulquiorra transformed. The Reiatsu pressure is insane. Survive it.",
        media: ULQ_R3,
      },
      {
        type: "pressure",
        title: "Round 4 — Suffocating Pressure",
        intro: "The pressure grows even stronger. Endure it.",
        media: ULQ_R4,
      },
      {
        type: "quick_block",
        title: "Round 5 — Quick Block",
        intro: "A lethal strike is coming! Press **BLOCK** within **2 seconds** or take damage.",
        media: ULQ_R5,
        windowMs: 2000,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
      },
      {
        type: "group_final",
        title: "Round 6 — Final Push",
        intro: "Final attack! **At least 3 fighters** must succeed, otherwise everyone loses.",
        media: ULQ_R6,
        requiredSuccesses: 3,
      },
    ],
  },

  // ===== JJK =====
  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    emoji: "🟣",
    difficulty: "Deadly",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.30,
    winReward: 200,
    hitReward: 15,
    roleDropId: JJK_BOSS_DROP_ROLE_ID,
    roleDropBase: 0.025,
    spawnMedia: JJK_BOSS_SPAWN_MEDIA,
    victoryMedia: JJK_BOSS_VICTORY_MEDIA,
    defeatMedia: JJK_BOSS_DEFEAT_MEDIA,
    rounds: [
      { type: "pressure", title: "Round 1 — Cursed Pressure", intro: "Overwhelming cursed pressure floods the area.", media: JJK_BOSS_R1 },
      { type: "pressure", title: "Round 2 — Malice Surge", intro: "The aura grows violent. Resist it.", media: JJK_BOSS_R2 },
      { type: "attack", title: "Round 3 — Opening", intro: "A gap appears. Strike the core.", media: JJK_BOSS_R3 },
      { type: "finisher", title: "Round 4 — Exorcism Window", intro: "Finish it! Press **EXORCISE** within 5 seconds.", windowMs: 5000, buttonLabel: "Exorcise", buttonEmoji: "🪬", media: JJK_BOSS_R4 },
    ],
  },
};

const MOBS = {
  bleach: {
    name: "Hollow",
    joinMs: BLEACH_MOB_MS,
    hitReward: BLEACH_MOB_HIT,
    missReward: BLEACH_MOB_Mค้: BLEACH_BONUS_PER_KILL,
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
  const eventTag = def.event === "bleach" ? "BLEACH" : "JJK";
  const currency = def.event === "bleach" ? E_REIATSU : E_CE;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${def.emoji} ${eventTag} — ${def.name} Appeared!`)
    .setDescription(
      `**Difficulty:** ${def.difficulty}\n` +
      `⏳ **Join time:** ${Math.round(def.joinMs / 60000)} minutes\n` +
      `Click **Join Battle** to participate.`
    )
    .addFields(
      { name: `${E_MEMBERS} Fighters`, value: fightersText, inline: false },
      { name: `Joined`, value: `\`${joinedCount}\``, inline: true },
      { name: `Rewards`, value: `\`${currency} ${def.winReward} win • +${currency} ${def.hitReward}/success (banked)\``, inline: true },
      { name: `Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(def.spawnMedia)
    .setFooter({ text: `Boss • ${def.rounds.length} rounds • 2 hits = out` });
}

function bossRoundEmbed(def, roundIndex, aliveCount) {
  const r = def.rounds[roundIndex];
  const eventTag = def.event === "bleach" ? "BLEACH" : "JJK";

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${def.emoji} ${eventTag} — ${def.name} • ${r.title}`)
    .setDescription(r.intro)
    .addFields({ name: `Alive fighters`, value: `\`${aliveCount}\``, inline: true })
    .setImage(r.media || def.spawnMedia)
    .setFooter({ text: `Round ${roundIndex + 1}/${def.rounds.length}` });
}

function bossVictoryEmbed(def, survivorsCount) {
  const dropTxt = def.roleDropId
    ? `Role Drop: ${(def.roleDropBase * 100).toFixed(1)}%`
    : "Role Drop: disabled";

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`✅ ${def.name} Defeated!`)
    .setDescription(`Rewards granted to survivors.`)
    .addFields(
      { name: `Survivors`, value: `\`${survivorsCount}\``, inline: true },
      { name: `Drops`, value: `\`${dropTxt} • ${(ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}% 100 Robux\``, inline: true }
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
  const eventTag = eventKey === "bleach" ? "BLEACH" : "JJK";
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
    .addFields({ name: `Attackers`, value: `\`${joinedCount}\``, inline: true })
    .setImage(mob.media);
}

function inventoryEmbed(eventKey, player) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const itemBonus = calcBleachSurvivalBonus(inv);
    const mult = calcBleachReiatsuMultiplier(inv);

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`BLEACH — Inventory`)
      .setDescription(
        [
          `${E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**`,
          `${E_DRAKO} Drako Coin: **${player.drako}**`,
          `${E_VASTO} Boss bonus: **${player.bleach.survivalBonus}% / ${BLEACH_BONUS_MAX}%**`,
          `🛡 Item boss bonus: **${itemBonus}%**`,
          `🍀 Drop luck: **x${calcBleachDropLuckMultiplier(inv).toFixed(2)}**`,
          `💰 Reward multiplier: **x${mult}**`,
          "",
          `• Zanpakutō: ${inv.zanpakuto_basic ? "✅" : "❌"}`,
          `• Mask Fragment: ${inv.hollow_mask_fragment ? "✅" : "❌"}`,
          `• Cloak: ${inv.soul_reaper_cloak ? "✅" : "❌"}`,
          `• Amplifier: ${inv.reiatsu_amplifier ? "✅" : "❌"}`,
          `• Aizen Role: ${inv.cosmetic_role ? "✅" : "❌"}`,
          "",
          `🧥 Wardrobe saved roles: **${player.ownedRoles.length}**`,
        ].join("\n")
      );
  }

  const inv = player.jjk.items;
  const itemBonus = calcJjkSurvivalBonus(inv);
  const mult = calcJjkCEMultiplier(inv);

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`JUJUTSU KAISEN — Inventory`)
    .setDescription(
      [
        `${E_CE} Cursed Energy: **${player.jjk.cursedEnergy}**`,
        `${E_DRAKO} Drako Coin: **${player.drako}**`,
        `Boss bonus: **${player.jjk.survivalBonus}% / ${JJK_BONUS_MAX}%**`,
        `🛡 Item boss bonus: **${itemBonus}%**`,
        `🍀 Drop luck: **x${calcJjkDropLuckMultiplier(inv).toFixed(2)}**`,
        `💰 Reward multiplier: **x${mult.toFixed(2)}**`,
        "",
        `• Black Flash Manual: ${inv.black_flash_manual ? "✅" : "❌"}`,
        `• Domain Charm: ${inv.domain_charm ? "✅" : "❌"}`,
        `• Cursed Tool: ${inv.cursed_tool ? "✅" : "❌"}`,
        `• Reverse Talisman: ${inv.reverse_talisman ? "✅" : "❌"}`,
        `• Binding Vow Seal: ${inv.binding_vow_seal ? "✅" : "❌"}`,
        "",
        `🧥 Wardrobe saved roles: **${player.ownedRoles.length}**`,
      ].join("\n")
    );
}

function shopEmbed(eventKey, player) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const lines = BLEACH_SHOP_ITEMS.map((it) => {
      const owned = inv[it.key] ? "✅ Owned" : `${E_REIATSU} ${it.price} Reiatsu`;
      return `**${it.name}** — ${owned}\n> ${it.desc}`;
    });

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`BLEACH — Shop`)
      .setDescription(lines.join("\n\n"))
      .addFields(
        { name: `${E_REIATSU} Your Reiatsu`, value: `\`${player.bleach.reiatsu}\``, inline: true },
        { name: `${E_DRAKO} Drako`, value: `\`${player.drako}\``, inline: true }
      );
  }

  const inv = player.jjk.items;
  const lines = JJK_SHOP_ITEMS.map((it) => {
    const owned = inv[it.key] ? "✅ Owned" : `${E_CE} ${it.price} Cursed Energy`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`JUJUTSU KAISEN — Shop`)
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: `${E_CE} Your Cursed Energy`, value: `\`${player.jjk.cursedEnergy}\``, inline: true },
      { name: `${E_DRAKO} Drako`, value: `\`${player.drako}\``, inline: true }
    );
}

function leaderboardEmbed(eventKey, entries) {
  const tag = eventKey === "bleach" ? "BLEACH" : "JJK";
  const currency = eventKey === "bleach" ? E_REIATSU : E_CE;

  const lines = entries.map((e, i) => `**#${i + 1}** — ${safeName(e.name)}: **${currency} ${e.score}**`);
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🏆 ${tag} Leaderboard`)
    .setDescription(lines.join("\n") || "No data yet.");
}

/* ===================== COMPONENT IDS ===================== */
const CID = {
  BOSS_JOIN: "boss_join",
  BOSS_RULES: "boss_rules",
  BOSS_ACTION: "boss_action", // boss_action:<bossId>:<roundIndex>:<token>
  MOB_ATTACK: "mob_attack",   // mob_attack:<eventKey>
  COMBO_BTN: "combo_btn",     // combo_btn:<bossId>:<roundIndex>:<token>:<color>
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

function shopButtons(eventKey, player) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("buy_bleach_zanpakuto_basic").setLabel("Buy Zanpakutō").setStyle(ButtonStyle.Secondary).setDisabled(inv.zanpakuto_basic),
      new ButtonBuilder().setCustomId("buy_bleach_hollow_mask_fragment").setLabel("Buy Mask Fragment").setStyle(ButtonStyle.Secondary).setDisabled(inv.hollow_mask_fragment),
      new ButtonBuilder().setCustomId("buy_bleach_soul_reaper_cloak").setLabel("Buy Cloak").setStyle(ButtonStyle.Secondary).setDisabled(inv.soul_reaper_cloak)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("buy_bleach_reiatsu_amplifier").setLabel("Buy Amplifier").setStyle(ButtonStyle.Secondary).setDisabled(inv.reiatsu_amplifier),
      new ButtonBuilder().setCustomId("buy_bleach_cosmetic_role").setLabel("Buy Aizen Role").setStyle(ButtonStyle.Danger).setDisabled(inv.cosmetic_role)
    );
    return [row1, row2];
  }

  const inv = player.jjk.items;
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_jjk_black_flash_manual").setLabel("Buy Black Flash").setStyle(ButtonStyle.Secondary).setDisabled(inv.black_flash_manual),
    new ButtonBuilder().setCustomId("buy_jjk_domain_charm").setLabel("Buy Domain Charm").setStyle(ButtonStyle.Secondary).setDisabled(inv.domain_charm),
    new ButtonBuilder().setCustomId("buy_jjk_cursed_tool").setLabel("Buy Cursed Tool").setStyle(ButtonStyle.Secondary).setDisabled(inv.cursed_tool)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_jjk_reverse_talisman").setLabel("Buy Reverse Talisman").setStyle(ButtonStyle.Secondary).setDisabled(inv.reverse_talisman),
    new ButtonBuilder().setCustomId("buy_jjk_binding_vow_seal").setLabel("Buy Binding Vow").setStyle(ButtonStyle.Danger).setDisabled(inv.binding_vow_seal)
  );
  return [row1, row2];
}

/* ===================== RUNTIME STATE ===================== */
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
  const fightersText = fighters.length
    ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000)
    : "`No fighters yet`";

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

/* ===================== COOP / COMBO HELPERS ===================== */
function makeToken() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function comboButtonsRow(bossId, roundIndex, token, colors, disabled = false) {
  const map = {
    red: { label: "RED", emoji: "🟥" },
    green: { label: "GREEN", emoji: "🟩" },
    blue: { label: "BLUE", emoji: "🟦" },
    yellow: { label: "YELLOW", emoji: "🟨" },
  };

  const row = new ActionRowBuilder();
  for (const c of colors) {
    const meta = map[c];
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${CID.COMBO_BTN}:${bossId}:${roundIndex}:${token}:${c}`)
        .setLabel(meta.label)
        .setEmoji(meta.emoji)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    );
  }
  return [row];
}

function randomComboSequence(len = 4) {
  const colors = ["red", "green", "blue", "yellow"];
  const seq = [];
  for (let i = 0; i < len; i++) seq.push(colors[Math.floor(Math.random() * colors.length)]);
  return seq;
}

function formatCombo(seq) {
  const e = { red: "🟥", green: "🟩", blue: "🟦", yellow: "🟨" };
  return seq.map((c) => e[c]).join(" ");
}

/* ===================== BOSS RUNNER ===================== */
async function runBoss(channel, boss) {
  try {
    boss.joining = false;
    await updateBossSpawnMessage(channel, boss);

    let alive = aliveIds(boss);
    if (!alive.length) {
      await channel.send(`💨 Nobody joined. **${boss.def.name}** vanished.`).catch(() => {});
      return;
    }

    // ✅ Run rounds
    for (let i = 0; i < boss.def.rounds.length; i++) {
      alive = aliveIds(boss);
      if (!alive.length) break;

      // ✅ 10 sec BEFORE every round (no after-round cooldown to avoid 20s)
      await channel.send(`⏳ Next round starts in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
      await sleep(ROUND_COOLDOWN_MS);

      alive = aliveIds(boss);
      if (!alive.length) break;

      const r = boss.def.rounds[i];

      await channel.send({ embeds: [bossRoundEmbed(boss.def, i, alive.length)] }).catch(() => {});

      // ---- pressure / attack ----
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
            await channel.send(`✅ **${nm}** succeeded! (+${getEventCurrencyEmoji(boss.def.event)} ${add} banked)`).catch(() => {});
          }
          await sleep(250);
        }
        continue;
      }

      // ---- coop_block (global requirement) ----
      if (r.type === "coop_block") {
        const token = makeToken();
        boss.activeAction = { type: "coop", token, roundIndex: i, pressed: new Set() };

        const customId = `boss_action:${boss.def.id}:${i}:${token}`;
        const msg = await channel.send({
          content: `🛡️ **CO-OP BLOCK** — Need **${r.requiredPresses}** unique presses in **${Math.round(r.windowMs / 1000)}s**!`,
          components: actionButtonRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false),
        }).catch(() => null);

        await sleep(r.windowMs);

        if (msg?.id) await msg.edit({ components: actionButtonRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", true) }).catch(() => {});
        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);

        if (pressed.size < (r.requiredPresses || 4)) {
          // ❌ not enough people blocked -> everyone takes a hit
          await channel.send(`❌ Not enough fighters blocked in time (**${pressed.size}/${r.requiredPresses || 4}**). Everyone takes damage!`).catch(() => {});
          for (const uid of nowAlive) {
            await applyHit(uid, boss, channel, `couldn't block the strike!`);
            await sleep(150);
          }
        } else {
          // ✅ phase passed; pressers succeed (bank), non-pressers take hit
          await channel.send(`✅ Block successful (**${pressed.size}** fighters blocked).`).catch(() => {});
          for (const uid of nowAlive) {
            const player = await getPlayer(uid);
            const nm = safeName(boss.participants.get(uid)?.displayName);
            if (pressed.has(uid)) {
              const mult = getEventMultiplier(boss.def.event, player);
              const add = Math.floor(boss.def.hitReward * mult);
              bankSuccess(uid, boss, add);
              await channel.send(`🛡️ **${nm}** blocked! (+${getEventCurrencyEmoji(boss.def.event)} ${add} banked)`).catch(() => {});
            } else {
              await applyHit(uid, boss, channel, `did not block in time!`);
            }
            await sleep(180);
          }
        }
        continue;
      }

      // ---- quick_block (per-user pressed or takes hit) ----
      if (r.type === "quick_block") {
        const token = makeToken();
        boss.activeAction = { type: "quick", token, roundIndex: i, pressed: new Set() };

        const customId = `boss_action:${boss.def.id}:${i}:${token}`;
        const msg = await channel.send({
          content: `⚠️ **QUICK BLOCK** — press **BLOCK** within **${Math.round(r.windowMs / 1000)}s**!`,
          components: actionButtonRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false),
        }).catch(() => null);

        await sleep(r.windowMs);

        if (msg?.id) await msg.edit({ components: actionButtonRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", true) }).catch(() => {});
        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const nm = safeName(boss.participants.get(uid)?.displayName);

          if (pressed.has(uid)) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            await channel.send(`🛡️ **${nm}** blocked and counterattacked! (+${getEventCurrencyEmoji(boss.def.event)} ${add} banked)`).catch(() => {});
          } else {
            await applyHit(uid, boss, channel, `was too slow!`);
          }
          await sleep(170);
        }
        continue;
      }

      // ---- finisher (pressed or hit, then end fight) ----
      if (r.type === "finisher") {
        const token = makeToken();
        boss.activeAction = { type: "finisher", token, roundIndex: i, pressed: new Set() };

        const customId = `boss_action:${boss.def.id}:${i}:${token}`;
        const msg = await channel.send({
          content: `⚔️ **FINISHER WINDOW** — press **${(r.buttonLabel || "Finish").toUpperCase()}** within **${Math.round(r.windowMs / 1000)}s**!`,
          components: actionButtonRow(customId, r.buttonLabel || "Finish", r.buttonEmoji || "⚔️", false),
        }).catch(() => null);

        await sleep(r.windowMs);

        if (msg?.id) await msg.edit({ components: actionButtonRow(customId, r.buttonLabel || "Finish", r.buttonEmoji || "⚔️", true) }).catch(() => {});
        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const nm = safeName(boss.participants.get(uid)?.displayName);

          if (pressed.has(uid)) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            await channel.send(`⚔️ **${nm}** landed the finisher! (+${getEventCurrencyEmoji(boss.def.event)} ${add} banked)`).catch(() => {});
          } else {
            await applyHit(uid, boss, channel, `missed the finisher window!`);
          }
          await sleep(160);
        }

        // finisher ends the round loop
        break;
      }

      // ---- combo_defense (per-user QTE) ----
      if (r.type === "combo_defense") {
        const token = makeToken();
        const seq = randomComboSequence(4); // 4 steps
        boss.combo = {
          token,
          roundIndex: i,
          sequence: seq,
          progress: new Map(), // uid -> index
          success: new Set(),
          failed: new Set(),
        };

        const colors = ["red", "green", "blue", "yellow"];
        const msg = await channel.send({
          content: `🎮 **COMBO DEFENSE** — Press in order: **${formatCombo(seq)}**  (Time: **${Math.round(r.windowMs / 1000)}s**)`,
          components: comboButtonsRow(boss.def.id, i, token, colors, false),
        }).catch(() => null);

        await sleep(r.windowMs);

        // disable
        if (msg?.id) {
          await msg.edit({
            components: comboButtonsRow(boss.def.id, i, token, colors, true),
          }).catch(() => {});
        }

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const nm = safeName(boss.participants.get(uid)?.displayName);

          if (boss.combo.success.has(uid)) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            await channel.send(`✅ **${nm}** completed the combo! (+${getEventCurrencyEmoji(boss.def.event)} ${add} banked)`).catch(() => {});
          } else {
            await applyHit(uid, boss, channel, `failed the combo defense!`);
          }
          await sleep(170);
        }

        boss.combo = null;
        continue;
      }

      // ---- group_final (>=3 successes else defeat ALL) ----
      if (r.type === "group_final") {
        const nowAlive = aliveIds(boss);
        let successCount = 0;
        const successUids = [];

        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.def.event, player, boss.def.baseChance);
          const ok = Math.random() < chance;
          if (ok) {
            successCount++;
            successUids.push(uid);
          }
        }

        if (successCount < (r.requiredSuccesses || 3)) {
          await channel.send(`❌ Not enough fighters succeeded (**${successCount}/${r.requiredSuccesses || 3}**). **Everyone loses.**`).catch(() => {});
          await channel.send({ embeds: [bossDefeatEmbed(boss.def)] }).catch(() => {});
          return;
        }

        await channel.send(`✅ Group success (**${successCount}/${r.requiredSuccesses || 3}**). The final push lands!`).catch(() => {});

        // successes bank; failures take hit
        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const nm = safeName(boss.participants.get(uid)?.displayName);

          if (successUids.includes(uid)) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            await channel.send(`⚔️ **${nm}** broke through! (+${getEventCurrencyEmoji(boss.def.event)} ${add} banked)`).catch(() => {});
          } else {
            await applyHit(uid, boss, channel, `failed the final push!`);
          }
          await sleep(170);
        }

        // final round ends the loop (then rewards stage)
        break;
      }
    }

    const survivors = aliveIds(boss);
    if (!survivors.length) {
      await channel.send({ embeds: [bossDefeatEmbed(boss.def)] }).catch(() => {});
      return;
    }

    // ✅ Rewards on victory only
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

      // Role drops
      const luckMult = getEventDropMult(boss.def.event, player);
      const base = boss.def.roleDropBase || 0;
      const chance = Math.min(DROP_CHANCE_CAP, base * luckMult);

      if (boss.def.roleDropId && Math.random() < chance) {
        ensureOwnedRole(player, boss.def.roleDropId);
        await setPlayer(uid, player);

        const res = await tryGiveRole(channel.guild, uid, boss.def.roleDropId);
        lines.push(res.ok
          ? `🎭 <@${uid}> obtained a **Boss Role**!`
          : `⚠️ <@${uid}> won role but bot couldn't assign: ${res.reason} (saved to wardrobe)`
        );
      }

      // Robux drop (kept)
      const robuxChance = Math.min(ROBUX_CHANCE_CAP, ROBUX_CHANCE_REAL_BASE * luckMult);
      if (Math.random() < robuxChance) {
        lines.push(`🎁 <@${uid}> won **100 Robux** (${(ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}%) — ${ROBUX_CLAIM_TEXT}`);
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
    combo: null,
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
    /* ---------- SLASH ---------- */
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
        return interaction.reply({ embeds: [inventoryEmbed(eventKey, p)], ephemeral: true });
      }

      if (interaction.commandName === "shop") {
        const eventKey = interaction.options.getString("event", true);
        const p = await getPlayer(interaction.user.id);
        return interaction.reply({
          embeds: [shopEmbed(eventKey, p)],
          components: shopButtons(eventKey, p),
          ephemeral: true,
        });
      }

      if (interaction.commandName === "leaderboard") {
        const eventKey = interaction.options.getString("event", true);
        const rows = await getTopPlayers(eventKey, 10);
        const entries = [];

        for (const r of rows) {
          let name = r.userId;
          try {
            const m = await interaction.guild.members.fetch(r.userId);
            name = safeName(m?.displayName || m?.user?.username || r.userId);
          } catch {}
          entries.push({ name, score: r.score });
        }

        return interaction.reply({ embeds: [leaderboardEmbed(eventKey, entries)], ephemeral: false });
      }

      if (interaction.commandName === "dailyclaim") {
        const p = await getPlayer(interaction.user.id);
        const now = Date.now();

        if (now - p.bleach.lastDaily < DAILY_COOLDOWN_MS) {
          const hrs = Math.ceil((DAILY_COOLDOWN_MS - (now - p.bleach.lastDaily)) / 3600000);
          return interaction.reply({ content: `⏳ Come back in **${hrs}h**.`, ephemeral: true });
        }

        const amount = hasBoosterRole(interaction.member) ? DAILY_BOOSTER : DAILY_NORMAL;
        p.bleach.reiatsu += amount;
        p.bleach.lastDaily = now;

        await setPlayer(interaction.user.id, p);
        return interaction.reply({ content: `🎁 You claimed **${E_REIATSU} ${amount} Reiatsu**!`, ephemeral: false });
      }

      if (interaction.commandName === "give_reatsu") {
        const target = interaction.options.getUser("user", true);
        const amount = interaction.options.getInteger("amount", true);

        if (amount < 50) return interaction.reply({ content: `❌ Minimum transfer is ${E_REIATSU} 50.`, ephemeral: true });
        if (target.bot) return interaction.reply({ content: "❌ You can't transfer to a bot.", ephemeral: true });
        if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't transfer to yourself.", ephemeral: true });

        const sender = await getPlayer(interaction.user.id);
        const receiver = await getPlayer(target.id);

        if (sender.bleach.reiatsu < amount) {
          return interaction.reply({ content: `❌ Not enough Reiatsu. You have ${sender.bleach.reiatsu}.`, ephemeral: true });
        }

        sender.bleach.reiatsu -= amount;
        receiver.bleach.reiatsu += amount;

        await setPlayer(interaction.user.id, sender);
        await setPlayer(target.id, receiver);

        return interaction.reply({
          content: `${E_REIATSU} **${safeName(interaction.user.username)}** sent **${amount} Reiatsu** to **${safeName(target.username)}**.`,
          ephemeral: false,
        });
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
              content: `❌ Need ${E_REIATSU} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\nYou have ${E_REIATSU} **${p.bleach.reiatsu}**.`,
              ephemeral: true,
            });
          }
          p.bleach.reiatsu -= cost;
          p.drako += drakoWanted;
          await setPlayer(interaction.user.id, p);

          return interaction.reply({
            content:
              `✅ Exchange: ${E_REIATSU} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako**\n` +
              `Rate: **${DRAKO_RATE_BLEACH} Reiatsu = 1 Drako**\n` +
              `Now: ${E_REIATSU} **${p.bleach.reiatsu}** • ${E_DRAKO} **${p.drako}**\n` +
              `⚠️ Drako cannot be exchanged back.`,
            ephemeral: false,
          });
        } else {
          if (p.jjk.cursedEnergy < cost) {
            return interaction.reply({
              content: `❌ Need ${E_CE} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\nYou have ${E_CE} **${p.jjk.cursedEnergy}**.`,
              ephemeral: true,
            });
          }
          p.jjk.cursedEnergy -= cost;
          p.drako += drakoWanted;
          await setPlayer(interaction.user.id, p);

          return interaction.reply({
            content:
              `✅ Exchange: ${E_CE} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako**\n` +
              `Rate: **${DRAKO_RATE_JJK} Cursed Energy = 1 Drako**\n` +
              `Now: ${E_CE} **${p.jjk.cursedEnergy}** • ${E_DRAKO} **${p.drako}**\n` +
              `⚠️ Drako cannot be exchanged back.`,
            ephemeral: false,
          });
        }
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

      if (interaction.commandName === "adminadd") {
        // Only role 1259865441405501571 can do this
        const allowed = interaction.member?.roles?.cache?.has("1259865441405501571");
        if (!allowed) return interaction.reply({ content: "⛔ No permission.", ephemeral: true });

        const currency = interaction.options.getString("currency", true);
        const amount = interaction.options.getInteger("amount", true);
        const target = interaction.options.getUser("user") || interaction.user;

        const p = await getPlayer(target.id);

        if (currency === "drako") p.drako += amount;
        if (currency === "reiatsu") p.bleach.reiatsu += amount;
        if (currency === "cursed_energy") p.jjk.cursedEnergy += amount;

        await setPlayer(target.id, p);

        return interaction.reply({
          content:
            `✅ Added **${amount}** to <@${target.id}>.\n` +
            `${E_REIATSU} Reiatsu: **${p.bleach.reiatsu}** • ${E_CE} CE: **${p.jjk.cursedEnergy}** • ${E_DRAKO} Drako: **${p.drako}**`,
          ephemeral: false,
        });
      }
    }

    /* ---------- SELECT MENU (WARDROBE) ---------- */
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== "wardrobe_select") return;

      const roleId = interaction.values?.[0];
      if (!roleId) return;

      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) return interaction.reply({ content: "❌ Can't read your member data.", ephemeral: true });

      const p = await getPlayer(interaction.user.id);
      if (!p.ownedRoles.includes(String(roleId))) {
        return interaction.reply({ content: "❌ This role is not in your wardrobe.", ephemeral: true });
      }

      const has = member.roles.cache.has(roleId);
      if (has) {
        const res = await tryRemoveRole(interaction.guild, interaction.user.id, roleId);
        if (!res.ok) return interaction.reply({ content: `⚠️ Can't remove role: ${res.reason}`, ephemeral: true });
      } else {
        const res = await tryGiveRole(interaction.guild, interaction.user.id, roleId);
        if (!res.ok) return interaction.reply({ content: `⚠️ Can't assign role: ${res.reason}`, ephemeral: true });
      }

      const updatedMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => member);
      return interaction.update({
        embeds: [wardrobeEmbed(interaction.guild, p)],
        components: wardrobeComponents(interaction.guild, updatedMember, p),
      });
    }

    /* ---------- BUTTONS ---------- */
    if (interaction.isButton()) {
      try { await interaction.deferUpdate(); } catch {}

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) return;

      const cid = interaction.customId;

      // Boss join
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

      // Boss rules
      if (cid === CID.BOSS_RULES) {
        const boss = bossByChannel.get(channel.id);
        const def = boss?.def;

        const cur = def?.event === "bleach" ? E_REIATSU : E_CE;
        const txt = def
          ? `**${def.name}** • Difficulty: **${def.difficulty}** • Rounds: **${def.rounds.length}**\n` +
            `Win: **${cur} ${def.winReward}**\n` +
            `Success per phase: **+${cur} ${def.hitReward}** (banked, paid only on victory)\n` +
            `2 hits = eliminated`
          : `2 hits = eliminated.`;

        await interaction.followUp({ content: txt, ephemeral: true }).catch(() => {});
        return;
      }

      // Boss action: boss_action:<bossId>:<roundIndex>:<token>
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

      // Combo defense button: combo_btn:<bossId>:<roundIndex>:<token>:<color>
      if (cid.startsWith(`${CID.COMBO_BTN}:`)) {
        const parts = cid.split(":");
        const bossId = parts[1];
        const roundIndex = Number(parts[2]);
        const token = parts[3];
        const color = parts[4];

        const boss = bossByChannel.get(channel.id);
        if (!boss || boss.def.id !== bossId) {
          await interaction.followUp({ content: "❌ No active combo.", ephemeral: true }).catch(() => {});
          return;
        }
        if (!boss.combo || boss.combo.token !== token || boss.combo.roundIndex !== roundIndex) {
          await interaction.followUp({ content: "⌛ Too late.", ephemeral: true }).catch(() => {});
          return;
        }

        const uid = interaction.user.id;
        const st = boss.participants.get(uid);
        if (!st || st.hits >= MAX_HITS) {
          await interaction.followUp({ content: "❌ You are not in the fight.", ephemeral: true }).catch(() => {});
          return;
        }

        // if already succeeded, ignore
        if (boss.combo.success.has(uid)) {
          await interaction.followUp({ content: "✅ Already completed.", ephemeral: true }).catch(() => {});
          return;
        }

        // if already failed, ignore
        if (boss.combo.failed.has(uid)) {
          await interaction.followUp({ content: "❌ You already failed.", ephemeral: true }).catch(() => {});
          return;
        }

        const seq = boss.combo.sequence;
        const idx = boss.combo.progress.get(uid) || 0;
        const expected = seq[idx];

        if (color !== expected) {
          boss.combo.failed.add(uid);
          await interaction.followUp({ content: "❌ Wrong input. You failed the combo.", ephemeral: true }).catch(() => {});
          return;
        }

        const next = idx + 1;
        boss.combo.progress.set(uid, next);

        if (next >= seq.length) {
          boss.combo.success.add(uid);
          await interaction.followUp({ content: "✅ Combo completed!", ephemeral: true }).catch(() => {});
        } else {
          await interaction.followUp({ content: `✅ Good. Step ${next}/${seq.length}...`, ephemeral: true }).catch(() => {});
        }
        return;
      }

      // Mob attack: mob_attack:<eventKey>
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

      // Shop buys
      if (cid.startsWith("buy_")) {
        const p = await getPlayer(interaction.user.id);

        const bleachMap = {
          buy_bleach_zanpakuto_basic: "zanpakuto_basic",
          buy_bleach_hollow_mask_fragment: "hollow_mask_fragment",
          buy_bleach_soul_reaper_cloak: "soul_reaper_cloak",
          buy_bleach_reiatsu_amplifier: "reiatsu_amplifier",
          buy_bleach_cosmetic_role: "cosmetic_role",
        };

        const jjkMap = {
          buy_jjk_black_flash_manual: "black_flash_manual",
          buy_jjk_domain_charm: "domain_charm",
          buy_jjk_cursed_tool: "cursed_tool",
          buy_jjk_reverse_talisman: "reverse_talisman",
          buy_jjk_binding_vow_seal: "binding_vow_seal",
        };

        let eventKey = null;
        let key = null;

        if (bleachMap[cid]) { eventKey = "bleach"; key = bleachMap[cid]; }
        if (jjkMap[cid]) { eventKey = "jjk"; key = jjkMap[cid]; }

        if (!eventKey || !key) {
          await interaction.followUp({ content: "❌ Unknown item.", ephemeral: true }).catch(() => {});
          return;
        }

        const itemList = eventKey === "bleach" ? BLEACH_SHOP_ITEMS : JJK_SHOP_ITEMS;
        const item = itemList.find((x) => x.key === key);
        if (!item) {
          await interaction.followUp({ content: "❌ Unknown item.", ephemeral: true }).catch(() => {});
          return;
        }

        const inv = eventKey === "bleach" ? p.bleach.items : p.jjk.items;
        if (inv[key]) {
          await interaction.followUp({ content: "✅ You already own this item.", ephemeral: true }).catch(() => {});
          return;
        }

        if (eventKey === "bleach") {
          if (p.bleach.reiatsu < item.price) {
            await interaction.followUp({ content: `❌ Need ${E_REIATSU} ${item.price}.`, ephemeral: true }).catch(() => {});
            return;
          }
          p.bleach.reiatsu -= item.price;
          p.bleach.items[key] = true;
        } else {
          if (p.jjk.cursedEnergy < item.price) {
            await interaction.followUp({ content: `❌ Need ${E_CE} ${item.price}.`, ephemeral: true }).catch(() => {});
            return;
          }
          p.jjk.cursedEnergy -= item.price;
          p.jjk.items[key] = true;
        }

        if (item.roleId) {
          ensureOwnedRole(p, item.roleId);
          const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
          if (!res.ok) {
            await interaction.followUp({ content: `⚠️ Bought role, but bot couldn't assign: ${res.reason} (saved to wardrobe)`, ephemeral: true }).catch(() => {});
          }
        }

        await setPlayer(interaction.user.id, p);

        const msgId = interaction.message?.id;
        if (msgId) {
          const msg = await channel.messages.fetch(msgId).catch(() => null);
          if (msg) {
            await msg.edit({
              embeds: [shopEmbed(eventKey, p)],
              components: shopButtons(eventKey, p),
            }).catch(() => {});
          }
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
