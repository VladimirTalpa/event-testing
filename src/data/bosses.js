const media = require("./media");

/**
 * Boss definitions
 * Fields expected by your boss engine:
 * - event: "bleach" | "jjk"
 * - id, name, difficulty
 * - joinMs, baseChance
 * - winReward, hitReward
 * - roleDropChance, roleDropId
 * - spawnMedia, victoryMedia, defeatMedia
 * - rounds: [{ type, title, intro, media, ... }]
 */

// If you already store these IDs in config.js, you can move them there later.
const VASTO_DROP_ROLE_ID = "1467426528584405103";      // from your earlier code
const ULQ_DROP_ROLE_ID = "1469573731301986367";        // from your earlier code
const GRIMMJOW_DROP_ROLE_ID = "1469831066628919439";   // YOU provided

module.exports = {
  /* =========================
   * BLEACH — VASTO LORDE
   * ========================= */
  vasto: {
    event: "bleach",
    id: "vasto",
    name: "Vasto Lorde",
    icon: "<:event:1469832084418727979>", // keep/replace if you moved icons to config
    difficulty: "Hard",

    joinMs: 2 * 60 * 1000,
    baseChance: 0.30,

    winReward: 200,
    hitReward: 15,

    roleDropChance: 0.025,
    roleDropId: VASTO_DROP_ROLE_ID,

    spawnMedia: media.VASTO_SPAWN,
    victoryMedia: media.VASTO_WIN,
    defeatMedia: media.VASTO_LOSE,

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
      // If you had a Round 5 gif in older version, add it here; otherwise keep as final press without media.
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
        media: media.VASTO_R4, // reuse last gif (you don't have VASTO_R5 in media)
      },
    ],
  },

  /* =========================
   * BLEACH — ULQUIORRA
   * ========================= */
  ulquiorra: {
    event: "bleach",
    id: "ulquiorra",
    name: "Ulquiorra",
    icon: "<:event:1469831975446511648>", // keep/replace if needed
    difficulty: "Extreme",

    joinMs: 3 * 60 * 1000,
    baseChance: 0.20,

    winReward: 500,
    hitReward: 25,

    roleDropChance: 0.03,
    roleDropId: ULQ_DROP_ROLE_ID,

    spawnMedia: media.ULQ_SPAWN,
    victoryMedia: media.ULQ_WIN,
    defeatMedia: media.ULQ_LOSE,

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
        windowMs: 15000, // ✅ your request
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

  /* =========================
   * BLEACH — GRIMMJOW (NEW)
   * ========================= */
  grimmjow: {
    event: "bleach",
    id: "grimmjow",
    name: "Grimmjow",
    icon: "<:event:1469831949857325097>", // your old Grimmjow emoji, can change later
    difficulty: "Medium",

    joinMs: 2 * 60 * 1000,
    baseChance: 0.50, // ✅ your request

    winReward: 125,
    hitReward: 15,

    roleDropChance: 0.0, // you didn’t specify drop chance; if you want always/percent tell me
    roleDropId: GRIMMJOW_DROP_ROLE_ID,

    spawnMedia: media.GRIMMJOW_SPAWN,
    victoryMedia: media.GRIMMJOW_WIN,
    defeatMedia: media.GRIMMJOW_LOSE,

    rounds: [
      {
        // NOTE: your engine currently supports: pressure, attack, coop_block, quick_block, finisher, combo_defense, group_final
        // Round 1 request: "press 3 block buttons within 15 seconds"
        // We'll implement it as a combo_defense of length 3 using same button set (works with current engine) OR add new type.
        // Since your current engine combo_defense is 4 presses, we emulate with a 15s "finisher" (single press) would not match.
        // BEST: keep as combo_defense 4 presses for now OR you implement multi_press later.
        // For now I convert it to "combo_defense" but your combo is fixed length 4 in code.
        type: "combo_defense",
        title: "Round 1 — Savage Assault (QTE)",
        intro:
          "Grimmjow rushes you with relentless attacks.\n" +
          "Press the buttons in the **correct order** within **15 seconds**.\n" +
          "Mistake or timeout = a hit.",
        windowMs: 15000,
        media: media.GRIMMJOW_R1,
      },
      {
        type: "coop_block",
        title: "Round 2 — Joint Block",
        intro:
          "Grimmjow unleashes a powerful strike.\n" +
          "**3 different players** must press **Block** within **10 seconds**.\n" +
          "No time = you take a hit.",
        windowMs: 10000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.GRIMMJOW_R2,
      },
      {
        type: "finisher",
        title: "Final — Stand Your Ground",
        intro:
          "Congratulations — you endured Grimmjow’s trial.\n" +
          "Press **Finish** to end the encounter.\n" +
          "If you do not press, you take a hit.",
        windowMs: 8000,
        buttonLabel: "Finish",
        buttonEmoji: "⚔️",
        media: media.GRIMMJOW_R2,
      },
    ],
  },

  /* =========================
   * JJK — SPECIAL GRADE CURSE (NEW, YOUR SPEC)
   * ========================= */
  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    icon: "<:event:1470018845245968434>", // ✅ JJK logo emoji you requested
    difficulty: "Medium",

    joinMs: 2 * 60 * 1000,
    baseChance: 0.50, // ✅ your request

    winReward: 85,
    hitReward: 5,

    roleDropChance: 0.0,
    roleDropId: null,

    spawnMedia: media.JJK_SG_SPAWN,
    victoryMedia: media.JJK_SG_WIN,
    defeatMedia: media.JJK_SG_LOSE,

    rounds: [
      {
        type: "pressure",
        title: "Round 1 — Bloodlust",
        intro:
          "The cursed spirit is excited and craves battle.\n" +
          "Endure the pressure to avoid a hit.",
        media: media.JJK_SG_R1,
      },
      {
        type: "quick_block",
        title: "Round 2 — Guard (5s)",
        intro:
          "A powerful cursed attack is coming!\n" +
          "You have **5 seconds** to press **Block**.\n" +
          "Fail = a hit.",
        windowMs: 5000,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: media.JJK_SG_R2,
      },
      {
        type: "finisher",
        title: "Round 3 — Exorcise",
        intro:
          "The spirit is trapped — this is your chance.\n" +
          "Press **Exorcise** to finish it.",
        windowMs: 8000,
        buttonLabel: "Exorcise",
        buttonEmoji: "🪬",
        media: media.JJK_SG_R3,
      },
    ],
  },
};
