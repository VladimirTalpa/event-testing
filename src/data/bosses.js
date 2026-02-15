// Boss definitions used by the /spawnboss command + boss engine.
// NOTE: These are the 5 bosses you originally asked for (no Mahito / Sukuna finger etc.).

const CARD_GIF = "https://media.discordapp.net/attachments/1468153576353431615/1471828355153268759/Your_paragraph_text.gif?ex=69905a79&is=698f08f9&hm=9d059092959a3446edcf38507f1a71b5577e85a97a8ee08292da323f238d513b&=&width=388&height=582";

/**
 * Mechanics:
 * - Each boss has 4 rounds.
 * - Every round has a prompt + 3 options.
 * - Picking the correct option increases your survival chance and contributes more progress.
 */

module.exports = [
  {
    id: "vasto_lorde",
    name: "Vasto Lorde",
    faction: "Bleach",
    rounds: 4,
    hpMax: 100,
    image: CARD_GIF,
    mechanics: [
      {
        prompt: "Vasto Lorde charges a **devouring lunge**…",
        options: [
          { key: "dodge", label: "Sidestep", emoji: "🌀" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
          { key: "strike", label: "Strike", emoji: "⚔️" },
        ],
        correct: "dodge",
      },
      {
        prompt: "A **shockwave** rips the ground!",
        options: [
          { key: "jump", label: "Jump", emoji: "🦘" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
          { key: "rush", label: "Rush", emoji: "🏃" },
        ],
        correct: "jump",
      },
      {
        prompt: "It releases **dark reiatsu pressure**…",
        options: [
          { key: "focus", label: "Focus", emoji: "🧠" },
          { key: "retreat", label: "Retreat", emoji: "⬅️" },
          { key: "strike", label: "Strike", emoji: "⚔️" },
        ],
        correct: "focus",
      },
      {
        prompt: "Final round — **finish window**!",
        options: [
          { key: "allin", label: "All-in", emoji: "🔥" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
          { key: "retreat", label: "Retreat", emoji: "⬅️" },
        ],
        correct: "allin",
      },
    ],
    rewards: {
      currencyMin: 120,
      currencyMax: 220,
      shardMin: 8,
      shardMax: 16,
      titleChance: 0.12,
      titleId: "TITLE_VASTO_SLAYER",
    },
  },
  {
    id: "ulquiorra",
    name: "Ulquiorra",
    faction: "Bleach",
    rounds: 4,
    hpMax: 100,
    image: CARD_GIF,
    mechanics: [
      {
        prompt: "Ulquiorra fires a **Cero**…",
        options: [
          { key: "dodge", label: "Dodge", emoji: "🌀" },
          { key: "guard", label: "Block", emoji: "🛡️" },
          { key: "counter", label: "Counter", emoji: "🎯" },
        ],
        correct: "dodge",
      },
      {
        prompt: "He appears behind you — **Sonído**!",
        options: [
          { key: "turn", label: "Turn", emoji: "🔁" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
          { key: "run", label: "Run", emoji: "🏃" },
        ],
        correct: "turn",
      },
      {
        prompt: "A **spear throw** is incoming!",
        options: [
          { key: "deflect", label: "Deflect", emoji: "🗡️" },
          { key: "dodge", label: "Dodge", emoji: "🌀" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
        ],
        correct: "deflect",
      },
      {
        prompt: "Final — **Lanza del Relámpago**!",
        options: [
          { key: "dodge", label: "Dodge", emoji: "🌀" },
          { key: "allin", label: "All-in", emoji: "🔥" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
        ],
        correct: "dodge",
      },
    ],
    rewards: {
      currencyMin: 150,
      currencyMax: 260,
      shardMin: 10,
      shardMax: 20,
      titleChance: 0.14,
      titleId: "TITLE_MURCIELAGO",
    },
  },
  {
    id: "grimmjow",
    name: "Grimmjow",
    faction: "Bleach",
    rounds: 4,
    hpMax: 100,
    image: CARD_GIF,
    mechanics: [
      {
        prompt: "Grimmjow rushes in with a **claw combo**…",
        options: [
          { key: "parry", label: "Parry", emoji: "🗡️" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
          { key: "dodge", label: "Dodge", emoji: "🌀" },
        ],
        correct: "parry",
      },
      {
        prompt: "He charges a **point-blank blast**!",
        options: [
          { key: "dodge", label: "Dodge", emoji: "🌀" },
          { key: "guard", label: "Block", emoji: "🛡️" },
          { key: "strike", label: "Strike", emoji: "⚔️" },
        ],
        correct: "guard",
      },
      {
        prompt: "A **fake-out** feint…",
        options: [
          { key: "wait", label: "Wait", emoji: "⏳" },
          { key: "dodge", label: "Dodge", emoji: "🌀" },
          { key: "rush", label: "Rush", emoji: "🏃" },
        ],
        correct: "wait",
      },
      {
        prompt: "Final — **kill window**!",
        options: [
          { key: "allin", label: "All-in", emoji: "🔥" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
          { key: "retreat", label: "Retreat", emoji: "⬅️" },
        ],
        correct: "allin",
      },
    ],
    rewards: {
      currencyMin: 140,
      currencyMax: 250,
      shardMin: 10,
      shardMax: 18,
      titleChance: 0.13,
      titleId: "TITLE_PANTHERA",
    },
  },
  {
    id: "mahoraga",
    name: "Mahoraga",
    faction: "JJK",
    rounds: 4,
    hpMax: 100,
    image: CARD_GIF,
    mechanics: [
      {
        prompt: "Mahoraga begins **adapting**…",
        options: [
          { key: "burst", label: "Burst", emoji: "💥" },
          { key: "stall", label: "Stall", emoji: "⏳" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
        ],
        correct: "burst",
      },
      {
        prompt: "A **wheel spin** signals a counter!",
        options: [
          { key: "dodge", label: "Dodge", emoji: "🌀" },
          { key: "parry", label: "Parry", emoji: "🗡️" },
          { key: "rush", label: "Rush", emoji: "🏃" },
        ],
        correct: "parry",
      },
      {
        prompt: "It swings a **cleave**…",
        options: [
          { key: "guard", label: "Guard", emoji: "🛡️" },
          { key: "dodge", label: "Dodge", emoji: "🌀" },
          { key: "counter", label: "Counter", emoji: "🎯" },
        ],
        correct: "guard",
      },
      {
        prompt: "Final — end it before it adapts fully!",
        options: [
          { key: "allin", label: "All-in", emoji: "🔥" },
          { key: "burst", label: "Burst", emoji: "💥" },
          { key: "stall", label: "Stall", emoji: "⏳" },
        ],
        correct: "allin",
      },
    ],
    rewards: {
      currencyMin: 160,
      currencyMax: 280,
      shardMin: 10,
      shardMax: 22,
      titleChance: 0.15,
      titleId: "TITLE_ADAPTATION",
    },
  },
  {
    id: "special_grade",
    name: "Special Grade Curse",
    faction: "JJK",
    rounds: 4,
    hpMax: 100,
    image: CARD_GIF,
    mechanics: [
      {
        prompt: "The curse starts forming a **Domain**…",
        options: [
          { key: "interrupt", label: "Interrupt", emoji: "⛔" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
          { key: "dodge", label: "Dodge", emoji: "🌀" },
        ],
        correct: "interrupt",
      },
      {
        prompt: "Cursed hands reach out — **grab**!",
        options: [
          { key: "dodge", label: "Dodge", emoji: "🌀" },
          { key: "counter", label: "Counter", emoji: "🎯" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
        ],
        correct: "counter",
      },
      {
        prompt: "A **wide-area** curse wave…",
        options: [
          { key: "guard", label: "Guard", emoji: "🛡️" },
          { key: "run", label: "Run", emoji: "🏃" },
          { key: "jump", label: "Jump", emoji: "🦘" },
        ],
        correct: "guard",
      },
      {
        prompt: "Final — the curse is unstable. Finish!",
        options: [
          { key: "allin", label: "All-in", emoji: "🔥" },
          { key: "interrupt", label: "Interrupt", emoji: "⛔" },
          { key: "guard", label: "Guard", emoji: "🛡️" },
        ],
        correct: "allin",
      },
    ],
    rewards: {
      currencyMin: 150,
      currencyMax: 270,
      shardMin: 10,
      shardMax: 20,
      titleChance: 0.14,
      titleId: "TITLE_SPECIAL_GRADE",
    },
  },
];
