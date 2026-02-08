// src/data/bosses.js
const {
  E_VASTO,
  E_ULQ,
  E_BLEACH,
  E_JJK,
  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
} = require("../config");

const media = require("./media");

const BOSSES = {
  /* ===================== VASTO ===================== */
  vasto: {
    event: "bleach",
    id: "vasto",
    name: "Vasto Lorde",
    icon: E_VASTO,
    difficulty: "Hard",
    joinMs: 2 * 60 * 1000,
    baseChance: 0.3,
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
        intro: "Vasto Lorde releases massive Reiatsu.",
        media: media.VASTO_R1,
      },
      {
        type: "pressure",
        title: "Round 2 — Frenzy",
        intro: "Pressure increases.",
        media: media.VASTO_R2,
      },
      {
        type: "coop_block",
        title: "Round 3 — Block Together",
        windowMs: 5000,
        requiredPresses: 4,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.VASTO_R3,
      },
      {
        type: "attack",
        title: "Round 4 — Counter",
        intro: "Strike back.",
        media: media.VASTO_R4,
      },
      {
        type: "finisher",
        title: "Round 5 — Finish",
        windowMs: 10000,
        buttonLabel: "Finisher",
        buttonEmoji: "⚔️",
        media: media.VASTO_R5,
      },
    ],
  },

  /* ===================== ULQUIORRA ===================== */
  ulquiorra: {
    event: "bleach",
    id: "ulquiorra",
    name: "Ulquiorra",
    icon: E_ULQ,
    difficulty: "Extreme",
    joinMs: 3 * 60 * 1000,
    baseChance: 0.2,
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
        title: "Round 1 — Block",
        windowMs: 5000,
        requiredPresses: 4,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.ULQ_R1,
      },
      {
        // ⬇️ УВЕЛИЧЕНО ДО 15 СЕК
        type: "combo_defense",
        title: "Round 2 — Combo Defense",
        windowMs: 15000,
        media: media.ULQ_R2,
      },
      {
        type: "pressure",
        title: "Round 3 — Pressure",
        media: media.ULQ_R3,
      },
      {
        type: "pressure",
        title: "Round 4 — Pressure+",
        media: media.ULQ_R4,
      },
      {
        type: "quick_block",
        title: "Round 5 — Quick Block",
        windowMs: 2000,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.ULQ_R5,
      },
      {
        type: "group_final",
        title: "Round 6 — Final",
        requiredWins: 3,
        media: media.ULQ_R6,
      },
    ],
  },

  /* ===================== GRIMMJOW (NEW) ===================== */
  grimmjow: {
    event: "bleach",
    id: "grimmjow",
    name: "Grimmjow",
    icon: "🐆",
    difficulty: "Medium",

    joinMs: 2 * 60 * 1000,
    baseChance: 0.5,
    winReward: 125,
    hitReward: 15,

    roleDropChance: 1.0,
    roleDropId: "1469831066628919439",

    spawnMedia: media.GRIMMJOW_SPAWN,
    victoryMedia: media.GRIMMJOW_WIN,
    defeatMedia: media.GRIMMJOW_LOSE,

    rounds: [
      {
        type: "coop_block",
        title: "Round 1 — Barrage",
        windowMs: 15000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.GRIMMJOW_R1,
      },
      {
        type: "coop_block",
        title: "Round 2 — Heavy Strike",
        windowMs: 10000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.GRIMMJOW_R2,
      },
    ],
  },

  /* ===================== JJK SPECIAL ===================== */
  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    icon: "🩸",
    difficulty: "Medium",

    joinMs: 2 * 60 * 1000,
    baseChance: 0.5,
    winReward: 85,
    hitReward: 5,

    spawnMedia: media.JJK_NEW_SPAWN,
    victoryMedia: media.JJK_NEW_WIN,
    defeatMedia: media.JJK_NEW_LOSE,

    rounds: [
      {
        type: "pressure",
        title: "Round 1 — Bloodlust",
        media: media.JJK_NEW_R1,
      },
      {
        type: "quick_block",
        title: "Round 2 — Block",
        windowMs: 5000,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.JJK_NEW_R2,
      },
      {
        type: "finisher",
        title: "Round 3 — Exorcise",
        windowMs: 7000,
        buttonLabel: "Exorcise",
        buttonEmoji: "🪬",
        media: media.JJK_NEW_R3,
      },
    ],
  },
};

module.exports = { BOSSES };
