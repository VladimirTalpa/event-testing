// src/data/bosses.js
const { E_VASTO, E_ULQ, E_BLEACH, E_JJK, VASTO_DROP_ROLE_ID, ULQ_DROP_ROLE_ID } = require("../config");
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
      {
        type: "pressure",
        title: "Round 1 — Reiatsu Wave",
        intro:
          "Vasto Lorde releases a massive wave of Reiatsu.\n" +
          "Withstand it to bank Reiatsu. Fail and you take a hit (1/2).",
        media: media.VASTO_R1,
      },
      {
        type: "pressure",
        title: "Round 2 — Frenzy Pressure",
        intro:
          "Vasto Lorde enters a frenzy — the pressure intensifies.\n" +
          "Withstand it to bank Reiatsu. Fail and you take a hit.",
        media: media.VASTO_R2,
      },
      {
        type: "coop_block",
        title: "Round 3 — Cooperative Block",
        intro:
          "Vasto Lorde is charging a devastating attack.\n" +
          "To survive, **4 players** must press **Block** within **5 seconds**.",
        windowMs: 5000,
        requiredPresses: 4,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.VASTO_R3,
      },
      {
        type: "attack",
        title: "Round 4 — Counterattack",
        intro:
          "Vasto Lorde is weakened — counterattack!\n" +
          "Success banks Reiatsu. Failure = a hit.",
        media: media.VASTO_R4,
      },
      {
        type: "finisher",
        title: "Round 5 — Finisher",
        intro:
          "Vasto Lorde has taken heavy damage — finish it!\n" +
          "Press **Finisher** within **10 seconds**.\n" +
          "If you do not press, you take a hit.",
        windowMs: 10 * 1000,
        buttonLabel: "Finisher",
        buttonEmoji: "⚔️",
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
      {
        type: "coop_block",
        title: "Round 1 — Cooperative Block",
        intro:
          "Ulquiorra launches a powerful attack.\n" +
          "To survive, **4 players** must press **Block** within **5 seconds**.",
        windowMs: 5000,
        requiredPresses: 4,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.ULQ_R1,
      },
      {
        type: "combo_defense",
        title: "Round 2 — Combo Defense (QTE)",
        intro:
          "Ulquiorra attacks again — Combo Defense!\n" +
          "Press the buttons in the **correct order** within **5 seconds**.\n" +
          "Mistake or timeout = a hit.",
        windowMs: 5000,
        media: media.ULQ_R2,
      },
      {
        type: "pressure",
        title: "Round 3 — Transformation Pressure",
        intro:
          "Ulquiorra transforms — Reiatsu pressure becomes insane.\n" +
          "Withstand it to avoid a hit.",
        media: media.ULQ_R3,
      },
      {
        type: "pressure",
        title: "Round 4 — Suffocating Pressure",
        intro:
          "The pressure intensifies even further.\n" +
          "Withstand it to avoid a hit.",
        media: media.ULQ_R4,
      },
      {
        type: "quick_block",
        title: "Round 5 — Quick Block (2s)",
        intro:
          "Ulquiorra prepares a lethal strike!\n" +
          "You have **2 seconds** to press **Block**.\n" +
          "Block in time to survive and counterattack (banked reward).",
        windowMs: 2000,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.ULQ_R5,
      },
      {
        type: "group_final",
        title: "Round 6 — Final Push",
        intro:
          "Ulquiorra is weakened — your final attack can decide everything.\n" +
          "**At least 3 players** must succeed the roll.\n" +
          "If fewer than 3 succeed — **everyone loses**.",
        requiredWins: 3,
        media: media.ULQ_R6,
      },
    ],
  },

  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    icon: E_JJK,
    difficulty: "Deadly",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.30,
    winReward: 200,
    hitReward: 15,
    roleDropChance: 0.0,
    roleDropId: null,

    spawnMedia: media.JJK_BOSS_SPAWN_MEDIA,
    victoryMedia: media.JJK_BOSS_VICTORY_MEDIA,
    defeatMedia: media.JJK_BOSS_DEFEAT_MEDIA,

    rounds: [
      { type: "pressure", title: "Round 1 — Cursed Pressure", intro: "Overwhelming cursed pressure floods the area.", media: media.JJK_BOSS_R1 },
      { type: "pressure", title: "Round 2 — Malice Surge", intro: "The aura turns violent. Resist it.", media: media.JJK_BOSS_R2 },
      { type: "attack", title: "Round 3 — Opening", intro: "A gap appears. Strike the core.", media: media.JJK_BOSS_R3 },
      { type: "finisher", title: "Round 4 — Exorcism Window", intro: "Finish it! Press **Exorcise** in time.", windowMs: 5000, buttonLabel: "Exorcise", buttonEmoji: "🪬", media: media.JJK_BOSS_R4 },
    ],
  },
};

module.exports = { BOSSES };
