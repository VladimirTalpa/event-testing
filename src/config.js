// src/config.js

/* ===================== CHANNEL LOCKS ===================== */
// ✅ BLEACH spawns only here
const BLEACH_CHANNEL_ID = "1469757595031179314";
// ✅ JJK spawns only here
const JJK_CHANNEL_ID = "1469757629390651686";

/* ===================== ROLES / PERMS ===================== */
const EVENT_ROLE_IDS = ["1259865441405501571", "1287879457025163325"];
const ADMIN_ROLE_ID = "1259865441405501571"; // used by /adminadd

const PING_BOSS_ROLE_ID = "1467575062826586205";
const PING_HOLLOW_ROLE_ID = "1467575020275368131";

const BOOSTER_ROLE_ID = "1267266564961341501";

/* ===================== THEME / EMOJIS ===================== */
const COLOR = 0x7b2cff;

// Event logos
const E_BLEACH = "<:event:1470018874408964119>";
const E_JJK = "<:event:1470018845245968434>";

// Currency emojis
const E_REIATSU = "<:event:1469821285079978045>";
const E_CE = "<:event:1469821211872727040>";
const E_DRAKO = "<:event:1469812070542217389>";

const E_MEMBERS = "👥";

/* ===================== CARD PLACEHOLDER (YOUR GIF) ===================== */
const CARD_PLACEHOLDER_GIF =
  "https://media.discordapp.net/attachments/1468153576353431615/1471828355153268759/Your_paragraph_text.gif?ex=69905a79&is=698f08f9&hm=9d059092959a3446edcf38507f1a71b5577e85a97a8ee08292da323f238d513b&=&width=388&height=582";

/* ===================== RPG ECONOMY ===================== */
// Pack prices
const PACK_PRICE_BASIC = { bleach: 250, jjk: 250 }; // in faction currency
const PACK_PRICE_LEGENDARY = { bleach: 1200, jjk: 1200 };

// Stars
const STAR_EVERY_LEVELS = 10;
const STAR_STAT_BONUS = 0.08; // +8% per star

/* ===================== EXPEDITIONS ===================== */
const EXPEDITION_DAILY_LIMIT = 2;
const EXPEDITION_START_DELAY_MS = 60 * 60 * 1000; // starts in 1 hour
const EXPEDITION_TICK_MS = 10 * 60 * 1000; // update every 10 minutes

/* ===================== LEGACY EVENT CONFIG (kept) ===================== */
const ROUND_COOLDOWN_MS = 10 * 1000;
const MAX_HITS = 2;

module.exports = {
  BLEACH_CHANNEL_ID,
  JJK_CHANNEL_ID,

  EVENT_ROLE_IDS,
  ADMIN_ROLE_ID,
  PING_BOSS_ROLE_ID,
  PING_HOLLOW_ROLE_ID,
  BOOSTER_ROLE_ID,

  COLOR,
  E_MEMBERS,

  E_BLEACH,
  E_JJK,
  E_REIATSU,
  E_CE,
  E_DRAKO,

  CARD_PLACEHOLDER_GIF,

  PACK_PRICE_BASIC,
  PACK_PRICE_LEGENDARY,

  STAR_EVERY_LEVELS,
  STAR_STAT_BONUS,

  EXPEDITION_DAILY_LIMIT,
  EXPEDITION_START_DELAY_MS,
  EXPEDITION_TICK_MS,

  ROUND_COOLDOWN_MS,
  MAX_HITS,
};
