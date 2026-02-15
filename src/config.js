require("dotenv").config();

/**
 * ✅ Главная цель этого config:
 * - ВСЕ значения существуют (чтобы код не крашился)
 * - Медиа для боссов настраивается только тут
 * - Можно оставить часть полей пустыми ("") — всё равно будет работать
 */

// ====== Basics ======
const COLOR = 0x8b5cf6;

// ====== Emojis (если нет — ставь свои, или оставь как есть) ======
const E_MEMBERS = "👥";
const E_BLEACH = "🩸";
const E_JJK = "🟣";
const E_REIATSU = "💠";
const E_CE = "🕳️";
const E_DRAKO = "🪙";

const E_VASTO = "👹";
const E_ULQ = "🦇";
const E_GRIMJOW = "🦁"; // ✅ фикс: чтобы Grimmjow не крашил импорт

// ====== Rates ======
const DRAKO_RATE_BLEACH = 250; // Reiatsu → 1 Drako
const DRAKO_RATE_JJK = 250;    // CE → 1 Drako

// ====== Boss system ======
const MAX_HITS = 2; // если у тебя в системе у игроков 2 хита до смерти

// ====== Role drops (оставь свои реальные ID) ======
const VASTO_DROP_ROLE_ID = process.env.VASTO_DROP_ROLE_ID || "0";
const ULQ_DROP_ROLE_ID = process.env.ULQ_DROP_ROLE_ID || "0";

// ====== Permissions (role that can spawn bosses/mobs/adminadd) ======
const EVENT_STAFF_ROLE_ID = process.env.EVENT_STAFF_ROLE_ID || "0";

// ====== Media links for BOSSES ======
// Можно оставить пустыми "" — тогда media.js вернёт null и код НЕ упадёт.
const MEDIA_VASTO_SPAWN = process.env.MEDIA_VASTO_SPAWN || "";
const MEDIA_VASTO_VICTORY = process.env.MEDIA_VASTO_VICTORY || "";
const MEDIA_VASTO_DEFEAT = process.env.MEDIA_VASTO_DEFEAT || "";
const MEDIA_VASTO_R1 = process.env.MEDIA_VASTO_R1 || "";
const MEDIA_VASTO_R2 = process.env.MEDIA_VASTO_R2 || "";
const MEDIA_VASTO_R3 = process.env.MEDIA_VASTO_R3 || "";
const MEDIA_VASTO_R4 = process.env.MEDIA_VASTO_R4 || "";
const MEDIA_VASTO_R5 = process.env.MEDIA_VASTO_R5 || "";

const MEDIA_ULQ_SPAWN = process.env.MEDIA_ULQ_SPAWN || "";
const MEDIA_ULQ_VICTORY = process.env.MEDIA_ULQ_VICTORY || "";
const MEDIA_ULQ_DEFEAT = process.env.MEDIA_ULQ_DEFEAT || "";
const MEDIA_ULQ_R1 = process.env.MEDIA_ULQ_R1 || "";
const MEDIA_ULQ_R2 = process.env.MEDIA_ULQ_R2 || "";
const MEDIA_ULQ_R3 = process.env.MEDIA_ULQ_R3 || "";
const MEDIA_ULQ_R4 = process.env.MEDIA_ULQ_R4 || "";
const MEDIA_ULQ_R5 = process.env.MEDIA_ULQ_R5 || "";
const MEDIA_ULQ_R6 = process.env.MEDIA_ULQ_R6 || "";

const MEDIA_GRIM_SPAWN = process.env.MEDIA_GRIM_SPAWN || "";
const MEDIA_GRIM_VICTORY = process.env.MEDIA_GRIM_VICTORY || "";
const MEDIA_GRIM_DEFEAT = process.env.MEDIA_GRIM_DEFEAT || "";
const MEDIA_GRIM_R1 = process.env.MEDIA_GRIM_R1 || "";
const MEDIA_GRIM_R2 = process.env.MEDIA_GRIM_R2 || "";

