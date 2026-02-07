
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const CID = {
  BOSS_JOIN: ["boss_join", "vasto_join", "hollow_join"],
  BOSS_RULES: ["boss_rules", "vasto_rules", "hollow_rules"],
  HOLLOW_ATTACK: ["hollow_attack", "hollow_join", "hollow_attack_btn"],
};

function bossButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("boss_join").setLabel("Join Battle").setEmoji("🗡").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId("boss_rules").setLabel("Rules").setEmoji("📜").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
  ];
}

function hollowButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("hollow_attack").setLabel("Attack Hollow").setEmoji("⚔️").setStyle(ButtonStyle.Primary).setDisabled(disabled)
    ),
  ];
}

function clashButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("clash_accept").setLabel("Accept Clash").setEmoji("⚡").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId("clash_decline").setLabel("Decline").setEmoji("❌").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
  ];
}

module.exports = { CID, bossButtons, hollowButtons, clashButtons };
