// src/data/bosses.js

const {
  E_VASTO,
  E_ULQ,
  E_GRIMJOW,

  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
  GRIMMJOW_ROLE_ID,
} = require("../config");

const media = require("./media");


const BOSSES = {

  /* ===== GRIMMJOW ===== */

  grimmjow: {
    event: "bleach",

    id: "grimmjow",
    name: "Grimmjow",

    icon: E_GRIMJOW,
    difficulty: "Medium",

    joinMs: 120000,
    baseChance: 0.5,

    winReward: 125,
    hitReward: 15,

    roleDropChance: 1,
    roleDropId: GRIMMJOW_ROLE_ID,

    spawnMedia: media.GRIMMJOW_SPAWN,
    victoryMedia: media.GRIMMJOW_WIN,
    defeatMedia: media.GRIMMJOW_LOSE,

    rounds: [

      {
        type: "quick_block",
        title: "Wild Assault",
        windowMs: 15000,
        media: media.GRIMMJOW_R1,
      },

      {
        type: "coop_block",
        title: "Desgarrón",
        windowMs: 10000,
        requiredPresses: 3,
        media: media.GRIMMJOW_R2,
      },

      {
        type: "attack",
        title: "Final Clash",
        media: media.GRIMMJOW_WIN,
      },
    ],
  },


  /* ===== JJK SPECIAL ===== */

  specialgrade: {
    event: "jjk",

    id: "specialgrade",
    name: "Special Grade Curse",

    icon: "🪬",
    difficulty: "Medium",

    joinMs: 120000,
    baseChance: 0.5,

    winReward: 85,
    hitReward: 5,

    roleDropChance: 0,
    roleDropId: null,

    spawnMedia: media.JJK_SPAWN,
    victoryMedia: media.JJK_WIN,
    defeatMedia: media.JJK_LOSE,

    rounds: [

      {
        type: "pressure",
        title: "Battle Hunger",
        media: media.JJK_R1,
      },

      {
        type: "quick_block",
        title: "Block Attack",
        windowMs: 5000,
        media: media.JJK_R2,
      },

      {
        type: "finisher",
        title: "Exorcise",
        windowMs: 6000,
        media: media.JJK_R3,
      },
    ],
  },

};


module.exports = {
  BOSSES,
};
