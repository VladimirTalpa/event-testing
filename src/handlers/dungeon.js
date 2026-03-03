// Import necessary modules
const { generateRandomEncounter } = require('../utils/encounterGenerator');
const { DUNGEON_SIZE, DUNGEON_LAYOUT } = require('../constants');

// Function to create a new dungeon
function createDungeon() {
    const dungeon = {
        layout: DUNGEON_LAYOUT,
        size: DUNGEON_SIZE,
        rooms: [],
    };
    // Initialize rooms based on layout
    initializeRooms(dungeon);
    return dungeon;
}

// Function to initialize rooms in the dungeon
function initializeRooms(dungeon) {
    for (let i = 0; i < dungeon.size; i++) {
        dungeon.rooms.push({
            id: i,
            enemies: [],
            items: [],
        });
    }
}

// Function to enter the dungeon
function enterDungeon(dungeon) {
    console.log('Entering dungeon...');
    return dungeon;
}

// Function to exit the dungeon
function exitDungeon() {
    console.log('Exiting dungeon...');
    return null;
}

// Export the functions
module.exports = {
    createDungeon,
    enterDungeon,
    exitDungeon,
};