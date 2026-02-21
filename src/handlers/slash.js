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
    // Small fairness taper so duo is strong but not auto-win
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
    const png = await buildInventoryImage(eventKey, p, interaction.user, BLEACH_BONUS_MAX, JJK_BONUS_MAX);
    const file = new AttachmentBuilder(png, { name: `inventory-${eventKey}.png` });
    return interaction.reply({
      files: [file],
      ephemeral: true,
    });
  }

  if (interaction.commandName === "shop") {
    const eventKey = interaction.options.getString("event", true);
    const p = await getPlayer(interaction.user.id);
    return interaction.reply(buildShopV2Payload({
      eventKey,
      player: p,
      page: 0,
      selectedKey: null,
      withFlags: true,
      ephemeral: false,
    }));
  }

  if (interaction.commandName === "testcardpull") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "No permission.", ephemeral: true });
    }

    const eventKey = "bleach";
    const card = getCardById(eventKey, "bl_ichigo");
    if (!card) return interaction.reply({ content: "bl_ichigo not found in card pool.", ephemeral: true });

    const p = await getPlayer(interaction.user.id);
    if (!p.cards || typeof p.cards !== "object") p.cards = { bleach: {}, jjk: {} };
    if (!p.cards.bleach) p.cards.bleach = {};
    if (!p.cards.jjk) p.cards.jjk = {};
    if (!p.cardLevels || typeof p.cardLevels !== "object") p.cardLevels = { bleach: {}, jjk: {} };
    if (!p.cardLevels.bleach) p.cardLevels.bleach = {};
    if (!p.cardLevels.jjk) p.cardLevels.jjk = {};

    const afterCount = Math.max(0, Number(p.cards.bleach[card.id] || 0)) + 1;
    p.cards.bleach[card.id] = afterCount;
    if (!p.cardLevels.bleach[card.id]) p.cardLevels.bleach[card.id] = 1;
    await setPlayer(interaction.user.id, p);

    const openingPng = await buildPackOpeningImage({
      eventKey,
      username: interaction.user.username,
      packName: "Bleach Test Pack",
    });
    const openingFile = new AttachmentBuilder(openingPng, { name: "test-opening-bleach.png" });
    await interaction.reply({ files: [openingFile], ephemeral: true });

    const revealPng = await buildCardRevealImage({
      eventKey,
      username: interaction.user.username,
      card,
      countOwned: afterCount,
      level: p.cardLevels.bleach[card.id] || 1,
    });
    const revealFile = new AttachmentBuilder(revealPng, { name: "test-card-ichigo.png" });
    return interaction.followUp({ files: [revealFile], ephemeral: true });
  }

  if (interaction.commandName === "cards") {
    const eventKey = normalizeEventKey(interaction.options.getString("event", true));
    const target = interaction.options.getUser("user") || interaction.user;
    const isPrivate = target.id !== interaction.user.id;
    const p = await getPlayer(target.id);
    const rows = collectRowsForPlayer(p, eventKey);
    if (!rows.length) {
      return interaction.reply({ content: `No ${eventKey.toUpperCase()} cards found. Open packs in /shop first.`, ephemeral: true });
    }
    const book = await buildCardsBookPayload({
      eventKey,
      targetId: target.id,
      targetName: safeName(target.username),
      ownerId: interaction.user.id,
      rows,
      page: 0,
    });
    return interaction.reply({
      flags: MessageFlags.IsComponentsV2 | (isPrivate ? MessageFlags.Ephemeral : 0),
      components: book.components,
      files: book.files,
    });
  }

  if (interaction.commandName === "cardlevel") {
    const eventKey = normalizeEventKey(interaction.options.getString("event", true));
    const query = interaction.options.getString("card", true);
    const times = Math.max(1, Number(interaction.options.getInteger("times") || 1));
    const p = await getPlayer(interaction.user.id);
    const card = findCard(eventKey, query);
    if (!card) return interaction.reply({ content: "Card not found. Use id or close name.", ephemeral: true });

    if (!p.cards || typeof p.cards !== "object") p.cards = { bleach: {}, jjk: {} };
    if (!p.cardLevels || typeof p.cardLevels !== "object") p.cardLevels = { bleach: {}, jjk: {} };
    if (!p.cards.bleach) p.cards.bleach = {};
    if (!p.cards.jjk) p.cards.jjk = {};
    if (!p.cardLevels.bleach) p.cardLevels.bleach = {};
    if (!p.cardLevels.jjk) p.cardLevels.jjk = {};

    const cardsMap = eventKey === "bleach" ? p.cards.bleach : p.cards.jjk;
    const levels = eventKey === "bleach" ? p.cardLevels.bleach : p.cardLevels.jjk;
    let amount = Math.max(0, Number(cardsMap[card.id] || 0));
    let level = Math.max(1, Number(levels[card.id] || 1));
    if (amount <= 0) return interaction.reply({ content: "You do not own this card yet.", ephemeral: true });

    const levelBefore = level;
    let upgraded = 0;
    let spentDup = 0;
    let spentDrako = 0;
    let stopReason = "";

    for (let i = 0; i < times; i++) {
      if (level >= CARD_MAX_LEVEL) {
        stopReason = "Card is already max level (" + CARD_MAX_LEVEL + ").";
        break;
      }
      const dupNeed = Math.max(1, Math.floor(level / 3) + 1);
      const drakoNeed = 25 * level;
      const usableDup = Math.max(0, amount - 1);
      if (usableDup < dupNeed) {
        stopReason = "Need " + dupNeed + " duplicates for next level (usable now: " + usableDup + ").";
        break;
      }
      if (p.drako < drakoNeed) {
        stopReason = "Need " + drakoNeed + " Drako for next upgrade.";
        break;
      }

      amount -= dupNeed;
      p.drako -= drakoNeed;
      level += 1;
      upgraded += 1;
      spentDup += dupNeed;
      spentDrako += drakoNeed;
    }

    cardsMap[card.id] = amount;
    levels[card.id] = level;
    await setPlayer(interaction.user.id, p);

    const statsNow = cardStatsAtLevel(card, level);
    const nextDupNeed = level >= CARD_MAX_LEVEL ? 0 : Math.max(1, Math.floor(level / 3) + 1);
    const nextDrakoNeed = level >= CARD_MAX_LEVEL ? 0 : 25 * level;

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "## CARD LEVEL UP | " + eventKey.toUpperCase() + "\n" +
          "Card: **" + card.name + "**\n" +
          "Level: **" + levelBefore + " -> " + level + "**"
        )
      )
      .addSeparatorComponents(new SeparatorBuilder());

    if (upgraded <= 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "Status: **No upgrade applied**\n" +
          "Reason: " + (stopReason || "Requirements not met.") + "\n" +
          "Owned: **x" + amount + "** | Drako: **" + p.drako + "**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "Upgraded: **+" + upgraded + " level(s)**\n" +
          "Spent: **" + spentDup + " duplicates** + **" + spentDrako + " Drako**\n" +
          "Current Stats: DMG **" + statsNow.dmg + "** | DEF **" + statsNow.def + "** | HP **" + statsNow.hp + "** | PWR **" + cardPower(statsNow) + "**"
        )
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          level >= CARD_MAX_LEVEL
            ? "Max level reached."
            : ("Next cost: **" + nextDupNeed + " duplicates** + **" + nextDrakoNeed + " Drako**\n" +
              "Remaining: **x" + amount + "** cards | **" + p.drako + "** Drako" +
              (stopReason ? "\nNote: " + stopReason : ""))
        )
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: false,
    });
  }

  if (interaction.commandName === "cardslash") {
    const replyCardslashError = (text) =>
      interaction.reply(buildErrorV2(text, "Cardslash Error"));

    const eventKey = normalizeEventKey(interaction.options.getString("event", true));
    const myCardQuery = interaction.options.getString("card", true);
    const enemy = interaction.options.getUser("user", true);
    const enemyCardQuery = interaction.options.getString("enemy_card");

    if (enemy.bot) return replyCardslashError("You cannot clash with a bot.");
    if (enemy.id === interaction.user.id) return replyCardslashError("Pick another user.");

    const me = await getPlayer(interaction.user.id);
    const op = await getPlayer(enemy.id);
    const today = utcDayKey();
    if (!me.cardClashDaily || typeof me.cardClashDaily !== "object") {
      me.cardClashDaily = { day: today, used: 0 };
    }
    if (String(me.cardClashDaily.day || "") !== today) {
      me.cardClashDaily.day = today;
      me.cardClashDaily.used = 0;
    }
    const bypassLimit = await canBypassCardslashLimit(interaction);
    const usedToday = Math.max(0, Number(me.cardClashDaily.used || 0));
    if (!bypassLimit && usedToday >= 3) {
      return interaction.reply(
        buildErrorV2(
          "You already used `/cardslash` 3/3 times today.\nTry again after daily reset (UTC).",
          "Cardslash Limit"
        )
      );
    }
    const normalMyCard = findCard(eventKey, myCardQuery);
    const myDuo = getOwnedDuoCard(eventKey, me, myCardQuery);
    if (!normalMyCard && !myDuo) return replyCardslashError("Your card/duo was not found.");

    const myCard = myDuo ? myDuo.duo : normalMyCard;
    const myAmount = myDuo ? myDuo.amount : Math.max(0, Number(getEventCardsMap(me, eventKey)[myCard.id] || 0));
    if (myAmount <= 0) return replyCardslashError("You do not own that card.");

    const myLevel = Math.max(1, Number(getEventLevelsMap(me, eventKey)[myCard.id] || 1));
    const myStats = cardStatsAtLevel(myCard, myLevel);
    const myPower = myDuo ? Math.floor(cardPower(myStats) * 0.97) : cardPower(myStats);

    let enemyPick = null;
    if (enemyCardQuery) {
      const c = findCard(eventKey, enemyCardQuery);
      const duo = getOwnedDuoCard(eventKey, op, enemyCardQuery);
      if (!c && !duo) return replyCardslashError("Enemy card query not found.");
      const pick = duo ? duo.duo : c;
      const amount = duo ? duo.amount : Math.max(0, Number(getEventCardsMap(op, eventKey)[pick.id] || 0));
      if (amount <= 0) return replyCardslashError("Enemy does not own that card.");
      const lv = Math.max(1, Number(getEventLevelsMap(op, eventKey)[pick.id] || 1));
      const stats = cardStatsAtLevel(pick, lv);
      enemyPick = { card: pick, level: lv, stats, power: duo ? Math.floor(cardPower(stats) * 0.97) : cardPower(stats) };
    } else {
      enemyPick = strongestOwnedCard(op, eventKey);
      if (!enemyPick) return replyCardslashError("Enemy has no card in this event.");
    }

    if (!bypassLimit) me.cardClashDaily.used = usedToday + 1;

    const myRoll = myPower * (0.85 + Math.random() * 0.3);
    const enemyRoll = enemyPick.power * (0.85 + Math.random() * 0.3);
    const meWon = myRoll >= enemyRoll;

    const winnerId = meWon ? interaction.user.id : enemy.id;
    const loserId = meWon ? enemy.id : interaction.user.id;
    const diff = Math.abs(Math.floor(myRoll - enemyRoll));

    const winnerEventReward = randomInt(120, 220);
    const loserEventReward = randomInt(40, 85);
    const winnerDrakoReward = randomInt(8, 20);
    const loserDrakoReward = randomInt(2, 6);

    if (eventKey === "bleach") {
      if (meWon) {
        me.bleach.reiatsu += winnerEventReward;
        op.bleach.reiatsu += loserEventReward;
      } else {
        op.bleach.reiatsu += winnerEventReward;
        me.bleach.reiatsu += loserEventReward;
      }
    } else {
      if (meWon) {
        me.jjk.cursedEnergy += winnerEventReward;
        op.jjk.cursedEnergy += loserEventReward;
      } else {
        op.jjk.cursedEnergy += winnerEventReward;
        me.jjk.cursedEnergy += loserEventReward;
      }
    }

    if (meWon) {
      me.drako += winnerDrakoReward;
      op.drako += loserDrakoReward;
    } else {
      op.drako += winnerDrakoReward;
      me.drako += loserDrakoReward;
    }

    await setPlayer(interaction.user.id, me);
    await setPlayer(enemy.id, op);

    const remaining = bypassLimit ? 3 : Math.max(0, 3 - Number(me.cardClashDaily.used || 0));
    const png = await buildCardSlashImage({
      eventKey,
      winnerId,
      impact: diff,
      usesLeft: remaining,
      left: {
        userId: interaction.user.id,
        userName: safeName(interaction.user.username),
        card: myCard,
        level: myLevel,
        stats: myStats,
        power: myPower,
      },
      right: {
        userId: enemy.id,
        userName: safeName(enemy.username),
        card: enemyPick.card,
        level: enemyPick.level,
        stats: enemyPick.stats,
        power: enemyPick.power,
      },
    });
    const file = new AttachmentBuilder(png, { name: `cardslash-${eventKey}.png` });
    return interaction.reply({ files: [file], ephemeral: false });
  }

  if (interaction.commandName === "cardmastery") {
    const sub = interaction.options.getSubcommand(true);
    const eventKey = normalizeEventKey(interaction.options.getString("event", true));
    const query = interaction.options.getString("card", true);
    const p = await getPlayer(interaction.user.id);
    ensureCardSystems(p);
    const card = findCard(eventKey, query);
    if (!card) return interaction.reply({ content: "Card not found.", ephemeral: true });

    const cardsMap = eventKey === "jjk" ? p.cards.jjk : p.cards.bleach;
    const levels = eventKey === "jjk" ? p.cardLevels.jjk : p.cardLevels.bleach;
    const mastery = eventKey === "jjk" ? p.cardMastery.jjk : p.cardMastery.bleach;
    const owned = Math.max(0, Number(cardsMap[card.id] || 0));
    const level = Math.max(1, Number(levels[card.id] || 1));
    const stage = Math.max(1, Math.min(3, Number(mastery[card.id] || 1)));
    const req = getMasteryRequirements(stage, level);

    if (sub === "info") {
      const content =
        `## CARD MASTERY | ${eventKey.toUpperCase()}\n` +
        `Card: **${card.name}**\n` +
        `Owned: **x${owned}** | Level: **${level}** | Mastery: **${masteryStageName(stage)}**\n` +
        (req
          ? `Next: **${masteryStageName(req.toStage)}** requires Lv.${req.minLevel}, ${req.dupNeed} duplicates, ${req.drakoNeed} Drako`
          : "Status: **MAX Mastery (M3)**");
      const container = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    if (owned <= 0) return interaction.reply({ content: "You do not own this card.", ephemeral: true });
    if (!req) return interaction.reply({ content: "This card is already at M3.", ephemeral: true });
    if (level < req.minLevel) {
      return interaction.reply({ content: `Need level ${req.minLevel} first (current: ${level}).`, ephemeral: true });
    }
    const usableDup = Math.max(0, owned - 1);
    if (usableDup < req.dupNeed) {
      return interaction.reply({ content: `Need ${req.dupNeed} duplicates (usable now: ${usableDup}).`, ephemeral: true });
    }
    if (p.drako < req.drakoNeed) {
      return interaction.reply({ content: `Need ${req.drakoNeed} Drako (current: ${p.drako}).`, ephemeral: true });
    }

    cardsMap[card.id] = owned - req.dupNeed;
    p.drako -= req.drakoNeed;
    mastery[card.id] = req.toStage;
    await setPlayer(interaction.user.id, p);

    const res = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## MASTERY UPGRADE SUCCESS\n` +
          `Card: **${card.name}**\n` +
          `Stage: **${masteryStageName(stage)} -> ${masteryStageName(req.toStage)}**\n` +
          `Spent: **${req.dupNeed} duplicates** + **${req.drakoNeed} Drako**\n` +
          `Remaining: **x${cardsMap[card.id]}** cards | **${p.drako} Drako**`
        )
      );
    return interaction.reply({ components: [res], flags: MessageFlags.IsComponentsV2 });
  }

  if (interaction.commandName === "cardfuse") {
    const sub = interaction.options.getSubcommand(true);
    const eventKey = normalizeEventKey(interaction.options.getString("event", true));
    const recipes = getFusionRecipesForEvent(eventKey);
    const req = getFusionRequirements();

    if (sub === "guide") {
      const text =
        `## CARD FUSION GUIDE | ${eventKey.toUpperCase()}\n` +
        `1. Level both parent cards to **Lv.${req.minLevel}+**\n` +
        `2. Upgrade both to **M${req.minMastery}**\n` +
        `3. Keep at least **${req.copiesEach} copies** of each card\n` +
        `4. Pay **${req.drakoCost.toLocaleString("en-US")} Drako** + **${req.eventCurrencyCost.toLocaleString("en-US")} ${eventKey === "bleach" ? "Reiatsu" : "Cursed Energy"}**\n` +
        `5. Use \`/cardfuse craft\` with the exact pair\n\n`
      const c = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
      return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    if (sub === "list") {
      const lines = recipes.map((r, i) => `**#${i + 1}** ${r.name}  |  \`${r.a}\` + \`${r.b}\`  ->  \`${r.duoId}\``);
      const c = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## FUSION RECIPES | ${eventKey.toUpperCase()}\n` +
          `${lines.join("\n") || "_No recipes_"}\n\n` +
          `Requirement: Lv.${req.minLevel}+ + M${req.minMastery} + ${req.copiesEach} copies each + ${req.drakoCost} Drako + ${req.eventCurrencyCost} ${eventKey === "bleach" ? "Reiatsu" : "CE"}.`
        )
      );
      return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    const qa = interaction.options.getString("card_a", true);
    const qb = interaction.options.getString("card_b", true);
    const pa = findCard(eventKey, qa);
    const pb = findCard(eventKey, qb);
    if (!pa || !pb) return interaction.reply({ content: "One or both parent cards not found.", ephemeral: true });
    if (pa.id === pb.id) return interaction.reply({ content: "Choose two different cards.", ephemeral: true });

    const rec = findFusionRecipe(eventKey, pa.id, pb.id);
    if (!rec) return interaction.reply({ content: "This pair has no fusion recipe.", ephemeral: true });

    const p = await getPlayer(interaction.user.id);
    ensureCardSystems(p);
    const cardsMap = eventKey === "jjk" ? p.cards.jjk : p.cards.bleach;
    const levels = eventKey === "jjk" ? p.cardLevels.jjk : p.cardLevels.bleach;
    const mastery = eventKey === "jjk" ? p.cardMastery.jjk : p.cardMastery.bleach;
    const duoMap = eventKey === "jjk" ? p.duoCards.jjk : p.duoCards.bleach;

    const amountA = Math.max(0, Number(cardsMap[pa.id] || 0));
    const amountB = Math.max(0, Number(cardsMap[pb.id] || 0));
    const lvA = Math.max(1, Number(levels[pa.id] || 1));
    const lvB = Math.max(1, Number(levels[pb.id] || 1));
    const ma = Math.max(1, Number(mastery[pa.id] || 1));
    const mb = Math.max(1, Number(mastery[pb.id] || 1));

    if (amountA < req.copiesEach || amountB < req.copiesEach) {
      return interaction.reply({ content: `Need ${req.copiesEach} copies of each parent card.`, ephemeral: true });
    }
    if (lvA < req.minLevel || lvB < req.minLevel) {
      return interaction.reply({ content: `Both cards must be level ${req.minLevel}+ (now ${lvA}/${lvB}).`, ephemeral: true });
    }
    if (ma < req.minMastery || mb < req.minMastery) {
      return interaction.reply({ content: `Both cards must be M${req.minMastery} (now M${ma}/M${mb}).`, ephemeral: true });
    }
    if (p.drako < req.drakoCost) return interaction.reply({ content: `Need ${req.drakoCost} Drako.`, ephemeral: true });
    if (eventKey === "bleach" && p.bleach.reiatsu < req.eventCurrencyCost) return interaction.reply({ content: `Need ${req.eventCurrencyCost} Reiatsu.`, ephemeral: true });
    if (eventKey === "jjk" && p.jjk.cursedEnergy < req.eventCurrencyCost) return interaction.reply({ content: `Need ${req.eventCurrencyCost} Cursed Energy.`, ephemeral: true });

    cardsMap[pa.id] = amountA - req.copiesEach;
    cardsMap[pb.id] = amountB - req.copiesEach;
    p.drako -= req.drakoCost;
    if (eventKey === "bleach") p.bleach.reiatsu -= req.eventCurrencyCost;
    else p.jjk.cursedEnergy -= req.eventCurrencyCost;

    duoMap[rec.duoId] = Math.max(0, Number(duoMap[rec.duoId] || 0)) + 1;
    if (!levels[rec.duoId]) levels[rec.duoId] = 1;

    const duoCard = getDuoCardFromRecipe(eventKey, rec);
    const duoStats = cardStatsAtLevel(duoCard, levels[rec.duoId] || 1);
    const duoPower = Math.floor(cardPower(duoStats) * 0.97);

    await setPlayer(interaction.user.id, p);
    const c = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## FUSION SUCCESS\n` +
        `Duo: **${rec.name}**  (\`${rec.duoId}\`)\n` +
        `Owned Duo: **${duoMap[rec.duoId]}**\n` +
        `Base Power: **${duoPower}** (fair-capped)\n` +
        `Spent: ${req.copiesEach}x ${pa.name}, ${req.copiesEach}x ${pb.name}, ${req.drakoCost} Drako, ${req.eventCurrencyCost} ${eventKey === "bleach" ? "Reiatsu" : "CE"}.`
      )
    );
    return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }

  if (interaction.commandName === "clan") {
    const sub = interaction.options.getSubcommand(true);
    if (sub === "setup") {
      const payload = await buildClanSetupPayload({
        guild: interaction.guild,
        userId: interaction.user.id,
        member: interaction.member,
      });
      return interaction.reply(payload);
    }
    if (sub === "help") {
      const c = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(buildClanHelpText()));
      return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    // legacy fallback (kept for old cached commands)
    if (sub === "create") {
      if (!hasClanCreateAccess(interaction.member)) {
        return interaction.reply({
          content:
            "You cannot create a clan yet.\n" +
            "Required role: <@&1472494294173745223> or <@&1443940262635245598> or <@&1474147727645474836>.\n" +
            `Special role can be bought for ${CLAN_SPECIAL_ROLE_COST.toLocaleString("en-US")} Reiatsu/CE in /clan setup.`,
          ephemeral: true,
        });
      }
      const name = interaction.options.getString("name", true);
      const icon = interaction.options.getString("icon") || "";
      const res = await createClan({ ownerId: interaction.user.id, name, icon });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      const clan = res.clan;
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## CLAN CREATED\n` +
          `${clanIconPrefix(clan.icon)}**${clan.name}**\n` +
          `Owner: <@${clan.ownerId}>\n` +
          `Members: **${clan.members.length}/${MAX_CLAN_MEMBERS}**\n` +
          `Cost: **${CLAN_CREATE_COST_DRAKO} Drako**`
        )
      );
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "request") {
      const name = interaction.options.getString("name", true);
      const res = await requestJoinClan({ userId: interaction.user.id, clanName: name });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## JOIN REQUEST SENT\nClan: **${res.clan.name}**\nWait for owner/officer approval.`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "accept") {
      const name = interaction.options.getString("name", true);
      const res = await acceptInvite({ userId: interaction.user.id, clanName: name });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## INVITE ACCEPTED\nYou joined **${res.clan.name}**.`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "invite") {
      const user = interaction.options.getUser("user", true);
      if (user.bot) return interaction.reply({ content: "Cannot invite bots.", ephemeral: true });
      const res = await inviteToClan({ managerId: interaction.user.id, targetUserId: user.id });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## INVITE SENT\nInvited <@${user.id}> to **${res.clan.name}**.`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "approve") {
      const user = interaction.options.getUser("user", true);
      const res = await approveJoinRequest({ managerId: interaction.user.id, userId: user.id });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## REQUEST APPROVED\n<@${user.id}> joined **${res.clan.name}**.`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "deny") {
      const user = interaction.options.getUser("user", true);
      const res = await denyJoinRequest({ managerId: interaction.user.id, userId: user.id });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## REQUEST DENIED\nRemoved request from <@${user.id}>.`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "promote") {
      const user = interaction.options.getUser("user", true);
      const res = await promoteOfficer({ ownerId: interaction.user.id, targetUserId: user.id });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## OFFICER PROMOTED\n<@${user.id}> is now an officer.`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "demote") {
      const user = interaction.options.getUser("user", true);
      const res = await demoteOfficer({ ownerId: interaction.user.id, targetUserId: user.id });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## OFFICER DEMOTED\n<@${user.id}> is now a member.`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "transfer") {
      const user = interaction.options.getUser("user", true);
      const res = await transferOwnership({ ownerId: interaction.user.id, targetUserId: user.id });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## OWNERSHIP TRANSFERRED\nNew owner: <@${user.id}>`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "kick") {
      const user = interaction.options.getUser("user", true);
      const res = await kickMember({ managerId: interaction.user.id, targetUserId: user.id });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## MEMBER KICKED\nRemoved <@${user.id}> from **${res.clan.name}**.`))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "requests") {
      const me = await getPlayer(interaction.user.id);
      if (!me.clanId) return interaction.reply({ content: "You are not in a clan.", ephemeral: true });
      const clan = await getClan(me.clanId);
      if (!clan) return interaction.reply({ content: "Clan not found.", ephemeral: true });
      if (!canManageClan(clan, interaction.user.id)) return interaction.reply({ content: "Only owner/officers can view requests.", ephemeral: true });
      const reqLines = (clan.joinRequests || []).slice(0, 12).map((x, i) => `**#${i + 1}** <@${x.userId}>`).join("\n");
      const invLines = (clan.invites || []).slice(0, 12).map((x, i) => `**#${i + 1}** <@${x.userId}>`).join("\n");
      const text =
        `## CLAN REQUESTS | ${clan.name}\n` +
        `Join Requests:\n${reqLines || "_None_"}\n\n` +
        `Pending Invites:\n${invLines || "_None_"}`;
      return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(text))], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    if (sub === "leave") {
      const res = await leaveClan({ userId: interaction.user.id });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent("## CLAN LEFT\nYou left your clan."))],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (sub === "info") {
      const name = interaction.options.getString("name");
      let clan = null;
      if (name) clan = await findClanByName(name);
      if (!clan) {
        const me = await getPlayer(interaction.user.id);
        if (me.clanId) clan = await getClan(me.clanId);
      }
      if (!clan) return interaction.reply({ content: "Clan not found.", ephemeral: true });
      const memberMentions = clan.members.slice(0, 15).map((x) => `<@${x}>`).join(", ");
      const officerMentions = clan.officers.slice(0, 10).map((x) => `<@${x}>`).join(", ");
      const hasBoss = !!(clan.activeBoss && clan.activeBoss.hpCurrent > 0 && clan.activeBoss.endsAt > Date.now());
      const bossText = hasBoss
        ? `${clan.activeBoss.name} | ${clan.activeBoss.hpCurrent}/${clan.activeBoss.hpMax} HP`
        : "No active clan boss";
      let ownerLabel = clan.ownerId;
      try {
        const m = await interaction.guild.members.fetch(clan.ownerId);
        ownerLabel = safeName(m?.displayName || m?.user?.username || clan.ownerId);
      } catch {}
      const memberNames = [];
      for (const uid of clan.members.slice(0, 15)) {
        let display = uid;
        try {
          const m = await interaction.guild.members.fetch(uid);
          display = safeName(m?.displayName || m?.user?.username || uid);
        } catch {}
        memberNames.push(display);
      }
      const officerNames = [];
      for (const uid of clan.officers.slice(0, 10)) {
        let display = uid;
        try {
          const m = await interaction.guild.members.fetch(uid);
          display = safeName(m?.displayName || m?.user?.username || uid);
        } catch {}
        officerNames.push(display);
      }
      const createdText = clan.createdAt ? new Date(clan.createdAt).toISOString().slice(0, 10) : "-";
      const png = await buildClanInfoImage({
        name: clan.name,
        icon: clan.icon,
        ownerName: ownerLabel,
        createdText,
        members: memberNames,
        officers: officerNames,
        memberCount: clan.members.length,
        maxMembers: MAX_CLAN_MEMBERS,
        officerCount: clan.officers.length,
        requestCount: (clan.joinRequests || []).length,
        inviteCount: (clan.invites || []).length,
        weekly: clan.weekly,
        activeBoss: hasBoss ? clan.activeBoss : null,
      });
      const file = new AttachmentBuilder(png, { name: `clan-info-${clan.id}.png` });
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${clanIconPrefix(clan.icon)}CLAN PROFILE\n` +
            `Name: **${clan.name}**  |  Owner: <@${clan.ownerId}>`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### Weekly Snapshot\n` +
            `- Damage: **${clan.weekly.totalDamage}**\n` +
            `- Boss Clears: **${clan.weekly.bossClears}**\n` +
            `- Activity: **${clan.weekly.activity}**\n` +
            `- Active Boss: ${bossText}`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### Management\n` +
            `- Officers: ${officerMentions || "_none_"}\n` +
            `- Requests: **${(clan.joinRequests || []).length}** | Invites: **${(clan.invites || []).length}**\n` +
            `- Members: ${memberMentions || "_none_"}`
          )
        );
      return interaction.reply({ components: [container], files: [file], flags: MessageFlags.IsComponentsV2 });
    }
  }

  if (interaction.commandName === "clanboss") {
    const sub = interaction.options.getSubcommand(true);
    if (sub === "start") {
      const eventKey = normalizeEventKey(interaction.options.getString("event", true));
      const res = await startClanBoss({ userId: interaction.user.id, eventKey });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      const boss = res.clan.activeBoss;
      const top = await resolveClanDamageRows(interaction.guild, boss.damageByUser || {}, 10);
      const png = await buildClanBossHudImage({
        clanName: res.clan.name,
        bossName: boss.name,
        eventKey: boss.eventKey,
        hpMax: boss.hpMax,
        hpCurrent: boss.hpCurrent,
        topDamage: top,
        joined: res.clan.members.length,
        alive: res.clan.members.length,
        totalDamage: 0,
        weeklyClears: res.clan.weekly.bossClears,
        endsAt: boss.endsAt,
      });
      const file = new AttachmentBuilder(png, { name: `clan-boss-${boss.eventKey}.png` });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## CLAN BOSS STARTED\n` +
          `Clan: **${res.clan.name}**\n` +
          `Boss: **${boss.name}**\n` +
          `Event: **${boss.eventKey.toUpperCase()}**\n` +
          `HP: **${boss.hpCurrent}/${boss.hpMax}**\n` +
          `Duration: **30 min**\n` +
          `Use \`/clanboss hit event:${boss.eventKey}\` to attack.`
        )
      );
      return interaction.reply({ components: [container], files: [file], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "hit") {
      const eventKey = normalizeEventKey(interaction.options.getString("event", true));
      const res = await hitClanBoss({ userId: interaction.user.id, cardEventKey: eventKey });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      const boss = res.clan.activeBoss;
      if (!res.cleared) {
        const top = await resolveClanDamageRows(interaction.guild, boss.damageByUser || {}, 10);
        const totalDamage = top.reduce((a, b) => a + Number(b.dmg || 0), 0);
        const png = await buildClanBossHudImage({
          clanName: res.clan.name,
          bossName: boss.name,
          eventKey: boss.eventKey,
          hpMax: boss.hpMax,
          hpCurrent: boss.hpCurrent,
          topDamage: top,
          joined: res.clan.members.length,
          alive: res.clan.members.length,
          totalDamage,
          weeklyClears: res.clan.weekly.bossClears,
          endsAt: boss.endsAt,
        });
        const file = new AttachmentBuilder(png, { name: `clan-boss-${boss.eventKey}.png` });
        const c = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## CLAN BOSS HIT\n` +
            `Damage: **${res.dmg}**\n` +
            `Boss HP: **${boss.hpCurrent}/${boss.hpMax}**\n` +
            `Event: **${boss.eventKey.toUpperCase()}**`
          )
        );
        return interaction.reply({ components: [c], files: [file], flags: MessageFlags.IsComponentsV2 });
      }

      const top = [...res.rewardRows]
        .sort((a, b) => b.damage - a.damage)
        .slice(0, 8)
        .map((x, i) => `**#${i + 1}** <@${x.userId}> - DMG **${x.damage}** | +**${x.eventReward}** + **${x.drakoReward} Drako**`)
        .join("\n");

      const clear = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## CLAN BOSS CLEARED\n` +
            `Clan: **${res.clan.name}**\n` +
            `Final Hit: **${res.dmg}**\n` +
            `Rewards distributed by contribution.\n\n${top || "_No reward rows_"}`
          )
        );
      const lbRows = await getClanWeeklyLeaderboard(10);
      const png = await buildClanLeaderboardImage(lbRows);
      const file = new AttachmentBuilder(png, { name: "clan-leaderboard-weekly.png" });
      return interaction.reply({ components: [clear], files: [file], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "status") {
      const me = await getPlayer(interaction.user.id);
      if (!me.clanId) return interaction.reply({ content: "Join a clan first.", ephemeral: true });
      const clan = await getClan(me.clanId);
      if (!clan) return interaction.reply({ content: "Clan not found.", ephemeral: true });
      const b = clan.activeBoss;
      if (!b || b.hpCurrent <= 0 || b.endsAt <= Date.now()) {
        return interaction.reply({
          components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent("## CLAN BOSS STATUS\nNo active clan boss."))],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
      const top = Object.entries(b.damageByUser || {})
        .sort((a, b2) => Number(b2[1] || 0) - Number(a[1] || 0))
        .slice(0, 6)
        .map(([uid, dmg], i) => `**#${i + 1}** <@${uid}> - **${Math.floor(Number(dmg || 0))}**`)
        .join("\n");
      const topRows = await resolveClanDamageRows(interaction.guild, b.damageByUser || {}, 10);
      const totalDamage = topRows.reduce((a, r) => a + Number(r.dmg || 0), 0);
      const png = await buildClanBossHudImage({
        clanName: clan.name,
        bossName: b.name,
        eventKey: b.eventKey,
        hpMax: b.hpMax,
        hpCurrent: b.hpCurrent,
        topDamage: topRows,
        joined: clan.members.length,
        alive: clan.members.length,
        totalDamage,
        weeklyClears: clan.weekly.bossClears,
        endsAt: b.endsAt,
      });
      const file = new AttachmentBuilder(png, { name: `clan-boss-status-${b.eventKey}.png` });
      const c = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## CLAN BOSS STATUS\n` +
          `Clan: **${clan.name}**\n` +
          `Boss: **${b.name}**\n` +
          `HP: **${b.hpCurrent}/${b.hpMax}**\n` +
          `Ends: <t:${Math.floor(b.endsAt / 1000)}:R>\n` +
          `${top ? `\nTop Damage:\n${top}` : ""}`
        )
      );
      return interaction.reply({ components: [c], files: [file], flags: MessageFlags.IsComponentsV2 });
    }
  }

  if (interaction.commandName === "clanleaderboard") {
    const rows = await getClanWeeklyLeaderboard(10);
    const png = await buildClanLeaderboardImage(rows);
    const file = new AttachmentBuilder(png, { name: "clan-leaderboard-weekly.png" });
    const lines = rows.map((r, i) =>
      `**#${i + 1}** ${r.icon ? `${r.icon} ` : ""}**${safeName(r.name)}** | Score **${r.score}** | DMG ${r.damage} | Clears ${r.clears} | Activity ${r.activity}`
    );
    const c = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## CLAN WAR ROOM — WEEKLY RANKING\n` +
          `Scoring model: **Damage + Activity + Boss Clears**`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### Top Clans\n${lines.join("\n") || "_No clans yet._"}`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Use \`/clan info\` for profile, \`/clanboss status\` for live raid HUD, and \`/clan requests\` for management queue.`
        )
      );
    return interaction.reply({ components: [c], files: [file], flags: MessageFlags.IsComponentsV2 });
  }

  if (interaction.commandName === "chaos") {
    const sub = interaction.options.getSubcommand(true);
    const chaosRespond = async (payload) => {
      if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
      return interaction.reply(payload);
    };

    if (sub === "help") {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
      const png = await buildChaosHelpImage({
        dailyLimit: CHAOS_DAILY_LIMIT,
        cooldownSec: Math.floor(CHAOS_COOLDOWN_MS / 1000),
        teams: TEAM_IDS.map((id) => ({
          id,
          label: CHAOS_TEAM_META[id]?.label || id.toUpperCase(),
          flavor: CHAOS_TEAM_META[id]?.flavor || "",
        })),
      });
      const file = new AttachmentBuilder(png, { name: "chaos-help.png" });
      const c = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "## CHAOS BRIEFING\n" +
          "Use `/chaos team`, then run `/chaos play`. Team is permanent."
        )
      );
      return chaosRespond({ components: [c], files: [file], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }

    if (sub === "team") {
      const choice = String(interaction.options.getString("choice", true) || "").toLowerCase();
      if (!TEAM_IDS.includes(choice)) {
        return interaction.reply(buildErrorV2("Invalid team choice.", "Chaos Team"));
      }
      const res = await setChaosTeam(interaction.user.id, choice);
      if (!res.ok) {
        return interaction.reply(buildErrorV2(res.error || "Team lock failed.", "Chaos Team"));
      }
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
      const t = CHAOS_TEAM_META[choice];
      const png = await buildChaosTeamLockImage({
        username: safeName(interaction.user.username),
        teamLabel: t?.label || choice.toUpperCase(),
        teamCode: choice,
        badge: t?.badge || "-",
        flavor: t?.flavor || "",
      });
      const file = new AttachmentBuilder(png, { name: "chaos-team-lock.png" });
      const c = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("## CHAOS TEAM CONFIRMED\nTeam lock applied permanently.")
      );
      return chaosRespond({ components: [c], files: [file], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "profile") {
      const target = interaction.options.getUser("user") || interaction.user;
      const prof = await getChaosProfile(target.id);
      const wr = prof.games > 0 ? ((prof.wins / prof.games) * 100).toFixed(1) : "0.0";
      const usesLeft = getDailyUsesLeft(prof, CHAOS_DAILY_LIMIT);
      const resetAt = chaosResetUnix();
      const teamText = prof.team ? `${chaosTeamLabel(prof.team)} (${prof.team.toUpperCase()})` : "Unassigned";
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
      const png = await buildChaosProfileImage({
        username: safeName(target.username),
        teamLabel: prof.team ? chaosTeamLabel(prof.team) : "Unassigned",
        teamCode: prof.team || "NONE",
        games: prof.games,
        wins: prof.wins,
        losses: prof.losses,
        winRate: wr,
        totalPoints: prof.totalPoints.toLocaleString("en-US"),
        highestPoints: prof.highestPoints.toLocaleString("en-US"),
        bestStreak: prof.bestStreak,
        dailyLeft: usesLeft,
        dailyLimit: CHAOS_DAILY_LIMIT,
        resetText: `<t:${resetAt}:R>`,
      });
      const file = new AttachmentBuilder(png, { name: "chaos-profile.png" });
      const c = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## CHAOS PROFILE SNAPSHOT\nUser: <@${target.id}> | Team: **${teamText}**`
        )
      );
      return chaosRespond({ components: [c], files: [file], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "leaderboard") {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
      const top = await getChaosLeaderboard(10);
      const teamTop = await getChaosTeamLeaderboard();
      const lines = [];
      for (let i = 0; i < top.length; i++) {
        const row = top[i];
        let name = row.userId;
        try {
          const m = await interaction.guild.members.fetch(row.userId);
          name = safeName(m?.displayName || m?.user?.username || row.userId);
        } catch {}
        const tag = row.team ? ` | ${row.team.toUpperCase()}` : "";
        lines.push(
          `#${i + 1} ${name}${tag} | PTS ${row.totalPoints.toLocaleString("en-US")} | W ${row.wins} | BS ${row.bestStreak}`
        );
      }
      const teamLines = teamTop.map((r, i) =>
        `#${i + 1} ${chaosTeamLabel(r.teamId)} | PTS ${r.totalPoints.toLocaleString("en-US")} | W ${r.wins} | C ${r.clears} | M ${r.members}`
      );
      const png = await buildChaosLeaderboardImage({
        playerRows: lines.length ? lines : ["No player data yet."],
        teamRows: teamLines.length ? teamLines : ["No teams yet."],
        winnerLine: getTeamWinnerLine(teamTop),
      });
      const file = new AttachmentBuilder(png, { name: "chaos-leaderboard.png" });
      const c = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("## CHAOS LEADERBOARD UPDATE\nPlayer + Team war rankings synced.")
      );
      return chaosRespond({ components: [c], files: [file], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "play") {
      const eventKey = normalizeEventKey(interaction.options.getString("event", true));
      const me = await getPlayer(interaction.user.id);
      const prof = await getChaosProfile(interaction.user.id);
      const now = Date.now();
      if (!prof.team) {
        return interaction.reply(
          buildErrorV2(
            "Choose your permanent team first: `/chaos team choice:<vanguard|eclipse|titan>`.",
            "Chaos Team Required"
          )
        );
      }
      const waitMs = CHAOS_COOLDOWN_MS - (now - Number(prof.lastPlayAt || 0));
      if (waitMs > 0) {
        const sec = Math.ceil(waitMs / 1000);
        return interaction.reply(
          buildErrorV2(`Chaos Rift cooldown active. Try again in ${sec}s.`, "Chaos Cooldown")
        );
      }
      const leftBefore = getDailyUsesLeft(prof, CHAOS_DAILY_LIMIT);
      if (leftBefore <= 0) {
        return interaction.reply(
          buildErrorV2(
            `Daily limit reached (${CHAOS_DAILY_LIMIT}/${CHAOS_DAILY_LIMIT}). Reset <t:${chaosResetUnix(now)}:R>.`,
            "Chaos Daily Limit"
          )
        );
      }
      const consume = consumeDailyUse(prof, CHAOS_DAILY_LIMIT);
      if (!consume.ok) {
        return interaction.reply(
          buildErrorV2(
            `Daily limit reached (${CHAOS_DAILY_LIMIT}/${CHAOS_DAILY_LIMIT}). Reset <t:${chaosResetUnix(now)}:R>.`,
            "Chaos Daily Limit"
          )
        );
      }
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
      await setChaosProfile(interaction.user.id, consume.profile);

      const run = playChaosRun();
      const points = Math.max(0, Number(run.points || 0));
      const baseRate = eventKey === "bleach" ? randomInt(13, 19) : randomInt(12, 18);
      let eventReward = Math.max(0, Math.floor(points * baseRate + (run.survived ? randomInt(120, 260) : randomInt(20, 90))));
      let drakoReward = Math.max(0, Math.floor(points / 240) + (run.survived ? randomInt(4, 12) : randomInt(1, 4)));
      const teamRowsNow = await getChaosTeamLeaderboard();
      const teamBonusPct = chaosTeamBonusPercent(teamRowsNow, prof.team);
      const teamEventBonus = Math.floor((eventReward * teamBonusPct) / 100);
      const teamDrakoBonus = Math.max(0, Math.floor((drakoReward * teamBonusPct) / 100));
      eventReward += teamEventBonus;
      drakoReward += teamDrakoBonus;

      if (eventKey === "bleach") me.bleach.reiatsu += eventReward;
      else me.jjk.cursedEnergy += eventReward;
      me.drako += drakoReward;
      await setPlayer(interaction.user.id, me);
      const updatedProf = await recordChaosResult(interaction.user.id, { points, won: run.survived, at: now });
      const teamRowsAfter = await getChaosTeamLeaderboard();
      const teamRank = teamRowsAfter.findIndex((r) => String(r.teamId || "") === String(prof.team || "")) + 1;
      const dailyLeft = getDailyUsesLeft(updatedProf, CHAOS_DAILY_LIMIT);

      const symbol = eventKey === "bleach" ? E_REIATSU : E_CE;
      const resultLine = run.survived ? "Status: **CLEARED**" : "Status: **FAILED**";
      const steps = run.steps.slice(0, 8).map((x) => `- ${x}`).join("\n");
      const rewards = [
        `${symbol} +${eventReward.toLocaleString("en-US")}`,
        `${E_DRAKO} +${drakoReward.toLocaleString("en-US")}`,
        teamBonusPct > 0
          ? `Team Bonus ${teamBonusPct}% => ${symbol} +${teamEventBonus.toLocaleString("en-US")} | ${E_DRAKO} +${teamDrakoBonus.toLocaleString("en-US")}`
          : "Team Bonus: none",
        `Daily Left: ${dailyLeft}/${CHAOS_DAILY_LIMIT}`,
        `Balance: ${eventKey === "bleach" ? `${E_REIATSU} ${me.bleach.reiatsu.toLocaleString("en-US")}` : `${E_CE} ${me.jjk.cursedEnergy.toLocaleString("en-US")}`} | ${E_DRAKO} ${me.drako.toLocaleString("en-US")}`,
      ];
      const png = await buildChaosRunImage({
        username: safeName(interaction.user.username),
        teamLabel: chaosTeamLabel(prof.team),
        badge: chaosTeamBadge(prof.team),
        status: run.survived ? "CLEARED" : "FAILED",
        hp: run.hp,
        points: points.toLocaleString("en-US"),
        teamRank: teamRank || "-",
        steps: (steps ? steps.split("\n").map((x) => x.replace(/^- /, "")) : []).slice(0, 8),
        rewards,
        eventLabel: eventKey === "bleach" ? "BLEACH" : "JJK",
      });
      const file = new AttachmentBuilder(png, { name: "chaos-run.png" });
      const c = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## CHAOS RUN COMPLETE\n<@${interaction.user.id}> | ${resultLine} | Team Rank **#${teamRank || "-"}**`
        )
      );
      return chaosRespond({ components: [c], files: [file], flags: MessageFlags.IsComponentsV2 });
    }
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

    const eventLabel = eventKey === "bleach" ? "BLEACH" : "JJK";
    const eventEmoji = eventKey === "bleach" ? E_REIATSU : E_CE;
    const top = entries
      .map((e, i) => `**#${i + 1}** • ${safeName(e.name)} — ${eventEmoji} **${Math.max(0, Math.floor(Number(e.score || 0))).toLocaleString("en-US")}**`)
      .join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## ${eventEmoji} ${eventLabel} Leaderboard\n` +
          `Server: **${safeName(interaction.guild?.name || "Unknown")}**`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          top || "_No data yet._"
        )
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: false,
    });
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

  /* ===================== /give (new) ===================== */
  if (interaction.commandName === "give") {
    const currency = interaction.options.getString("currency", true);
    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    if (amount < 1) return interaction.reply({ content: "❌ Amount must be >= 1.", ephemeral: true });
    if (target.bot) return interaction.reply({ content: "❌ You can't transfer to a bot.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't transfer to yourself.", ephemeral: true });

    const sender = await getPlayer(interaction.user.id);
    const receiver = await getPlayer(target.id);

    function getBal(p) {
      if (currency === "reiatsu") return p.bleach.reiatsu;
      if (currency === "cursed_energy") return p.jjk.cursedEnergy;
      if (currency === "drako") return p.drako;
      return 0;
    }
    function setBal(p, v) {
      if (currency === "reiatsu") p.bleach.reiatsu = v;
      if (currency === "cursed_energy") p.jjk.cursedEnergy = v;
      if (currency === "drako") p.drako = v;
    }

    const s = getBal(sender);
    if (s < amount) return interaction.reply({ content: `❌ Not enough funds. You have ${s}.`, ephemeral: true });

    setBal(sender, s - amount);
    setBal(receiver, getBal(receiver) + amount);

    await setPlayer(interaction.user.id, sender);
    await setPlayer(target.id, receiver);

    const emoji = currency === "reiatsu" ? E_REIATSU : currency === "cursed_energy" ? E_CE : E_DRAKO;

    return interaction.reply({
      content: `${emoji} **${safeName(interaction.user.username)}** sent **${amount}** to **${safeName(target.username)}**.`,
      ephemeral: false,
    });
  }

  if (interaction.commandName === "exchange_drako") {
    const eventKey = interaction.options.getString("event", true);
    const drakoWanted = interaction.options.getInteger("drako", true);

    const rate = eventKey === "bleach" ? DRAKO_RATE_BLEACH : DRAKO_RATE_JJK;
    const cost = drakoWanted * rate;
    const currencyEmoji = eventKey === "bleach" ? E_REIATSU : `<:ce:${EXCHANGE_CE_EMOJI_ID}>`;

    const p = await getPlayer(interaction.user.id);

    if (eventKey === "bleach") {
      if (p.bleach.reiatsu < cost) {
        return interaction.reply({
          content:
            `Need ${currencyEmoji} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\n` +
            `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
            `You have ${currencyEmoji} **${p.bleach.reiatsu}**.`,
          ephemeral: true,
        });
      }
      p.bleach.reiatsu -= cost;
      p.drako += drakoWanted;
      await setPlayer(interaction.user.id, p);

      const png = await buildExchangeImage({
        eventKey,
        rate,
        cost,
        drakoWanted,
        currencyEmoji,
        drakoEmoji: E_DRAKO,
        afterCurrency: p.bleach.reiatsu,
        afterDrako: p.drako,
      });
      const file = new AttachmentBuilder(png, { name: `exchange-${eventKey}.png` });
      return interaction.reply({ files: [file], ephemeral: false });
    }

    if (p.jjk.cursedEnergy < cost) {
      return interaction.reply({
        content:
          `Need ${currencyEmoji} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\n` +
          `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
          `You have ${currencyEmoji} **${p.jjk.cursedEnergy}**.`,
        ephemeral: true,
      });
    }
    p.jjk.cursedEnergy -= cost;
    p.drako += drakoWanted;
    await setPlayer(interaction.user.id, p);

    const png = await buildExchangeImage({
      eventKey,
      rate,
      cost,
      drakoWanted,
      currencyEmoji,
      drakoEmoji: E_DRAKO,
      afterCurrency: p.jjk.cursedEnergy,
      afterDrako: p.drako,
    });
    const file = new AttachmentBuilder(png, { name: `exchange-${eventKey}.png` });
    return interaction.reply({ files: [file], ephemeral: false });
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

  if (interaction.commandName === "testreciview") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
    }

    const bossId = interaction.options.getString("boss", true);
    const mode = interaction.options.getString("mode", true);
    const def = BOSSES[bossId];
    if (!def) return interaction.reply({ content: "❌ Unknown boss.", ephemeral: true });

    const sampleTop = [
      { name: safeName(interaction.member?.displayName || interaction.user.username), dmg: 45000 },
      { name: "Silvers Rayleigh", dmg: 30000 },
      { name: "Red_thz", dmg: 15000 },
      { name: "Charlotte Katakuri", dmg: 15000 },
    ];

    if (mode === "reward") {
      const png = await buildBossRewardImage(def, {
        rows: [
          { name: sampleTop[0].name, text: "+850 Win | +45 Bank | Total 895 | 12 Shards" },
          { name: sampleTop[1].name, text: "+780 Win | +30 Bank | Total 810" },
          { name: sampleTop[2].name, text: "+720 Win | +15 Bank | Total 735" },
        ],
      });
      const file = new AttachmentBuilder(png, { name: `test-reward-${def.id}.png` });
      return interaction.reply({ files: [file], ephemeral: true });
    }

    if (mode === "action") {
      const png = await buildBossLiveImage(def, {
        phase: "ROUND ACTIVE — COOP BLOCK",
        hpLeft: 1825,
        hpTotal: 1930,
        topDamage: sampleTop,
        noteA: "Status: BEGIN",
        noteB: "Need 4 different players to press Block",
        noteC: "Window ends in 5s",
      });
      const file = new AttachmentBuilder(png, { name: `test-action-${def.id}.png` });
      return interaction.reply({ files: [file], ephemeral: true });
    }

    const victory = mode === "result_win";
    const png = await buildBossResultImage(def, {
      victory,
      topDamage: sampleTop,
      hpLeft: victory ? 0 : 1825,
      hpTotal: 1930,
      survivors: victory ? 3 : 0,
      joined: 4,
      deadOverlay: !victory,
    });
    const file = new AttachmentBuilder(png, { name: `test-result-${def.id}.png` });
    return interaction.reply({ files: [file], ephemeral: true });
  }

  if (interaction.commandName === "spawnmob") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
    }

    const eventKey = interaction.options.getString("event", true);
    if (!MOBS[eventKey]) return interaction.reply({ content: "❌ Unknown event.", ephemeral: true });

    if (!isAllowedSpawnChannel(eventKey, channel.id)) {
      const needed = eventKey === "bleach" ? `<#${BLEACH_CHANNEL_ID}>` : `<#${JJK_CHANNEL_ID}>`;
      return interaction.reply({ content: `❌ This mob can only be spawned in ${needed}.`, ephemeral: true });
    }

    await interaction.reply({ content: `✅ Mob spawned (${eventKey}).`, ephemeral: true });
    await spawnMob(channel, eventKey, { bleachChannelId: BLEACH_CHANNEL_ID, jjkChannelId: JJK_CHANNEL_ID, withPing: true });
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

  /* ===================== /pvpclash ===================== */
  if (interaction.commandName === "pvpclash") {
    const replyPvpError = (text, title = "PvP Clash Error") =>
      interaction.reply(buildErrorV2(text, title));

    const currency = interaction.options.getString("currency", true);
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("user", true);

    if (target.bot) return replyPvpError("You cannot duel a bot.");
    if (target.id === interaction.user.id) return replyPvpError("You cannot duel yourself.");
    if (amount < 1) return replyPvpError("Amount must be greater than 0.");

    const me = await getPlayer(interaction.user.id);
    const today = utcDayKey();
    if (!me.pvpClashDaily || typeof me.pvpClashDaily !== "object") {
      me.pvpClashDaily = { day: today, used: 0 };
    }
    if (String(me.pvpClashDaily.day || "") !== today) {
      me.pvpClashDaily.day = today;
      me.pvpClashDaily.used = 0;
    }
    const bypassLimit = await canBypassCardslashLimit(interaction);
    const usedToday = Math.max(0, Number(me.pvpClashDaily.used || 0));
    if (!bypassLimit && usedToday >= 3) {
      return replyPvpError(
        "You already used /pvpclash 3/3 times today. Try again after daily reset (UTC).",
        "PvP Clash Limit"
      );
    }
    if (!bypassLimit) me.pvpClashDaily.used = usedToday + 1;
    await setPlayer(interaction.user.id, me);

    const key = `${channel.id}:${interaction.user.id}:${target.id}`;
    pvpById.set(key, { createdAt: Date.now(), done: false });

    const remaining = bypassLimit ? "INF" : String(Math.max(0, 3 - Number(me.pvpClashDaily.used || 0)));
    const challengePng = await buildPvpChallengeImage({
      challengerName: safeName(interaction.user.username),
      targetName: safeName(target.username),
      amount,
      currency,
      usesLeft: remaining,
    });
    const challengeFile = new AttachmentBuilder(challengePng, { name: `pvp-challenge-${interaction.user.id}-${target.id}.png` });

    return interaction.reply({
      content:
        `PVP CHALLENGE: <@${target.id}> you were challenged by <@${interaction.user.id}>!\n` +
        `Stake: **${amount} ${currency}**`,
      files: [challengeFile],
      components: pvpButtons(currency, amount, interaction.user.id, target.id, false),
      ephemeral: false,
    });
  }
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
};



