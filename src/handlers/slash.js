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
const { findCard, getCardById, cardStatsAtLevel, cardPower, CARD_MAX_LEVEL, CARD_POOL } = require("../data/cards");
const {
  MAX_CLAN_MEMBERS,
  CLAN_CREATE_COST_DRAKO,
  getClan,
  findClanByName,
  createClan,
  joinClan,
  leaveClan,
  startClanBoss,
  hitClanBoss,
  getClanWeeklyLeaderboard,
} = require("../core/clans");

const { spawnBoss } = require("../events/boss");
const { spawnMob } = require("../events/mob");
const { pvpById } = require("../core/state");
const EXCHANGE_CE_EMOJI_ID = "1473448154220335339";

function getEventCardsMap(player, eventKey) {
  return eventKey === "bleach" ? (player?.cards?.bleach || {}) : (player?.cards?.jjk || {});
}

function getEventLevelsMap(player, eventKey) {
  return eventKey === "bleach" ? (player?.cardLevels?.bleach || {}) : (player?.cardLevels?.jjk || {});
}

function normalizeEventKey(v) {
  return v === "jjk" ? "jjk" : "bleach";
}

function strongestOwnedCard(player, eventKey) {
  const cardsMap = getEventCardsMap(player, eventKey);
  const levels = getEventLevelsMap(player, eventKey);
  let best = null;
  for (const [cardId, amountRaw] of Object.entries(cardsMap)) {
    const amount = Math.max(0, Number(amountRaw || 0));
    if (amount <= 0) continue;
    const card = getCardById(eventKey, cardId);
    if (!card) continue;
    const lv = Math.max(1, Number(levels[cardId] || 1));
    const stats = cardStatsAtLevel(card, lv);
    const power = cardPower(stats);
    if (!best || power > best.power) best = { card, level: lv, amount, stats, power };
  }
  return best;
}

const DUO_RECIPES = {
  jjk: [
    { a: "jjk_yuji", b: "jjk_todo", duoId: "duo_jjk_itadori_todo", name: "Itadori x Todo Duo" },
    { a: "jjk_gojo", b: "jjk_nanami", duoId: "duo_jjk_gojo_nanami", name: "Gojo x Nanami Duo" },
    { a: "jjk_sukuna", b: "jjk_megumi", duoId: "duo_jjk_sukuna_megumi", name: "Sukuna x Megumi Duo" },
  ],
  bleach: [],
};

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

function utcDayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
    const eventKey = normalizeEventKey(interaction.options.getString("event", true));
    const myCardQuery = interaction.options.getString("card", true);
    const enemy = interaction.options.getUser("user", true);
    const enemyCardQuery = interaction.options.getString("enemy_card");

    if (enemy.bot) return interaction.reply({ content: "You cannot clash with a bot.", ephemeral: true });
    if (enemy.id === interaction.user.id) return interaction.reply({ content: "Pick another user.", ephemeral: true });

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
    const usedToday = Math.max(0, Number(me.cardClashDaily.used || 0));
    if (usedToday >= 3) {
      const err = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("## CARD CLASH LIMIT")
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "You already used `/cardslash` **3/3** times today.\n" +
            "Try again after daily reset (UTC)."
          )
        );
      return interaction.reply({
        components: [err],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }
    const myCard = findCard(eventKey, myCardQuery);
    if (!myCard) return interaction.reply({ content: "Your card was not found.", ephemeral: true });

    const myAmount = Math.max(0, Number(getEventCardsMap(me, eventKey)[myCard.id] || 0));
    if (myAmount <= 0) return interaction.reply({ content: "You do not own that card.", ephemeral: true });

    const myLevel = Math.max(1, Number(getEventLevelsMap(me, eventKey)[myCard.id] || 1));
    const myStats = cardStatsAtLevel(myCard, myLevel);
    const myPower = cardPower(myStats);

    let enemyPick = null;
    if (enemyCardQuery) {
      const c = findCard(eventKey, enemyCardQuery);
      if (!c) return interaction.reply({ content: "Enemy card query not found.", ephemeral: true });
      const amount = Math.max(0, Number(getEventCardsMap(op, eventKey)[c.id] || 0));
      if (amount <= 0) return interaction.reply({ content: "Enemy does not own that card.", ephemeral: true });
      const lv = Math.max(1, Number(getEventLevelsMap(op, eventKey)[c.id] || 1));
      const stats = cardStatsAtLevel(c, lv);
      enemyPick = { card: c, level: lv, stats, power: cardPower(stats) };
    } else {
      enemyPick = strongestOwnedCard(op, eventKey);
      if (!enemyPick) return interaction.reply({ content: "Enemy has no card in this event.", ephemeral: true });
    }

    me.cardClashDaily.used = usedToday + 1;

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

    const eventCurrency = eventKey === "bleach" ? "Reiatsu" : "Cursed Energy";
    const remaining = Math.max(0, 3 - Number(me.cardClashDaily.used || 0));
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "## CARD SLASH | " + eventKey.toUpperCase() + "\n" +
          "<@" + interaction.user.id + "> vs <@" + enemy.id + ">"
        )
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### Matchup\n" +
          "- <@" + interaction.user.id + ">: **" + myCard.name + "** (Lv." + myLevel + ", PWR " + myPower + ")\n" +
          "- <@" + enemy.id + ">: **" + enemyPick.card.name + "** (Lv." + enemyPick.level + ", PWR " + enemyPick.power + ")"
        )
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### Result\n" +
          "- Winner: <@" + winnerId + ">\n" +
          "- Loser: <@" + loserId + ">\n" +
          "- Impact: **" + diff + "**"
        )
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### Rewards\n" +
          "- Winner: **+" + winnerEventReward + " " + eventCurrency + "** + **" + winnerDrakoReward + " Drako**\n" +
          "- Loser: **+" + loserEventReward + " " + eventCurrency + "** + **" + loserDrakoReward + " Drako**\n" +
          "\nUses left today: **" + remaining + "/3**"
        )
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: false,
    });
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
    const eventKey = normalizeEventKey(interaction.options.getString("event", true));
    const qa = interaction.options.getString("card_a", true);
    const qb = interaction.options.getString("card_b", true);
    const pa = findCard(eventKey, qa);
    const pb = findCard(eventKey, qb);
    if (!pa || !pb) return interaction.reply({ content: "One or both cards not found.", ephemeral: true });
    if (pa.id === pb.id) return interaction.reply({ content: "Choose two different cards.", ephemeral: true });

    const recipes = DUO_RECIPES[eventKey] || [];
    const rec = recipes.find((r) => {
      const set = new Set([r.a, r.b]);
      return set.has(pa.id) && set.has(pb.id);
    });
    if (!rec) {
      return interaction.reply({ content: "This pair has no duo fusion recipe yet.", ephemeral: true });
    }

    const p = await getPlayer(interaction.user.id);
    ensureCardSystems(p);
    const cardsMap = eventKey === "jjk" ? p.cards.jjk : p.cards.bleach;
    const mastery = eventKey === "jjk" ? p.cardMastery.jjk : p.cardMastery.bleach;
    const duoMap = eventKey === "jjk" ? p.duoCards.jjk : p.duoCards.bleach;

    const amountA = Math.max(0, Number(cardsMap[pa.id] || 0));
    const amountB = Math.max(0, Number(cardsMap[pb.id] || 0));
    const ma = Math.max(1, Number(mastery[pa.id] || 1));
    const mb = Math.max(1, Number(mastery[pb.id] || 1));
    if (amountA <= 0 || amountB <= 0) return interaction.reply({ content: "You must own both cards.", ephemeral: true });
    if (ma < 3 || mb < 3) {
      return interaction.reply({ content: "Both cards must be M3 to fuse.", ephemeral: true });
    }

    cardsMap[pa.id] = amountA - 1;
    cardsMap[pb.id] = amountB - 1;
    duoMap[rec.duoId] = Math.max(0, Number(duoMap[rec.duoId] || 0)) + 1;
    await setPlayer(interaction.user.id, p);

    const c = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## DUO FUSION SUCCESS\n` +
        `Fusion: **${rec.name}**\n` +
        `Duo Card ID: \`${rec.duoId}\`\n` +
        `Owned Duo Copies: **${duoMap[rec.duoId]}**`
      )
    );
    return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }

  if (interaction.commandName === "clan") {
    const sub = interaction.options.getSubcommand(true);
    if (sub === "create") {
      const name = interaction.options.getString("name", true);
      const icon = interaction.options.getString("icon") || "";
      const res = await createClan({ ownerId: interaction.user.id, name, icon });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      const clan = res.clan;
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## CLAN CREATED\n` +
          `${clan.icon ? `${clan.icon} ` : ""}**${clan.name}**\n` +
          `Owner: <@${clan.ownerId}>\n` +
          `Members: **${clan.members.length}/${MAX_CLAN_MEMBERS}**\n` +
          `Cost: **${CLAN_CREATE_COST_DRAKO} Drako**`
        )
      );
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "join") {
      const name = interaction.options.getString("name", true);
      const res = await joinClan({ userId: interaction.user.id, clanName: name });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      return interaction.reply({
        components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## CLAN JOINED\nYou joined **${res.clan.name}**.`))],
        flags: MessageFlags.IsComponentsV2,
      });
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
      const hasBoss = !!(clan.activeBoss && clan.activeBoss.hpCurrent > 0 && clan.activeBoss.endsAt > Date.now());
      const bossText = hasBoss
        ? `${clan.activeBoss.name} | ${clan.activeBoss.hpCurrent}/${clan.activeBoss.hpMax} HP`
        : "No active clan boss";
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## CLAN INFO\n` +
          `${clan.icon ? `${clan.icon} ` : ""}**${clan.name}**\n` +
          `Owner: <@${clan.ownerId}>\n` +
          `Members: **${clan.members.length}/${MAX_CLAN_MEMBERS}**\n` +
          `Weekly: DMG **${clan.weekly.totalDamage}** | Clears **${clan.weekly.bossClears}** | Activity **${clan.weekly.activity}**\n` +
          `Boss: ${bossText}\n` +
          `${memberMentions ? `\nMembers:\n${memberMentions}` : ""}`
        )
      );
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  }

  if (interaction.commandName === "clanboss") {
    const sub = interaction.options.getSubcommand(true);
    if (sub === "start") {
      const eventKey = normalizeEventKey(interaction.options.getString("event", true));
      const res = await startClanBoss({ userId: interaction.user.id, eventKey });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      const boss = res.clan.activeBoss;
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
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (sub === "hit") {
      const eventKey = normalizeEventKey(interaction.options.getString("event", true));
      const res = await hitClanBoss({ userId: interaction.user.id, cardEventKey: eventKey });
      if (!res.ok) return interaction.reply({ content: res.error, ephemeral: true });
      const boss = res.clan.activeBoss;
      if (!res.cleared) {
        const c = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## CLAN BOSS HIT\n` +
            `Damage: **${res.dmg}**\n` +
            `Boss HP: **${boss.hpCurrent}/${boss.hpMax}**\n` +
            `Event: **${boss.eventKey.toUpperCase()}**`
          )
        );
        return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
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
      return interaction.reply({ components: [clear], flags: MessageFlags.IsComponentsV2 });
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
      return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }

  if (interaction.commandName === "clanleaderboard") {
    const rows = await getClanWeeklyLeaderboard(10);
    const lines = rows.map((r, i) =>
      `**#${i + 1}** ${r.icon ? `${r.icon} ` : ""}**${safeName(r.name)}** | Score **${r.score}** | DMG ${r.damage} | Clears ${r.clears} | Activity ${r.activity}`
    );
    const c = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## WEEKLY CLAN LEADERBOARD\n` +
        `Ranked by damage + activity + boss clears.\n\n` +
        `${lines.join("\n") || "_No clans yet._"}`
      )
    );
    return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
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
    const currency = interaction.options.getString("currency", true);
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("user", true);

    if (target.bot) return interaction.reply({ content: "❌ You can't duel a bot.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't duel yourself.", ephemeral: true });
    if (amount < 1) return interaction.reply({ content: "❌ Amount must be >= 1.", ephemeral: true });

    const key = `${channel.id}:${interaction.user.id}:${target.id}`;
    pvpById.set(key, { createdAt: Date.now(), done: false });

    return interaction.reply({
      content:
        `⚔️ <@${target.id}> you were challenged by <@${interaction.user.id}>!\n` +
        `Stake: **${amount} ${currency}**`,
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


