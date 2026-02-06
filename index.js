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

// Visual / theme
const COLOR = 0x7b2cff;

// Boss
const BOSS_NAME = "Vasto Lorde";
const BOSS_JOIN_MS = 2 * 60 * 1000; // ✅ 2 minutes join time
const BOSS_ROUNDS = 4;
const ROUND_COOLDOWN_MS = 10 * 1000;
const BASE_SURVIVE_CHANCE = 0.30;
const BOSS_REIATSU_REWARD = 200;

// ✅ New: bonus Reiatsu for each successful round (survive = "hit")
const BOSS_SURVIVE_HIT_REIATSU = 10;

// Hollow mini-event
const HOLLOW_EVENT_MS = 2 * 60 * 1000; // ✅ 2 minutes to join/attack
const HOLLOW_HIT_REIATSU = 25;
const HOLLOW_MISS_REIATSU = 10;
const BONUS_PER_HOLLOW_KILL = 1; // +1% only for hitters
const BONUS_MAX = 30;

// Drops
const BOSS_DROP_ROLE_ID = "1467426528584405103";
const DROP_ROLE_CHANCE_BASE = 0.05;

// Robux: real vs display (as requested)
const DROP_ROBUX_CHANCE_REAL_BASE = 0.005; // 0.5% actual
const DROP_ROBUX_CHANCE_DISPLAY = 0.025;   // 2.5% shown
const ROBUX_CLAIM_TEXT = "To claim: contact **daez063**.";

// Caps to keep balance
const DROP_ROLE_CHANCE_CAP = 0.12;   // 12% max
const DROP_ROBUX_CHANCE_CAP = 0.01;  // 1% max

// Shop cosmetic role
const SHOP_COSMETIC_ROLE_ID = "1467438527200497768";

// PvP
const CLASH_RESPONSE_MS = 20 * 1000;
const CLASH_COOLDOWN_MS = 5 * 60 * 1000; // ✅ 5 minutes cooldown

// Daily claim
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_NORMAL = 100;
const DAILY_BOOSTER = 200;

/* ===================== MEDIA ===================== */
const BOSS_SPAWN_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467277181955604572/Your_paragraph_text_4.gif?ex=6980749c&is=697f231c&hm=d06365f2194faceee52207192f81db418aa5a485aaa498f154553dc5e62f6d79&=";

const STATE_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1467276870784520326/Your_paragraph_text_3.gif?ex=69807452&is=697f22d2&hm=893ba1888e2ea579e71f442f158cfc25e06ed5371b59c978dd1afae3f61d480f&=";
const STATE_R2 = STATE_R1;
const STATE_R3 =
  "https://media.discordapp.net/attachments/1405973335979851877/1467276903160483995/Your_paragraph_text_1.gif?ex=6980745a&is=697f22da&hm=52decaeaf342973a4930a1d7a0f09ac5fb38358650e5607c40e9c821d7596a88&=";
const STATE_R4 =
  "https://media.discordapp.net/attachments/1405973335979851877/1467276984257220795/Your_paragraph_text_6.gif?ex=6980746d&is=697f22ed&hm=2a22d2df088318c7bfb1ddcb1601caea0ea248a19e6db909f741895b769ce7bb&=";

const BOSS_VICTORY_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467278760901345313/Your_paragraph_text_7.gif?ex=69807615&is=697f2495&hm=b6f4546141fb8a52e480992b5c029cd1c675072df0e71b1f3ed50ebee65b01eb&=";

const BOSS_DEFEAT_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467276974589218941/Your_paragraph_text_5.gif?ex=6980746b&is=697f22eb&hm=4f8a5f7867d5366e2a473a6d84a13e051544ebc5c56bee5dc34a4ae727c00f20&=";

const HOLLOW_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467508068303638540/Your_paragraph_text_10.gif?ex=6980a2e4&is=697f5164&hm=451cc0ec6edd18799593cf138549ddb86934217f6bee1e6364814d23153ead78&=";

const CLASH_START_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1467446034660720742/Your_paragraph_text_8.gif?ex=6980691e&is=697f179e&hm=5e217368be1ac6a1da725734faceaf93b98b781a69010e7802e7e41346e321b8&=";

const CLASH_VICTORY_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1467446050116862113/Your_paragraph_text_9.gif?ex=69806922&is=697f17a2&hm=568709eed12dec446ea88e589be0d97e4db67cac24e1a51b1b7ff91e92882e2e&=";

