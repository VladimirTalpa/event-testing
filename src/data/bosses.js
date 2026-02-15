// src/data/bosses.js
const {
  E_VASTO,
  E_ULQ,
  E_JJK,
  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
} = require("../config");

const media = require("./media");

// ✅ join time (кд до начала) = 30 секунд
const JOIN_30S = 30 * 1000;

const BOSSES = {
  vasto: {
    event: "bleach",
    id: "vasto",
    name: "Vasto Lorde",
    icon: E_VASTO,
    difficulty: "Hard",
    joinMs: JOIN_30S,
    baseChance: 0.30,
    winReward: 200,
    hitReward: 15,
    roleDropChance: 0.025,
    roleDropId: VASTO_DROP_ROLE_ID,

    spawnMedia: media.VASTO_SPAWN_MEDIA,
    victoryMedia: media.VASTO_VICTORY_MEDIA,
    defeatMedia: media.VASTO_DEFEAT_MEDIA,

    rounds: [
      { type: "pressure", title: "Round 1 — Reiatsu Wave", intro: "Withstand it.", media: media.VASTO_R1 },
      { type: "pressure", title: "Round 2 — Frenzy Pressure", intro: "Withstand it.", media: media.VASTO_R2 },
      { type: "coop_block", title: "Round 3 — Cooperative Block", intro: "4 players must press Block within 5s.", windowMs: 5000, requiredPresses: 4, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.VASTO_R3 },
      { type: "attack", title: "Round 4 — Counterattack", intro: "Strike back.", media: media.VASTO_R4 },
      { type: "finisher", title: "Round 5 — Finisher", intro: "Press Finisher within 10s.", windowMs: 10 * 1000, buttonLabel: "Finisher", buttonEmoji: "⚔️", media: media.VASTO_R5 },
    ],
  },

  ulquiorra: {
    event: "bleach",
    id: "ulquiorra",
    name: "Ulquiorra",
    icon: E_ULQ,
    difficulty: "Extreme",
    joinMs: JOIN_30S,
    baseChance: 0.20,
    winReward: 500,
    hitReward: 25,
    roleDropChance: 0.03,
    roleDropId: ULQ_DROP_ROLE_ID,

    spawnMedia: media.ULQ_SPAWN_MEDIA,
    victoryMedia: media.ULQ_VICTORY_MEDIA,
    defeatMedia: media.ULQ_DEFEAT_MEDIA,

    rounds: [
      { type: "coop_block", title: "Round 1 — Cooperative Block", intro: "4 players must press Block within 5s.", windowMs: 5000, requiredPresses: 4, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.ULQ_R1 },
      { type: "combo_defense", title: "Round 2 — Combo Defense (QTE)", intro: "Press combo order within 15s.", windowMs: 15000, media: media.ULQ_R2 },
      { type: "pressure", title: "Round 3 — Transformation Pressure", intro: "Withstand it.", media: media.ULQ_R3 },
      { type: "pressure", title: "Round 4 — Suffocating Pressure", intro: "Withstand it.", media: media.ULQ_R4 },
      { type: "quick_block", title: "Round 5 — Quick Block (2s)", intro: "Press Block within 2s.", windowMs: 2000, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.ULQ_R5 },
      { type: "group_final", title: "Round 6 — Final Push", intro: "At least 3 players must succeed.", requiredWins: 3, media: media.ULQ_R6 },
    ],
  },

  grimmjow: {
    event: "bleach",
    id: "grimmjow",
    name: "Grimmjow",
    icon: "🦁",
    difficulty: "Medium",
    joinMs: JOIN_30S,
    baseChance: 0.50,
    winReward: 125,
    hitReward: 15,
    roleDropChance: 1.0,
    roleDropId: "1469831066628919439",

    spawnMedia: media.GRIM_SPAWN_MEDIA,
    victoryMedia: media.GRIM_VICTORY_MEDIA,
    defeatMedia: media.GRIM_DEFEAT_MEDIA,

    rounds: [
      { type: "multi_press", title: "Round 1 — Relentless Assault", intro: "Press Block 3 times within 15s.", windowMs: 15000, requiredPresses: 3, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.GRIM_R1 },
      { type: "coop_block", title: "Round 2 — Coordinated Defense", intro: "3 players must press Block within 10s.", windowMs: 10000, requiredPresses: 3, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.GRIM_R2 },
      { type: "attack", title: "Final — You endured the trial", intro: "Grimmjow leaves.", media: media.GRIM_VICTORY_MEDIA },
    ],
  },

  mahoraga: {
    event: "jjk",
    id: "mahoraga",
    name: "Mahoraga",
    icon: E_JJK,
    difficulty: "Insanity",
    joinMs: JOIN_30S,
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
      { type: "multi_press", title: "Round 1 — Total Block", intro: "Press Block 3 times for 10s.", windowMs: 10 * 1000, requiredPresses: 3, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.MAHO_R1 },
      { type: "pressure", title: "Round 2 — Endure", intro: "Survive.", media: media.MAHO_R2 },
      { type: "pressure", title: "Round 3 — Pressure", intro: "Withstand.", media: media.MAHO_R3 },
      {
        type: "choice_qte",
        title: "Round 4 — Decide Fast",
        intro: "Choose correct button in 3s.",
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
        intro: "Why did the wheel spin?",
        delayMs: 5000,
        spamLines: ["🚨 error....error....system corrupted....", "🚨 error....error....system corrupted....", "🚨 error....error....system corrupted...."],
        endText: "⚠️ **Mahoraga adapted.**",
        endMedia: media.MAHO_ADAPTED,
      },
      { type: "pressure", title: "Round 6 — Unbreakable", intro: "He becomes invincible..", media: media.MAHO_R6 },
      {
        type: "tri_press",
        title: "Round 7 — Regain Focus",
        intro: "Click all 3 buttons in 12 seconds.",
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
    icon: E_JJK,
    difficulty: "Medium",
    joinMs: JOIN_30S,
    baseChance: 0.30,
    winReward: 200,
    hitReward: 15,
    roleDropChance: 0.0,
    roleDropId: null,

    spawnMedia: media.JJK_SG_SPAWN_MEDIA,
    victoryMedia: media.JJK_SG_VICTORY_MEDIA,
    defeatMedia: media.JJK_SG_DEFEAT_MEDIA,

    rounds: [
      { type: "pressure", title: "Round 1 — Cursed Pressure", intro: "Overwhelming aura.", media: media.JJK_SG_R1 },
      { type: "pressure", title: "Round 2 — Malice Surge", intro: "Resist.", media: media.JJK_SG_R2 },
      { type: "attack", title: "Round 3 — Opening", intro: "Strike the core.", media: media.JJK_SG_R3 },
      { type: "finisher", title: "Round 4 — Exorcism Window", intro: "Press Exorcise in time.", windowMs: 5000, buttonLabel: "Exorcise", buttonEmoji: "🪬", media: media.JJK_SG_R3 },
    ],
  },
};

module.exports = { BOSSES };
