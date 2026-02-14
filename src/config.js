// src/config.js

/* ===================== CHANNEL LOCKS ===================== */
// ✅ Spawns restricted to these channels
const BLEACH_CHANNEL_ID = process.env.BLEACH_CHANNEL_ID || '1469757595031179314';
const JJK_CHANNEL_ID = process.env.JJK_CHANNEL_ID || '1469757629390651686';

/* ===================== ROLES / PERMS ===================== */
// Roles allowed to use /spawnboss and /spawnmob
const EVENT_ROLE_IDS = (process.env.EVENT_ROLE_IDS || '1259865441405501571,1287879457025163325')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Role allowed to use /adminadd (optional)
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID || '1259865441405501571';

const PING_BOSS_ROLE_ID = process.env.PING_BOSS_ROLE_ID || '1467575062826586205';
const PING_HOLLOW_ROLE_ID = process.env.PING_HOLLOW_ROLE_ID || '1467575020275368131';
const BOOSTER_ROLE_ID = process.env.BOOSTER_ROLE_ID || '1267266564961341501';

/* ===================== THEME / EMOJIS ===================== */
const COLOR = 0x7b2cff;

// Your custom emojis (keep yours)
const E_BLEACH = process.env.E_BLEACH || '<:event:1470018874408964119>';
const E_JJK = process.env.E_JJK || '<:event:1470018845245968434>';

const E_REIATSU = process.env.E_REIATSU || '<:event:1469821285079978045>';
const E_CE = process.env.E_CE || '<:event:1469821211872727040>';
const E_DRAKO = process.env.E_DRAKO || '<:event:1469812070542217389>';

const E_MEMBERS = '👥';

/* ===================== CARD GIF (TEMP DESIGN) ===================== */
const CARD_GIF_URL =
  process.env.CARD_GIF_URL ||
  'https://media.discordapp.net/attachments/1468153576353431615/1471828355153268759/Your_paragraph_text.gif?ex=69905a79&is=698f08f9&hm=9d059092959a3446edcf38507f1a71b5577e85a97a8ee08292da323f238d513b&=&width=388&height=582';

/* ===================== ECONOMY RATES ===================== */
const DRAKO_RATE_BLEACH = Number(process.env.DRAKO_RATE_BLEACH || 47);
const DRAKO_RATE_JJK = Number(process.env.DRAKO_RATE_JJK || 19);

/* ===================== BOSS / MOB GLOBALS ===================== */
const ROUND_COOLDOWN_MS = 10 * 1000;
const MAX_HITS = 2;

/* ===================== DAILY ===================== */
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_NORMAL = 100;
const DAILY_BOOSTER = 200;

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

/* ===================== DROPS / ROLES ===================== */
const VASTO_DROP_ROLE_ID = process.env.VASTO_DROP_ROLE_ID || '1467426528584405103';
const ULQ_DROP_ROLE_ID = process.env.ULQ_DROP_ROLE_ID || '1469573731301986367';
const GRIMMJOW_DROP_ROLE_ID = process.env.GRIMMJOW_DROP_ROLE_ID || '1469831066628919439';
const MAHORAGA_DROP_ROLE_ID = process.env.MAHORAGA_DROP_ROLE_ID || '1470124664931094590';

// Example shop cosmetic role
const SHOP_COSMETIC_ROLE_ID = process.env.SHOP_COSMETIC_ROLE_ID || '1467438527200497768';

/* ===================== BOSSES LIST FOR DEPLOY CHOICES ===================== */
const BOSS_IDS = {
  vasto: { id: 'vasto', label: 'Vasto Lorde (Bleach)' },
  ulquiorra: { id: 'ulquiorra', label: 'Ulquiorra (Bleach)' },
  grimmjow: { id: 'grimmjow', label: 'Grimmjow (Bleach)' },
  mahoraga: { id: 'mahoraga', label: 'Mahoraga (JJK)' },
  specialgrade: { id: 'specialgrade', label: 'Special Grade Curse (JJK)' },
};

module.exports = {
  BLEACH_CHANNEL_ID,
  JJK_CHANNEL_ID,

  EVENT_ROLE_IDS,
  ADMIN_ROLE_ID,
  PING_BOSS_ROLE_ID,
  PING_HOLLOW_ROLE_ID,
  BOOSTER_ROLE_ID,

  COLOR,
  E_BLEACH,
  E_JJK,
  E_REIATSU,
  E_CE,
  E_DRAKO,
  E_MEMBERS,

  CARD_GIF_URL,

  DRAKO_RATE_BLEACH,
  DRAKO_RATE_JJK,

  ROUND_COOLDOWN_MS,
  MAX_HITS,

  DAILY_COOLDOWN_MS,
  DAILY_NORMAL,
  DAILY_BOOSTER,

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

  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
  GRIMMJOW_DROP_ROLE_ID,
  MAHORAGA_DROP_ROLE_ID,
  SHOP_COSMETIC_ROLE_ID,

  BOSS_IDS,
};
