const { E_VASTO, E_ULQ, E_GRIMJOW, E_BLEACH, E_JJK } = require("../config");

const BOSSES = {
  // Bleach
  vasto: {
    id: "vasto",
    name: "Vasto Lorde",
    event: "bleach",
    emoji: E_VASTO,
    rounds: 4,
    hpPerRound: [100, 75, 50, 25], // purely visual
    description: "Survive rounds. If you fail — you are eliminated.",
    difficulty: 1
  },
  ulquiorra: {
    id: "ulquiorra",
    name: "Ulquiorra",
    event: "bleach",
    emoji: E_ULQ,
    rounds: 5,
    hpPerRound: [100, 80, 60, 40, 20],
    description: "Higher risk. Better rewards.",
    difficulty: 2
  },
  grimmjow: {
    id: "grimmjow",
    name: "Grimmjow",
    event: "bleach",
    emoji: E_GRIMJOW,
    rounds: 5,
    hpPerRound: [100, 78, 55, 33, 15],
    description: "Aggressive boss. Punishes low DEF.",
    difficulty: 2
  },

  // JJK
  mahoraga: {
    id: "mahoraga",
    name: "Mahoraga",
    event: "jjk",
    emoji: E_JJK,
    rounds: 6,
    hpPerRound: [100, 85, 70, 55, 40, 20],
    description: "Adapting boss. Long run.",
    difficulty: 3
  },
  specialgrade: {
    id: "specialgrade",
    name: "Special Grade Curse",
    event: "jjk",
    emoji: E_JJK,
    rounds: 5,
    hpPerRound: [100, 82, 64, 42, 18],
    description: "Classic raid-style boss. Team matters.",
    difficulty: 2
  }
};

module.exports = { BOSSES };
