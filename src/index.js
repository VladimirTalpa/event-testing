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

/* ===================== GLOBAL CONFIG ===================== */

// Event staff roles (can spawn manually)
const EVENT_ROLE_IDS = ["1259865441405501571", "1287879457025163325"];

// Booster role (daily bonus)
const BOOSTER_ROLE_ID = "1267266564961341501";

// Theme color
const COLOR = 0x7b2cff;

// Between rounds
const ROUND_COOLDOWN_MS = 10 * 1000;

// 2 hits = out
const MAX_HITS = 2;

// Daily
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/* ===================== CHANNEL ROUTING ===================== */
// ✅ BLEACH channel (bosses + hollows)
const BLEACH_CHANNEL_ID = "1469757595031179314";
// ✅ JJK channel (bosses + cursed spirits)
const JJK_CHANNEL_ID = "1469757629390651686";

/* ===================== EMOJIS ===================== */
const E_MEMBERS = "<:event:1467501718630568118>";
const E_REIATSU = "<:event:1467497975101128724>";
const E_VASTO = "<:event:1467502793869885563>";

const E_CE = "🟣";      // cursed energy emoji
const E_DRAKO = "🪙";   // drako coin emoji

/* ===================== BLEACH CONFIG ===================== */
const BLEACH = {
  id: "bleach",
  name: "BLEACH",
  currencyName: "Reiatsu",
  currencyEmoji: E_REIATSU,
  exchangeRate: 47, // 47 reiatsu -> 1 drako
  pingBossRoleId: "1467575062826586205",
  pingMobRoleId: "1467575020275368131",

  autoMobEveryMs: 20 * 60 * 1000,
  autoBossEveryMs: 2 * 60 * 60 * 1000,

  mob: {
    name: "Hollow",
    joinMs: 2 * 60 * 1000,
    hitReward: 25,
    missReward: 10,
    bonusPerKill: 1,
    bonusMax: 30,
    media:
      "https://media.discordapp.net/attachments/1405973335979851877/1467508068303638540/Your_paragraph_text_10.gif?ex=6980a2e4&is=697f5164&hm=451cc0ec6edd18799593cf138549ddb86934217f6bee1e6364814d23153ead78&=",
  },

  drops: {
    bossDropRoleId: "1467426528584405103",
    dropRoleChanceBase: 0.05,
    dropRoleChanceCap: 0.12,
    dropRobuxChanceRealBase: 0.005,
    dropRobuxChanceDisplay: 0.025,
    dropRobuxChanceCap: 0.01,
    robuxClaimText: "To claim: contact **daez063**.",
  },

  daily: {
    normal: 100,
    booster: 200,
  },

  shop: {
    cosmeticRoleId: "1467438527200497768",
    items: [
      { key: "zanpakuto_basic", name: "Zanpakutō (basic)", price: 350, desc: "+4% survive vs bosses • +5% drop luck", type: "stat" },
      { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: "+7% survive vs bosses • +10% drop luck", type: "stat" },
      { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: "+9% survive vs bosses • +6% drop luck", type: "stat" },
      { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: "+25% rewards • +2% survive vs bosses", type: "stat" },
      { key: "cosmetic_role", name: "Sousuke Aizen role", price: 6000, desc: "Cosmetic Discord role (no stats).", type: "role", roleId: "1467438527200497768" },
    ],
  },
};

/* ===================== JJK CONFIG ===================== */
const JJK = {
  id: "jjk",
  name: "JUJUTSU KAISEN",
  currencyName: "Cursed Energy",
  currencyEmoji: E_CE,
  exchangeRate: 18, // 18 CE -> 1 drako

  // ⚠️ если хочешь пинги для JJK, укажи role ids. Если не надо — оставь null.
  pingBossRoleId: null,
  pingMobRoleId: null,

  autoMobEveryMs: 25 * 60 * 1000,   // можешь поменять
  autoBossEveryMs: 3 * 60 * 60 * 1000, // можешь поменять

  mob: {
    name: "Cursed Spirit",
    joinMs: 2 * 60 * 1000,
    hitReward: 22,
    missReward: 9,
    bonusPerKill: 1,
    bonusMax: 30,
    media: BLEACH.mob.media, // поставь своё если хочешь
  },

  drops: {
    // ⚠️ поставь свою роль за дроп JJK (или оставь null чтобы не давать роль)
    bossDropRoleId: null,
    dropRoleChanceBase: 0.05,
    dropRoleChanceCap: 0.12,
    dropRobuxChanceRealBase: 0.003,
    dropRobuxChanceDisplay: 0.02,
    dropRobuxChanceCap: 0.01,
    robuxClaimText: "To claim: contact **daez063**.",
  },

  daily: {
    normal: 90,
    booster: 180,
  },

  shop: {
    // ⚠️ замени на реальный role id косметики JJK
    cosmeticRoleId: null,
    items: [
      { key: "cursed_tool_basic", name: "Cursed Tool (basic)", price: 320, desc: "+4% survive vs curses • +5% drop luck", type: "stat" },
      { key: "ofuda_talisman", name: "Ofuda Talisman", price: 850, desc: "+7% survive vs curses • +10% drop luck", type: "stat" },
      { key: "sorcerer_uniform", name: "Sorcerer Uniform", price: 1150, desc: "+9% survive vs curses • +6% drop luck", type: "stat" },
      { key: "black_flash_focus", name: "Black Flash Focus", price: 1450, desc: "+25% rewards • +2% survive vs curses", type: "stat" },
      // ⚠️ roleId поставь если есть роль
      { key: "cosmetic_role", name: "Special Grade Sorcerer role", price: 6000, desc: "Cosmetic Discord role (no stats).", type: "role", roleId: null },
    ],
  },
};

