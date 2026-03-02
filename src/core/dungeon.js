class Dungeon {
    constructor() {
        this.players = [];
        this.teams = [];
    }

    // Register a player
    registerPlayer(player) {
        this.players.push(player);
    }

    // Select cards for a player
    selectCards(player) {
        // Sample logic for card selection
        return player.cards.sort(() => Math.random() - 0.5).slice(0, 3);
    }

    // Create teams
    createTeams() {
        const teamSize = Math.ceil(this.players.length / 2);
        for (let i = 0; i < this.players.length; i += teamSize) {
            this.teams.push(this.players.slice(i, i + teamSize));
        }
    }

    // Simulate a battle between two teams
    simulateBattle(teamA, teamB) {
        let teamAScore = Math.random() * 100;
        let teamBScore = Math.random() * 100;
        return teamAScore > teamBScore ? teamA : teamB;
    }

    // Distribute rewards to the winning team
    distributeRewards(winningTeam) {
        winningTeam.forEach(player => {
            player.rewards.push("Gold Coin");
        });
    }

    // Run the dungeon adventure
    run() {
        this.createTeams();
        const winningTeam = this.simulateBattle(this.teams[0], this.teams[1]);
        this.distributeRewards(winningTeam);
    }
}