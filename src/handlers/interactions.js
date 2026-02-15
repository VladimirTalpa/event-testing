const handleSlash = require("./slash");
const handleButtons = require("./buttons");
const handleSelects = require("./selects");

module.exports = async function handleInteractions(interaction) {
  try {
    if (interaction.isChatInputCommand()) return handleSlash(interaction);
    if (interaction.isButton()) return handleButtons(interaction);
    if (interaction.isStringSelectMenu()) return handleSelects(interaction);
  } catch (e) {
    console.error("Interaction error:", e);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: "❌ Error occurred.", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Error occurred.", ephemeral: true });
      }
    } catch {}
  }
};
