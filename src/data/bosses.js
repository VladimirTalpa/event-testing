const { E_BLEACH, E_JJK } = require("../config");

module.exports = {
  BOSSES: {
    vasto: {
      id: "vasto",
      event: "bleach",
      icon: E_BLEACH,
      name: "Vasto Lorde",
      difficulty: "Hard",
      joinMs: 2 * 60 * 1000,
      maxHits: 2,
      winRewardRange: { min: 250, max: 350 },
      hitReward: 40,
      spawnMedia: "https://i.imgur.com/8yKQFQ2.png",
      victoryMedia: "https://i.imgur.com/8yKQFQ2.png",
      defeatMedia: "https://i.imgur.com/8yKQFQ2.png",
      rounds: [
        { title: "Round 1", intro: "Survive the strike!", mode: "press", label: "Block", emoji: "🛡️", durationMs: 7000 },
        { title: "Round 2", intro: "Pick the right guard!", mode: "choice", options: ["left", "right"], durationMs: 9000, safe: "left" },
        { title: "Round 3", intro: "Combo defense!", mode: "combo", durationMs: 12000 },
      ],
    },

    mahoraga: {
      id: "mahoraga",
      event: "jjk",
      icon: E_JJK,
      name: "Mahoraga",
      difficulty: "Nightmare",
      joinMs: 2 * 60 * 1000,
      maxHits: 2,
      winRewardRange: { min: 280, max: 420 },
      hitReward: 45,
      spawnMedia: "https://i.imgur.com/8yKQFQ2.png",
      victoryMedia: "https://i.imgur.com/8yKQFQ2.png",
      defeatMedia: "https://i.imgur.com/8yKQFQ2.png",
      rounds: [
        { title: "Round 1", intro: "Press in time!", mode: "press", label: "Dodge", emoji: "💨", durationMs: 7000 },
        { title: "Round 2", intro: "3-hit focus!", mode: "multi_press", label: "Parry", emoji: "⚔️", need: 3, durationMs: 9000 },
        { title: "Round 3", intro: "Combo defense!", mode: "combo", durationMs: 12000 },
      ],
    },
  },
};
