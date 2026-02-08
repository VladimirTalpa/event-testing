// src/data/bosses.js

const {
  E_VASTO,
  E_ULQ,
  E_GRIMJOW,
  E_BLEACH,
  E_JJK,

  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
} = require("../config");

const media = require("./media");


/* ===================== BOSSES ===================== */

const BOSSES = {


/* =================================================== */
/* ===================== BLEACH ====================== */
/* =================================================== */


  /* ===== VASTO ===== */

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
        intro: "Survive the pressure.",
        media: media.VASTO_R1,
      },
      {
        type: "pressure",
        title: "Frenzy",
        intro: "Pressure increases.",
        media: media.VASTO_R2,
      },
      {
        type: "coop_block",
        title: "Group Block",
        windowMs: 5000,
        requiredPresses: 4,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.VASTO_R3,
      },
      {
        type: "attack",
        title: "Counter",
        intro: "Attack!",
        media: media.VASTO_R4,
      },
      {
        type: "finisher",
        title: "Finish",
        windowMs: 10000,
        buttonLabel: "Finisher",
        buttonEmoji: "⚔️",
        media: media.VASTO_R5,
      },
    ],
  },


/* =================================================== */
/* =================== GRIMMJOW ====================== */
/* =================================================== */


  grimmjow: {
    event: "bleach",
    id: "grimmjow",

    name: "Grimmjow",
    icon: E_GRIMJOW,

    difficulty: "Medium",

    joinMs: 120000,

    baseChance: 0.50,

    winReward: 125,
    hitReward: 15,

    roleDropChance: 0.04,
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

        intro: "Block multiple attacks!",

        windowMs: 15000,

        buttonLabel: "Block",
        buttonEmoji: "🛡️",

        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1469843137181651024/Your_paragraph_text_21.gif",
      },

      {
        type: "coop_block",
        title: "Heavy Strike",

        windowMs: 10000,
        requiredPresses: 3,

        buttonLabel: "Block",
        buttonEmoji: "🛡️",

        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1469843163945504899/Your_paragraph_text_23.gif",
      },

    ],
  },


/* =================================================== */
/* ======================= JJK ======================= */
/* =================================================== */


  specialgrade: {
    event: "jjk",
    id: "specialgrade",

    name: "Special Grade Curse",
    icon: E_JJK,

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

        intro: "The curse craves battle.",

        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1470019102163730637/Your_paragraph_text_38.gif",
      },

      {
        type: "quick_block",
        title: "Deadly Blast",

        windowMs: 5000,

        buttonLabel: "Block",
        buttonEmoji: "🛡️",

        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1470019117309235418/Your_paragraph_text_37.gif",
      },

      {
        type: "finisher",
        title: "Exorcise",

        windowMs: 8000,

        buttonLabel: "Exorcise",
        buttonEmoji: "🪬",

        media:
          "https://media.discordapp.net/attachments/1405973335979851877/1470019129867239526/Your_paragraph_text_36.gif",
      },

    ],
  },


};

module.exports = {
  BOSSES,
};
