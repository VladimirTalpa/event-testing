// src/data/bosses.js
const {
  E_VASTO,
  E_ULQ,
  E_JJK,
  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
} = require("../config");

const media = require("./media");

// ✅ Grimmjow role id you gave
const GRIMMJOW_ROLE_ID = "1469831066628919439";

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
          "Press the buttons in the **correct order** within **15 seconds**.\n" +
          "Mistake or timeout = a hit.",
        // ✅ CHANGED TO 15s (you requested)
        windowMs: 15000,
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

  // ✅ NEW: Grimmjow (Bleach)
  grimmjow: {
    event: "bleach",
    id: "grimmjow",
    name: "Grimmjow",
    icon: "🐆",
    difficulty: "Medium",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.50,
    winReward: 125,
    hitReward: 15,

    // you said: "и роль его роль ... id"
    // chance not provided -> set same as Vasto (2.5%)
    roleDropChance: 0.025,
    roleDropId: GRIMMJOW_ROLE_ID,

    spawnMedia: media.GRIM_SPAWN_MEDIA,
    victoryMedia: media.GRIM_VICTORY_MEDIA,
    defeatMedia: media.GRIM_DEFEAT_MEDIA,

    rounds: [
      {
        type: "combo_defense",
        title: "Round 1 — Relentless Assault",
        intro:
          "Grimmjow rushes you with a storm of attacks.\n" +
          "Press the buttons in the **correct order** within **15 seconds**.\n" +
          "Mistake or timeout = a hit.",
        windowMs: 15000,
        media: media.GRIM_R1,
      },
      {
        type: "coop_block",
        title: "Round 2 — Heavy Strike",
        intro:
          "Grimmjow unleashes a powerful attack.\n" +
          "**3 players** must press **Block** within **10 seconds**.\n" +
          "Fail = everyone takes a hit.",
        windowMs: 10000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.GRIM_R2,
      },
    ],
  },

  // ✅ NEW JJK Special Grade (replaces old placeholder logic)
  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    icon: E_JJK,
    difficulty: "Medium",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.50,

    // you requested:
    // winReward = 85 CE
    // hitReward = 5 CE banked per success
    winReward: 85,
    hitReward: 5,

    // no role drop mentioned for JJK boss
    roleDropChance: 0.0,
    roleDropId: null,

    // ✅ NEW material reward for crafting later
    materialReward: { key: "cursed_shard", name: "Cursed Shard", amount: 1 },

    spawnMedia: media.JJK_BOSS_SPAWN_MEDIA,
    victoryMedia: media.JJK_BOSS_VICTORY_MEDIA,
    defeatMedia: media.JJK_BOSS_DEFEAT_MEDIA,

    rounds: [
      {
        type: "pressure",
        title: "Round 1 — Bloodlust",
        intro: "The curse is thrilled and craves battle. Endure its presence.",
        media: media.JJK_BOSS_R1,
      },
      {
        type: "quick_block",
        title: "Round 2 — Sudden Attack",
        intro:
          "The curse fires a devastating strike!\n" +
          "You have **5 seconds** to press **Block**.\n" +
          "Too late = you take a hit.",
        windowMs: 5000,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.JJK_BOSS_R2,
      },
      {
        type: "finisher",
        title: "Round 3 — Exorcise",
        intro:
          "The curse is trapped — this is your chance!\n" +
          "Press **Exorcise** in time to finish it.",
        windowMs: 5000,
        buttonLabel: "Exorcise",
        buttonEmoji: "🪬",
        media: media.JJK_BOSS_R3,
      },
    ],
  },
};

module.exports = { BOSSES };
