const { openProfile, openStore, openForge } = require("../ui/menus");
const { spawnBoss } = require("../events/boss");

module.exports = async (interaction) => {
  const name = interaction.commandName;

  if (name === "profile") return openProfile(interaction);
  if (name === "store") return openStore(interaction);
  if (name === "forge") return openForge(interaction);

  if (name === "spawnboss") {
    const bossId = interaction.options.getString("boss", true);
    await interaction.reply({ content: "OK", ephemeral: true });
    return spawnBoss(interaction.channel, bossId);
  }

  return interaction.reply({ content: "Unknown command.", ephemeral: true });
};
