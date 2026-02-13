// src/data/bosses.js
const { DEFAULT_CARD_GIF } = require("../config");

const BOSSES = {
  vasto_lorde: {
    id: "vasto_lorde",
    event: "bleach",
    icon: "👹",
    name: "Vasto Lorde",
    difficulty: "Hard",
    joinMs: 120000,
    baseChance: 0.55,
    hitReward: 20,
    winReward: 120,
    roleDropChance: 0.03,
    roleDropId: null,

    spawnMedia: DEFAULT_CARD_GIF,
    victoryMedia: DEFAULT_CARD_GIF,
    defeatMedia: DEFAULT_CARD_GIF,

    rounds: [
      { title: "Round 1/4", type: "pressure", intro: "The air gets heavy...", status: "Reiatsu Pressure", hpPct: 92, media: DEFAULT_CARD_GIF },
      { title: "Round 2/4", type: "attack", intro: "A cero is forming...", status: "Cero Charge", hpPct: 83, media: DEFAULT_CARD_GIF },
      { title: "Round 3/4", type: "pressure", intro: "Reiatsu surges violently.", status: "Reiatsu Surge", hpPct: 72, media: DEFAULT_CARD_GIF },
      { title: "Round 4/4", type: "quick_block", intro: "Final strike incoming!", status: "Execution", hpPct: 60, windowMs: 5000, buttonLabel: "Block", buttonEmoji: "🛡️", media: DEFAULT_CARD_GIF }
    ]
  },

  toji_raid: {
    id: "toji_raid",
    event: "jjk",
    icon: "👹",
    name: "Toji Raid",
    difficulty: "Extreme",
    joinMs: 120000,
    baseChance: 0.50,
    hitReward: 25,
    winRewardRange: { min: 140, max: 220 },

    shardDropRange: { min: 5, max: 12 },
    expeditionKeyChance: 0.15,

    spawnMedia: DEFAULT_CARD_GIF,
    victoryMedia: DEFAULT_CARD_GIF,
    defeatMedia: DEFAULT_CARD_GIF,

    rounds: [
      { title: "Round 1/4", type: "attack", intro: "He vanishes instantly.", status: "Ambush", hpPct: 90 },
      { title: "Round 2/4", type: "combo_defense", intro: "Fast chain attacks!", status: "Speed Blitz", hpPct: 78, windowMs: 6000 },
      { title: "Round 3/4", type: "choice_qte", intro: "Choose your move!", status: "Mindgame", hpPct: 66, windowMs: 3000,
        choices: [
          { key: "dodge", label: "Dodge", emoji: "🌀" },
          { key: "parry", label: "Parry", emoji: "🗡️" }
        ],
        correct: "dodge"
      },
      { title: "Round 4/4", type: "finisher", intro: "Final hit!", status: "Finisher", hpPct: 55, windowMs: 5000, buttonLabel: "Finisher", buttonEmoji: "⚔️" }
    ]
  }
};

module.exports = { BOSSES };
