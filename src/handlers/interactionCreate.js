// src/handlers/interactionCreate.js
const handleSlash = require("./slash");
const handleButtons = require("./buttons");
const handleSelects = require("./selects");

module.exports = async function interactionCreateHandler(client, interaction) {
  try {
    // Slash
    if (interaction.isChatInputCommand()) {
      return await handleSlash(interaction);
    }

    // Buttons
    if (interaction.isButton()) {
      // ВАЖНО: быстро подтверждаем, чтобы не было "The application did not respond"
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(() => {});
      }
      return await handleButtons(interaction);
    }

    // Select menus
    if (interaction.isStringSelectMenu()) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(() => {});
      }
      return await handleSelects(interaction);
    }
  } catch (e) {
    console.error("Interaction error:", e);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "⚠️ Error handling this action. Check logs.", ephemeral: true });
      } else {
        await interaction.followUp({ content: "⚠️ Error handling this action. Check logs.", ephemeral: true }).catch(() => {});
      }
    } catch {}
  }
};
