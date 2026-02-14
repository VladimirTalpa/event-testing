// src/ui/components.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

function btn(customId, label, style = ButtonStyle.Secondary, disabled = false, emoji = null) {
  const b = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style).setDisabled(disabled);
  if (emoji) b.setEmoji(emoji);
  return b;
}

function row(...buttons) {
  return new ActionRowBuilder().addComponents(buttons);
}

function closeRow() {
  return row(btn("ui:close", "Close", ButtonStyle.Danger));
}

function backCloseRow(backId) {
  return row(
    btn(backId, "Back", ButtonStyle.Secondary),
    btn("ui:close", "Close", ButtonStyle.Danger)
  );
}

function navRow(backId, nextId, extraClose = true) {
  const buttons = [
    btn(backId, "Back", ButtonStyle.Secondary),
    btn(nextId, "Next", ButtonStyle.Secondary),
  ];
  if (extraClose) buttons.push(btn("ui:close", "Close", ButtonStyle.Danger));
  return row(...buttons);
}

function menu(customId, placeholder, options, minValues = 1, maxValues = 1, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(minValues)
      .setMaxValues(maxValues)
      .setDisabled(disabled)
      .addOptions(options)
  );
}

/**
 * Стандартные вкладки для Profile (одно красивое меню)
 */
function profileTabsSelect() {
  return menu(
    "ui:profile:tabs",
    "Choose a section…",
    [
      { label: "Currency", value: "currency", description: "Reiatsu / CE / Drako" },
      { label: "Cards", value: "cards", description: "Your characters collection" },
      { label: "Gears", value: "gears", description: "Weapon / Armor" },
      { label: "Titles", value: "titles", description: "Roles you can wear (Wardrobe)" },
      { label: "Leaderboard", value: "leaderboard", description: "Top players (event)" },
    ],
    1,
    1
  );
}

/**
 * Стандартные вкладки для Store
 */
function storeTabsSelect() {
  return menu(
    "ui:store:tabs",
    "Choose a store section…",
    [
      { label: "Event Shop", value: "event_shop", description: "Event items & cosmetics" },
      { label: "Card Packs", value: "packs", description: "Buy packs and open them" },
      { label: "Gear Shop", value: "gear_shop", description: "Buy gear materials/items" },
    ],
    1,
    1
  );
}

/**
 * Мини-меню для Card Packs
 */
function packSelect() {
  return menu(
    "ui:store:packs",
    "Choose a pack…",
    [
      { label: "Basic Pack", value: "basic", description: "Cheaper, common/rare focused" },
      { label: "Legendary Pack", value: "legendary", description: "Higher chance for Legendary/Mythic" },
    ],
    1,
    1
  );
}

module.exports = {
  btn,
  row,
  closeRow,
  backCloseRow,
  navRow,
  menu,
  profileTabsSelect,
  storeTabsSelect,
  packSelect,
};
