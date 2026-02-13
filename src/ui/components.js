// src/ui/components.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function bossButtons(disabled) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("boss_join")
        .setLabel("Join Battle")
        .setEmoji("🗡️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!!disabled),
      new ButtonBuilder()
        .setCustomId("boss_leave")
        .setLabel("Leave")
        .setEmoji("🏃")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!!disabled)
    )
  ];
}

function singleActionRow(customId, label, emoji, disabled) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setEmoji(emoji)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!!disabled)
    )
  ];
}

function dualChoiceRow(idA, labelA, emojiA, idB, labelB, emojiB, disabled) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(idA).setLabel(labelA).setEmoji(emojiA).setStyle(ButtonStyle.Primary).setDisabled(!!disabled),
      new ButtonBuilder().setCustomId(idB).setLabel(labelB).setEmoji(emojiB).setStyle(ButtonStyle.Primary).setDisabled(!!disabled)
    )
  ];
}

function triChoiceRow(btns, disabled) {
  const row = new ActionRowBuilder();
  for (const b of btns.slice(0, 3)) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(b.customId)
        .setLabel(b.label)
        .setEmoji(b.emoji)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!!disabled)
    );
  }
  return [row];
}

function comboDefenseRows(token, bossId, roundIndex) {
  const colors = [
    { key: "red", emoji: "🔴" },
    { key: "blue", emoji: "🔵" },
    { key: "green", emoji: "🟢" },
    { key: "yellow", emoji: "🟡" }
  ];

  const row = new ActionRowBuilder();
  for (const c of colors) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`boss_action:${bossId}:${roundIndex}:${token}:combo:${c.key}`)
        .setEmoji(c.emoji)
        .setStyle(ButtonStyle.Secondary)
    );
  }
  return [row];
}

module.exports = {
  bossButtons,
  singleActionRow,
  dualChoiceRow,
  triChoiceRow,
  comboDefenseRows
};
