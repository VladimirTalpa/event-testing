// src/config.js

/* ===================== CHANNELS ===================== */

const BLEACH_CHANNEL_ID = "1469757595031179314";
const JJK_CHANNEL_ID = "1469757629390651686";

/* ===================== ROLES ===================== */

const EVENT_ROLE_IDS = [
  "1259865441405501571",
  "1287879457025163325",
];

const PING_BOSS_ROLE_ID = "1467575062826586205";
const PING_HOLLOW_ROLE_ID = "1467575020275368131";
const BOOSTER_ROLE_ID = "1267266564961341501";


/* ===================== EVENT LOGOS ===================== */

// 🔵 BLEACH LOGO
const E_BLEACH = "<:bleach:1470018874408964119>";

// 🟣 JJK LOGO
const E_JJK = "<:jjk:1470018845245968434>";


/* ===================== COMMON EMOJIS ===================== */

const E_REIATSU = "🔷";
const E_CE = "🟣";
const E_DRAKO = "🪙";
const E_MEMBERS = "👥";


/* ===================== THEME ===================== */

const COLOR = 0x7b2cff;


/* ===================== ECONOMY ===================== */

const DRAKO_RATE_BLEACH = 47;
const DRAKO_RATE_JJK = 19;


/* ===================== BOSS ===================== */

const ROUND_COOLDOWN_MS = 10 * 1000;
const MAX_HITS = 2;


/* ===================== DAILY ===================== */

const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_NORMAL = 100;
const DAILY_BOOSTER = 200;


/* ===================== DROPS ===================== */

const VASTO_DROP_ROLE_ID = "1467426528584405103";
const ULQ_DROP_ROLE_ID = "1469573731301986367";


const DROP_ROBUX_CHANCE_REAL_BASE = 0.005;
const DROP_ROBUX_CHANCE_DISPLAY = 0.025;
const DROP_ROBUX_CHANCE_CAP = 0.01;

const ROBUX_CLAIM_TEXT =
  "To claim: contact **daez063**.";


/* ===================== SHOP ===================== */

const SHOP_COSMETIC_ROLE_ID = "1467438527200497768";


/* ===================== MOB ===================== */

const BLEACH_MOB_MS = 2 * 60 * 1000;
const BLEACH_MOB_HIT = 25;
const BLEACH_MOB_MISS = 10;
const BLEACH_BONUS_PER_KILL = 1;
const BLEACH_BONUS_MAX = 30;


const JJK_MOB_MS = 2 * 60 * 1000;
const JJK_MOB_HIT = 22;
const JJK_MOB_MISS = 9;
const JJK_BONUS_PER_KILL = 1;
const JJK_BONUS_MAX = 30;


/* ===================== EXPORT ===================== */

module.exports = {
  // Channels
  BLEACH_CHANNEL_ID,
  JJK_CHANNEL_ID,

  // Roles
  EVENT_ROLE_IDS,
  PING_BOSS_ROLE_ID,
  PING_HOLLOW_ROLE_ID,
  BOOSTER_ROLE_ID,

  // Logos
  E_BLEACH,
  E_JJK,

  // Emojis
  E_REIATSU,
  E_CE,
  E_DRAKO,
  E_MEMBERS,

  // Theme
  COLOR,

  // Economy
  DRAKO_RATE_BLEACH,
  DRAKO_RATE_JJK,

  // Boss
  ROUND_COOLDOWN_MS,
  MAX_HITS,

  // Daily
  DAILY_COOLDOWN_MS,
  DAILY_NORMAL,
  DAILY_BOOSTER,

  // Drops
  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,

  DROP_ROBUX_CHANCE_REAL_BASE,
  DROP_ROBUX_CHANCE_DISPLAY,
  DROP_ROBUX_CHANCE_CAP,
  ROBUX_CLAIM_TEXT,

  // Shop
  SHOP_COSMETIC_ROLE_ID,

  // Mob
  BLEACH_MOB_MS,
  BLEACH_MOB_HIT,
  BLEACH_MOB_MISS,
  BLEACH_BONUS_PER_KILL,
  BLEACH_BONUS_MAX,

  JJK_MOB_MS,
  JJK_MOB_HIT,
  JJK_MOB_MISS,
  JJK_BONUS_PER_KILL,
  JJK_BONUS_MAX,
};
