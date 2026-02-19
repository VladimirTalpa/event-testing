"use strict";

const {
  buildClanSetupPayload,
  hasClanCreateAccess,
  CLAN_SPECIAL_ROLE_COST,
} = require("../ui/clan-setup-v2");
const {
  createClan,
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

module.exports = async function handleModals(interaction) {
  if (!interaction.customId.startsWith("clanmodal:")) return;
  const action = interaction.customId.split(":")[1];
  const raw = String(interaction.fields.getTextInputValue("value") || "").trim();

  let notice = "";
  let ok = false;

  if (action === "create") {
    if (!hasClanCreateAccess(interaction.member)) {
      notice =
        "You cannot create a clan.\n" +
        "Need allowed create role.\n" +
        `Special role can be bought in setup for ${CLAN_SPECIAL_ROLE_COST.toLocaleString("en-US")}.`;
    } else {
      const [nameRaw, iconRaw] = raw.split("|");
      const res = await createClan({
        ownerId: interaction.user.id,
        name: String(nameRaw || "").trim(),
        icon: String(iconRaw || "").trim(),
      });
      ok = res.ok;
      notice = res.ok ? `Clan created: ${res.clan.name}` : res.error;
    }
  } else if (action === "request") {
    const res = await requestJoinClan({ userId: interaction.user.id, clanName: raw });
    ok = res.ok;
    notice = res.ok ? `Join request sent to ${res.clan.name}.` : res.error;
  } else if (action === "accept") {
    const res = await acceptInvite({ userId: interaction.user.id, clanName: raw });
    ok = res.ok;
    notice = res.ok ? `Invite accepted. Joined ${res.clan.name}.` : res.error;
  } else {
    const uid = parseUserIdInput(raw);
    if (!uid) {
      notice = "Invalid user id / mention.";
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
    member: interaction.member,
    notice: `${ok ? "Success" : "Failed"}: ${notice}`,
  });
  return interaction.reply(payload);
};
