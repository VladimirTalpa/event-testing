// src/data/bosses.js

const {
  E_VASTO,
  E_ULQ,

  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
} = require("../config");

const media = require("./media");


const BOSSES = {

  /* ================= BLEACH ================= */

  vasto: {
    event: "bleach",
    id: "vasto",
    name: "Vasto Lorde",
    icon: E_VASTO,
    difficulty: "Hard",

    joinMs: 120000,
    baseChance: 0.30,

    winReward: 200,
    hitReward: 15,

    roleDropChance: 0.025,
    roleDropId: VASTO_DROP_ROLE_ID,

    spawnMedia: media.VASTO_SPAWN_MEDIA,
    victoryMedia: media.VASTO_VICTORY_MEDIA,
    defeatMedia: media.VASTO_DEFEAT_MEDIA,

    rounds: [

      {
        type: "pressure",
        title: "Reiatsu Wave",
        intro: "Withstand the pressure.",
        media: media.VASTO_R1,
      },

      {
        type: "pressure",
        title: "Frenzy",
        intro: "Pressure intensifies.",
        media: media.VASTO_R2,
      },

      {
        type: "coop_block",
        title: "Block Together",
        windowMs: 5000,
        requiredPresses: 4,
        media: media.VASTO_R3,
      },

      {
        type: "attack",
        title: "Counter",
        media: media.VASTO_R4,
      },

      {
        type: "finisher",
        title: "Finisher",
        windowMs: 10000,
        media: media.VASTO_R5,
      },
    ],
  },


  ulquiorra: {
    event: "bleach",
    id: "ulquiorra",
    name: "Ulquiorra",
    icon: E_ULQ,
    difficulty: "Extreme",

    joinMs: 180000,
    baseChance: 0.20,

    winReward: 500,
    hitReward: 25,

    roleDropChance: 0.03,
    roleDropId: ULQ_DROP_ROLE_ID,

    spawnMedia: media.ULQ_SPAWN_MEDIA,
    victoryMedia: media.ULQ_VICTORY_MEDIA,
    defeatMedia: media.ULQ_DEFEAT_MEDIA,

    rounds: [

      {
        type: "coop_block",
        title: "Block",
        windowMs: 5000,
        requiredPresses: 4,
        media: media.ULQ_R1,
      },

      {
        type: "combo_defense",
        title: "QTE Defense",
        windowMs: 15000,
        media: media.ULQ_R2,
      },

      {
        type: "pressure",
        title: "Transform",
        media: media.ULQ_R3,
      },

      {
        type: "pressure",
        title: "Suffocation",
        media: media.ULQ_R4,
      },

      {
        type: "quick_block",
        title: "Quick Block",
        windowMs: 2000,
        media: media.ULQ_R5,
      },

      {
        type: "group_final",
        title: "Final Push",
        requiredWins: 3,
        media: media.ULQ_R6,
      },
    ],
  },


  /* ================= GRIMMJOW ================= */

  grimmjow: {
    event: "bleach",
    id: "grimmjow",
    name: "Grimmjow",
    icon: "🐆",
    difficulty: "Medium",

    joinMs: 120000,
    baseChance: 0.50,

    winReward: 125,
    hitReward: 15,

    roleDropChance: 1.0,
    roleDropId: "1469831066628919439",

    spawnMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1469843123160088636/Your_paragraph_text_20.gif",

    victoryMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1469843182920532062/Your_paragraph_text_24.gif",

    defeatMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1469843151152746668/Your_paragraph_text_22.gif",

    rounds: [

      {
        type: "quick_block",
        title: "Wild Assault",
        windowMs: 15000,
        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1469843137181651024/Your_paragraph_text_21.gif",
      },

      {
        type: "coop_block",
        title: "Desgarrón",
        windowMs: 10000,
        requiredPresses: 3,
        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1469843163945504899/Your_paragraph_text_23.gif",
      },

      {
        type: "attack",
        title: "Final Clash",
        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1469843182920532062/Your_paragraph_text_24.gif",
      },
    ],
  },


  /* ================= JJK ================= */

  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    icon: "🪬",
    difficulty: "Medium",

    joinMs: 120000,
    baseChance: 0.50,

    winReward: 85,
    hitReward: 5,

    roleDropChance: 0,
    roleDropId: null,

    spawnMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1470019091216597002/Your_paragraph_text_39.gif",

    victoryMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1470019159818637446/Your_paragraph_text_34.gif",

    defeatMedia:
      "https://media.discordapp.net/attachments/1405973335979851877/1470019147839701177/Your_paragraph_text_35.gif",

    rounds: [

      {
        type: "pressure",
        title: "Battle Hunger",
        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1470019102163730637/Your_paragraph_text_38.gif",
      },

      {
        type: "quick_block",
        title: "Block Attack",
        windowMs: 5000,
        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1470019117309235418/Your_paragraph_text_37.gif",
      },

      {
        type: "finisher",
        title: "Exorcise",
        windowMs: 6000,
        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1470019129867239526/Your_paragraph_text_36.gif",
      },
    ],
  },

};


module.exports = {
  BOSSES,
};
