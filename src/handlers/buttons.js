const { handleProfile, handleStore, handleForge } = require("../ui/menus");
const { handleBossButton } = require("../events/boss");

module.exports = async (interaction) => {
  const id = interaction.customId;

  if (id.startsWith("profile:")) return handleProfile(interaction);
  if (id.startsWith("store:")) return handleStore(interaction);
  if (id.startsWith("forge:")) return handleForge(interaction);
  if (id.startsWith("boss:")) return handleBossButton(interaction);

  return interaction.reply({ content: "Unknown button.", ephemeral: true });
};
