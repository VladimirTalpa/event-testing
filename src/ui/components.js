const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function closeRow(customId = "ui:close") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(customId).setLabel("Close").setStyle(ButtonStyle.Secondary)
  );
}

function rowOf(...buttons) {
  const row = new ActionRowBuilder();
  row.addComponents(...buttons);
  return row;
}

module.exports = { closeRow, rowOf };