/* ===================== REDIS (Railway) ===================== */
/**
 * Railway Redis обычно даёт переменную REDIS_URL автоматически.
 * Мы храним игроков в hash:
 * key = bleach:players
 * field = userId
 * value = JSON.stringify(player)
 */
const REDIS_PLAYERS_KEY = "bleach:players";

let redis;
async function getRedis() {
  if (redis) return redis;

  if (!process.env.REDIS_URL) {
    throw new Error("Missing REDIS_URL. Add Railway Redis and set REDIS_URL variable.");
  }

  redis = createClient({ url: process.env.REDIS_URL });
  redis.on("error", (err) => console.error("Redis error:", err));

  await redis.connect();
  console.log("✅ Redis connected");
  return redis;
}

function normalizePlayer(raw = {}) {
  const reiatsu = Number.isFinite(raw.reiatsu)
    ? raw.reiatsu
    : (Number.isFinite(raw.reatsu) ? raw.reatsu : 0);

  const items = raw.items && typeof raw.items === "object" ? raw.items : {};
  return {
    reiatsu,
    survivalBonus: Number.isFinite(raw.survivalBonus) ? raw.survivalBonus : 0,
    lastDaily: Number.isFinite(raw.lastDaily) ? raw.lastDaily : 0,
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
  const r = await getRedis();
  const raw = await r.hGet(REDIS_PLAYERS_KEY, userId);

  if (!raw) {
    const fresh = normalizePlayer({});
    await r.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(fresh));
    return fresh;
  }

  try {
    return normalizePlayer(JSON.parse(raw));
  } catch {
    const fresh = normalizePlayer({});
    await r.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(fresh));
    return fresh;
  }
}

async function setPlayer(userId, playerObj) {
  const r = await getRedis();
  const normalized = normalizePlayer(playerObj);
  await r.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(normalized));
  return normalized;
}

async function getTopPlayers(limit = 10) {
  const r = await getRedis();
  const all = await r.hGetAll(REDIS_PLAYERS_KEY); // { userId: json }
  const rows = Object.entries(all).map(([userId, json]) => {
    let p = {};
    try { p = normalizePlayer(JSON.parse(json)); } catch {}
    return { userId, reiatsu: p.reiatsu || 0 };
  });

  rows.sort((a, b) => b.reiatsu - a.reiatsu);
  return rows.slice(0, limit);
}

/* ===================== SHOP (balanced: defense + drop luck) ===================== */
const SHOP_ITEMS = [
  { key: "zanpakuto_basic", name: "Zanpakutō (basic)", price: 350, desc: `+4% survive vs ${BOSS_NAME} • +5% drop luck` },
  { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: `+7% survive vs ${BOSS_NAME} • +10% drop luck` },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: `+9% survive vs ${BOSS_NAME} • +6% drop luck` },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: `${E_REIATSU} +25% Reiatsu rewards • +2% survive vs ${BOSS_NAME}` },
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
  return mult; // max 1.21
}

/* ===================== HELPERS ===================== */
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
}
function hasBoosterRole(member) { return !!member?.roles?.cache?.has(BOOSTER_ROLE_ID); }

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

/* ===================== EMBEDS ===================== */
function bossSpawnEmbed(channelName, joinedCount, fightersText) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_VASTO} ${BOSS_NAME} Appeared!`)
    .setDescription(`${E_VASTO} Click **🗡 Join Battle**.\n⏳ **Join time: 2 minutes**`)
    .addFields(
      { name: `${E_MEMBERS} Fighters`, value: fightersText, inline: false },
      { name: `${E_MEMBERS} Joined`, value: `\`${joinedCount}\``, inline: true },
      { name: `${E_REIATSU} Rewards`, value: `\`${BOSS_REIATSU_REWARD} + round hits\``, inline: true },
      { name: `📌 Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(BOSS_SPAWN_MEDIA)
    .setFooter({ text: `Boss • ${BOSS_ROUNDS} rounds • Cooldown 10s` });
}

function bossStateEmbed(round, aliveCount) {
  const media = round === 1 ? STATE_R1 : round === 2 ? STATE_R2 : round === 3 ? STATE_R3 : STATE_R4;
  const title =
    round === 1 ? `${E_VASTO} ${BOSS_NAME} is enraged` :
    round === 2 ? `${E_VASTO} ${BOSS_NAME} keeps pushing` :
    round === 3 ? `${E_VASTO} ${BOSS_NAME} took serious damage` :
                  `${E_VASTO} ${BOSS_NAME} is almost defeated`;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(title)
    .addFields({ name: `${E_MEMBERS} Alive fighters`, value: `\`${aliveCount}\``, inline: true })
    .setImage(media)
    .setFooter({ text: `State after Round ${round}/${BOSS_ROUNDS}` });
}

