const handleSlash = require("./slash");
const handleButtons = require("./buttons");
const handleSelects = require("./selects");

module.exports = async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) return await handleSlash(interaction);
    if (interaction.isButton()) return await handleButtons(interaction);
    if (interaction.isStringSelectMenu()) return await handleSelects(interaction);
  } catch (e) {
    console.error(e);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: "Error.", ephemeral: true });
      } else {
        await interaction.reply({ content: "Error.", ephemeral: true });
      }
    } catch {}
  }
};
