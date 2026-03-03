// src/handlers/slash.js
const {
  AttachmentBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { BOSSES } = require("../data/bosses");
const { MOBS } = require("../data/mobs");

const {
  BLEACH_CHANNEL_ID,
  JJK_CHANNEL_ID,
  DAILY_COOLDOWN_MS,
  DAILY_NORMAL,
  DAILY_BOOSTER,
  DRAKO_RATE_BLEACH,
  DRAKO_RATE_JJK,

  E_REIATSU,
  E_CE,
  E_DRAKO,

  BLEACH_BONUS_MAX,
  JJK_BONUS_MAX,
} = require("../config");

const { getPlayer, setPlayer, getTopPlayers } = require("../core/players");
const { safeName } = require("../core/utils");
const { hasEventRole, hasBoosterRole, wardrobeComponents, pvpButtons } = require("../ui/components");
const { wardrobeEmbed } = require("../ui/embeds");
const { buildInventoryImage } = require("../ui/inventory-card");
const { buildBossResultImage, buildBossRewardImage, buildBossLiveImage } = require("../ui/boss-card");
const { buildExchangeImage } = require("../ui/exchange-card");
const { buildShopV2Payload } = require("../ui/shop-v2");
const { buildPackOpeningImage, buildCardRevealImage } = require("../ui/card-pack");
const { collectRowsForPlayer, buildCardsBookPayload } = require("../ui/cards-book-v2");
const { buildCardSlashImage } = require("../ui/cardslash-card");
const { buildPvpChallengeImage } = require("../ui/pvpclash-card");
const { buildErrorV2 } = require("../ui/feedback-v2");
const { buildClanBossHudImage, buildClanLeaderboardImage, buildClanInfoImage } = require("../ui/clan-card");
const { buildChaosHelpImage, buildChaosProfileImage, buildChaosLeaderboardImage, buildChaosRunImage, buildChaosTeamLockImage } = require("../ui/chaos-card");
const { buildClanSetupPayload, buildClanHelpText, hasClanCreateAccess, CLAN_SPECIAL_CREATE_ROLE_ID, CLAN_SPECIAL_ROLE_COST } = require("../ui/clan-setup-v2");
const {
  findCard,
  getCardById,
  cardStatsAtLevel,
  cardPower,
  CARD_MAX_LEVEL,
  findFusionRecipe,
  getFusionRecipesForEvent,
  getDuoCardFromRecipe,
} = require("../data/cards");
const {
  MAX_CLAN_MEMBERS,
  CLAN_CREATE_COST_DRAKO,
  getClan,
  findClanByName,
  canManageClan,
  createClan,
  requestJoinClan,
  inviteToClan,
  acceptInvite,
  approveJoinRequest,
  denyJoinRequest,
  promoteOfficer,
  demoteOfficer,
  transferOwnership,
  kickMember,
  leaveClan,
  startClanBoss,
  hitClanBoss,
  getClanWeeklyLeaderboard,
} = require("../core/clans");
const {
  TEAM_IDS,
  getChaosProfile,
  setChaosProfile,
  setChaosTeam,
  getDailyUsesLeft,
  consumeDailyUse,
  recordChaosResult,
  getChaosLeaderboard,
  getChaosTeamLeaderboard,
  getTeamWinnerLine,
} = require("../core/chaos");

const { spawnBoss } = require("../events/boss");
const { spawnMob } = require("../events/mob");
const { pvpById } = require("../core/state");
const EXCHANGE_CE_EMOJI_ID = "1473448154220335339";
const CARDSLASH_LIMIT_BYPASS_ROLE_IDS = new Set([
  "1472494294173745223",
  "1287879457025163325",
]);

function hasCardslashLimitBypass(member) {
  if (!member) return false;
  if (member?.roles?.cache) {
    for (const rid of CARDSLASH_LIMIT_BYPASS_ROLE_IDS) {
      if (member.roles.cache.has(rid)) return true;
    }
    return false;
  }
  if (Array.isArray(member?.roles)) {
    const set = new Set(member.roles.map((x) => String(x)));
    for (const rid of CARDSLASH_LIMIT_BYPASS_ROLE_IDS) {
      if (set.has(rid)) return true;
    }
  }
  if (Array.isArray(member?._roles)) {
    const set = new Set(member._roles.map((x) => String(x)));
    for (const rid of CARDSLASH_LIMIT_BYPASS_ROLE_IDS) {
      if (set.has(rid)) return true;
    }
  }
  return false;
}

async function canBypassCardslashLimit(interaction) {
  if (hasCardslashLimitBypass(interaction?.member)) return true;
  const guild = interaction?.guild;
  const userId = String(interaction?.user?.id || "");
  if (!guild || !userId) return false;
  const fetched = await guild.members.fetch(userId).catch(() => null);
  return hasCardslashLimitBypass(fetched);
}

function getEventCardsMap(player, eventKey) {
  return eventKey === "bleach" ? (player?.cards?.bleach || {}) : (player?.cards?.jjk || {});
}

function getEventLevelsMap(player, eventKey) {
  return eventKey === "bleach" ? (player?.cardLevels?.bleach || {}) : (player?.cardLevels?.jjk || {});
}

function normalizeEventKey(v) {
  return v === "jjk" ? "jjk" : "bleach";
}

function masteryStageName(n) {
  const x = Math.max(1, Math.min(3, Math.floor(Number(n || 1))));
  return `M${x}`;
}

function getMasteryMap(player, eventKey) {
  return eventKey === "jjk" ? (player?.cardMastery?.jjk || {}) : (player?.cardMastery?.bleach || {});
}

function ensureCardSystems(player) {
  if (!player.cards || typeof player.cards !== "object") player.cards = { bleach: {}, jjk: {} };
  if (!player.cards.bleach) player.cards.bleach = {};
  if (!player.cards.jjk) player.cards.jjk = {};
  if (!player.cardLevels || typeof player.cardLevels !== "object") player.cardLevels = { bleach: {}, jjk: {} };
  if (!player.cardLevels.bleach) player.cardLevels.bleach = {};
  if (!player.cardLevels.jjk) player.cardLevels.jjk = {};
  if (!player.cardMastery || typeof player.cardMastery !== "object") player.cardMastery = { bleach: {}, jjk: {} };
  if (!player.cardMastery.bleach) player.cardMastery.bleach = {};
  if (!player.cardMastery.jjk) player.cardMastery.jjk = {};
  if (!player.duoCards || typeof player.duoCards !== "object") player.duoCards = { bleach: {}, jjk: {} };
  if (!player.duoCards.bleach) player.duoCards.bleach = {};
  if (!player.duoCards.jjk) player.duoCards.jjk = {};
}

function getMasteryRequirements(currentStage, level) {
  if (currentStage <= 1) {
    return { toStage: 2, minLevel: 10, dupNeed: 3, drakoNeed: 500 };
  }
  if (currentStage === 2) {
    return { toStage: 3, minLevel: CARD_MAX_LEVEL, dupNeed: 5, drakoNeed: 1200 };
  }
  return null;
}

function getFusionRequirements() {
  return {
    minMastery: 3,
    minLevel: 40,
    copiesEach: 3,
    drakoCost: 5000,
    eventCurrencyCost: 25000,
  };
}

function getOwnedDuoCard(eventKey, player, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  const duoMap = eventKey === "jjk" ? (player?.duoCards?.jjk || {}) : (player?.duoCards?.bleach || {});
  for (const recipe of getFusionRecipesForEvent(eventKey)) {
    const amount = Math.max(0, Number(duoMap[recipe.duoId] || 0));
    if (amount <= 0) continue;
    if (recipe.duoId.toLowerCase() !== q && String(recipe.name || "").toLowerCase() !== q && !String(recipe.name || "").toLowerCase().includes(q)) continue;
    const duo = getDuoCardFromRecipe(eventKey, recipe);
    if (!duo) continue;
    return { duo, recipe, amount };
  }
  return null;
}

function strongestOwnedCard(player, eventKey) {
  const cardsMap = getEventCardsMap(player, eventKey);
  const levels = getEventLevelsMap(player, eventKey);
  const duos = eventKey === "jjk" ? (player?.duoCards?.jjk || {}) : (player?.duoCards?.bleach || {});
  let best = null;

  for (const [cardId, amountRaw] of Object.entries(cardsMap)) {
    const amount = Math.max(0, Number(amountRaw || 0));
    if (amount <= 0) continue;
    const card = getCardById(eventKey, cardId);
    if (!card) continue;
    const lv = Math.max(1, Number(levels[cardId] || 1));
    const stats = cardStatsAtLevel(card, lv);
    const power = cardPower(stats);
    if (!best || power > best.power) best = { card, level: lv, amount, stats, power, isDuo: false };
  }

  for (const recipe of getFusionRecipesForEvent(eventKey)) {
    const amount = Math.max(0, Number(duos[recipe.duoId] || 0));
    if (amount <= 0) continue;
    const duoCard = getDuoCardFromRecipe(eventKey, recipe);
    if (!duoCard) continue;
    const lv = Math.max(1, Number(levels[recipe.duoId] || 1));
    const stats = cardStatsAtLevel(duoCard, lv);
    const power = Math.floor(cardPower(stats) * 0.97);
    if (!best || power > best.power) best = { card: duoCard, level: lv, amount, stats, power, isDuo: true };
  }

  return best;
}

function isAllowedSpawnChannel(eventKey, channelId) {
  if (eventKey === "bleach") return channelId === BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return channelId === JJK_CHANNEL_ID;
  return false;
}

function randomInt(min, max) {
  const a = Math.floor(Number(min || 0));
  const b = Math.floor(Number(max || 0));
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function playChaosRun() {
  const steps = [];
  let points = 0;
  let hp = 3;

  const events = ["cache", "fight", "trap", "surge", "jackpot"];
  for (let i = 0; i < 5; i++) {
    if (hp <= 0) break;
    const kind = events[randomInt(0, events.length - 1)];
    if (kind === "cache") {
      const gain = randomInt(70, 180);
      points += gain;
      steps.push(`Room ${i + 1}: Supply Cache found +${gain} pts`);
      continue;
    }
    if (kind === "fight") {
      const powerRoll = randomInt(1, 100);
      if (powerRoll >= 32) {
        const gain = randomInt(110, 260);
        points += gain;
        steps.push(`Room ${i + 1}: Rift Beast defeated +${gain} pts`);
      } else {
        const loss = randomInt(60, 130);
        points = Math.max(0, points - loss);
        hp -= 1;
        steps.push(`Room ${i + 1}: Rift Beast hit you -${loss} pts | HP ${Math.max(0, hp)}/3`);
      }
      continue;
    }
    if (kind === "trap") {
      const loss = randomInt(90, 170);
      points = Math.max(0, points - loss);
      hp -= 1;
      steps.push(`Room ${i + 1}: Void Trap triggered -${loss} pts | HP ${Math.max(0, hp)}/3`);
      continue;
    }
    if (kind === "surge") {
      const gain = randomInt(80, 210);
      points += gain;
      steps.push(`Room ${i + 1}: Adrenaline Surge +${gain} pts`);
      continue;
    }
    const gain = randomInt(170, 360);
    points += gain;
    steps.push(`Room ${i + 1}: Legendary Jackpot +${gain} pts`);
  }

  const survived = hp > 0;
  if (!survived) {
    const crashLoss = randomInt(80, 200);
    points = Math.max(0, points - crashLoss);
    steps.push(`Collapse: Rift overrun -${crashLoss} pts`);
  } else {
    const bonus = randomInt(90, 220);
    points += bonus;
    steps.push(`Extraction Bonus +${bonus} pts`);
  }

  return {
    points: Math.max(0, Math.floor(points)),
    survived,
    hp: Math.max(0, hp),
    steps,
  };
}

const CHAOS_DAILY_LIMIT = 6;
const CHAOS_COOLDOWN_MS = 2 * 60 * 1000;
const CHAOS_TEAM_META = {
  vanguard: {
    label: "Vanguard Division",
    badge: "Aegis",
    flavor: "Defensive frontline. Stable rewards and high clear rate.",
  },
  eclipse: {
    label: "Eclipse Syndicate",
    badge: "Shadow",
    flavor: "High-risk strike team. Strong point bursts.",
  },
  titan: {
    label: "Titan Protocol",
    badge: "Core",
    flavor: "Heavy assault doctrine. Sustained pressure and durability.",
  },
};

function chaosTeamLabel(teamId) {
  const id = String(teamId || "").toLowerCase();
  return CHAOS_TEAM_META[id]?.label || "Unassigned";
}

function chaosTeamBadge(teamId) {
  const id = String(teamId || "").toLowerCase();
  return CHAOS_TEAM_META[id]?.badge || "-";
}

function chaosResetUnix(now = Date.now()) {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0);
  return Math.floor(next / 1000);
}

function chaosTeamBonusPercent(rows, teamId) {
  if (!Array.isArray(rows) || !rows.length || !teamId) return 0;
  const top = rows[0];
  if (!top || Number(top.totalPoints || 0) <= 0) return 0;
  const index = rows.findIndex((r) => String(r.teamId || "") === String(teamId || ""));
  if (index === 0) return 15;
  if (index === 1) return 8;
  return 0;
}

function utcDayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function resolveClanDamageRows(guild, damageByUser, limit = 10) {
  const rows = Object.entries(damageByUser || {})
    .map(([uid, dmg]) => ({ uid: String(uid), dmg: Math.max(0, Math.floor(Number(dmg || 0))) }))
    .sort((a, b) => b.dmg - a.dmg)
    .slice(0, Math.max(1, Math.floor(Number(limit || 10))));

  const out = [];
  for (const row of rows) {
    let name = row.uid;
    try {
      const m = await guild.members.fetch(row.uid);
      name = safeName(m?.displayName || m?.user?.username || row.uid);
    } catch {}
    out.push({ name, dmg: row.dmg });
  }
  return out;
}

function clanIconPrefix(icon) {
  const s = String(icon || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return "🛡️ ";
  return `${s} `;
}

module.exports = async function handleSlash(interaction) {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) {
    return interaction.reply({ content: "❌ Use commands in a text channel.", ephemeral: true });
  }

  // ... ALL YOUR EXISTING COMMAND HANDLERS HERE (balance, inventory, shop, etc.)
  // Код отсечен для краткости - оставьте всё как было с строк 399-1875

  if (interaction.commandName === "adminadd") {
    const allowed = hasEventRole(interaction.member);
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

  // ===== DUNGEON SPAWN =====
  if (interaction.commandName === "dungeon_spawn") {
    const event = interaction.options.getString("event");
    const { spawnDungeon } = require("../core/dungeon");

    await interaction.deferReply();

    try {
      const dungeon = await spawnDungeon(event, interaction.channelId);

      const embed = new EmbedBuilder()
        .setColor(0x7b2cff)
        .setTitle(`🏰 ${event.toUpperCase()} Dungeon Spawned!`)
        .setDescription(
          `A new dungeon has appeared! Join and select your best cards to battle against other players.\n\n` +
          `⏱️ **Registration:** 5 minutes\n` +
          `🎴 **Card Selection:** 3 minutes\n` +
          `⚔️ **Battle:** Automatic 5 rounds`
        )
        .addFields(
          { name: "Event", value: event.toUpperCase(), inline: true },
          { name: "Participants", value: `0`, inline: true },
          { name: "Status", value: dungeon.status, inline: false },
          { name: "Dungeon ID", value: dungeon.id, inline: false }
        );

      const joinButton = new ButtonBuilder()
        .setCustomId(`dungeon_join:${dungeon.id}`)
        .setLabel("Join")
        .setStyle(ButtonStyle.Success)
        .setEmoji("⚔️");

      const infoButton = new ButtonBuilder()
        .setCustomId(`dungeon_info:${dungeon.id}`)
        .setLabel("Info")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("ℹ️");

      const row = new ActionRowBuilder().addComponents(joinButton, infoButton);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error("Dungeon spawn error:", error);
      await interaction.editReply({ content: "❌ Failed to spawn dungeon!", ephemeral: true });
    }

    return;
  }
};