function bossVictoryEmbed(survivorsCount) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`${E_VASTO} ${BOSS_NAME} Defeated!`)
    .setDescription(`✅ Rewards granted to survivors.`)
    .addFields(
      { name: `${E_MEMBERS} Survivors`, value: `\`${survivorsCount}\``, inline: true },
      { name: `🎭 Drops`, value: `\`5% role • ${(DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}% 100 Robux\``, inline: true }
    )
    .setImage(BOSS_VICTORY_MEDIA);
}

function bossDefeatEmbed() {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`${E_VASTO} Defeat`)
    .setDescription(`❌ Everyone lost. ${BOSS_NAME} wins.`)
    .setImage(BOSS_DEFEAT_MEDIA);
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
      { name: `${E_VASTO} Boss bonus`, value: `\`${player.survivalBonus}% / ${BONUS_MAX}%\``, inline: true }
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
      ].join("\n")
    );
}

function leaderboardEmbed(entries) {
  const lines = entries.map((e, i) => `**#${i + 1}** — ${safeName(e.name)}: **${E_REIATSU} ${e.reiatsu}**`);
  return new EmbedBuilder().setColor(COLOR).setTitle("🏆 Reiatsu Leaderboard").setDescription(lines.join("\n") || "No data yet.");
}

function clashInviteEmbed(chName, tName, stake) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("⚡ Reiatsu Clash")
    .setDescription(`${E_REIATSU} **${chName}** vs **${tName}**\nStake: **${E_REIATSU} ${stake}**\n🎲 50/50`)
    .setImage(CLASH_START_GIF);
}

function clashWinEmbed(wName, lName, stake) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🏆 Reiatsu Overwhelmed")
    .setDescription(`**${wName}** defeated **${lName}**\n+${E_REIATSU} ${stake}`)
    .setImage(CLASH_VICTORY_GIF);
}

/* ===================== COMPONENTS + ALIASES ===================== */
const CID = {
  BOSS_JOIN: ["boss_join", "vasto_join", "hollow_join"],
  BOSS_RULES: ["boss_rules", "vasto_rules", "hollow_rules"],
  HOLLOW_ATTACK: ["hollow_attack", "hollow_join", "hollow_attack_btn"],
};

function bossButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("boss_join").setLabel("Join Battle").setEmoji("🗡").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId("boss_rules").setLabel("Rules").setEmoji("📜").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
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

function clashButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("clash_accept").setLabel("Accept Clash").setEmoji("⚡").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId("clash_decline").setLabel("Decline").setEmoji("❌").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
  ];
}

/* ===================== RUNTIME STATE ===================== */
const bossByChannel = new Map();
const hollowByChannel = new Map();
const clashByChannel = new Map();
const lastClashByUser = new Map();

/* ===================== EVENT LOGIC ===================== */
function computeBossSurviveChance(player) {
  const itemBonus = calcItemSurvivalBonus(player.items);
  const perm = clamp(player.survivalBonus, 0, BONUS_MAX);
  return Math.min(0.95, BASE_SURVIVE_CHANCE + (itemBonus + perm) / 100);
}

async function updateBossSpawnMessage(channel, boss) {
  const fighters = [...boss.participants.values()];
  const fightersText = fighters.length
    ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000)
    : "`No fighters yet`";

  await editMessageSafe(channel, boss.messageId, {
    embeds: [bossSpawnEmbed(channel.name, fighters.length, fightersText)],
    components: bossButtons(!boss.joining),
  });
}

