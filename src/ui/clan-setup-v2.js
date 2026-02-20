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
  "1443940262635245598", // booster assistant manager
  "1474147727645474836", // purchasable special role
];

const CLAN_SPECIAL_CREATE_ROLE_ID = "1474147727645474836";
const CLAN_SPECIAL_ROLE_COST = 60000;

function getMemberRoleIds(member) {
  if (!member) return new Set();
  if (member?.roles?.cache) return new Set(member.roles.cache.keys());
  if (Array.isArray(member?.roles)) return new Set(member.roles.map((x) => String(x)));
  if (Array.isArray(member?._roles)) return new Set(member._roles.map((x) => String(x)));
  return new Set();
}

function memberHasRole(member, roleId) {
  const id = String(roleId || "");
  if (!id) return false;
  return getMemberRoleIds(member).has(id);
}

function hasClanCreateAccess(member) {
  const roleIds = getMemberRoleIds(member);
  return CLAN_CREATE_ROLE_IDS.some((id) => roleIds.has(String(id)));
}

function setupButton(id, label, style = ButtonStyle.Secondary, disabled = false) {
  return new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style).setDisabled(disabled);
}

function clanIconPrefix(icon) {
  const s = String(icon || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return "🛡️ ";
  return `${s} `;
}

async function resolveMember(guild, userId, member) {
  if (member?.roles?.cache) return member;
  if (!guild?.members?.fetch) return member;
  return guild.members.fetch(String(userId)).catch(() => member);
}

async function buildClanSetupPayload({ guild, userId, member, notice = "" }) {
  const liveMember = await resolveMember(guild, userId, member);
  const player = await getPlayer(userId);
  const clan = player?.clanId ? await getClan(player.clanId) : null;
  const inClan = !!clan;
  const isOwner = inClan && clan.ownerId === String(userId);
  const canManage = inClan && canManageClan(clan, userId);
  const createAccess = hasClanCreateAccess(liveMember);
  const hasSpecialRole = memberHasRole(liveMember, CLAN_SPECIAL_CREATE_ROLE_ID);
  const activeBoss = clan?.activeBoss && clan.activeBoss.hpCurrent > 0 && clan.activeBoss.endsAt > Date.now()
    ? clan.activeBoss
    : null;

  const statusBlock =
    `### Status\n` +
    `- Clan: ${inClan ? `**${clanIconPrefix(clan.icon)}${clan.name}**` : "_No clan_"}\n` +
    `- Role: ${inClan ? (isOwner ? "**Owner**" : canManage ? "**Officer**" : "**Member**") : "_None_"}\n` +
    `- Create Access: ${createAccess ? "**Yes**" : "**No**"}\n` +
    `- Special Role: ${hasSpecialRole ? "**Owned**" : "**Not owned**"}\n` +
    `- Price: **${CLAN_SPECIAL_ROLE_COST.toLocaleString("en-US")} Reiatsu** or **${CLAN_SPECIAL_ROLE_COST.toLocaleString("en-US")} CE**\n` +
    `- Active Boss: ${activeBoss ? `**${activeBoss.name}** (${activeBoss.hpCurrent}/${activeBoss.hpMax})` : "_None_"}`;

  const queueBlock =
    inClan
      ? `### Queue\n` +
        `- Requests: **${(clan.joinRequests || []).length}**\n` +
        `- Invites: **${(clan.invites || []).length}**\n` +
        `- Members: **${clan.members.length}/30**\n` +
        `- Weekly: DMG **${clan.weekly.totalDamage}** | Clears **${clan.weekly.bossClears}** | Activity **${clan.weekly.activity}**`
      : `### Queue\n- Join or create a clan to unlock all clan actions.`;

  const iconGuide =
    `### Icon Guide\n` +
    `- Upload image in Discord -> Right click -> **Copy Link**\n` +
    `- Use format: \`ClanName|https://cdn.discordapp.com/.../icon.png\``;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## CLAN CONTROL CENTER\nUser: <@${userId}>`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${statusBlock}\n\n${queueBlock}\n\n${iconGuide}`));

  if (notice) {
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Last Action\n${notice}`));
  }

  container
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Actions"))
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
        setupButton("clanui:buyrole:bleach", "Buy Access B", ButtonStyle.Secondary, hasSpecialRole),
        setupButton("clanui:buyrole:jjk", "Buy Access J", ButtonStyle.Secondary, hasSpecialRole),
        setupButton("clanui:help", "Help", ButtonStyle.Secondary, false),
        setupButton("clanui:info", "Clan Info PNG", ButtonStyle.Secondary, !inClan),
        setupButton("clanui:leaderboard", "Weekly LB", ButtonStyle.Secondary, false)
      )
    )
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
        setupButton("clanui:transfer", "Transfer Owner", ButtonStyle.Primary, !isOwner),
        setupButton("clanui:boss:status", "Boss Status", ButtonStyle.Secondary, !inClan),
        setupButton("clanui:boss:hit", "Hit Active", ButtonStyle.Secondary, !(inClan && activeBoss))
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:boss:start:bleach", "Start Boss B", ButtonStyle.Primary, !canManage),
        setupButton("clanui:boss:start:jjk", "Start Boss J", ButtonStyle.Primary, !canManage)
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
    "### Core\n" +
    "- `/clan setup` opens the full control panel.\n" +
    "- `/clan help` shows this guide.\n\n" +
    "### Create Access Roles\n" +
    "- <@&1472494294173745223>\n" +
    "- <@&1443940262635245598>\n" +
    "- <@&1474147727645474836> (buyable)\n\n" +
    "### Special Role Purchase\n" +
    "- Cost: **60,000 Reiatsu** or **60,000 Cursed Energy**\n" +
    "- Buy in `/clan setup` with **Buy Access B/J** buttons.\n\n" +
    "### Clan Icon URL\n" +
    "1. Upload image in Discord.\n" +
    "2. Right click -> Copy Link.\n" +
    "3. Create format: `Name|ImageURL`\n" +
    "4. Example: `Shadow Core|https://cdn.discordapp.com/attachments/.../icon.png`\n\n" +
    "### Applications\n" +
    "- Member clicks **Request Join** with clan name.\n" +
    "- Owner/officer opens **View Queue**.\n" +
    "- Use **Approve/Deny** with mention, user ID, or queue index (`1`, `2`, ...).\n"
  );
}

module.exports = {
  CLAN_CREATE_ROLE_IDS,
  CLAN_SPECIAL_CREATE_ROLE_ID,
  CLAN_SPECIAL_ROLE_COST,
  memberHasRole,
  hasClanCreateAccess,
  buildClanSetupPayload,
  buildClanHelpText,
};
