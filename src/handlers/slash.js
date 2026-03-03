const { EmbedBuilder } = require('discord.js');

// Existing code...

// Fixing dungeon_spawn command syntax and formatting
const dungeon_spawn = {
    name: 'dungeon_spawn',
    description: 'Spawn a dungeon',
    execute(interaction) {
        // Command execution logic
        interaction.reply({ content: 'Dungeon spawned!', ephemeral: true });
    },
};

// Export the command
module.exports = dungeon_spawn;