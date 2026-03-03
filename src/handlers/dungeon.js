module.exports = async function handleDungeon(interaction) {
  try {
    if (interaction.customId?.startsWith("dungeon_join:")) {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ content: "✅ You joined the dungeon!" });
      return;
    }
    if (interaction.customId?.startsWith("dungeon_info:")) {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ content: "🏰 Dungeon Info" });
      return;
    }
  } catch (error) {
    console.error("Dungeon handler error:", error);
  }
};
