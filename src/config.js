// src/config.js
require("dotenv").config();

/* ===================== CHANNEL LOCKS ===================== */
const BLEACH_CHANNEL_ID = process.env.BLEACH_CHANNEL_ID || "1469757595031179314";
const JJK_CHANNEL_ID = process.env.JJK_CHANNEL_ID || "1469757629390651686";

/* ===================== ROLES / PERMS ===================== */
const parseCsvIds = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// ✅ роли евент-стаффа (как у тебя было)
const EVENT_ROLE_IDS =
  process.env.EVENT_ROLE_IDS
    ? parseCsvIds(process.env.EVENT_ROLE_IDS)
    : ["1259865441405501571", "1287879457025163325"];

// ✅ роль которая может /spawnboss и /spawnmob
const BOSS_SPAWNER_ROLE_ID =
  process.env.BOSS_SPAWNER_ROLE_ID || "1259865441405501571";

const PING_BOSS_ROLE_ID = "1467575062826586205";
const PING_HOLLOW_ROLE_ID = "1467575020275368131";
const BOOSTER_ROLE_ID = process.env.BOOSTER_ROLE_ID || "1267266564961341501";

/* ===================== THEME / EMOJIS ===================== */
const COLOR = 0x7b2cff;

const E_BLEACH = "<:event:1470018874408964119>";
const E_JJK = "<:event:1470018845245968434>";

const E_VASTO = "<:event:1469832084418727979>";
const E_ULQ = "<:event:1469831975446511648>";
const E_GRIMJOW = "<:event:1469831949857325097>";
const E_REIATSU = "<:event:1469821285079978045>";
const E_CE = "<:event:1469821211872727040>";
const E_DRAKO = "<:event:1469812070542217389>";

const E_MEMBERS = "👥";

/* ===================== ECONOMY RATES ===================== */
const DRAKO_RATE_BLEACH = 47;
const DRAKO_RATE_JJK = 19;

/* ===================== COMMON GAME CONFIG ===================== */
const ROUND_COOLDOWN_MS = 10 * 1000;
const MAX_HITS = 2;

/* ===================== DAILY (BLEACH ONLY) ===================== */
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_NORMAL = 100;
const DAILY_BOOSTER = 200;

/* ===================== DROPS / ROLES ===================== */
const VASTO_DROP_ROLE_ID = "1467426528584405103";
const ULQ_DROP_ROLE_ID = "1469573731301986367";

/* ===================== SHOP ROLE ===================== */
const SHOP_COSMETIC_ROLE_ID = "1467438527200497768";

/* ===================== MOB CONFIG ===================== */
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

module.exports = {
  BLEACH_CHANNEL_ID,
  JJK_CHANNEL_ID,

  EVENT_ROLE_IDS,
  BOSS_SPAWNER_ROLE_ID,

  PING_BOSS_ROLE_ID,
  PING_HOLLOW_ROLE_ID,
  BOOSTER_ROLE_ID,

  COLOR,

  E_VASTO,
  E_ULQ,
  E_GRIMJOW,

  E_REIATSU,
  E_CE,
  E_DRAKO,

  E_MEMBERS,
  E_BLEACH,
  E_JJK,

  DRAKO_RATE_BLEACH,
  DRAKO_RATE_JJK,

  ROUND_COOLDOWN_MS,
  MAX_HITS,

  DAILY_COOLDOWN_MS,
  DAILY_NORMAL,
  DAILY_BOOSTER,

  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,

  SHOP_COSMETIC_ROLE_ID,

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
