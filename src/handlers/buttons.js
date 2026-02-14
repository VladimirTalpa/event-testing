// src/handlers/buttons.js
const { bossByChannel, mobByChannel, pvpById } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName } = require("../core/utils");

const { MOBS } = require("../data/mobs");
const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");

const { mobEmbed, shopEmbed } = require("../ui/old_embeds_inventory_shop");
const { CID, mobButtons, shopButtons, pvpButtons } = require("../ui/old_components_shop_mob_boss");

// NEW UI
const { closeRow, profileTabsSelect, storeTabsSelect, packSelect, backCloseRow } = require("../ui/components");
const {
  profileHomeEmbed,
  profileCurrencyEmbed,
  profileCardsEmbed,
  profileGearsEmbed,
  profileTitlesEmbed,
  profileLeaderboardEmbed,

  storeHomeEmbed,
  storeEventShopEmbed,
  storePacksEmbed,
  storeGearShopEmbed,
} = require("../ui/embeds");

const { getCardsSummaryText, getTitlesText } = require("../core/profile_helpers");
const { E_REIATSU, E_CE, E_DRAKO } = require("../config");

/* ===================== role helpers ===================== */
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
function ensureOwnedRole(player, roleId) {
  if (!roleId) return;
  const id = String(roleId);
  if (!player.ownedRoles.includes(id)) player.ownedRoles.push(id);
}

module.exports = async function handleButtons(interaction) {
  // важно: deferUpdate для кнопок
  try { await interaction.deferUpdate(); } catch {}

  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  const cid = interaction.customId;

  /* ===================== UI: CLOSE ===================== */
  if (cid === "ui:close") {
    // просто убираем components и делаем "закрыто"
    return interaction.message.edit({ components: [], embeds: interaction.message.embeds }).catch(() => {});
  }

  /* ===================== UI: PROFILE NAV ===================== */
  if (cid.startsWith("ui:profile:")) {
    // пока кнопки не используем, профиль управляется select-меню
    return;
  }

  /* ===================== UI: STORE NAV ===================== */
  if (cid.startsWith("ui:store:")) {
    return;
  }

  /* ===================== Boss join / rules / actions (LEGACY) ===================== */
  if (cid === CID.BOSS_JOIN || cid === CID.BOSS_RULES || cid.startsWith("boss_action:")) {
    // отдаём в твой legacy обработчик (почти 1-в-1 как был)
    const legacy = require("./buttons_legacy_boss_mob_shop_pvp");
    return legacy(interaction);
  }

  /* ===================== Mob attack / PvP / Shop buys (LEGACY) ===================== */
  if (
    cid.startsWith(`${CID.MOB_ATTACK}:`) ||
    cid.startsWith(`${CID.PVP_ACCEPT}:`) ||
    cid.startsWith(`${CID.PVP_DECLINE}:`) ||
    cid.startsWith("buy_")
  ) {
    const legacy = require("./buttons_legacy_boss_mob_shop_pvp");
    return legacy(interaction);
  }

  // fallback
};
