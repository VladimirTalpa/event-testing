// src/ui/components.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * Универсальная кнопка закрытия для любых меню/ивентов.
 * customId одинаковый везде, чтобы твой collector в slash.js мог
 * просто ловить "ui_close".
 */
function closeButton(label = "Close") {
  return new ButtonBuilder()
    .setCustomId("ui_close")
    .setLabel(label)
    .setStyle(ButtonStyle.Danger);
}

function row(...buttons) {
  return new ActionRowBuilder().addComponents(...buttons);
}

function closeRow(label = "Close") {
  return row(closeButton(label));
}

function navButton(customId, label, style = ButtonStyle.Secondary, emoji = null) {
  const b = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);
  if (emoji) b.setEmoji(emoji);
  return b;
}

module.exports = {
  row,
  closeRow,
  closeButton,
  navButton,
};