/* ===================== BOSS DEFINITIONS ===================== */
// Bleach bosses
const BOSSES = {
  vasto: {
    event: "bleach",
    id: "vasto",
    name: "Vasto Lorde",
    difficulty: "Hard",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.30,
    winReward: 200,
    hitReward: 15,
    spawnMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1467277181955604572/Your_paragraph_text_4.gif?ex=6980749c&is=697f231c&hm=d06365f2194faceee52207192f81db418aa5a485aaa498f154553dc5e62f6d79&=",
    victoryMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1467278760901345313/Your_paragraph_text_7.gif?ex=69807615&is=697f2495&hm=b6f4546141fb8a52e480992b5c029cd1c675072df0e71b1f3ed50ebee65b01eb&=",
    defeatMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1467276974589218941/Your_paragraph_text_5.gif?ex=6980746b&is=697f22eb&hm=4f8a5f7867d5366e2a473a6d84a13e051544ebc5c56bee5dc34a4ae727c00f20&=",
    rounds: [
      { type: "pressure", title: "Round 1 — Reiatsu Wave", intro: "A powerful Reiatsu wave bursts out.", media:
        "https://media.discordapp.net/attachments/1405973335979851877/1467276870784520326/Your_paragraph_text_3.gif?ex=69807452&is=697f22d2&hm=893ba1888e2ea579e71f442f158cfc25e06ed5371b59c978dd1afae3f61d480f&=" },
      { type: "pressure", title: "Round 2 — Berserk Pressure", intro: "The pressure intensifies.", media:
        "https://media.discordapp.net/attachments/1405973335979851877/1467276870784520326/Your_paragraph_text_3.gif?ex=69807452&is=697f22d2&hm=893ba1888e2ea579e71f442f158cfc25e06ed5371b59c978dd1afae3f61d480f&=" },
      { type: "attack", title: "Round 3 — Weakened", intro: "Strike while it’s weakened.", media:
        "https://media.discordapp.net/attachments/1405973335979851877/1467276903160483995/Your_paragraph_text_1.gif?ex=6980745a&is=697f22da&hm=52decaeaf342973a4930a1d7a0f09ac5fb38358650e5607c40e9c821d7596a88&=" },
      { type: "finisher", title: "Round 4 — Final (Finisher)", intro: "Press FINISHER in time!", windowMs: 5000, buttonLabel: "Finisher", buttonEmoji: "⚔️", media:
        "https://media.discordapp.net/attachments/1405973335979851877/1467276984257220795/Your_paragraph_text_6.gif?ex=6980746d&is=697f22ed&hm=2a22d2df088318c7bfb1ddcb1601caea0ea248a19e6db909f741895b769ce7bb&=" },
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
    spawnMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1467277181955604572/Your_paragraph_text_4.gif?ex=6980749c&is=697f231c&hm=d06365f2194faceee52207192f81db418aa5a485aaa498f154553dc5e62f6d79&=",
    victoryMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1467278760901345313/Your_paragraph_text_7.gif?ex=69807615&is=697f2495&hm=b6f4546141fb8a52e480992b5c029cd1c675072df0e71b1f3ed50ebee65b01eb&=",
    defeatMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1467276974589218941/Your_paragraph_text_5.gif?ex=6980746b&is=697f22eb&hm=4f8a5f7867d5366e2a473a6d84a13e051544ebc5c56bee5dc34a4ae727c00f20&=",
    rounds: [
      { type: "pressure", title: "Round 1 — Reiatsu Wave", intro: "Endure the pressure.", media: null },
      { type: "defend", title: "Round 2 — Defense", intro: "Hold in time!", windowMs: 2000, buttonLabel: "Hold", buttonEmoji: "🛡️", media: null },
      { type: "defend", title: "Round 3 — Defense", intro: "Hold again!", windowMs: 2000, buttonLabel: "Hold", buttonEmoji: "🛡️", media: null },
      { type: "attack", title: "Round 4 — Transformation", intro: "Pressure becomes unbearable.", media: null },
      { type: "attack", title: "Round 5 — Rampage", intro: "Survive the assault.", media: null },
      { type: "attack", title: "Round 6 — Critical Damage", intro: "Finish the fight.", media: null },
      { type: "attack", title: "Round 7 — Final", intro: "Last chance.", media: null },
    ],
  },

  // JJK boss (same mechanics as Vasto)
  special_grade: {
    event: "jjk",
    id: "special_grade",
    name: "Special Grade Curse",
    difficulty: "Hard",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.30,
    winReward: 200, // paid in cursed energy (CE)
    hitReward: 15,
    spawnMedia: null,
    victoryMedia: null,
    defeatMedia: null,
    rounds: [
      { type: "pressure", title: "Round 1 — Cursed Pressure", intro: "A violent cursed aura crushes the area.", media: null },
      { type: "pressure", title: "Round 2 — Cursed Frenzy", intro: "The cursed pressure intensifies.", media: null },
      { type: "attack", title: "Round 3 — Opening", intro: "Strike the curse while it’s exposed.", media: null },
      { type: "finisher", title: "Round 4 — Final (Exorcise)", intro: "Press EXORCISE in time!", windowMs: 5000, buttonLabel: "Exorcise", buttonEmoji: "🗡️", media: null },
    ],
  },
};

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

function normalizeEventState(raw = {}, eventId) {
  const items = raw.items && typeof raw.items === "object" ? raw.items : {};
  const ownedRoles = Array.isArray(raw.ownedRoles) ? raw.ownedRoles.filter(Boolean).map(String) : [];

  return {
    currency: Number.isFinite(raw.currency) ? raw.currency : 0,
    survivalBonus: Number.isFinite(raw.survivalBonus) ? raw.survivalBonus : 0,
    lastDaily: Number.isFinite(raw.lastDaily) ? raw.lastDaily : 0,
    ownedRoles: [...new Set(ownedRoles)],
    items: { ...items },
  };
}

function normalizePlayer(raw = {}) {
  return {
    drako: Number.isFinite(raw.drako) ? raw.drako : 0,
    bleach: normalizeEventState(raw.bleach, "bleach"),
    jjk: normalizeEventState(raw.jjk, "jjk"),
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

async function getTopPlayers(eventId, limit = 10) {
  await initRedis();
  const all = await redis.hGetAll(REDIS_PLAYERS_KEY);
  const rows = Object.entries(all).map(([userId, json]) => {
    let p = {};
    try { p = normalizePlayer(JSON.parse(json)); } catch {}
    const cur = (p?.[eventId]?.currency) || 0;
    return { userId, currency: cur };
  });
  rows.sort((a, b) => b.currency - a.currency);
  return rows.slice(0, limit);
}

/* ===================== SHOP LOGIC (generic) ===================== */
function getEventConfig(eventId) {
  return eventId === "bleach" ? BLEACH : JJK;
}

function getShopItems(eventId) {
  return getEventConfig(eventId).shop.items;
}

function calcItemSurvivalBonus(eventId, items) {
  // same formula but different keys per event
  let bonus = 0;
  if (eventId === "bleach") {
    if (items.zanpakuto_basic) bonus += 4;
    if (items.hollow_mask_fragment) bonus += 7;
    if (items.soul_reaper_cloak) bonus += 9;
    if (items.reiatsu_amplifier) bonus += 2;
  } else {
    if (items.cursed_tool_basic) bonus += 4;
    if (items.ofuda_talisman) bonus += 7;
    if (items.sorcerer_uniform) bonus += 9;
    if (items.black_flash_focus) bonus += 2;
  }
  return bonus;
}

function calcRewardMultiplier(eventId, items) {
  if (eventId === "bleach") return items.reiatsu_amplifier ? 1.25 : 1.0;
  return items.black_flash_focus ? 1.25 : 1.0;
}

function calcDropLuckMultiplier(eventId, items) {
  let mult = 1.0;
  if (eventId === "bleach") {
    if (items.zanpakuto_basic) mult += 0.05;
    if (items.hollow_mask_fragment) mult += 0.10;
    if (items.soul_reaper_cloak) mult += 0.06;
  } else {
    if (items.cursed_tool_basic) mult += 0.05;
    if (items.ofuda_talisman) mult += 0.10;
    if (items.sorcerer_uniform) mult += 0.06;
  }
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
  if (!roleId) return { ok: false, reason: "RoleId not configured." };
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
  if (!roleId) return { ok: false, reason: "RoleId not configured." };
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

/* ===================== WARDROBE ===================== */
function ensureOwnedRole(player, eventId, roleId) {
  const rid = String(roleId);
  const st = player[eventId];
  if (!st.ownedRoles.includes(rid)) st.ownedRoles.push(rid);
}

function wardrobeEmbed(guild, eventCfg, player, eventId) {
  const st = player[eventId];
  const roles = st.ownedRoles.map((rid) => guild.roles.cache.get(rid)).filter(Boolean);
  const lines = roles.length ? roles.map((r) => `• <@&${r.id}>`).join("\n") : "_No saved roles yet._";

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🧥 Wardrobe — ${eventCfg.name}`)
    .setDescription(
      `Saved roles never disappear.\nSelect a role below to **equip/unequip** it.\n\n${lines}`
    );
}

function wardrobeComponents(guild, member, player, eventId) {
  const st = player[eventId];
  const roles = st.ownedRoles.map((rid) => guild.roles.cache.get(rid)).filter(Boolean);
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
    .setCustomId(`wardrobe_select:${eventId}`)
    .setPlaceholder("Choose a role to equip/unequip")
    .addOptions(options);

  return [new ActionRowBuilder().addComponents(menu)];
}

/* ===================== EMBEDS ===================== */
function bossSpawnEmbed(bossDef, eventCfg, channelName, joinedCount, fightersText) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_VASTO} ${bossDef.name} Appeared!`)
    .setDescription(
      `**Event:** ${eventCfg.name}\n` +
      `**Difficulty:** ${bossDef.difficulty}\n` +
      `⏳ **Join time:** ${Math.round(bossDef.joinMs / 60000)} minutes\n` +
      `Click **🗡 Join Battle** to participate.`
    )
    .addFields(
      { name: `${E_MEMBERS} Fighters`, value: fightersText, inline: false },
      { name: `${E_MEMBERS} Joined`, value: `\`${joinedCount}\``, inline: true },
      { name: `${eventCfg.currencyEmoji} Rewards`, value: `\`${bossDef.winReward} win • +${bossDef.hitReward}/success (banked)\``, inline: true },
      { name: `📌 Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(bossDef.spawnMedia || null)
    .setFooter({ text: `Boss • ${bossDef.rounds.length} rounds • 2 hits = out` });
}

function bossRoundEmbed(bossDef, eventCfg, roundIndex, aliveCount) {
  const r = bossDef.rounds[roundIndex];
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_VASTO} ${bossDef.name} — ${r.title}`)
    .setDescription(`**Event:** ${eventCfg.name}\n${r.intro}`)
    .addFields({ name: `${E_MEMBERS} Alive fighters`, value: `\`${aliveCount}\``, inline: true })
    .setImage(r.media || bossDef.spawnMedia || null)
    .setFooter({ text: `Round ${roundIndex + 1}/${bossDef.rounds.length}` });
}

function bossVictoryEmbed(bossDef, eventCfg, survivorsCount, dropsCfg) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`${E_VASTO} ${bossDef.name} Defeated!`)
    .setDescription(`✅ Rewards granted to survivors.`)
    .addFields(
      { name: `${E_MEMBERS} Survivors`, value: `\`${survivorsCount}\``, inline: true },
      { name: `🎭 Drops`, value: `\`${(dropsCfg.dropRoleChanceBase * 100).toFixed(1)}% role • ${(dropsCfg.dropRobuxChanceDisplay * 100).toFixed(1)}% 100 Robux\``, inline: true }
    )
    .setImage(bossDef.victoryMedia || null);
}

function bossDefeatEmbed(bossDef) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`${E_VASTO} Defeat`)
    .setDescription(`❌ Everyone lost. **${bossDef.name}** wins.`)
    .setImage(bossDef.defeatMedia || null);
}

