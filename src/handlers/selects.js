// src/handlers/selects.js
const { getPlayer } = require("../core/players");
const { wardrobeEmbed } = require("../ui/embeds");
const { wardrobeComponents } = require("../ui/components");
const { buildShopV2Payload } = require("../ui/shop-v2");

async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has("ManageRoles")) return { ok: false, reason: "Missing Manage Roles permission." };
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role add." };
  }
}
async function tryRemoveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has("ManageRoles")) return { ok: false, reason: "Missing Manage Roles permission." };
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.remove(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role remove." };
  }
}

module.exports = async function handleSelects(interaction) {
  if (interaction.customId.startsWith("shopv2_event:")) {
    const [, pageRaw] = interaction.customId.split(":");
    const eventKey = interaction.values?.[0] === "jjk" ? "jjk" : "bleach";
    const p = await getPlayer(interaction.user.id);
    return interaction.update(buildShopV2Payload({
      eventKey,
      player: p,
      page: Number(pageRaw || 0),
      selectedKey: null,
    }));
  }

  if (interaction.customId.startsWith("shopv2_pick:")) {
    const [, eventKeyRaw, pageRaw] = interaction.customId.split(":");
    const eventKey = eventKeyRaw === "jjk" ? "jjk" : "bleach";
    const selectedKey = interaction.values?.[0] || null;
    const p = await getPlayer(interaction.user.id);
    return interaction.update(buildShopV2Payload({
      eventKey,
      player: p,
      page: Number(pageRaw || 0),
      selectedKey,
    }));
  }

  if (interaction.customId !== "wardrobe_select") return;

  const roleId = interaction.values?.[0];
  if (!roleId) return;

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member) return interaction.reply({ content: "❌ Can't read your member data.", ephemeral: true });

  const p = await getPlayer(interaction.user.id);
  if (!p.ownedRoles.includes(String(roleId))) {
    return interaction.reply({ content: "❌ This role is not in your wardrobe.", ephemeral: true });
  }

  const has = member.roles.cache.has(roleId);
  if (has) {
    const res = await tryRemoveRole(interaction.guild, interaction.user.id, roleId);
    if (!res.ok) return interaction.reply({ content: `⚠️ Can't remove role: ${res.reason}`, ephemeral: true });
  } else {
    const res = await tryGiveRole(interaction.guild, interaction.user.id, roleId);
    if (!res.ok) return interaction.reply({ content: `⚠️ Can't assign role: ${res.reason}`, ephemeral: true });
  }

  const updatedMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => member);
  return interaction.update({
    embeds: [wardrobeEmbed(interaction.guild, p)],
    components: wardrobeComponents(interaction.guild, updatedMember, p),
  });
};
