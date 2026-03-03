// Existing content above... 

  new SlashCommandBuilder()
    .setName("dungeon_spawn")
    .setDescription("Spawn a new dungeon (staff only)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which event?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach", value: "bleach" },
          { name: "Jujutsu Kaisen", value: "jjk" }
        )
    ),
// Existing content below...