function mobEmbed(eventCfg, mobCfg, joinedCount) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`👁️ ${mobCfg.name} Appeared!`)
    .setDescription(
      [
        `**Event:** ${eventCfg.name}`,
        `⏳ **Time:** ${Math.round(mobCfg.joinMs / 60000)} minutes`,
        `🎲 50/50 chance to hit`,
        `${eventCfg.currencyEmoji} Hit: **${mobCfg.hitReward}** • Miss: **${mobCfg.missReward}**`,
        `${E_VASTO} If defeated: hitters gain +${mobCfg.bonusPerKill}% boss bonus (max ${mobCfg.bonusMax}%).`,
      ].join("\n")
    )
    .addFields({ name: `${E_MEMBERS} Attackers`, value: `\`${joinedCount}\``, inline: true })
    .setImage(mobCfg.media || null);
}

function shopEmbed(eventCfg, player, eventId) {
  const st = player[eventId];
  const items = getShopItems(eventId);

  const lines = items.map((it) => {
    const owned = st.items[it.key] ? "✅ Owned" : `${eventCfg.currencyEmoji} ${it.price} ${eventCfg.currencyName}`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🛒 Shop — ${eventCfg.name}`)
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: `${eventCfg.currencyEmoji} Your ${eventCfg.currencyName}`, value: `\`${st.currency}\``, inline: true },
      { name: `${E_VASTO} Boss bonus`, value: `\`${st.survivalBonus}% / ${eventCfg.mob.bonusMax}%\``, inline: true },
      { name: `${E_DRAKO} Drako Coin`, value: `\`${player.drako}\``, inline: true }
    );
}

