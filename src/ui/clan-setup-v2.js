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
  if (/^https?:\/\//i.test(s)) return "[ICON] ";
  return `${s} `;
}

function clanThemeTag(clan) {
  if (!clan) return "NEUTRAL";
  const n = String(clan.name || "").toLowerCase();
  if (n.includes("bleach")) return "EMBER";
  if (n.includes("jjk")) return "CRIMSON";
  return n.length % 2 === 0 ? "CYBER" : "AURORA";
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

  const theme = clanThemeTag(clan);
  const roleText = inClan ? (isOwner ? "OWNER" : canManage ? "OFFICER" : "MEMBER") : "NONE";

  const headerBlock =
    `## CLAN WAR CONSOLE\n` +
    `Theme: **${theme}**\n` +
    `User: <@${userId}>`;

  const statusBlock =
    `### Core Status\n` +
    `- Clan: ${inClan ? `**${clanIconPrefix(clan.icon)}${clan.name}**` : "**NO CLAN**"}\n` +
    `- Permission Tier: **${roleText}**\n` +
    `- Create Access: **${createAccess ? "UNLOCKED" : "LOCKED"}**\n` +
    `- Special Create Role: **${hasSpecialRole ? "OWNED" : "NOT OWNED"}**\n` +
    `- Unlock Cost: **${CLAN_SPECIAL_ROLE_COST.toLocaleString("en-US")} Reiatsu** or **${CLAN_SPECIAL_ROLE_COST.toLocaleString("en-US")} CE**`;

  const queueBlock =
    inClan
      ? `### Queue + Weekly\n` +
        `- Join Requests: **${(clan.joinRequests || []).length}**\n` +
        `- Active Invites: **${(clan.invites || []).length}**\n` +
        `- Members: **${clan.members.length}/30**\n` +
        `- Weekly Damage: **${clan.weekly.totalDamage.toLocaleString("en-US")}**\n` +
        `- Weekly Clears: **${clan.weekly.bossClears}**\n` +
        `- Weekly Activity: **${clan.weekly.activity}**`
      : `### Queue + Weekly\n- Join or create a clan to unlock raids, leaderboard and queue tools.`;

  const bossBlock =
    `### Clan Boss\n` +
    `- Status: ${activeBoss ? "**ONLINE**" : "**OFFLINE**"}\n` +
    `- Boss: ${activeBoss ? `**${activeBoss.name}**` : "_None_"}\n` +
    `- HP: ${activeBoss ? `**${activeBoss.hpCurrent}/${activeBoss.hpMax}**` : "_-_"}`;

  const iconGuide =
    `### Icon Guide\n` +
    `- Upload image in Discord -> Right click -> **Copy Link**\n` +
    `- Create clan input format: \`ClanName|https://cdn.discordapp.com/.../icon.png\``;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerBlock))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${statusBlock}\n\n${queueBlock}\n\n${bossBlock}\n\n${iconGuide}`));

  if (notice) {
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Last Action\n${notice}`));
  }

  container
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Panel Actions (Modern Layout)"))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:refresh", "Refresh Panel", ButtonStyle.Secondary, false),
        setupButton("clanui:help", "Guide", ButtonStyle.Secondary, false),
        setupButton("clanui:create", "Create Clan", ButtonStyle.Primary, inClan),
        setupButton("clanui:request", "Join Request", ButtonStyle.Secondary, inClan),
        setupButton("clanui:accept", "Accept Invite", ButtonStyle.Success, inClan)
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:buyrole:bleach", "Buy Access (Bleach)", ButtonStyle.Secondary, hasSpecialRole),
        setupButton("clanui:buyrole:jjk", "Buy Access (JJK)", ButtonStyle.Secondary, hasSpecialRole),
        setupButton("clanui:requests", "Queue Viewer", ButtonStyle.Secondary, !canManage),
        setupButton("clanui:invite", "Invite User", ButtonStyle.Secondary, !canManage),
        setupButton("clanui:leave", "Leave Clan", ButtonStyle.Danger, !inClan)
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:approve", "Approve Req", ButtonStyle.Success, !canManage),
        setupButton("clanui:deny", "Deny Req", ButtonStyle.Danger, !canManage),
        setupButton("clanui:promote", "Promote", ButtonStyle.Secondary, !isOwner),
        setupButton("clanui:demote", "Demote", ButtonStyle.Secondary, !isOwner),
        setupButton("clanui:kick", "Kick Member", ButtonStyle.Danger, !canManage)
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:transfer", "Transfer Owner", ButtonStyle.Primary, !isOwner),
        setupButton("clanui:boss:start:bleach", "Start Boss B", ButtonStyle.Primary, !canManage),
        setupButton("clanui:boss:start:jjk", "Start Boss J", ButtonStyle.Primary, !canManage),
        setupButton("clanui:boss:status", "Boss HUD", ButtonStyle.Secondary, !inClan),
        setupButton("clanui:boss:hit", "Raid Hit", ButtonStyle.Secondary, !(inClan && activeBoss))
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        setupButton("clanui:info", "My Clan PNG", ButtonStyle.Secondary, !inClan),
        setupButton("clanui:leaderboard", "Clan Weekly PNG", ButtonStyle.Secondary, false)
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: [container],
  };
}

function buildClanHelpText() {
  return (
    "## CLAN HELP | SETUP FLOW\n" +
    "### Core\n" +
    "- `/clan setup` opens the modern control panel.\n" +
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
    "### Applications & Queue\n" +
    "- Player uses **Join Request** and enters clan name.\n" +
    "- Owner/Officer opens **Queue Viewer**.\n" +
    "- Use **Approve Req / Deny Req** with mention, user ID, or queue index (`1`, `2`, ...).\n\n" +
    "### Raid Ops\n" +
    "- Start raid: **Start Boss B/J**\n" +
    "- Hit raid: **Raid Hit**\n" +
    "- Snapshot: **Boss HUD**, **My Clan PNG**, **Clan Weekly PNG**\n"
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
