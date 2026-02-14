// src/ui/components.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

function closeRow(customId = "ui:close") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel("Close")
      .setStyle(ButtonStyle.Secondary)
  );
}

function navRow({ backId, closeId = "ui:close" }) {
  const row = new ActionRowBuilder();
  if (backId) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(backId)
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary)
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(closeId)
      .setLabel("Close")
      .setStyle(ButtonStyle.Secondary)
  );
  return row;
}

function mainMenuSelect(customId, placeholder, options) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addOptions(options)
  );
}

module.exports = {
  closeRow,
  navRow,
  mainMenuSelect,
};