function inventoryEmbed(eventCfg, player, eventId) {
  const st = player[eventId];
  const itemBonus = calcItemSurvivalBonus(eventId, st.items);
  const mult = calcRewardMultiplier(eventId, st.items);

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🎒 Inventory — ${eventCfg.name}`)
    .setDescription(
      [
        `${eventCfg.currencyEmoji} ${eventCfg.currencyName}: **${st.currency}**`,
        `${E_DRAKO} Drako Coin: **${player.drako}**`,
        `${E_VASTO} Permanent boss bonus: **${st.survivalBonus}% / ${eventCfg.mob.bonusMax}%**`,
        `🛡 Item boss bonus: **${itemBonus}%**`,
        `🍀 Drop luck: **x${calcDropLuckMultiplier(eventId, st.items).toFixed(2)}**`,
        `💰 Reward multiplier: **x${mult}**`,
        "",
        `🧥 Wardrobe saved roles: **${st.ownedRoles.length}**`,
      ].join("\n")
    );
}

function leaderboardEmbed(eventCfg, entries) {
  const lines = entries.map((e, i) => `**#${i + 1}** — ${safeName(e.name)}: **${eventCfg.currencyEmoji} ${e.currency}**`);
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🏆 Leaderboard — ${eventCfg.name}`)
    .setDescription(lines.join("\n") || "No data yet.");
}

/* ===================== COMPONENTS ===================== */
const CID = {
  BOSS_JOIN: "boss_join",
  BOSS_RULES: "boss_rules",
  BOSS_ACTION: "boss_action", // boss_action:<eventId>:<bossId>:<roundIndex>:<token>
  MOB_ATTACK: "mob_attack",   // mob_attack:<eventId>
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

function mobButtons(eventId, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${CID.MOB_ATTACK}:${eventId}`).setLabel("Attack").setEmoji("⚔️").setStyle(ButtonStyle.Primary).setDisabled(disabled)
    ),
  ];
}

function shopButtons(eventId, player) {
  const eventCfg = getEventConfig(eventId);
  const st = player[eventId];
  const items = eventCfg.shop.items;

  // Discord max 5 buttons per row; we’ll do 2 rows
  const btns = items.map((it) =>
    new ButtonBuilder()
      .setCustomId(`buy:${eventId}:${it.key}`)
      .setLabel(`Buy ${it.name}`.slice(0, 80))
      .setStyle(it.type === "role" ? ButtonStyle.Danger : ButtonStyle.Secondary)
      .setDisabled(!!st.items[it.key])
  );

  const row1 = new ActionRowBuilder().addComponents(btns.slice(0, 3));
  const row2 = new ActionRowBuilder().addComponents(btns.slice(3, 5));
  return [row1, row2].filter((r) => r.components.length);
}

/* ===================== RUNTIME STATE ===================== */
const bossByChannel = new Map();   // channelId -> bossState
const mobByChannel = new Map();    // channelId -> mobState

/* ===================== CORE CALCS ===================== */
function computeSurviveChance(eventId, player, baseChance, bonusMax) {
  const st = player[eventId];
  const itemBonus = calcItemSurvivalBonus(eventId, st.items);
  const perm = clamp(st.survivalBonus, 0, bonusMax);
  return Math.min(0.95, baseChance + (itemBonus + perm) / 100);
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

async function updateBossSpawnMessage(channel, boss) {
  const fighters = [...boss.participants.values()];
  const fightersText = fighters.length
    ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000)
    : "`No fighters yet`";

  await editMessageSafe(channel, boss.messageId, {
    embeds: [bossSpawnEmbed(boss.def, boss.eventCfg, channel.name, fighters.length, fightersText)],
    components: bossButtons(!boss.joining),
  });
}

