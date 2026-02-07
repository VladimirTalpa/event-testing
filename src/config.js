/* ===================== CONFIG ===================== */

// Roles that can manually spawn events
const EVENT_ROLE_IDS = ["1259865441405501571", "1287879457025163325"];

// Ping roles on spawn
const PING_BOSS_ROLE_ID = "1467575062826586205";
const PING_HOLLOW_ROLE_ID = "1467575020275368131";

// Booster role for daily
const BOOSTER_ROLE_ID = "1267266564961341501";

// Emojis
const E_VASTO = "<:event:1467502793869885563>";
const E_MEMBERS = "<:event:1467501718630568118>";
const E_REIATSU = "<:event:1467497975101128724>";

// Auto spawn channel + timers
const AUTO_EVENT_CHANNEL_ID = "1358096447467294790";
const AUTO_HOLLOW_EVERY_MS = 20 * 60 * 1000; // 20 min
const AUTO_BOSS_EVERY_MS = 2 * 60 * 60 * 1000; // 2 hours

// Visual / theme
const COLOR = 0x7b2cff;

// Boss mechanics (shared)
const BOSS_JOIN_MS = 2 * 60 * 1000;
const BOSS_ROUNDS = 4;
const ROUND_COOLDOWN_MS = 10 * 1000;
const BASE_SURVIVE_CHANCE = 0.30;
const BOSS_REIATSU_REWARD = 200;
const BOSS_SURVIVE_HIT_REIATSU = 10;

// Hollow mini-event
const HOLLOW_EVENT_MS = 2 * 60 * 1000;
const HOLLOW_HIT_REIATSU = 25;
const HOLLOW_MISS_REIATSU = 10;
const BONUS_PER_HOLLOW_KILL = 1; // +1% for hitters
const BONUS_MAX = 30;

// Drops (shared)
const DROP_ROLE_CHANCE_BASE = 0.05;
const DROP_ROLE_CHANCE_CAP = 0.12;

const DROP_ROBUX_CHANCE_REAL_BASE = 0.005;
const DROP_ROBUX_CHANCE_DISPLAY = 0.025;
const DROP_ROBUX_CHANCE_CAP = 0.01;
const ROBUX_CLAIM_TEXT = "To claim: contact **daez063**.";

// Shop cosmetic role
const SHOP_COSMETIC_ROLE_ID = "1467438527200497768";

// PvP
const CLASH_RESPONSE_MS = 20 * 1000;
const CLASH_COOLDOWN_MS = 5 * 60 * 1000;

// Daily claim
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_NORMAL = 100;
const DAILY_BOOSTER = 200;

/* ===================== MEDIA ===================== */

