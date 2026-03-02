// Dungeon Interaction Handler

class Dungeon {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.rooms = [];
    }

    addRoom(room) {
        this.rooms.push(room);
    }

    describe() {
        return `${this.name}: ${this.description}`;
    }

    listRooms() {
        return this.rooms.map(room => room.describe()).join('\n');
    }
}

class Room {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }

    describe() {
        return `${this.name}: ${this.description}`;
    }
}

// Export the Dungeon class for use in other parts of the application
module.exports = Dungeon;