/* ===================== BOSS RUNNER ===================== */
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

      await channel.send({ embeds: [bossRoundEmbed(boss.def, boss.eventCfg, i, alive.length)] }).catch(() => {});

      // random rounds
      if (r.type === "pressure" || r.type === "attack") {
        for (const uid of alive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.eventId, player, boss.def.baseChance, boss.eventCfg.mob.bonusMax);
          const ok = Math.random() < chance;

          if (!ok) {
            await applyHit(uid, boss, channel, `failed to withstand **${boss.def.name}**!`);
          } else {
            const mult = calcRewardMultiplier(boss.eventId, player[boss.eventId].items);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);

            const nm = safeName(boss.participants.get(uid)?.displayName);
            await channel.send(`⚔️ **${nm}** counterattacked! (+${boss.eventCfg.currencyEmoji} ${add} banked)`).catch(() => {});
          }
          await sleep(300);
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Cooldown: **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

      // button rounds (defend/finisher)
      if (r.type === "defend" || r.type === "finisher") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = { token, roundIndex: i, pressed: new Set() };

        const customId = `${CID.BOSS_ACTION}:${boss.eventId}:${boss.def.id}:${i}:${token}`;

        const msg = await channel.send({
          content:
            r.type === "finisher"
              ? `⚠️ **FINISHER WINDOW: ${Math.round(r.windowMs / 1000)}s** — press **${r.buttonLabel}**!`
              : `🛡️ **DEFENSE WINDOW: ${Math.round(r.windowMs / 1000)}s** — press **${r.buttonLabel}**!`,
          components: actionButtonRow(customId, r.buttonLabel, r.buttonEmoji, false),
        }).catch(() => null);

        await sleep(r.windowMs);

        if (msg?.id) {
          await editMessageSafe(channel, msg.id, {
            components: actionButtonRow(customId, r.buttonLabel, r.buttonEmoji, true),
          });
        }

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const player = await getPlayer(uid);

          if (pressed.has(uid)) {
            const mult = calcRewardMultiplier(boss.eventId, player[boss.eventId].items);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);

            const nm = safeName(boss.participants.get(uid)?.displayName);
            await channel.send(`✅ **${nm}** succeeded! (+${boss.eventCfg.currencyEmoji} ${add} banked)`).catch(() => {});
          } else {
            await applyHit(uid, boss, channel, `was too slow!`);
          }
          await sleep(220);
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

    // payout only on victory
    const lines = [];
    for (const uid of survivors) {
      const player = await getPlayer(uid);
      const st = player[boss.eventId];

      const mult = calcRewardMultiplier(boss.eventId, st.items);
      const win = Math.floor(boss.def.winReward * mult);
      const hits = boss.hitBank.get(uid) || 0;

      st.currency += (win + hits);

      // drops (per-event config)
      const drops = boss.eventCfg.drops;
      const luckMult = calcDropLuckMultiplier(boss.eventId, st.items);

      const roleChance = Math.min(drops.dropRoleChanceCap, drops.dropRoleChanceBase * luckMult);
      if (drops.bossDropRoleId && Math.random() < roleChance) {
        ensureOwnedRole(player, boss.eventId, drops.bossDropRoleId);
        const res = await tryGiveRole(channel.guild, uid, drops.bossDropRoleId);
        lines.push(res.ok ? `🎭 <@${uid}> obtained a **drop role**!` : `⚠️ <@${uid}> won role but bot couldn't assign: ${res.reason} (saved to wardrobe)`);
      }

      const robuxChance = Math.min(drops.dropRobuxChanceCap, drops.dropRobuxChanceRealBase * luckMult);
      if (Math.random() < robuxChance) {
        lines.push(`🎁 <@${uid}> won **100 Robux** (${(drops.dropRobuxChanceDisplay * 100).toFixed(1)}%) — ${drops.robuxClaimText}`);
      }

      await setPlayer(uid, player);

      lines.unshift(`• <@${uid}> +${boss.eventCfg.currencyEmoji} ${win} (Win) +${boss.eventCfg.currencyEmoji} ${hits} (Success bank)`);
    }

    await channel.send({ embeds: [bossVictoryEmbed(boss.def, boss.eventCfg, survivors.length, boss.eventCfg.drops)] }).catch(() => {});
    await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
  } catch (e) {
    console.error("runBoss crashed:", e);
    await channel.send("⚠️ Boss event crashed. Please report to admin.").catch(() => {});
  } finally {
    bossByChannel.delete(channel.id);
  }
}

async function spawnBoss(channel, eventId, bossId, withPing = true) {
  if (bossByChannel.has(channel.id)) return;

  const def = BOSSES[bossId];
  if (!def || def.event !== eventId) return;

  const eventCfg = getEventConfig(eventId);

  if (withPing && eventCfg.pingBossRoleId) {
    await channel.send(`<@&${eventCfg.pingBossRoleId}>`).catch(() => {});
  }

  const boss = {
    eventId,
    eventCfg,
    def,
    messageId: null,
    joining: true,
    participants: new Map(),
    hitBank: new Map(),
    activeAction: null,
  };

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(def, eventCfg, channel.name, 0, "`No fighters yet`")],
    components: bossButtons(false),
  });

  boss.messageId = msg.id;
  bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    const still = bossByChannel.get(channel.id);
    if (still && still.messageId === boss.messageId) runBoss(channel, still).catch(() => {});
  }, def.joinMs);
}

