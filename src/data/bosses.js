// src/data/bosses.js
const {
  E_VASTO,
  E_ULQ,
  E_BLEACH,
  E_JJK,
  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
  GRIMMJOW_DROP_ROLE_ID,
} = require("../config");

const media = require("./media");

const BOSSES = {
  vasto: {
    event: "bleach",
    id: "vasto",
    name: "Vasto Lorde",
    icon: E_VASTO,
    difficulty: "Hard",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.30,
    winReward: 200,
    hitReward: 15,
    roleDropChance: 0.025,
    roleDropId: VASTO_DROP_ROLE_ID,

    spawnMedia: media.VASTO_SPAWN_MEDIA,
    victoryMedia: media.VASTO_VICTORY_MEDIA,
    defeatMedia: media.VASTO_DEFEAT_MEDIA,

    rounds: [
      { type: "pressure", title: "Round 1 — Reiatsu Wave", intro: "Vasto Lorde releases a massive wave of Reiatsu.\nWithstand it to bank Reiatsu. Fail and you take a hit (1/2).", media: media.VASTO_R1 },
      { type: "pressure", title: "Round 2 — Frenzy Pressure", intro: "Vasto Lorde enters a frenzy — the pressure intensifies.\nWithstand it to bank Reiatsu. Fail and you take a hit.", media: media.VASTO_R2 },
      { type: "coop_block", title: "Round 3 — Cooperative Block", intro: "Vasto Lorde is charging a devastating attack.\nTo survive, **4 players** must press **Block** within **5 seconds**.", windowMs: 5000, requiredPresses: 4, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.VASTO_R3 },
      { type: "attack", title: "Round 4 — Counterattack", intro: "Vasto Lorde is weakened — counterattack!\nSuccess banks Reiatsu. Failure = a hit.", media: media.VASTO_R4 },
      { type: "finisher", title: "Round 5 — Finisher", intro: "Vasto Lorde has taken heavy damage — finish it!\nPress **Finisher** within **10 seconds**.\nIf you do not press, you take a hit.", windowMs: 10 * 1000, buttonLabel: "Finisher", buttonEmoji: "⚔️", media: media.VASTO_R5 },
    ],
  },

  ulquiorra: {
    event: "bleach",
    id: "ulquiorra",
    name: "Ulquiorra",
    icon: E_ULQ,
    difficulty: "Extreme",
    joinMs: 3 * 60 * 1000,
    baseChance: 0.20,
    winReward: 500,
    hitReward: 25,
    roleDropChance: 0.03,
    roleDropId: ULQ_DROP_ROLE_ID,

    spawnMedia: media.ULQ_SPAWN_MEDIA,
    victoryMedia: media.ULQ_VICTORY_MEDIA,
    defeatMedia: media.ULQ_DEFEAT_MEDIA,

    rounds: [
      { type: "coop_block", title: "Round 1 — Cooperative Block", intro: "Ulquiorra launches a powerful attack.\nTo survive, **4 players** must press **Block** within **5 seconds**.", windowMs: 5000, requiredPresses: 4, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.ULQ_R1 },

      // ✅ you requested: make this QTE timer 15 seconds
      { type: "combo_defense", title: "Round 2 — Combo Defense (QTE)", intro: "Ulquiorra attacks again — Combo Defense!\nPress the buttons in the **correct order** within **15 seconds**.\nMistake or timeout = a hit.", windowMs: 15000, media: media.ULQ_R2 },

      { type: "pressure", title: "Round 3 — Transformation Pressure", intro: "Ulquiorra transforms — Reiatsu pressure becomes insane.\nWithstand it to avoid a hit.", media: media.ULQ_R3 },
      { type: "pressure", title: "Round 4 — Suffocating Pressure", intro: "The pressure intensifies even further.\nWithstand it to avoid a hit.", media: media.ULQ_R4 },
      { type: "quick_block", title: "Round 5 — Quick Block (2s)", intro: "Ulquiorra prepares a lethal strike!\nYou have **2 seconds** to press **Block**.\nBlock in time to survive and counterattack (banked reward).", windowMs: 2000, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.ULQ_R5 },
      { type: "group_final", title: "Round 6 — Final Push", intro: "Ulquiorra is weakened — your final attack can decide everything.\n**At least 3 players** must succeed the roll.\nIf fewer than 3 succeed — **everyone loses**.", requiredWins: 3, media: media.ULQ_R6 },
    ],
  },

  // ✅ NEW: Grimmjow (Bleach)
  grimmjow: {
    event: "bleach",
    id: "grimmjow",
    name: "Grimmjow",
    icon: E_BLEACH,
    difficulty: "Medium",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.50,
    winReward: 125,
    hitReward: 15,
    roleDropChance: 1.0, // always award (since you gave a role id)
    roleDropId: GRIMMJOW_DROP_ROLE_ID,

    spawnMedia: media.GRIM_SPAWN_MEDIA,
    victoryMedia: media.GRIM_VICTORY_MEDIA,
    defeatMedia: media.GRIM_DEFEAT_MEDIA,

    rounds: [
      {
        type: "multi_press", // NEW round type implemented in boss.js below
        title: "Round 1 — Savage Rush",
        intro:
          "Grimmjow rushes you with a flurry of attacks.\n" +
          "Press **Block** **3 times** within **15 seconds** to withstand.",
        windowMs: 15000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.GRIM_R1,
      },
      {
        type: "coop_block",
        title: "Round 2 — Strong Strike",
        intro:
          "Grimmjow unleashes a powerful attack.\n" +
          "**3 players** must press **Block** within **10 seconds**.\n" +
          "Miss it — you take a hit.",
        windowMs: 10000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.GRIM_R2,
      },
    ],
  },

  // ✅ NEW: JJK Special Grade Curse (you requested)
  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    icon: E_JJK,
    difficulty: "Medium",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.50,
    winReward: 85,
    hitReward: 5,
    roleDropChance: 0.0,
    roleDropId: null,

    spawnMedia: media.JJK_SG_SPAWN_MEDIA,
    victoryMedia: media.JJK_SG_VICTORY_MEDIA,
    defeatMedia: media.JJK_SG_DEFEAT_MEDIA,

    rounds: [
      { type: "pressure", title: "Round 1 — Bloodlust", intro: "The cursed spirit is thrilled and craves battle.", media: media.JJK_SG_R1 },
      { type: "quick_block", title: "Round 2 — Block (5s)", intro: "The cursed spirit unleashes a strong attack.\nPress **Block** within **5 seconds**.", windowMs: 5000, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.JJK_SG_R2 },
      { type: "finisher", title: "Round 3 — Exorcise", intro: "The cursed spirit is trapped.\nPress **Exorcise** to finish it.", windowMs: 8000, buttonLabel: "Exorcise", buttonEmoji: "🪬", media: media.JJK_SG_R3 },
    ],
  },
};

module.exports = { BOSSES };
