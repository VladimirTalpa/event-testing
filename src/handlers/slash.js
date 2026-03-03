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
  EmbedBuilder,
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

function normalizeEventKey(v) {
  return v === "jjk" ? "jjk" : "bleach";
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

  // ===== BALANCE COMMAND =====
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

  // ===== INVENTORY COMMAND =====
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

  // ===== SHOP COMMAND =====
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

  // ===== DUNGEON SPAWN COMMAND =====
  if (interaction.commandName === "dungeon_spawn") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ No permission.", ephemeral: true });
    }
    
    const { spawnDungeon } = require("../core/dungeon");
    const event = interaction.options.getString("event", true);
    
    await interaction.deferReply();
    
    try {
      const dungeon = await spawnDungeon(event, interaction.channelId);
      
      const embed = new EmbedBuilder()
        .setColor(0x7b2cff)
        .setTitle(`🏰 ${event.toUpperCase()} Dungeon Spawned!`)
        .setDescription(
          `A new raid has appeared!\n\n` +
          `**Objective:** Deal 1000 damage\n` +
          `**Rounds:** Up to 5 rounds\n` +
          `**Time Limit:** 10 minutes`
        )
        .addFields(
          { name: "Dungeon ID", value: `\`${dungeon.id}\``, inline: true },
          { name: "Event", value: event.toUpperCase(), inline: true }
        )
        .setFooter({ text: "Click JOIN to participate!" });
      
      const joinBtn = new ButtonBuilder()
        .setCustomId(`dungeon_join:${dungeon.id}`)
        .setLabel("Join Raid")
        .setStyle(ButtonStyle.Success)
        .setEmoji("⚔️");
      
      const infoBtn = new ButtonBuilder()
        .setCustomId(`dungeon_info:${dungeon.id}`)
        .setLabel("Info")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("ℹ️");
      
      const startBtn = new ButtonBuilder()
        .setCustomId(`dungeon_battle_start:${dungeon.id}`)
        .setLabel("Start Battle")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⚡");
      
      const row = new ActionRowBuilder().addComponents(joinBtn, infoBtn, startBtn);
      
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error("Dungeon spawn error:", error);
      await interaction.editReply({ content: "❌ Failed to spawn dungeon!", ephemeral: true });
    }
  }
};
