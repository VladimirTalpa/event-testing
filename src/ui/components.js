const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const CID = {
  BOSS_JOIN: "boss_join",
  BOSS_RULES: "boss_rules",
  MOB_ACTION: "mob_action", // mob_action:<eventKey>
};

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

function mobButtons(eventKey, label, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${CID.MOB_ACTION}:${eventKey}`)
        .setLabel(label)
        .setEmoji(eventKey === "jjk" ? "🪬" : "⚔️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled)
    ),
  ];
}

module.exports = { CID, bossButtons, singleActionRow, comboDefenseRows, mobButtons };
