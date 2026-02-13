// src/ui/menu.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const MID = {
  PROFILE_CURRENCY: "menu_profile_currency",
  PROFILE_CARDS: "menu_profile_cards",
  PROFILE_PACKS: "menu_profile_packs",

  STORE_PACKS: "menu_store_packs",

  OPEN_BASIC_BLEACH: "open_pack:basic:bleach",
  OPEN_BASIC_JJK: "open_pack:basic:jjk",
  OPEN_LEG_BLEACH: "open_pack:legendary:bleach",
  OPEN_LEG_JJK: "open_pack:legendary:jjk",

  REVEAL_NEXT: "pack_reveal_next",
  REVEAL_CLOSE: "pack_reveal_close",
};

function profileMenuRow() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(MID.PROFILE_CURRENCY).setLabel("Currency").setStyle(ButtonStyle.Secondary).setEmoji("💰"),
      new ButtonBuilder().setCustomId(MID.PROFILE_CARDS).setLabel("Cards").setStyle(ButtonStyle.Secondary).setEmoji("🃏"),
      new ButtonBuilder().setCustomId(MID.PROFILE_PACKS).setLabel("Packs").setStyle(ButtonStyle.Primary).setEmoji("🎁"),
    ),
  ];
}

function storeMenuRow() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(MID.STORE_PACKS).setLabel("Card Packs").setStyle(ButtonStyle.Primary).setEmoji("🎁"),
    ),
  ];
}

function packShopRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(MID.OPEN_BASIC_BLEACH).setLabel("Basic (Bleach)").setStyle(ButtonStyle.Secondary).setEmoji("🩸"),
      new ButtonBuilder().setCustomId(MID.OPEN_BASIC_JJK).setLabel("Basic (JJK)").setStyle(ButtonStyle.Secondary).setEmoji("🟣"),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(MID.OPEN_LEG_BLEACH).setLabel("Legendary (Bleach)").setStyle(ButtonStyle.Danger).setEmoji("🩸"),
      new ButtonBuilder().setCustomId(MID.OPEN_LEG_JJK).setLabel("Legendary (JJK)").setStyle(ButtonStyle.Danger).setEmoji("🟣"),
    ),
  ];
}

function packRevealRow(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(MID.REVEAL_NEXT).setLabel("Reveal next").setStyle(ButtonStyle.Success).setEmoji("✨").setDisabled(disabled),
      new ButtonBuilder().setCustomId(MID.REVEAL_CLOSE).setLabel("Close").setStyle(ButtonStyle.Secondary).setEmoji("✖").setDisabled(false),
    ),
  ];
}

module.exports = { MID, profileMenuRow, storeMenuRow, packShopRows, packRevealRow };
