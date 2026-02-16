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

  grimmjow: {
  event: "bleach",
  id: "grimmjow",
  name: "Grimmjow",
  icon: "🦁", // можешь заменить на свой emoji если хочешь
  difficulty: "Medium",
  joinMs: 2 * 60 * 1000,
  baseChance: 0.50,
  winReward: 125,
  hitReward: 15,
  roleDropChance: 1.0, // если роль должна падать всегда при победе — оставь 1.0
  roleDropId: "1469831066628919439",

  spawnMedia: "https://media.discordapp.net/attachments/1405973335979851877/1469843123160088636/Your_paragraph_text_20.gif?ex=69892194&is=6987d014&hm=f4f9a53a32821a59c255ab38ca2785aee18654acfb13fad1220324fc93b31431&=",
  victoryMedia: "https://media.discordapp.net/attachments/1405973335979851877/1469843182920532062/Your_paragraph_text_24.gif?ex=698921a3&is=6987d023&hm=7156f4b3cddeb4dc24e79afd243b5967c6ea239b53c1fdb75e6a3ca271546ece&=",
  defeatMedia: "https://media.discordapp.net/attachments/1405973335979851877/1469843151152746668/Your_paragraph_text_22.gif?ex=6989219b&is=6987d01b&hm=0482ac0a77dc9e0d047b55951c7708d71badbda4d9cc3b6f906d3e445e780dcc&=",

  rounds: [
    {
      type: "multi_press",                // ⚠️ это новый тип, см. примечание ниже
      title: "Round 1 — Relentless Assault",
      intro:
        "Grimmjow rushes in with a storm of strikes.\n" +
        "Press **Block** **3 times** within **15 seconds** to withstand it.",
      windowMs: 15000,
      requiredPresses: 3,
      buttonLabel: "Block",
      buttonEmoji: "🛡️",
      media: "https://media.discordapp.net/attachments/1405973335979851877/1469843137181651024/Your_paragraph_text_21.gif?ex=69892198&is=6987d018&hm=4852cd95f921b0d65021bb4569e695eca88078b0b75c31072e307163190e702f&=",
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
      media: "https://media.discordapp.net/attachments/1405973335979851877/1469843163945504899/Your_paragraph_text_23.gif?ex=6989219e&is=6987d01e&hm=2ac5fdbc70879714bf44c2c107d643cb61b67f79b7e27dbea0fb2a30c7feb861&=",
    },
    {
      type: "attack",
      title: "Final — You endured the trial",
      intro:
        "You held your ground.\n" +
        "Grimmjow leaves the battlefield.",
      media: "https://media.discordapp.net/attachments/1405973335979851877/1469843182920532062/Your_paragraph_text_24.gif?ex=698921a3&is=6987d023&hm=7156f4b3cddeb4dc24e79afd243b5967c6ea239b53c1fdb75e6a3ca271546ece&=",
    },
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
          { key: "focus", label: "Focuse", emoji: "🧠" },
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

  /* ===================== OLD specialgrade (kept) ===================== */
  specialgrade: {
    event: "jjk",
    id: "specialgrade",
    name: "Special Grade Curse",
    icon: E_JJK,
    difficulty: "Medium",
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

media:

// src/data/media.js

/* ===================== BLEACH MEDIA ===================== */
const VASTO_SPAWN_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842057219674194/Your_paragraph_text_13.gif?ex=69892096&is=6987cf16&hm=c31783bb0a9a57c197a3faf8d9314fb2a1d4621d424c8961bfcb2c0f0c753ef3&=";

const VASTO_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842005583462514/Your_paragraph_text_16.gif?ex=6989208a&is=6987cf0a&hm=f9a4c88976d44e3581b82d55c01fdefb03f1c7401697c8a663cf6aeeff68e8c3&=";

const VASTO_R2 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842043227341068/Your_paragraph_text_14.gif?ex=69892093&is=6987cf13&hm=117ea0c95417384a7b790f746a774d0778b9348257fd8ee7422ed8c4e908dd9a&=";

const VASTO_R3 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842024172884138/Your_paragraph_text_15.gif?ex=6989208e&is=6987cf0e&hm=ba70c2e8435df2b8aefb26205c5c0fc23386895da4837e5fcae10eb8fdd03d19&=";

const VASTO_R4 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842068024066068/Your_paragraph_text_12.gif?ex=69892099&is=6987cf19&hm=e1080c7bddf29f2e6edc23f9a083189bde2d417ea9ffb9d81e4b5dcd218227cc&=";

const VASTO_R5 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469841986705166347/Your_paragraph_text_18.gif?ex=69892085&is=6987cf05&hm=3b1a1520ace36d0ab11d4a443bed1f1321488192657b464da15ffb11d4f72700&=";

const VASTO_VICTORY_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469841996616040511/Your_paragraph_text_17.gif?ex=69892088&is=6987cf08&hm=c5adfce5d6fff70c659a87a43d9b1be1b56fdbd52031de45f6c15962306cf37f&=";

const VASTO_DEFEAT_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842262208020632/Your_paragraph_text_19.gif?ex=698920c7&is=6987cf47&hm=243b0dea5d8bec6a78a4efc223fa07e8e3656c4c301ca7521395bc935ef73b7b&=";

// Ulquiorra gifs
const ULQ_SPAWN_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843198812618782/Your_paragraph_text_25.gif?ex=698921a6&is=6987d026&hm=8ab0b38b1fafd210a7cbf589f54b37ce4c4e7117e5141a63d6d150e32f71096c&=";

const ULQ_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843217058103556/Your_paragraph_text_26.gif?ex=698921ab&is=6987d02b&hm=4499f79869465416007ef21580b08fdd8c6a8f597521ec484e22c023d3867586&=";

const ULQ_R2 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843235986866196/Your_paragraph_text_27.gif?ex=698921af&is=6987d02f&hm=d73e433123104264fb7797e32267d4af89dc7887fb2efdea42a41e578fc85bf4&=";

const ULQ_R3 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843247999353004/Your_paragraph_text_28.gif?ex=698921b2&is=6987d032&hm=03afda58f47e27975d3b6f5ee7a4af654e3bcc9ff89c8fc7488f3e905509dcbf&=";

const ULQ_R4 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843261139980308/Your_paragraph_text_29.gif?ex=698921b5&is=6987d035&hm=63d6429d4d618c3682ef4665c3b494200ccb031d4f450c38539ee8cde319a1ac&=";

const ULQ_R5 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843274737914123/Your_paragraph_text_30.gif?ex=698921b9&is=6987d039&hm=6274a0db6b1866c2d134fd4b9f200b68e968e97fd2ceb9ca7312c7a8cae804af&=";

const ULQ_R6 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843288277127219/Your_paragraph_text_31.gif?ex=698921bc&is=6987d03c&hm=88e3096454d50f1268761b18320c8d12a23d80cc49ff7c93240e3d7f553e4d6e&=";

const ULQ_VICTORY_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843303930527929/Your_paragraph_text_32.gif?ex=698921c0&is=6987d040&hm=2ad405fd31cd5be31faebe491f651ff5a1bb88a9816eebf0b6aa823808592df8&=";

const ULQ_DEFEAT_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843317087797279/Your_paragraph_text_33.gif?ex=698921c3&is=6987d043&hm=a9a78cb6e341b7d27c4d94b4f1c29c248811d77b206ad4ea7b6f7571fceabd2f&=";

// Bleach mob (Hollow)
const HOLLOW_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1467508068303638540/Your_paragraph_text_10.gif?ex=6980a2e4&is=697f5164&hm=451cc0ec6edd18799593cf138549ddb86934217f6bee1e6364814d23153ead78&=";

/* ===================== GRIMMJOW MEDIA (NEW) ===================== */
const GRIM_SPAWN_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843123160088636/Your_paragraph_text_20.gif?ex=69892194&is=6987d014&hm=f4f9a53a32821a59c255ab38ca2785aee18654acfb13fad1220324fc93b31431&=";

const GRIM_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843137181651024/Your_paragraph_text_21.gif?ex=69892198&is=6987d018&hm=4852cd95f921b0d65021bb4569e695eca88078b0b75c31072e307163190e702f&=";

const GRIM_R2 =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843163945504899/Your_paragraph_text_23.gif?ex=6989219e&is=6987d01e&hm=2ac5fdbc70879714bf44c2c107d643cb61b67f79b7e27dbea0fb2a30c7feb861&=";

const GRIM_VICTORY_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843182920532062/Your_paragraph_text_24.gif?ex=698921a3&is=6987d023&hm=7156f4b3cddeb4dc24e79afd243b5967c6ea239b53c1fdb75e6a3ca271546ece&=";

const GRIM_DEFEAT_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843151152746668/Your_paragraph_text_22.gif?ex=6989219b&is=6987d01b&hm=0482ac0a77dc9e0d047b55951c7708d71badbda4d9cc3b6f906d3e445e780dcc&=";

/* ===================== JJK BOSS MEDIA (NEW) ===================== */
const JJK_SG_SPAWN_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019091216597002/Your_paragraph_text_39.gif?ex=6989c576&is=698873f6&hm=202a603d2f90e20a5cc05442be5725288cbee9f3148115b34e1e38a502b92c8b&=";

const JJK_SG_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019102163730637/Your_paragraph_text_38.gif?ex=6989c579&is=698873f9&hm=15c50afadae2c1ae772b207479ee483d014be35850f95ecc41172fb8d70ab9ea&=";

const JJK_SG_R2 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019117309235418/Your_paragraph_text_37.gif?ex=6989c57d&is=698873fd&hm=d844521a54938743ea9dddb3787cc0cc9e13405ee0bd053012a234caaeb25115&=";

const JJK_SG_R3 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019129867239526/Your_paragraph_text_36.gif?ex=6989c580&is=69887400&hm=7793353f116000d95fb393f34a41586e9fe7300005d00cd8862e34226041c766&=";

const JJK_SG_VICTORY_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019159818637446/Your_paragraph_text_34.gif?ex=6989c587&is=69887407&hm=99b7163d50ac6f03bdfb132a1f38716d9f331a4e3fb395a033db8bbaaa4c5bed&=";

const JJK_SG_DEFEAT_MEDIA =
  "https://media.discordapp.net/attachments/1405973335979851877/1470019147839701177/Your_paragraph_text_35.gif?ex=6989c584&is=69887404&hm=366ad3f129479258f8d56f37c4ba5c3a7fd15e9767a79435f78e81e3f5a132d5&=";

/* ===================== MAHORAGA MEDIA (JJK) ===================== */
const MAHO_TEASER =
  "https://media.discordapp.net/attachments/1405973335979851877/1470132582409699542/Your_paragraph_text_41.gif?ex=698a2f29&is=6988dda9&hm=a04f11e8692072613e312cff91164e2119cb6670a691042e17d76f51ec75acb9&=";

const MAHO_SPAWN =
  "https://media.discordapp.net/attachments/1405973335979851877/1470132755672076429/Your_paragraph_text_42.gif?ex=698a2f52&is=6988ddd2&hm=258efd0c211001aa6a12bca7263db7c43912b83823c878e54b67c65e045e9650&=";

const MAHO_R1 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470136958134255718/Your_paragraph_text_43.gif?ex=698a333c&is=6988e1bc&hm=08727465a471249b812c66d9d36d2e137648c91f018e6b7c04505a3eaa0d4fab&=";

const MAHO_R2 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470137844805799948/Your_paragraph_text_44.gif?ex=698a3410&is=6988e290&hm=7e2cf508d71919f5ca4d9558b29c90a66a1fb37a3e53ef04f9d3e45702ec6c94&=";

const MAHO_R3 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470137831811842149/Your_paragraph_text_45.gif?ex=698a340c&is=6988e28c&hm=890d7578e63855e19d6d62e41f9d32d707ec755e643f1c196cc76d613be27c4d&=";

const MAHO_R4_AFTER =
  "https://cdn.discordapp.com/attachments/1405973335979851877/1470139986581000405/Your_paragraph_text_46.gif?ex=698a360e&is=6988e48e&hm=ac9e806f710eb66601322a155f281557bfa2cb70d3d8abc18a272f36c7fb10be&";

const MAHO_R5_WHEEL =
  "https://media.discordapp.net/attachments/1405973335979851877/1470140447304192052/Your_paragraph_text_47.gif?ex=698a367c&is=6988e4fc&hm=e4d25be6fc9839598b687f35c92050a0e2fd7d41e597a635bd6e5fbbe62ad5ab&=";

const MAHO_ADAPTED =
  "https://media.discordapp.net/attachments/1405973335979851877/1470140476375040096/Your_paragraph_text_48.gif?ex=698a3683&is=6988e503&hm=25cb774768cf70a5ebabee6f8647ff2a31a02974d5992a1640dec6bb43640186&=";

const MAHO_R6 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470142114309341358/Your_paragraph_text_49.gif?ex=698a3809&is=6988e689&hm=59f8ddd705480cd7782e0828b829916ffd1b63bc7fbb37c55ec92ae8ee6c1243&=";

const MAHO_R7 =
  "https://media.discordapp.net/attachments/1405973335979851877/1470144007240679677/Your_paragraph_text_51.gif?ex=698a39cd&is=6988e84d&hm=036dd08f07117228e678750fa298c18f8cb4179dbb76e815aae11f7789f75536&=";

const MAHO_VICTORY =
  "https://media.discordapp.net/attachments/1405973335979851877/1470144057098637433/Your_paragraph_text_50.gif?ex=698a39d9&is=6988e859&hm=a309a340f2990f2ced8afe61e9f38ab3ac4933295f79bc684680576108a54713&=";

const MAHO_DEFEAT =
  "https://media.discordapp.net/attachments/1405973335979851877/1470145622098055230/Your_paragraph_text_52.gif?ex=698a3b4e&is=6988e9ce&hm=32fcd3ec16aa05a4c14d6b92f288b61ba9b2bcd0b7c90290a15a1f4ef027790f&=";

/* ===================== JJK MOB MEDIA ===================== */
const CURSED_SPIRIT_MEDIA = JJK_SG_SPAWN_MEDIA; // used by mobs

module.exports = {
  VASTO_SPAWN_MEDIA,
  VASTO_R1,
  VASTO_R2,
  VASTO_R3,
  VASTO_R4,
  VASTO_R5,
  VASTO_VICTORY_MEDIA,
  VASTO_DEFEAT_MEDIA,

  ULQ_SPAWN_MEDIA,
  ULQ_R1,
  ULQ_R2,
  ULQ_R3,
  ULQ_R4,
  ULQ_R5,
  ULQ_R6,
  ULQ_VICTORY_MEDIA,
  ULQ_DEFEAT_MEDIA,

  HOLLOW_MEDIA,

  // Grimmjow
  GRIM_SPAWN_MEDIA,
  GRIM_R1,
  GRIM_R2,
  GRIM_VICTORY_MEDIA,
  GRIM_DEFEAT_MEDIA,

  // JJK Special Grade
  JJK_SG_SPAWN_MEDIA,
  JJK_SG_R1,
  JJK_SG_R2,
  JJK_SG_R3,
  JJK_SG_VICTORY_MEDIA,
  JJK_SG_DEFEAT_MEDIA,
  
// JJK Mahoraga
  MAHO_TEASER,
  MAHO_SPAWN,
  MAHO_R1,
  MAHO_R2,
  MAHO_R3,
  MAHO_R4_AFTER,
  MAHO_R5_WHEEL,
  MAHO_ADAPTED,
  MAHO_R6,
  MAHO_R7,
  MAHO_VICTORY,
  MAHO_DEFEAT,

  CURSED_SPIRIT_MEDIA,
};

