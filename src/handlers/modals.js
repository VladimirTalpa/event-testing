"use strict";

const {
  buildClanSetupPayload,
  hasClanCreateAccess,
  CLAN_SPECIAL_ROLE_COST,
} = require("../ui/clan-setup-v2");
const { getPlayer } = require("../core/players");
const {
  createClan,
  getClan,
  requestJoinClan,
  acceptInvite,
  inviteToClan,
  approveJoinRequest,
  denyJoinRequest,
  promoteOfficer,
  demoteOfficer,
  transferOwnership,
  kickMember,
} = require("../core/clans");

function parseUserIdInput(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  const m = s.match(/\d{17,20}/);
  return m ? m[0] : "";
}

function normalizeClanNameInput(v) {
  return String(v || "")
    .replace(/^clan\s*:\s*/i, "")
    .replace(/^name\s*:\s*/i, "")
    .replace(/^join\s+/i, "")
    .trim();
}

function extractNameAndIcon(rawInput) {
  const raw = String(rawInput || "").trim();
  if (!raw) return { name: "", icon: "" };
  if (raw.includes("|")) {
    const [nameRaw, iconRaw] = raw.split("|");
    return {
      name: normalizeClanNameInput(String(nameRaw || "")),
      icon: String(iconRaw || "").trim(),
    };
  }
  const urlMatch = raw.match(/https?:\/\/\S+/i);
  if (!urlMatch) {
    return { name: normalizeClanNameInput(raw), icon: "" };
  }
  const icon = String(urlMatch[0] || "").trim();
  const name = normalizeClanNameInput(raw.replace(icon, "").trim());
  return { name, icon };
}

async function resolveRequestTargetId(action, userId, raw) {
  const uid = parseUserIdInput(raw);
  if (uid) return uid;
  if (action !== "approve" && action !== "deny") return "";

  const idx = Number(String(raw || "").trim());
  if (!Number.isInteger(idx) || idx < 1) return "";
  const me = await getPlayer(userId);
  if (!me?.clanId) return "";
  const clan = await getClan(me.clanId);
  if (!clan) return "";
  const row = (clan.joinRequests || [])[idx - 1];
  return row?.userId ? String(row.userId) : "";
}

module.exports = async function handleModals(interaction) {
  if (!interaction.customId.startsWith("clanmodal:")) return;
  const action = interaction.customId.split(":")[1];
  const raw = String(interaction.fields.getTextInputValue("value") || "").trim();
  const clanNameInput = normalizeClanNameInput(raw);

  let notice = "";
  let ok = false;

  if (action === "create") {
    const liveMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => interaction.member);
    if (!hasClanCreateAccess(liveMember)) {
      notice =
        "You cannot create a clan.\n" +
        "Need allowed create role.\n" +
        `Special role can be bought in setup for ${CLAN_SPECIAL_ROLE_COST.toLocaleString("en-US")}.`;
    } else {
      const parsed = extractNameAndIcon(raw);
      const res = await createClan({
        ownerId: interaction.user.id,
        name: parsed.name,
        icon: parsed.icon,
      });
      ok = res.ok;
      notice = res.ok ? `Clan created: ${res.clan.name}` : res.error;
    }
  } else if (action === "request") {
    const res = await requestJoinClan({ userId: interaction.user.id, clanName: clanNameInput });
    ok = res.ok;
    notice = res.ok ? `Join request sent to ${res.clan.name}.` : res.error;
    if (res.ok && res.clan?.ownerId) {
      const owner = await interaction.client.users.fetch(String(res.clan.ownerId)).catch(() => null);
      if (owner) {
        await owner.send(
          `New clan application for **${res.clan.name}**\n` +
          `User: <@${interaction.user.id}> (${interaction.user.id})\n` +
          `Open \`/clan setup\` -> **View Queue** -> **Approve** or **Deny**`
        ).catch(() => {});
      }
    }
  } else if (action === "accept") {
    const res = await acceptInvite({ userId: interaction.user.id, clanName: clanNameInput });
    ok = res.ok;
    notice = res.ok ? `Invite accepted. Joined ${res.clan.name}.` : res.error;
  } else {
    const uid = await resolveRequestTargetId(action, interaction.user.id, raw);
    if (!uid) {
      if (action === "approve" || action === "deny") {
        notice = "Invalid user id / mention / queue index.";
      } else {
        notice = "Invalid user id / mention.";
      }
    } else if (action === "invite") {
      const res = await inviteToClan({ managerId: interaction.user.id, targetUserId: uid });
      ok = res.ok;
      notice = res.ok ? `Invite sent to <@${uid}>.` : res.error;
    } else if (action === "approve") {
      const res = await approveJoinRequest({ managerId: interaction.user.id, userId: uid });
      ok = res.ok;
      notice = res.ok ? `Approved <@${uid}>.` : res.error;
    } else if (action === "deny") {
      const res = await denyJoinRequest({ managerId: interaction.user.id, userId: uid });
      ok = res.ok;
      notice = res.ok ? `Denied request from <@${uid}>.` : res.error;
    } else if (action === "promote") {
      const res = await promoteOfficer({ ownerId: interaction.user.id, targetUserId: uid });
      ok = res.ok;
      notice = res.ok ? `Promoted <@${uid}> to officer.` : res.error;
    } else if (action === "demote") {
      const res = await demoteOfficer({ ownerId: interaction.user.id, targetUserId: uid });
      ok = res.ok;
      notice = res.ok ? `Demoted <@${uid}> to member.` : res.error;
    } else if (action === "transfer") {
      const res = await transferOwnership({ ownerId: interaction.user.id, targetUserId: uid });
      ok = res.ok;
      notice = res.ok ? `Ownership transferred to <@${uid}>.` : res.error;
    } else if (action === "kick") {
      const res = await kickMember({ managerId: interaction.user.id, targetUserId: uid });
      ok = res.ok;
      notice = res.ok ? `Kicked <@${uid}> from clan.` : res.error;
    } else {
      notice = "Unknown modal action.";
    }
  }

  const payload = await buildClanSetupPayload({
    guild: interaction.guild,
    userId: interaction.user.id,
    member: await interaction.guild.members.fetch(interaction.user.id).catch(() => interaction.member),
    notice: `${ok ? "Success" : "Failed"}: ${notice}`,
  });
  return interaction.reply(payload);
};
