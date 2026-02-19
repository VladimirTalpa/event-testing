"use strict";

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { getPlayer } = require("../core/players");
const { getClan, canManageClan } = require("../core/clans");

const CLAN_CREATE_ROLE_IDS = [
  "1472494294173745223", // owner/co-owner/software tech dev
  "1443940262635245598", // booster 
  "1474147727645474836", // purchasable special in shop you can change it later on if you want it to be something else
];

const CLAN_SPECIAL_CREATE_ROLE_ID = "1474147727645474836";
const CLAN_SPECIAL_ROLE_COST = 60000;

function hasClanCreateAccess(member) {
  if (!member?.roles?.cache) return false;
  return CLAN_CREATE_ROLE_IDS.some((id) => member.roles.cache.has(id));
}

function setupButton(id, label, style = ButtonStyle.Secondary, disabled = false) {
  return new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style).setDisabled(disabled);
}

async function buildClanSetupPayload({ guild, userId, member, notice = "" }) {
  const player = await getPlayer(userId);
  const clan = player?.clanId ? await getClan(player.clanId) : null;
  const inClan = !!clan;
  const isOwner = inClan && clan.ownerId === String(userId);
  const canManage = inClan && canManageClan(clan, userId);
  const createAccess = hasClanCreateAccess(member);
  const activeBoss = clan?.activeBoss && clan.activeBoss.hpCurrent > 0 && clan.activeBoss.endsAt > Date.now()
    ? clan.activeBoss
    : null;

  const header =
    `## CLAN CONTROL CENTER\n` +
    `User: <@${userId}>`;
  const status =
    `### Status\n` +
    `- Clan: ${inClan ? `**${clan.icon ? `${clan.icon} ` : ""}${clan.name}**` : "_No clan_"}\n` +
    `- Role: ${inClan ? (isOwner ? "**Owner**" : canManage ? "**Officer**" : "**Member**") : "_None_"}\n` +
    `- Create Access: ${createAccess ? "**Yes**" : "**No**"}\n` +
    `- Special Role: ${member?.roles?.cache?.has(CLAN_SPECIAL_CREATE_ROLE_ID) ? "**Owned**" : "**Not owned**"}\n` +
    `- Special Role Price: **${CLAN_SPECIAL_ROLE_COST.toLocaleString("en-US")} Reiatsu** or **${CLAN_SPECIAL_ROLE_COST.toLocaleString("en-US")} CE**\n` +
    `- Active Clan Boss: ${activeBoss ? `**${activeBoss.name}** (${activeBoss.hpCurrent}/${activeBoss.hpMax})` : "_None_"}`;
  const queue =
    inClan
      ? `### Queue\n` +
        `- Requests: **${(clan.joinRequests || []).length}**\n` +
        `- Invites: **${(clan.invites || []).length}**\n` +
        `- Members: **${clan.members.length}/30**\n` +
        `- Weekly: DMG **${clan.weekly.totalDamage}** | Clears **${clan.weekly.bossClears}** | Activity **${clan.weekly.activity}**`
      : `### Queue\n- Join a clan or create one to unlock clan content.`;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(header))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${status}\n\n${queue}`));

  if (notice) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Last Action\n${notice}`));
  }

  container
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Clan Access"))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:refresh", "Refresh", ButtonStyle.Secondary, false),
        setupButton("clanui:create", "Create", ButtonStyle.Primary, inClan),
        setupButton("clanui:request", "Request Join", ButtonStyle.Secondary, inClan),
        setupButton("clanui:accept", "Accept Invite", ButtonStyle.Secondary, inClan),
        setupButton("clanui:leave", "Leave", ButtonStyle.Danger, !inClan)
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:buyrole:bleach", "Buy Access (Bleach)", ButtonStyle.Secondary, member?.roles?.cache?.has(CLAN_SPECIAL_CREATE_ROLE_ID)),
        setupButton("clanui:buyrole:jjk", "Buy Access (JJK)", ButtonStyle.Secondary, member?.roles?.cache?.has(CLAN_SPECIAL_CREATE_ROLE_ID)),
        setupButton("clanui:help", "Help", ButtonStyle.Secondary, false)
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Clan Management"))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:requests", "View Queue", ButtonStyle.Secondary, !canManage),
        setupButton("clanui:invite", "Invite", ButtonStyle.Secondary, !canManage),
        setupButton("clanui:approve", "Approve", ButtonStyle.Success, !canManage),
        setupButton("clanui:deny", "Deny", ButtonStyle.Danger, !canManage),
        setupButton("clanui:kick", "Kick", ButtonStyle.Danger, !canManage)
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:promote", "Promote", ButtonStyle.Secondary, !isOwner),
        setupButton("clanui:demote", "Demote", ButtonStyle.Secondary, !isOwner),
        setupButton("clanui:transfer", "Transfer Owner", ButtonStyle.Primary, !isOwner)
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Clan Boss / Ranking"))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:boss:start:bleach", "Start Boss B", ButtonStyle.Primary, !canManage),
        setupButton("clanui:boss:start:jjk", "Start Boss J", ButtonStyle.Primary, !canManage),
        setupButton("clanui:boss:hit:bleach", "Hit B", ButtonStyle.Secondary, !inClan),
        setupButton("clanui:boss:hit:jjk", "Hit J", ButtonStyle.Secondary, !inClan),
        setupButton("clanui:boss:status", "Boss Status", ButtonStyle.Secondary, !inClan)
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:leaderboard", "Weekly Leaderboard", ButtonStyle.Secondary, false),
        setupButton("clanui:info", "Clan Info PNG", ButtonStyle.Secondary, !inClan)
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [container],
  };
}

function buildClanHelpText() {
  return (
    "## CLAN HELP\n" +
    "### Commands\n" +
    "- `/clan setup` opens full clan control panel.\n" +
    "- `/clan help` shows this guide.\n\n" +
    "### Create Access Roles\n" +
    "- <@&1472494294173745223>\n" +
    "- <@&1443940262635245598>\n" +
    "- <@&1474147727645474836> (buyable)\n\n" +
    "### Buyable Special Role\n" +
    "- Cost: **60,000 Reiatsu** or **60,000 Cursed Energy**\n" +
    "- Buy inside `/clan setup` using the Buy Access buttons.\n\n" +
    "### Clan Loop\n" +
    "1. Request/Accept/Invite into clan.\n" +
    "2. Owner/Officer manages queue and roster.\n" +
    "3. Start clan boss, members hit boss with cards.\n" +
    "4. Claim rewards by contribution.\n" +
    "5. Push weekly ranking."
  );
}

module.exports = {
  CLAN_CREATE_ROLE_IDS,
  CLAN_SPECIAL_CREATE_ROLE_ID,
  CLAN_SPECIAL_ROLE_COST,
  hasClanCreateAccess,
  buildClanSetupPayload,
  buildClanHelpText,
};
