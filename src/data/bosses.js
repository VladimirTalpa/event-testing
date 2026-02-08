// src/data/bosses.js
const {
  E_VASTO,
  E_ULQ,
  E_GRIMJOW,
  E_JJK,
  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
  GRIMMJOW_DROP_ROLE_ID,
} = require("../config");

const media = require("./media");

/* ===================== GRIMMJOW MEDIA (direct links from you) ===================== */
const GRIM_SPAWN =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843123160088636/Your_paragraph_text_20.gif?ex=69892194&is=6987d014&hm=f4f9a53a32821a59c255ab38ca2785aee18654acfb13fad1220324fc93b31431&=";

const GRIM_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843137181651024/Your_paragraph_text_21.gif?ex=69892198&is=6987d018&hm=4852cd95f921b0d65021bb4569e695eca88078b0b75c31072e307163190e702f&=";

const GRIM_R2 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843163945504899/Your_paragraph_text_23.gif?ex=6989219e&is=6987d01e&hm=2ac5fdbc70879714bf44c2c107d643cb61b67f79b7e27dbea0fb2a30c7feb861&=";

const GRIM_VICTORY =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843182920532062/Your_paragraph_text_24.gif?ex=698921a3&is=6987d023&hm=7156f4b3cddeb4dc24e79afd243b5967c6ea239b53c1fdb75e6a3ca271546ece&=";

const GRIM_DEFEAT =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843151152746668/Your_paragraph_text_22.gif?ex=6989219b&is=6987d01b&hm=0482ac0a77dc9e0d047b55951c7708d71badbda4d9cc3b6f906d3e445e780dcc&=";

/* ===================== SPECIAL GRADE (NEW GIFS FROM YOU) ===================== */
const SG_SPAWN =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019091216597002/Your_paragraph_text_39.gif?ex=6989c576&is=698873f6&hm=202a603d2f90e20a5cc05442be5725288cbee9f3148115b34e1e38a502b92c8b&=";

const SG_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019102163730637/Your_paragraph_text_38.gif?ex=6989c579&is=698873f9&hm=15c50afadae2c1ae772b207479ee483d014be35850f95ecc41172fb8d70ab9ea&=";

const SG_R2 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019117309235418/Your_paragraph_text_37.gif?ex=6989c57d&is=698873fd&hm=d844521a54938743ea9dddb3787cc0cc9e13405ee0bd053012a234caaeb25115&=";

const SG_R3 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019129867239526/Your_paragraph_text_36.gif?ex=6989c580&is=69887400&hm=7793353f116000d95fb393f34a41586e9fe7300005d00cd8862e34226041c766&=";

const SG_VICTORY =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019159818637446/Your_paragraph_text_34.gif?ex=6989c587&is=69887407&hm=99b7163d50ac6f03bdfb132a1f38716d9f331a4e3fb395a033db8bbaaa4c5bed&=";

const SG_DEFEAT =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019147839701177/Your_paragraph_text_35.gif?ex=6989c584&is=69887404&hm=366ad3f129479258f8d56f37c4ba5c3a7fd15e9767a79435f78e81e3f5a132d5&=";

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

      // ✅ CHANGED: combo_defense timer to 15 seconds
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

      { type: "pressure", title: "Round 3 — Transformation Pressure", intro: "Ulquiorra transforms — Reiatsu pressure becomes insane.\nWithstand it to avoid a hit.", media: media.ULQ_R3 },
      { type: "pressure", title: "Round 4 — Suffocating Pressure", intro: "The pressure intensifies even further.\nWithstand it to avoid a hit.", media: media.ULQ_R4 },
      { type: "quick_block", title: "Round 5 — Quick Block (2s)", intro: "Ulquiorra prepares a lethal strike!\nYou have **2 seconds** to press **Block**.\nBlock in time to survive and counterattack (banked reward).", windowMs: 2000, buttonLabel: "Block", buttonEmoji: "🛡️", media: media.ULQ_R5 },
      { type: "group_final", title: "Round 6 — Final Push", intro: "Ulquiorra is weakened — your final attack can decide everything.\n**At least 3 players** must succeed the roll.\nIf fewer than 3 succeed — **everyone loses**.", requiredWins: 3, media: media.ULQ_R6 },
    ],
  },

  // ✅ NEW BOSS: Grimmjow (Bleach)
  grimmjow: {
    event: "bleach",
    id: "grimmjow",
    name: "Grimmjow",
    icon: E_GRIMJOW,
    difficulty: "Medium",
    joinMs: 2 * 60 * 1000,

    baseChance: 0.50,
    winReward: 125,
    hitReward: 15,

    // you said: "и роль ... id"
    // I interpret same as other bosses: role drop chance
    roleDropChance: 0.03,
    roleDropId: GRIMMJOW_DROP_ROLE_ID,

    spawnMedia: GRIM_SPAWN,
    victoryMedia: GRIM_VICTORY,
    defeatMedia: GRIM_DEFEAT,

    rounds: [
      {
        type: "coop_block",
        title: "Round 1 — Barrage Assault",
        intro:
          "Grimmjow rushes you with a relentless combo.\n" +
          "To withstand it: **3 players** must press **Block** within **15 seconds**.",
        windowMs: 15000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: GRIM_R1,
      },
      {
        type: "coop_block",
        title: "Round 2 — Heavy Strike",
        intro:
          "Grimmjow unleashes a powerful attack.\n" +
          "**3 players** must block together within **10 seconds**.\n" +
          "Failing = you take a hit.",
        windowMs: 10000,
        requiredPresses: 3,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: GRIM_R2,
      },
    ],
  },

  // ✅ UPDATED: Special Grade Curse (JJK) by your description
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

    // ✅ material for crafting: cursed shard (handled in boss.js)
    materialKey: "cursed_shard",
    materialAmount: 1,
    materialName: "Cursed Shard",

    spawnMedia: SG_SPAWN,
    victoryMedia: SG_VICTORY,
    defeatMedia: SG_DEFEAT,

    rounds: [
      {
        type: "pressure",
        title: "Round 1 — Bloodlust",
        intro: "The cursed spirit is ecstatic and hungry for a fight.\nSurvive to bank rewards.",
        media: SG_R1,
      },
      {
        type: "quick_block",
        title: "Round 2 — Block Window (5s)",
        intro:
          "The cursed spirit launches a heavy attack.\n" +
          "You must press **Block** within **5 seconds**.\n" +
          "Too slow = a hit.",
        windowMs: 5000,
        buttonLabel: "Block",
        buttonEmoji: "🛡️",
        media: SG_R2,
      },
      {
        type: "finisher",
        title: "Round 3 — Exorcise",
        intro:
          "The cursed spirit is trapped.\n" +
          "Press **Exorcise** to finish it.\n" +
          "Failing = a hit.",
        windowMs: 5000,
        buttonLabel: "Exorcise",
        buttonEmoji: "🪬",
        media: SG_R3,
      },
    ],
  },
};

module.exports = { BOSSES };