async function runBoss(channel, boss) {
  const roundBonusMap = new Map();

  try {
    boss.joining = false;
    await updateBossSpawnMessage(channel, boss);

    let alive = [...boss.participants.keys()];
    if (!alive.length) {
      await channel.send(`${E_VASTO} No one joined. ${BOSS_NAME} vanished.`).catch(() => {});
      return;
    }

    for (let round = 1; round <= BOSS_ROUNDS; round++) {
      if (!alive.length) break;

      await channel.send(`${E_VASTO} **Round ${round}/${BOSS_ROUNDS}** begins!`).catch(() => {});
      const nextAlive = [];

      for (const uid of alive) {
        const state = boss.participants.get(uid);
        const player = await getPlayer(uid);
        const survived = Math.random() < computeBossSurviveChance(player);
        const name = safeName(state.displayName);

        if (!survived) {
          state.hits++;
          await channel.send(`💥 **${name}** was hit by ${BOSS_NAME}! (${state.hits}/2)`).catch(() => {});
          if (state.hits < 2) nextAlive.push(uid);
          else await channel.send(`☠️ **${name}** was eliminated.`).catch(() => {});
        } else {
          const mult = calcReiatsuMultiplier(player.items);
          const bonus = Math.floor(BOSS_SURVIVE_HIT_REIATSU * mult);
          player.reiatsu += bonus;
          roundBonusMap.set(uid, (roundBonusMap.get(uid) || 0) + bonus);

          await channel.send(`⚔️ **${name}** resisted and dealt damage!`).catch(() => {});
          nextAlive.push(uid);
        }

        await setPlayer(uid, player);
        await sleep(600);
      }

      alive = nextAlive;

      if (alive.length) {
        await channel.send({ embeds: [bossStateEmbed(round, alive.length)] }).catch(() => {});
        if (round < BOSS_ROUNDS) {
          await channel.send(`⏳ Cooldown: **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
      }
    }

    if (!alive.length) {
      await channel.send({ embeds: [bossDefeatEmbed()] }).catch(() => {});
      return;
    }

    // Rewards + drops
    const lines = [];

    for (const uid of alive) {
      const player = await getPlayer(uid);
      const mult = calcReiatsuMultiplier(player.items);
      const baseReward = Math.floor(BOSS_REIATSU_REWARD * mult);
      player.reiatsu += baseReward;

      const roundBonus = roundBonusMap.get(uid) || 0;
      lines.push(`• <@${uid}> +${E_REIATSU} ${baseReward} (Round hits: +${E_REIATSU} ${roundBonus})`);

      const luckMult = calcDropLuckMultiplier(player.items);

      const roleChance = Math.min(DROP_ROLE_CHANCE_CAP, DROP_ROLE_CHANCE_BASE * luckMult);
      if (Math.random() < roleChance) {
        const res = await tryGiveRole(channel.guild, uid, BOSS_DROP_ROLE_ID);
        lines.push(res.ok ? `🎭 <@${uid}> obtained **Vasto Lorde role**!`
                          : `⚠️ <@${uid}> won role but bot couldn't assign: ${res.reason}`);
      }

      const robuxChance = Math.min(DROP_ROBUX_CHANCE_CAP, DROP_ROBUX_CHANCE_REAL_BASE * luckMult);
      if (Math.random() < robuxChance) {
        lines.push(`🎁 <@${uid}> won **100 Robux** (${(DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}%) — ${ROBUX_CLAIM_TEXT}`);
      }

      await setPlayer(uid, player);
    }

    await channel.send({ embeds: [bossVictoryEmbed(alive.length)] }).catch(() => {});
    await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
  } catch (e) {
    console.error("runBoss crashed:", e);
    await channel.send("⚠️ Boss event crashed. Please report to admin.").catch(() => {});
  } finally {
    bossByChannel.delete(channel.id);
  }
}

async function spawnBoss(channel, withPing = true) {
  if (bossByChannel.has(channel.id)) return;

  if (withPing) await channel.send(`<@&${PING_BOSS_ROLE_ID}>`).catch(() => {});
  const boss = { messageId: null, joining: true, participants: new Map() };

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(channel.name, 0, "`No fighters yet`")],
    components: bossButtons(false),
  });

  boss.messageId = msg.id;
  bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    const still = bossByChannel.get(channel.id);
    if (still && still.messageId === boss.messageId) runBoss(channel, still).catch(() => {});
  }, BOSS_JOIN_MS);
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

  // Connect redis on boot (fail fast)
  try {
    await getRedis();
  } catch (e) {
    console.error("❌ Redis not ready:", e?.message || e);
  }

  const autoChannel = await client.channels.fetch(AUTO_EVENT_CHANNEL_ID).catch(() => null);
  if (!autoChannel || !autoChannel.isTextBased()) {
    console.log("❌ Auto channel not accessible.");
    return;
  }

  setInterval(() => spawnHollow(autoChannel, true).catch(() => {}), AUTO_HOLLOW_EVERY_MS);
  setInterval(() => spawnBoss(autoChannel, true).catch(() => {}), AUTO_BOSS_EVERY_MS);

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

      if (interaction.commandName === "spawn_hollow") {
        if (!hasEventRole(interaction.member)) {
          return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
        }
        await interaction.reply({ content: `✅ ${E_VASTO} Boss spawned.`, ephemeral: true });
        await spawnBoss(channel, true);
        return;
      }

      if (interaction.commandName === "spawn_hollowling") {
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
        return interaction.reply({ content: `${E_REIATSU} **${safeName(target.username)}** has **${p.reiatsu} Reiatsu**.`, ephemeral: false });
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

      if (interaction.commandName === "give_reatsu") {
        const target = interaction.options.getUser("user", true);
        const amount = interaction.options.getInteger("amount", true);

        if (amount < 50) return interaction.reply({ content: `❌ Minimum transfer is ${E_REIATSU} 50.`, ephemeral: true });
        if (target.bot) return interaction.reply({ content: "❌ You can't transfer to a bot.", ephemeral: true });
        if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't transfer to yourself.", ephemeral: true });

        const sender = await getPlayer(interaction.user.id);
        const receiver = await getPlayer(target.id);

        if (sender.reiatsu < amount) {
          return interaction.reply({ content: `❌ Not enough Reiatsu. You have ${sender.reiatsu}.`, ephemeral: true });
        }

        sender.reiatsu -= amount;
        receiver.reiatsu += amount;

        await setPlayer(interaction.user.id, sender);
        await setPlayer(target.id, receiver);

        return interaction.reply({
          content: `${E_REIATSU} **${safeName(interaction.user.username)}** sent **${amount} Reiatsu** to **${safeName(target.username)}**.`,
          ephemeral: false,
        });
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

      if (interaction.commandName === "reatsu_clash") {
        const opponent = interaction.options.getUser("user", true);
        const stake = interaction.options.getInteger("stake", true);

        if (opponent.bot) return interaction.reply({ content: "❌ You can't challenge a bot.", ephemeral: true });
        if (opponent.id === interaction.user.id) return interaction.reply({ content: "❌ You can't challenge yourself.", ephemeral: true });

        const now = Date.now();
        const last = lastClashByUser.get(interaction.user.id) || 0;
        const left = CLASH_COOLDOWN_MS - (now - last);
        if (left > 0) {
          const mins = Math.ceil(left / 60000);
          return interaction.reply({ content: `⏳ You can use Reiatsu Clash again in **${mins} min**.`, ephemeral: true });
        }

        if (clashByChannel.has(channel.id)) {
          return interaction.reply({ content: "⚠️ A clash is already active in this channel.", ephemeral: true });
        }

        const p1 = await getPlayer(interaction.user.id);
        const p2 = await getPlayer(opponent.id);

        if (p1.reiatsu < stake) return interaction.reply({ content: `❌ You need ${E_REIATSU} ${stake}.`, ephemeral: true });
        if (p2.reiatsu < stake) return interaction.reply({ content: `❌ Opponent needs ${E_REIATSU} ${stake}.`, ephemeral: true });

        const msg = await channel.send({
          embeds: [clashInviteEmbed(safeName(interaction.user.username), safeName(opponent.username), stake)],
          components: clashButtons(false),
        });

        clashByChannel.set(channel.id, {
          messageId: msg.id,
          challengerId: interaction.user.id,
          targetId: opponent.id,
          stake,
          resolved: false,
        });

        lastClashByUser.set(interaction.user.id, Date.now());
        await interaction.reply({ content: "✅ Challenge sent.", ephemeral: true });

        setTimeout(async () => {
          const still = clashByChannel.get(channel.id);
          if (!still || still.messageId !== msg.id || still.resolved) return;
          still.resolved = true;

          await editMessageSafe(channel, still.messageId, { components: clashButtons(true) });
          await channel.send("⌛ Clash expired (no response).").catch(() => {});
          clashByChannel.delete(channel.id);
        }, CLASH_RESPONSE_MS);

        return;
      }
    }

    /* ---------- BUTTONS (Railway-safe + aliases) ---------- */
    if (interaction.isButton()) {
      try { await interaction.deferUpdate(); } catch {}

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) return;

      const cid = interaction.customId;

      // Boss join aliases
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

        boss.participants.set(uid, {
          hits: 0,
          displayName: interaction.member?.displayName || interaction.user.username,
        });

        await updateBossSpawnMessage(channel, boss);
        await interaction.followUp({ content: "✅ Joined the boss fight.", ephemeral: true }).catch(() => {});
        return;
      }

      // Boss rules aliases
      if (CID.BOSS_RULES.includes(cid)) {
        await interaction.followUp({
          content:
            `${E_VASTO} Boss: ${BOSS_ROUNDS} rounds • 2 hits = defeat • Cooldown 10s\n` +
            `${E_REIATSU} You gain +${BOSS_SURVIVE_HIT_REIATSU} Reiatsu per successful round hit\n` +
            `🎁 Robux shown: ${(DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}% (actual lower)`,
          ephemeral: true,
        }).catch(() => {});
        return;
      }

      // Hollow attack aliases
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
        await setPlayer(interaction.user.id, player);

        if (item.roleId) {
          const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
          if (!res.ok) {
            await interaction.followUp({ content: `⚠️ Bought role, but bot couldn't assign it: ${res.reason}`, ephemeral: true }).catch(() => {});
          }
        }

        const msgId = interaction.message?.id;
        if (msgId) {
          await editMessageSafe(channel, msgId, { embeds: [shopEmbed(player)], components: shopButtons(player) });
        }

        await interaction.followUp({ content: "✅ Purchased!", ephemeral: true }).catch(() => {});
        return;
      }

      // Clash accept/decline
      if (cid === "clash_accept" || cid === "clash_decline") {
        const clash = clashByChannel.get(channel.id);
        if (!clash || clash.resolved) return;

        if (interaction.user.id !== clash.targetId) {
          await interaction.followUp({ content: "❌ Only the challenged player can respond.", ephemeral: true }).catch(() => {});
          return;
        }

        if (cid === "clash_decline") {
          clash.resolved = true;
          await editMessageSafe(channel, clash.messageId, { components: clashButtons(true) });
          await channel.send("⚡ Clash declined.").catch(() => {});
          clashByChannel.delete(channel.id);
          return;
        }

        // accept
        clash.resolved = true;
        await editMessageSafe(channel, clash.messageId, { components: clashButtons(true) });
        await channel.send(`${E_REIATSU} 💥 Reiatsu pressure is rising…`).catch(() => {});
        await sleep(1500);

        const p1 = await getPlayer(clash.challengerId);
        const p2 = await getPlayer(clash.targetId);

        if (p1.reiatsu < clash.stake || p2.reiatsu < clash.stake) {
          await channel.send("⚠️ Clash cancelled (someone lacks Reiatsu now).").catch(() => {});
          clashByChannel.delete(channel.id);
          return;
        }

        const challengerMember = await channel.guild.members.fetch(clash.challengerId).catch(() => null);
        const targetMember = await channel.guild.members.fetch(clash.targetId).catch(() => null);
        const challengerName = safeName(challengerMember?.displayName || "Challenger");
        const targetName = safeName(targetMember?.displayName || "Opponent");

        const challengerWins = Math.random() < 0.5;

        if (challengerWins) {
          p1.reiatsu += clash.stake;
          p2.reiatsu -= clash.stake;
          await setPlayer(clash.challengerId, p1);
          await setPlayer(clash.targetId, p2);
          await channel.send({ embeds: [clashWinEmbed(challengerName, targetName, clash.stake)] }).catch(() => {});
        } else {
          p2.reiatsu += clash.stake;
          p1.reiatsu -= clash.stake;
          await setPlayer(clash.targetId, p2);
          await setPlayer(clash.challengerId, p1);
          await channel.send({ embeds: [clashWinEmbed(targetName, challengerName, clash.stake)] }).catch(() => {});
        }

        lastClashByUser.set(clash.challengerId, Date.now());
        clashByChannel.delete(channel.id);
        return;
      }
    }
  } catch (e) {
    console.error("Interaction error:", e);
  }
});

client.login(process.env.DISCORD_TOKEN);
