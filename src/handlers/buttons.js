// src/handlers/buttons.js
const { onBossButton } = require("../events/boss");
const { CID } = require("../ui/components");
const { mobByChannel } = require("../core/state");

module.exports = async function handleButtons(interaction) {
  const cid = interaction.customId;

  // boss buttons
  if (cid === CID.BOSS_JOIN || cid === CID.BOSS_RULES || cid.startsWith("boss_action:")) {
    return onBossButton(interaction);
  }

  // если у тебя есть моб/шоп/пвп — они остаются как были
  // (чтобы сейчас не ломать остальное)
};