/* ===================== MOB RUNNER ===================== */
async function spawnMob(channel, eventId, withPing = true) {
  if (mobByChannel.has(channel.id)) return;

  const eventCfg = getEventConfig(eventId);
  const mobCfg = eventCfg.mob;

  if (withPing && eventCfg.pingMobRoleId) {
    await channel.send(`<@&${eventCfg.pingMobRoleId}>`).catch(() => {});
  }

  const mob = { eventId, messageId: null, attackers: new Map(), resolved: false };

  const msg = await channel.send({
    embeds: [mobEmbed(eventCfg, mobCfg, 0)],
    components: mobButtons(eventId, false),
  });

  mob.messageId = msg.id;
  mobByChannel.set(channel.id, mob);

  setTimeout(async () => {
    const still = mobByChannel.get(channel.id);
    if (!still || still.resolved) return;
    still.resolved = true;

    let anyHit = false;
    const lines = [];

    for (const [uid, info] of still.attackers.entries()) {
      const hit = Math.random() < 0.5;
      const player = await getPlayer(uid);
      const st = player[eventId];

      const name = safeName(info.displayName);

      if (hit) {
        anyHit = true;
        st.currency += mobCfg.hitReward;
        st.survivalBonus = Math.min(mobCfg.bonusMax, st.survivalBonus + mobCfg.bonusPerKill);
        lines.push(`⚔️ **${name}** hit! +${eventCfg.currencyEmoji} ${mobCfg.hitReward} • bonus +${mobCfg.bonusPerKill}%`);
      } else {
        st.currency += mobCfg.missReward;
        lines.push(`💨 **${name}** missed. +${eventCfg.currencyEmoji} ${mobCfg.missReward}`);
      }

      await setPlayer(uid, player);
    }

    await editMessageSafe(channel, still.messageId, { components: mobButtons(eventId, true) });

    if (!still.attackers.size) {
      await channel.send(`💨 The ${mobCfg.name} disappeared… nobody attacked.`).catch(() => {});
    } else {
      await channel.send(anyHit ? `🕳️ **${mobCfg.name} defeated!**` : `🕳️ The ${mobCfg.name} escaped…`).catch(() => {});
      await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
    }

    mobByChannel.delete(channel.id);
  }, mobCfg.joinMs);
}

/* ===================== SHOP UI ===================== */
async function handleShopBuy(interaction, eventId, key) {
  const eventCfg = getEventConfig(eventId);
  const items = eventCfg.shop.items;

  const item = items.find((x) => x.key === key);
  if (!item) {
    await interaction.followUp({ content: "❌ Unknown item.", ephemeral: true }).catch(() => {});
    return;
  }

  const player = await getPlayer(interaction.user.id);
  const st = player[eventId];

  if (st.items[key]) {
    await interaction.followUp({ content: "✅ You already own this item.", ephemeral: true }).catch(() => {});
    return;
  }

  if (st.currency < item.price) {
    await interaction.followUp({ content: `❌ Not enough ${eventCfg.currencyName}. Need ${eventCfg.currencyEmoji} ${item.price}.`, ephemeral: true }).catch(() => {});
    return;
  }

  st.currency -= item.price;
  st.items[key] = true;

  // role items -> save to wardrobe forever
  if (item.type === "role" && item.roleId) {
    ensureOwnedRole(player, eventId, item.roleId);
  }

  await setPlayer(interaction.user.id, player);

  if (item.type === "role" && item.roleId) {
    const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
    if (!res.ok) {
      await interaction.followUp({ content: `⚠️ Bought role, but bot couldn't assign it: ${res.reason} (saved to wardrobe)`, ephemeral: true }).catch(() => {});
    }
  }

  const msgId = interaction.message?.id;
  if (msgId) {
    await editMessageSafe(interaction.channel, msgId, {
      embeds: [shopEmbed(eventCfg, player, eventId)],
      components: shopButtons(eventId, player),
    });
  }

  await interaction.followUp({ content: "✅ Purchased!", ephemeral: true }).catch(() => {});
}

