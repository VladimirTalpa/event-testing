// Dungeon Embed Utilities

/**
 * This utility provides functionality for embedding dungeon data.
 */
class DungeonEmbed {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }

    getEmbed() {
        return {
            title: this.name,
            description: this.description,
            color: 0x00ff00 // Green
        };
    }
}

module.exports = DungeonEmbed;
