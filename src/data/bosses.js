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
      // ✅ You asked: combo timer => 15 seconds
      { type: "combo_defense", title: "Round 2 — Combo Defense (QTE)", intro: "Ulquiorra attacks again — Combo Defense!\nPress the buttons in the **correct order** within **15 seconds**.\nMistake or timeout = a hit.", windowMs: 15000, media: media.ULQ_R2 },
      { type: "pressure", title: "Round 3 — Transformation Pressure", intro: "Ulquiorra transforms — Reiatsu pressure becomes insane.\nWithstand it to avoid a hit.", media: media.ULQ_R3 },
      { type: "pressure", title: "Round 4 — Suffocating Pressure", intro: "The pressure intensifies even further.\nWithstand it to avoid a hit.", media: media.ULQ_R4 },
      { type: "quick_block", title: "Round 5 — Quick Block (2s)", intro: "Ulquiorra prepares a lethal strike!\nYou have **2 seconds** to press **Block**.\nBlock in time to survive and counterattack (banked reward).", windowMs: 2000, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.ULQ_R5 },
      { type: "group_final", title: "Round 6 — Final Push", intro: "Ulquiorra is weakened — your final attack can decide everything.\n**At least 3 players** must succeed the roll.\nIf fewer than 3 succeed — **everyone loses**.", requiredWins: 3, media: media.ULQ_R6 },
    ],
  },

  /* ===================== MAHORAGA (JJK) ===================== */
  mahoraga: {
    event: "jjk",
    id: "mahoraga",
    name: "Mahoraga",
    icon: E_JJK,
    difficulty: "Insanity",
    joinMs: 3 * 60 * 1000,

    // you asked: 10% survive chance
    baseChance: 0.10,

    // you asked: lives = 3
    maxHits: 3,

    // rewards: win CE 800-1400 random, +30 per success banked
    winRewardRange: { min: 800, max: 1400 },
    hitReward: 30,

    // drops
    roleDropChance: 0.075,
    roleDropId: "1470124664931094590",
    expeditionKeyChance: 0.20,
    shardDropRange: { min: 5, max: 20 }, // per winner random

    // pre intro
    preText: "этим сокровищем я призываю......",
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
          "Заблокируйте все атаки Махораги.\n" +
          "Нужно нажать **Block** **3 раза** за **10 секунд**.",
        windowMs: 10 * 1000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.MAHO_R1,
      },
      {
        type: "pressure",
        title: "Round 2 — Endure",
        intro: "Выдержите атаки Махораги.",
        media: media.MAHO_R2,
      },
      {
        type: "pressure",
        title: "Round 3 — Pressure",
        intro: "Выдержите натиск Махораги.",
        media: media.MAHO_R3,
      },
      {
        type: "choice_qte",
        title: "Round 4 — Decide Fast",
        intro:
          "Выбери быстро.\n" +
          "Нажми правильную кнопку за **3 секунды**.",
        windowMs: 3000,
        choices: [
          { key: "slice", label: "Разрезание", emoji: "⚔️" },
          { key: "salmon", label: "Лосось!!", emoji: "🐟" },
        ],
        correct: "slice",
        afterText: "🩸 Махорага получил серьёзный урон.",
        afterMedia: media.MAHO_R4_AFTER,
      },
      {
        type: "scripted_hit_all",
        title: "Round 5 — Adaptation Begins",
        intro: "почему колесо у него на голове покрутилось ?",
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
        endText: "⚠️ **Махорага адаптировался.**",
        endMedia: media.MAHO_ADAPTED,
      },
      {
        type: "pressure",
        title: "Round 6 — Unbreakable",
        intro: "Махорага становится непобедимым…",
        media: media.MAHO_R6,
      },
      {
        type: "tri_press",
        title: "Round 7 — Regain Focus",
        intro:
          "Махорага берёт над вами превосходство.\n" +
          "Нажмите **все 3 кнопки** за **12 секунд**, чтобы собраться.",
        windowMs: 12 * 1000,
        buttons: [
          { key: "focus", label: "Сосредоточиться", emoji: "🧠" },
          { key: "reinforce", label: "Укрепить CE", emoji: "🟣" },
          { key: "resolve", label: "Собраться", emoji: "🔥" },
        ],
        media: media.MAHO_R7,
      },
      {
        type: "final_quiz",
        title: "Final — How to kill him?",
        intro: "Как его убить ?",
        windowMs: 8000,
        choices: [
          { key: "domain", label: "Расширение территорий", emoji: "🌀" },
          { key: "fire_arrow", label: "Убить до адаптации огненной стрелой", emoji: "🏹" },
          { key: "world_slash", label: "Мировое разрезание", emoji: "🗡️" },
        ],
        correct: "fire_arrow",
      },
    ],
  },

  /* ===================== OLD specialgrade (kept) ===================== */
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