/* ===================== CLIENT ===================== */
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await initRedis();

  const bleachCh = await client.channels.fetch(BLEACH_CHANNEL_ID).catch(() => null);
  const jjkCh = await client.channels.fetch(JJK_CHANNEL_ID).catch(() => null);

  if (!bleachCh?.isTextBased()) console.log("❌ BLEACH channel not accessible.");
  if (!jjkCh?.isTextBased()) console.log("❌ JJK channel not accessible.");

  if (bleachCh?.isTextBased()) {
    setInterval(() => spawnMob(bleachCh, "bleach", true).catch(() => {}), BLEACH.autoMobEveryMs);
    setInterval(() => spawnBoss(bleachCh, "bleach", "vasto", true).catch(() => {}), BLEACH.autoBossEveryMs);
    console.log("⏰ Auto-spawn BLEACH enabled", { channel: BLEACH_CHANNEL_ID });
  }

  if (jjkCh?.isTextBased()) {
    setInterval(() => spawnMob(jjkCh, "jjk", true).catch(() => {}), JJK.autoMobEveryMs);
    setInterval(() => spawnBoss(jjkCh, "jjk", "special_grade", true).catch(() => {}), JJK.autoBossEveryMs);
    console.log("⏰ Auto-spawn JJK enabled", { channel: JJK_CHANNEL_ID });
  }
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

      // /reatsu
      if (interaction.commandName === "reatsu") {
        const target = interaction.options.getUser("user") || interaction.user;
        const p = await getPlayer(target.id);
        return interaction.reply({
          content: `${E_REIATSU} **${safeName(target.username)}** has **${p.bleach.currency} Reiatsu**.\n${E_DRAKO} Drako Coin: **${p.drako}**`,
          ephemeral: false,
        });
      }

      // /cursedenergy
      if (interaction.commandName === "cursedenergy") {
        const target = interaction.options.getUser("user") || interaction.user;
        const p = await getPlayer(target.id);
        return interaction.reply({
          content: `${E_CE} **${safeName(target.username)}** has **${p.jjk.currency} Cursed Energy**.\n${E_DRAKO} Drako Coin: **${p.drako}**`,
          ephemeral: false,
        });
      }

      // /inventory event
      if (interaction.commandName === "inventory") {
        const eventId = interaction.options.getString("event", true);
        const eventCfg = getEventConfig(eventId);
        const p = await getPlayer(interaction.user.id);
        return interaction.reply({ embeds: [inventoryEmbed(eventCfg, p, eventId)], ephemeral: true });
      }

      // /shop event
      if (interaction.commandName === "shop") {
        const eventId = interaction.options.getString("event", true);
        const eventCfg = getEventConfig(eventId);
        const p = await getPlayer(interaction.user.id);
        return interaction.reply({
          embeds: [shopEmbed(eventCfg, p, eventId)],
          components: shopButtons(eventId, p),
          ephemeral: true,
        });
      }

      // /wardrobe event
      if (interaction.commandName === "wardrobe") {
        const eventId = interaction.options.getString("event", true);
        const eventCfg = getEventConfig(eventId);

        const p = await getPlayer(interaction.user.id);
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "❌ Can't read your member data.", ephemeral: true });

        return interaction.reply({
          embeds: [wardrobeEmbed(interaction.guild, eventCfg, p, eventId)],
          components: wardrobeComponents(interaction.guild, member, p, eventId),
          ephemeral: true,
        });
      }

      // /leaderboard
      if (interaction.commandName === "leaderboard") {
        const eventId = interaction.options.getString("event", true);
        const eventCfg = getEventConfig(eventId);

        const rows = await getTopPlayers(eventId, 10);
        const entries = [];
        for (const r of rows) {
          let name = r.userId;
          try {
            const m = await interaction.guild.members.fetch(r.userId);
            name = safeName(m?.displayName || m?.user?.username || r.userId);
          } catch {}
          entries.push({ name, currency: r.currency });
        }

        return interaction.reply({ embeds: [leaderboardEmbed(eventCfg, entries)], ephemeral: false });
      }

      // /give_currency
      if (interaction.commandName === "give_currency") {
        const eventId = interaction.options.getString("event", true);
        const eventCfg = getEventConfig(eventId);

        const target = interaction.options.getUser("user", true);
        const amount = interaction.options.getInteger("amount", true);

        if (amount < 50) return interaction.reply({ content: "❌ Minimum transfer is 50.", ephemeral: true });
        if (target.bot) return interaction.reply({ content: "❌ You can't transfer to a bot.", ephemeral: true });
        if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't transfer to yourself.", ephemeral: true });

        const senderP = await getPlayer(interaction.user.id);
        const receiverP = await getPlayer(target.id);

        const s = senderP[eventId];
        const r = receiverP[eventId];

        if (s.currency < amount) {
          return interaction.reply({
            content: `❌ Not enough ${eventCfg.currencyName}. You have ${eventCfg.currencyEmoji} ${s.currency}.`,
            ephemeral: true,
          });
        }

        s.currency -= amount;
        r.currency += amount;

        await setPlayer(interaction.user.id, senderP);
        await setPlayer(target.id, receiverP);

        return interaction.reply({
          content: `${eventCfg.currencyEmoji} **${safeName(interaction.user.username)}** sent **${amount} ${eventCfg.currencyName}** to **${safeName(target.username)}**.`,
          ephemeral: false,
        });
      }

      // /dailyclaim
      if (interaction.commandName === "dailyclaim") {
        const eventId = interaction.options.getString("event", true);
        const eventCfg = getEventConfig(eventId);

        const p = await getPlayer(interaction.user.id);
        const st = p[eventId];
        const now = Date.now();

        if (now - st.lastDaily < DAILY_COOLDOWN_MS) {
          const hrs = Math.ceil((DAILY_COOLDOWN_MS - (now - st.lastDaily)) / 3600000);
          return interaction.reply({ content: `⏳ Come back in **${hrs}h**.`, ephemeral: true });
        }

        const amount = hasBoosterRole(interaction.member) ? eventCfg.daily.booster : eventCfg.daily.normal;
        st.currency += amount;
        st.lastDaily = now;

        await setPlayer(interaction.user.id, p);

        return interaction.reply({ content: `🎁 You claimed **${eventCfg.currencyEmoji} ${amount} ${eventCfg.currencyName}**!`, ephemeral: false });
      }

      // /spawnboss
      if (interaction.commandName === "spawnboss") {
        if (!hasEventRole(interaction.member)) {
          return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
        }

        const eventId = interaction.options.getString("event", true);
        const bossId = interaction.options.getString("boss", true);

        const def = BOSSES[bossId];
        if (!def || def.event !== eventId) {
          return interaction.reply({ content: "❌ This boss doesn't belong to that event.", ephemeral: true });
        }

        // channel routing enforcement
        if (eventId === "bleach" && channel.id !== BLEACH_CHANNEL_ID) {
          return interaction.reply({ content: `❌ Bleach can only run in <#${BLEACH_CHANNEL_ID}>.`, ephemeral: true });
        }
        if (eventId === "jjk" && channel.id !== JJK_CHANNEL_ID) {
          return interaction.reply({ content: `❌ JJK can only run in <#${JJK_CHANNEL_ID}>.`, ephemeral: true });
        }

        await interaction.reply({ content: `✅ Spawned **${def.name}**.`, ephemeral: true });
        await spawnBoss(channel, eventId, bossId, true);
        return;
      }

      // /spawnmob
      if (interaction.commandName === "spawnmob") {
        if (!hasEventRole(interaction.member)) {
          return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
        }
        const eventId = interaction.options.getString("event", true);

        if (eventId === "bleach" && channel.id !== BLEACH_CHANNEL_ID) {
          return interaction.reply({ content: `❌ Bleach mobs can only run in <#${BLEACH_CHANNEL_ID}>.`, ephemeral: true });
        }
        if (eventId === "jjk" && channel.id !== JJK_CHANNEL_ID) {
          return interaction.reply({ content: `❌ JJK mobs can only run in <#${JJK_CHANNEL_ID}>.`, ephemeral: true });
        }

        await interaction.reply({ content: `✅ Spawned mob for **${getEventConfig(eventId).name}**.`, ephemeral: true });
        await spawnMob(channel, eventId, true);
        return;
      }

      // /exchange_drako
      if (interaction.commandName === "exchange_drako") {
        const eventId = interaction.options.getString("event", true);
        const drakoWanted = interaction.options.getInteger("drako", true);

        const eventCfg = getEventConfig(eventId);
        const cost = drakoWanted * eventCfg.exchangeRate;

        const p = await getPlayer(interaction.user.id);
        const st = p[eventId];

        if (st.currency < cost) {
          return interaction.reply({
            content:
              `❌ Not enough ${eventCfg.currencyName}. Need ${eventCfg.currencyEmoji} **${cost}** for ${E_DRAKO} **${drakoWanted} Drako**.\n` +
              `You have: ${eventCfg.currencyEmoji} **${st.currency}**`,
            ephemeral: true,
          });
        }

        st.currency -= cost;
        p.drako += drakoWanted;

        await setPlayer(interaction.user.id, p);

        return interaction.reply({
          content:
            `✅ Exchanged ${eventCfg.currencyEmoji} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako Coin**.\n` +
            `Now: ${eventCfg.currencyEmoji} **${st.currency}** • ${E_DRAKO} **${p.drako}**\n` +
            `⚠️ Drako Coin cannot be exchanged back.`,
          ephemeral: false,
        });
      }
    }

    /* ---------- SELECT MENU (WARDROBE) ---------- */
    if (interaction.isStringSelectMenu()) {
      const [prefix, eventId] = interaction.customId.split(":");
      if (prefix !== "wardrobe_select") return;

      const roleId = interaction.values?.[0];
      if (!roleId) return;

      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) return interaction.reply({ content: "❌ Can't read your member data.", ephemeral: true });

      const eventCfg = getEventConfig(eventId);
      const p = await getPlayer(interaction.user.id);
      const st = p[eventId];

      if (!st.ownedRoles.includes(String(roleId))) {
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

      // refresh UI
      const refreshedMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => member);
      return interaction.update({
        embeds: [wardrobeEmbed(interaction.guild, eventCfg, p, eventId)],
        components: wardrobeComponents(interaction.guild, refreshedMember, p, eventId),
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

        // enforce correct channel per event
        if (boss.eventId === "bleach" && channel.id !== BLEACH_CHANNEL_ID) {
          await interaction.followUp({ content: `❌ Bleach can only run in <#${BLEACH_CHANNEL_ID}>.`, ephemeral: true }).catch(() => {});
          return;
        }
        if (boss.eventId === "jjk" && channel.id !== JJK_CHANNEL_ID) {
          await interaction.followUp({ content: `❌ JJK can only run in <#${JJK_CHANNEL_ID}>.`, ephemeral: true }).catch(() => {});
          return;
        }

        if (boss.participants.has(uid)) {
          await interaction.followUp({ content: "⚠️ You already joined.", ephemeral: true }).catch(() => {});
          return;
        }

        boss.participants.set(uid, { hits: 0, displayName: interaction.member?.displayName || interaction.user.username });
        await updateBossSpawnMessage(channel, boss);
        await interaction.followUp({ content: "✅ Joined the boss fight.", ephemeral: true }).catch(() => {});
        return;
      }

      // Boss rules
      if (cid === CID.BOSS_RULES) {
        const boss = bossByChannel.get(channel.id);
        if (!boss) {
          await interaction.followUp({ content: "❌ No active boss here.", ephemeral: true }).catch(() => {});
          return;
        }
        const def = boss.def;
        const eventCfg = boss.eventCfg;

        const txt =
          `**${def.name}** • Event: **${eventCfg.name}** • Difficulty: **${def.difficulty}** • Rounds: **${def.rounds.length}**\n` +
          `Win: **${eventCfg.currencyEmoji} ${def.winReward}**\n` +
          `Success per round: **+${eventCfg.currencyEmoji} ${def.hitReward}** (banked, paid only on victory)\n` +
          `2 hits = eliminated`;

        await interaction.followUp({ content: txt, ephemeral: true }).catch(() => {});
        return;
      }

      // Boss action: boss_action:<eventId>:<bossId>:<roundIndex>:<token>
      if (cid.startsWith(`${CID.BOSS_ACTION}:`)) {
        const parts = cid.split(":");
        const eventId = parts[1];
        const bossId = parts[2];
        const roundIndex = Number(parts[3]);
        const token = parts[4];

        const boss = bossByChannel.get(channel.id);
        if (!boss || boss.eventId !== eventId || boss.def.id !== bossId) {
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

      // Mob attack: mob_attack:<eventId>
      if (cid.startsWith(`${CID.MOB_ATTACK}:`)) {
        const eventId = cid.split(":")[1];
        const mob = mobByChannel.get(channel.id);

        if (!mob || mob.resolved || mob.eventId !== eventId) {
          await interaction.followUp({ content: "❌ No active mob event.", ephemeral: true }).catch(() => {});
          return;
        }

        // enforce channel per event
        if (eventId === "bleach" && channel.id !== BLEACH_CHANNEL_ID) {
          await interaction.followUp({ content: `❌ Bleach mobs only in <#${BLEACH_CHANNEL_ID}>.`, ephemeral: true }).catch(() => {});
          return;
        }
        if (eventId === "jjk" && channel.id !== JJK_CHANNEL_ID) {
          await interaction.followUp({ content: `❌ JJK mobs only in <#${JJK_CHANNEL_ID}>.`, ephemeral: true }).catch(() => {});
          return;
        }

        const uid = interaction.user.id;
        if (mob.attackers.has(uid)) {
          await interaction.followUp({ content: "⚠️ You already attacked.", ephemeral: true }).catch(() => {});
          return;
        }

        mob.attackers.set(uid, { displayName: interaction.member?.displayName || interaction.user.username });

        const eventCfg = getEventConfig(eventId);
        await editMessageSafe(channel, mob.messageId, {
          embeds: [mobEmbed(eventCfg, eventCfg.mob, mob.attackers.size)],
          components: mobButtons(eventId, false),
        });

        await interaction.followUp({ content: "⚔️ Attack registered!", ephemeral: true }).catch(() => {});
        return;
      }

      // Shop buy: buy:<eventId>:<key>
      if (cid.startsWith("buy:")) {
        const parts = cid.split(":");
        const eventId = parts[1];
        const key = parts[2];

        await handleShopBuy(interaction, eventId, key);
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