const MEDIA_MAHO_TEASER = process.env.MEDIA_MAHO_TEASER || "";
const MEDIA_MAHO_SPAWN = process.env.MEDIA_MAHO_SPAWN || "";
const MEDIA_MAHO_VICTORY = process.env.MEDIA_MAHO_VICTORY || "";
const MEDIA_MAHO_DEFEAT = process.env.MEDIA_MAHO_DEFEAT || "";
const MEDIA_MAHO_R1 = process.env.MEDIA_MAHO_R1 || "";
const MEDIA_MAHO_R2 = process.env.MEDIA_MAHO_R2 || "";
const MEDIA_MAHO_R3 = process.env.MEDIA_MAHO_R3 || "";
const MEDIA_MAHO_R4_AFTER = process.env.MEDIA_MAHO_R4_AFTER || "";
const MEDIA_MAHO_ADAPTED = process.env.MEDIA_MAHO_ADAPTED || "";
const MEDIA_MAHO_R6 = process.env.MEDIA_MAHO_R6 || "";
const MEDIA_MAHO_R7 = process.env.MEDIA_MAHO_R7 || "";

const MEDIA_JJK_SG_SPAWN = process.env.MEDIA_JJK_SG_SPAWN || "";
const MEDIA_JJK_SG_VICTORY = process.env.MEDIA_JJK_SG_VICTORY || "";
const MEDIA_JJK_SG_DEFEAT = process.env.MEDIA_JJK_SG_DEFEAT || "";
const MEDIA_JJK_SG_R1 = process.env.MEDIA_JJK_SG_R1 || "";
const MEDIA_JJK_SG_R2 = process.env.MEDIA_JJK_SG_R2 || "";
const MEDIA_JJK_SG_R3 = process.env.MEDIA_JJK_SG_R3 || "";

module.exports = {
  // base
  COLOR,
  MAX_HITS,

  // emojis
  E_MEMBERS,
  E_BLEACH,
  E_JJK,
  E_REIATSU,
  E_CE,
  E_DRAKO,

  E_VASTO,
  E_ULQ,
  E_GRIMJOW,

  // rates
  DRAKO_RATE_BLEACH,
  DRAKO_RATE_JJK,

  // ids/roles
  EVENT_STAFF_ROLE_ID,
  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,

  // media
  MEDIA_VASTO_SPAWN,
  MEDIA_VASTO_VICTORY,
  MEDIA_VASTO_DEFEAT,
  MEDIA_VASTO_R1,
  MEDIA_VASTO_R2,
  MEDIA_VASTO_R3,
  MEDIA_VASTO_R4,
  MEDIA_VASTO_R5,

  MEDIA_ULQ_SPAWN,
  MEDIA_ULQ_VICTORY,
  MEDIA_ULQ_DEFEAT,
  MEDIA_ULQ_R1,
  MEDIA_ULQ_R2,
  MEDIA_ULQ_R3,
  MEDIA_ULQ_R4,
  MEDIA_ULQ_R5,
  MEDIA_ULQ_R6,

  MEDIA_GRIM_SPAWN,
  MEDIA_GRIM_VICTORY,
  MEDIA_GRIM_DEFEAT,
  MEDIA_GRIM_R1,
  MEDIA_GRIM_R2,

  MEDIA_MAHO_TEASER,
  MEDIA_MAHO_SPAWN,
  MEDIA_MAHO_VICTORY,
  MEDIA_MAHO_DEFEAT,
  MEDIA_MAHO_R1,
  MEDIA_MAHO_R2,
  MEDIA_MAHO_R3,
  MEDIA_MAHO_R4_AFTER,
  MEDIA_MAHO_ADAPTED,
  MEDIA_MAHO_R6,
  MEDIA_MAHO_R7,

  MEDIA_JJK_SG_SPAWN,
  MEDIA_JJK_SG_VICTORY,
  MEDIA_JJK_SG_DEFEAT,
  MEDIA_JJK_SG_R1,
  MEDIA_JJK_SG_R2,
  MEDIA_JJK_SG_R3,
};
