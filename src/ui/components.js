// src/ui/components.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

const { EVENT_ROLE_IDS, BOOSTER_ROLE_ID } = require("../config");

const CID = {
  BOSS_JOIN: "boss_join",
  BOSS_RULES: "boss_rules",
  BOSS_ACTION: "boss_action",
  MOB_ATTACK: "mob_attack",

  PVP_ACCEPT: "pvp_accept",
  PVP_DECLINE: "pvp_decline",

  // ✅ MENU
  MENU_INV: "menu_inv",
  MENU_CARDS: "menu_cards",
  MENU_PACKS: "menu_packs",
  MENU_PROFILE: "menu_profile",
  MENU_LB_DRAKO: "menu_lb_drako",
};

function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
}
function hasBoosterRole(member) {
  return !!member?.roles?.cache?.has(BOOSTER_ROLE_ID);
}

/* ===================== MAIN MENU ===================== */
function menuButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(CID.MENU_INV).setLabel("Inventory").setEmoji("🎒").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(CID.MENU_CARDS).setLabel("Cards").setEmoji("🃏").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(CID.MENU_PACKS).setLabel("Packs").setEmoji("🛒").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(CID.MENU_PROFILE).setLabel("Profile").setEmoji("👤").setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(CID.MENU_LB_DRAKO).setLabel("Drako Top").setEmoji("🏆").setStyle(ButtonStyle.Success).setDisabled(disabled)
    ),
  ];
}

/* ===================== EXISTING ===================== */
function bossButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(CID.BOSS_JOIN).setLabel("Join Battle").setEmoji("🗡").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId(CID.BOSS_RULES).setLabel("Rules").setEmoji("📜").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
  ];
}

function singleActionRow(customId, label, emoji, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(customId).setLabel(label).setEmoji(emoji).setStyle(ButtonStyle.Danger).setDisabled(disabled)
    ),
  ];
}

function dualChoiceRow(customIdA, labelA, emojiA, customIdB, labelB, emojiB, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(customIdA).setLabel(labelA).setEmoji(emojiA).setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId(customIdB).setLabel(labelB).setEmoji(emojiB).setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
  ];
}

function triChoiceRow(buttons, disabled = false) {
  const row = new ActionRowBuilder();
  for (const b of buttons.slice(0, 5)) {
    row.addComponents(
      new ButtonBuilder().setCustomId(b.customId).setLabel(b.label).setEmoji(b.emoji).setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    );
  }
  return [row];
}

function comboDefenseRows(token, bossId, roundIndex) {
  const mk = (kind) => `boss_action:${bossId}:${roundIndex}:${token}:combo:${kind}`;
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(mk("red")).setLabel("Red").setEmoji("🔴").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(mk("blue")).setLabel("Blue").setEmoji("🔵").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(mk("green")).setLabel("Green").setEmoji("🟢").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(mk("yellow")).setLabel("Yellow").setEmoji("🟡").setStyle(ButtonStyle.Secondary)
    ),
  ];
}

function mobButtons(eventKey, disabled = false) {
  const label = eventKey === "bleach" ? "Attack Hollow" : "Exorcise Spirit";
  const emoji = eventKey === "bleach" ? "⚔️" : "🪬";

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${CID.MOB_ATTACK}:${eventKey}`)
        .setLabel(label)
        .setEmoji(emoji)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled)
    ),
  ];
}

function shopButtons(eventKey, player) {
  // оставил как было у тебя (без изменений)
  const invB = player.bleach.items;
  const invJ = player.jjk.items;

  if (eventKey === "bleach") {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("buy_bleach_zanpakuto_basic").setLabel("Buy Zanpakutō").setStyle(ButtonStyle.Secondary).setDisabled(invB.zanpakuto_basic),
      new ButtonBuilder().setCustomId("buy_bleach_hollow_mask_fragment").setLabel("Buy Mask Fragment").setStyle(ButtonStyle.Secondary).setDisabled(invB.hollow_mask_fragment),
      new ButtonBuilder().setCustomId("buy_bleach_soul_reaper_cloak").setLabel("Buy Cloak").setStyle(ButtonStyle.Secondary).setDisabled(invB.soul_reaper_cloak)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("buy_bleach_reiatsu_amplifier").setLabel("Buy Amplifier").setStyle(ButtonStyle.Secondary).setDisabled(invB.reiatsu_amplifier),
      new ButtonBuilder().setCustomId("buy_bleach_cosmetic_role").setLabel("Buy Aizen role").setStyle(ButtonStyle.Danger).setDisabled(invB.cosmetic_role)
    );
    return [row1, row2];
  }

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_jjk_black_flash_manual").setLabel("Buy Black Flash").setStyle(ButtonStyle.Secondary).setDisabled(invJ.black_flash_manual),
    new ButtonBuilder().setCustomId("buy_jjk_domain_charm").setLabel("Buy Domain Charm").setStyle(ButtonStyle.Secondary).setDisabled(invJ.domain_charm),
    new ButtonBuilder().setCustomId("buy_jjk_cursed_tool").setLabel("Buy Cursed Tool").setStyle(ButtonStyle.Secondary).setDisabled(invJ.cursed_tool)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_jjk_reverse_talisman").setLabel("Buy Reverse Talisman").setStyle(ButtonStyle.Secondary).setDisabled(invJ.reverse_talisman),
    new ButtonBuilder().setCustomId("buy_jjk_binding_vow_seal").setLabel("Buy Binding Vow").setStyle(ButtonStyle.Danger).setDisabled(invJ.binding_vow_seal)
  );
  return [row1, row2];
}

/* ===================== WARDROBE UI ===================== */
function wardrobeComponents(guild, member, player) {
  const roles = player.ownedRoles.map((rid) => guild.roles.cache.get(rid)).filter(Boolean);
  if (!roles.length) return [];

  const options = roles.slice(0, 25).map((r) => {
    const equipped = member.roles.cache.has(r.id);
    return {
      label: r.name.slice(0, 100),
      value: r.id,
      description: equipped ? "Equipped (select to remove)" : "Not equipped (select to wear)",
    };
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("wardrobe_select")
    .setPlaceholder("Choose a role to equip/unequip")
    .addOptions(options);

  return [new ActionRowBuilder().addComponents(menu)];
}

function pvpButtons(currency, amount, challengerId, targetId, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${CID.PVP_ACCEPT}:${currency}:${amount}:${challengerId}:${targetId}`)
        .setLabel("Accept")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`${CID.PVP_DECLINE}:${currency}:${amount}:${challengerId}:${targetId}`)
        .setLabel("Decline")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    ),
  ];
}

module.exports = {
  CID,
  hasEventRole,
  hasBoosterRole,

  // ✅ menu
  menuButtons,

  // existing
  bossButtons,
  singleActionRow,
  dualChoiceRow,
  triChoiceRow,
  comboDefenseRows,
  mobButtons,
  shopButtons,
  wardrobeComponents,
  pvpButtons,
};
