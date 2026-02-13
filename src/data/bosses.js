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

const BOSSES = {
  /* ===================== BLEACH ===================== */

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

  grimmjow: {
    event: "bleach",
    id: "grimmjow",
    name: "Grimmjow",
    icon: E_GRIMJOW || "🦁",
    difficulty: "Medium",
    joinMs: 2 * 60 * 1000,

    baseChance: 0.50,
    winReward: 125,
    hitReward: 15,

    // если ты хочешь чтобы роль падала всегда — оставь 1.0
    roleDropChance: 1.0,
    roleDropId: "1469831066628919439",

    spawnMedia: media.GRIM_SPAWN_MEDIA,
    victoryMedia: media.GRIM_VICTORY_MEDIA,
    defeatMedia: media.GRIM_DEFEAT_MEDIA,

    rounds: [
      {
        type: "multi_press",
        title: "Round 1 — Relentless Assault",
        intro:
          "Grimmjow rushes in with a storm of strikes.\n" +
          "Press **Block** **3 times** within **15 seconds** to withstand it.",
        windowMs: 15000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.GRIM_R1,
      },
      {
        type: "coop_block",
        title: "Round 2 — Coordinated Defense",
        intro:
          "Grimmjow releases a heavy blow.\n" +
          "**3 players** must press **Block** within **10 seconds**.\n" +
          "Failing to block in time = you take a hit.",
        windowMs: 10000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.GRIM_R2,
      },
      {
        type: "attack",
        title: "Final — You endured the trial",
        intro:
          "You held your ground.\n" +
          "Grimmjow leaves the battlefield.",
        media: media.GRIM_VICTORY_MEDIA,
      },
    ],
  },

  /* ===================== JJK ===================== */

  mahoraga: {
    event: "jjk",
    id: "mahoraga",
    name: "Mahoraga",
    icon: "🛞",
    difficulty: "Insanity",
    joinMs: 3 * 60 * 1000,

    baseChance: 0.10,
    maxHits: 3,

    winRewardRange: { min: 800, max: 1400 },
    hitReward: 30,

    roleDropChance: 0.075,
    roleDropId: "1470124664931094590",

    expeditionKeyChance: 0.20,
    shardDropRange: { min: 5, max: 20 },

    preText: "With this treasure, I summon...",
    preTextDelayMs: 10 * 1000,
    teaserMedia: media.MAHO_TEASER,
    teaserDelayMs: 5 * 1000,

    spawnMedia: media.MAHO_SPAWN,
    victoryMedia: media.MAHO_VICTORY,
    defeatMedia: media.MAHO_DEFEAT,

    rounds: [
      {
        type: "multi_press",
        title: "Round 1 — Total Block",
        intro:
          "Block all of Mahoraga's attacks.\n" +
          "You need to press **Block** **3 times** for **10 seconds**.",
        windowMs: 10 * 1000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.MAHO_R1,
      },
      {
        type: "pressure",
        title: "Round 2 — Endure",
        intro: "Survive Mahoraga's attacks.",
        media: media.MAHO_R2,
      },
      {
        type: "pressure",
        title: "Round 3 — Pressure",
        intro: "Withstand the onslaught of Mahoraga.",
        media: media.MAHO_R3,
      },
      {
        type: "choice_qte",
        title: "Round 4 — Decide Fast",
        intro:
          "Choose quickly.\n" +
          "Press the correct button for **3 seconds**.",
        windowMs: 3000,
        choices: [
          { key: "slice", label: "Cutting", emoji: "⚔️" },
          { key: "salmon", label: "Salmon!!", emoji: "🐟" },
        ],
        correct: "slice",
        afterText: "🩸 Mahoraga took serious damage.",
        afterMedia: media.MAHO_R4_AFTER,
      },
      {
        type: "scripted_hit_all",
        title: "Round 5 — Adaptation Begins",
        intro: "Why did the wheel on his head spin ?",
        media: media.MAHO_R5_WHEEL,
        delayMs: 5000,
        spamLines: [
          "🚨 error....error....system corrupted....",
          "🚨 error....error....system corrupted....",
          "🚨 error....error....system corrupted....",
          "🚨 error....error....system corrupted....",
          "🚨 error....error....system corrupted....",
          "🚨 error....error....system corrupted....",
        ],
        endText: "⚠️ **Mahoraga adapted.**",
        endMedia: media.MAHO_ADAPTED,
      },
      {
        type: "pressure",
        title: "Round 6 — Unbreakable",
        intro: "Mahoraga becomes invincible..",
        media: media.MAHO_R6,
      },
      {
        type: "tri_press",
        title: "Round 7 — Regain Focus",
        intro:
          "Mahoraga takes over you.\n" +
          "Click **all 3 buttons** for **12 seconds**, to get ready.",
        windowMs: 12 * 1000,
        buttons: [
          { key: "focus", label: "Focus", emoji: "🧠" },
          { key: "reinforce", label: "Reinforce", emoji: "🟣" },
          { key: "resolve", label: "Get ready", emoji: "🔥" },
        ],
        media: media.MAHO_R7,
      },
      {
        type: "final_quiz",
        title: "Final — How to kill him?",
        intro: "...........",
        windowMs: 8000,
        choices: [
          { key: "domain", label: "Domain Expansion", emoji: "🌀" },
          { key: "fire_arrow", label: "Kill before adaptation", emoji: "🏹" },
          { key: "world_slash", label: "World Cutting", emoji: "🗡️" },
        ],
        correct: "fire_arrow",
      },
    ],
  },

  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    icon: "🕳️",
    difficulty: "Medium",
    joinMs: 2 * 60 * 1000,

    baseChance: 0.30,
    winReward: 200,
    hitReward: 15,

    roleDropChance: 0.0,
    roleDropId: null,

    spawnMedia: media.JJK_SG_SPAWN_MEDIA,
    victoryMedia: media.JJK_SG_VICTORY_MEDIA,
    defeatMedia: media.JJK_SG_DEFEAT_MEDIA,

    rounds: [
      {
        type: "pressure",
        title: "Round 1 — Cursed Pressure",
        intro: "Overwhelming cursed pressure floods the area.",
        media: media.JJK_SG_R1,
      },
      {
        type: "pressure",
        title: "Round 2 — Malice Surge",
        intro: "The aura turns violent. Resist it.",
        media: media.JJK_SG_R2,
      },
      {
        type: "attack",
        title: "Round 3 — Opening",
        intro: "A gap appears. Strike the core.",
        media: media.JJK_SG_R3,
      },
      {
        type: "finisher",
        title: "Round 4 — Exorcism Window",
        intro: "Finish it! Press **Exorcise** in time.",
        windowMs: 5000,
        buttonLabel: "Exorcise",
        buttonEmoji: "🪬",
        media: media.JJK_SG_VICTORY_MEDIA,
      },
    ],
  },
};

module.exports = { BOSSES };