// ✅ Vasto original gifs (restored)
const MEDIA = {
  VASTO_SPAWN:
    "https://media.discordapp.net/attachments/1405973335979851877/1467277181955604572/Your_paragraph_text_4.gif?ex=6980749c&is=697f231c&hm=d06365f2194faceee52207192f81db418aa5a485aaa498f154553dc5e62f6d79&=",

  VASTO_R1:
    "https://media.discordapp.net/attachments/1405973335979851877/1467276870784520326/Your_paragraph_text_3.gif?ex=69807452&is=697f22d2&hm=893ba1888e2ea579e71f442f158cfc25e06ed5371b59c978dd1afae3f61d480f&=",
  VASTO_R2:
    "https://media.discordapp.net/attachments/1405973335979851877/1467276870784520326/Your_paragraph_text_3.gif?ex=69807452&is=697f22d2&hm=893ba1888e2ea579e71f442f158cfc25e06ed5371b59c978dd1afae3f61d480f&=",
  VASTO_R3:
    "https://media.discordapp.net/attachments/1405973335979851877/1467276903160483995/Your_paragraph_text_1.gif?ex=6980745a&is=697f22da&hm=52decaeaf342973a4930a1d7a0f09ac5fb38358650e5607c40e9c821d7596a88&=",
  VASTO_R4:
    "https://media.discordapp.net/attachments/1405973335979851877/1467276984257220795/Your_paragraph_text_6.gif?ex=6980746d&is=697f22ed&hm=2a22d2df088318c7bfb1ddcb1601caea0ea248a19e6db909f741895b769ce7bb&=",

  VASTO_VICTORY:
    "https://media.discordapp.net/attachments/1405973335979851877/1467278760901345313/Your_paragraph_text_7.gif?ex=69807615&is=697f2495&hm=b6f4546141fb8a52e480992b5c029cd1c675072df0e71b1f3ed50ebee65b01eb&=",

  VASTO_DEFEAT:
    "https://media.discordapp.net/attachments/1405973335979851877/1467276974589218941/Your_paragraph_text_5.gif?ex=6980746b&is=697f22eb&hm=4f8a5f7867d5366e2a473a6d84a13e051544ebc5c56bee5dc34a4ae727c00f20&=",

  // ✅ Ulquiorra single gif (for spawn + all rounds for now)
  ULQ_GIF:
    "https://media.discordapp.net/attachments/1467989298467967127/1469574037377257563/Your_paragraph_text_11.gif?ex=698826f9&is=6986d579&hm=86478a9815f72c2bebb721ce7a0f2fb7fe3f19fd8d667f1f84a51ea7622e988d&=",

  HOLLOW:
    "https://media.discordapp.net/attachments/1405973335979851877/1467508068303638540/Your_paragraph_text_10.gif?ex=6980a2e4&is=697f5164&hm=451cc0ec6edd18799593cf138549ddb86934217f6bee1e6364814d23153ead78&=",

  CLASH_START:
    "https://media.discordapp.net/attachments/1405973335979851877/1467446034660720742/Your_paragraph_text_8.gif?ex=6980691e&is=697f179e&hm=5e217368be1ac6a1da725734faceaf93b98b781a69010e7802e7e41346e321b8&=",

  CLASH_VICTORY:
    "https://media.discordapp.net/attachments/1405973335979851877/1467446050116862113/Your_paragraph_text_9.gif?ex=69806922&is=697f17a2&hm=568709eed12dec446ea88e589be0d97e4db67cac24e1a51b1b7ff91e92882e2e&=",
};

const BOSSES = {
  vasto: {
    key: "vasto",
    name: "Vasto Lorde",
    spawn: MEDIA.VASTO_SPAWN,
    rounds: [MEDIA.VASTO_R1, MEDIA.VASTO_R2, MEDIA.VASTO_R3, MEDIA.VASTO_R4],
    victory: MEDIA.VASTO_VICTORY,
    defeat: MEDIA.VASTO_DEFEAT,
    // ⚠️ если хочешь другой дроп за Vasto — поменяешь тут
    dropRoleId: "1467426528584405103",
  },
  ulquiorra: {
    key: "ulquiorra",
    name: "Ulquiorra",
    spawn: MEDIA.ULQ_GIF,
    rounds: [MEDIA.ULQ_GIF, MEDIA.ULQ_GIF, MEDIA.ULQ_GIF, MEDIA.ULQ_GIF],
    victory: MEDIA.ULQ_GIF,
    defeat: MEDIA.ULQ_GIF,
    dropRoleId: "1469573731301986367",
  },
};

module.exports = {
  EVENT_ROLE_IDS,
  PING_BOSS_ROLE_ID,
  PING_HOLLOW_ROLE_ID,
  BOOSTER_ROLE_ID,
  E_VASTO,
  E_MEMBERS,
  E_REIATSU,
  AUTO_EVENT_CHANNEL_ID,
  AUTO_HOLLOW_EVERY_MS,
  AUTO_BOSS_EVERY_MS,
  COLOR,

  BOSS_JOIN_MS,
  BOSS_ROUNDS,
  ROUND_COOLDOWN_MS,
  BASE_SURVIVE_CHANCE,
  BOSS_REIATSU_REWARD,
  BOSS_SURVIVE_HIT_REIATSU,

  HOLLOW_EVENT_MS,
  HOLLOW_HIT_REIATSU,
  HOLLOW_MISS_REIATSU,
  BONUS_PER_HOLLOW_KILL,
  BONUS_MAX,

  DROP_ROLE_CHANCE_BASE,
  DROP_ROLE_CHANCE_CAP,
  DROP_ROBUX_CHANCE_REAL_BASE,
  DROP_ROBUX_CHANCE_DISPLAY,
  DROP_ROBUX_CHANCE_CAP,
  ROBUX_CLAIM_TEXT,

  SHOP_COSMETIC_ROLE_ID,

  CLASH_RESPONSE_MS,
  CLASH_COOLDOWN_MS,

  DAILY_COOLDOWN_MS,
  DAILY_NORMAL,
  DAILY_BOOSTER,

  MEDIA,
  BOSSES,
};
