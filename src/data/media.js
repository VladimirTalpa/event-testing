const cfg = require("../config");

// helper: безопасно вернуть ссылку или null
const u = (v) => (typeof v === "string" && v.trim().length ? v.trim() : null);

/**
 * ВАЖНО:
 * Тут мы НЕ хардкодим твои ссылки.
 * Всё берётся из config.js, чтобы ты мог менять медиа без трогания кода.
 * Если чего-то нет — возвращается null и бот НЕ падает.
 */

// =====================
// Bleach — Vasto
// =====================
const VASTO_SPAWN_MEDIA = u(cfg.MEDIA_VASTO_SPAWN);
const VASTO_VICTORY_MEDIA = u(cfg.MEDIA_VASTO_VICTORY);
const VASTO_DEFEAT_MEDIA = u(cfg.MEDIA_VASTO_DEFEAT);
const VASTO_R1 = u(cfg.MEDIA_VASTO_R1);
const VASTO_R2 = u(cfg.MEDIA_VASTO_R2);
const VASTO_R3 = u(cfg.MEDIA_VASTO_R3);
const VASTO_R4 = u(cfg.MEDIA_VASTO_R4);
const VASTO_R5 = u(cfg.MEDIA_VASTO_R5);

// =====================
// Bleach — Ulquiorra
// =====================
const ULQ_SPAWN_MEDIA = u(cfg.MEDIA_ULQ_SPAWN);
const ULQ_VICTORY_MEDIA = u(cfg.MEDIA_ULQ_VICTORY);
const ULQ_DEFEAT_MEDIA = u(cfg.MEDIA_ULQ_DEFEAT);
const ULQ_R1 = u(cfg.MEDIA_ULQ_R1);
const ULQ_R2 = u(cfg.MEDIA_ULQ_R2);
const ULQ_R3 = u(cfg.MEDIA_ULQ_R3);
const ULQ_R4 = u(cfg.MEDIA_ULQ_R4);
const ULQ_R5 = u(cfg.MEDIA_ULQ_R5);
const ULQ_R6 = u(cfg.MEDIA_ULQ_R6);

// =====================
// Bleach — Grimmjow
// =====================
const GRIM_SPAWN_MEDIA = u(cfg.MEDIA_GRIM_SPAWN);
const GRIM_VICTORY_MEDIA = u(cfg.MEDIA_GRIM_VICTORY);
const GRIM_DEFEAT_MEDIA = u(cfg.MEDIA_GRIM_DEFEAT);
const GRIM_R1 = u(cfg.MEDIA_GRIM_R1);
const GRIM_R2 = u(cfg.MEDIA_GRIM_R2);

// =====================
// JJK — Mahoraga
// =====================
const MAHO_TEASER = u(cfg.MEDIA_MAHO_TEASER);
const MAHO_SPAWN = u(cfg.MEDIA_MAHO_SPAWN);
const MAHO_VICTORY = u(cfg.MEDIA_MAHO_VICTORY);
const MAHO_DEFEAT = u(cfg.MEDIA_MAHO_DEFEAT);

const MAHO_R1 = u(cfg.MEDIA_MAHO_R1);
const MAHO_R2 = u(cfg.MEDIA_MAHO_R2);
const MAHO_R3 = u(cfg.MEDIA_MAHO_R3);
const MAHO_R4_AFTER = u(cfg.MEDIA_MAHO_R4_AFTER);
const MAHO_ADAPTED = u(cfg.MEDIA_MAHO_ADAPTED);
const MAHO_R6 = u(cfg.MEDIA_MAHO_R6);
const MAHO_R7 = u(cfg.MEDIA_MAHO_R7);

// =====================
// JJK — Special Grade
// =====================
const JJK_SG_SPAWN_MEDIA = u(cfg.MEDIA_JJK_SG_SPAWN);
const JJK_SG_VICTORY_MEDIA = u(cfg.MEDIA_JJK_SG_VICTORY);
const JJK_SG_DEFEAT_MEDIA = u(cfg.MEDIA_JJK_SG_DEFEAT);
const JJK_SG_R1 = u(cfg.MEDIA_JJK_SG_R1);
const JJK_SG_R2 = u(cfg.MEDIA_JJK_SG_R2);
const JJK_SG_R3 = u(cfg.MEDIA_JJK_SG_R3);

module.exports = {
  // Vasto
  VASTO_SPAWN_MEDIA,
  VASTO_VICTORY_MEDIA,
  VASTO_DEFEAT_MEDIA,
  VASTO_R1,
  VASTO_R2,
  VASTO_R3,
  VASTO_R4,
  VASTO_R5,

  // Ulq
  ULQ_SPAWN_MEDIA,
  ULQ_VICTORY_MEDIA,
  ULQ_DEFEAT_MEDIA,
  ULQ_R1,
  ULQ_R2,
  ULQ_R3,
  ULQ_R4,
  ULQ_R5,
  ULQ_R6,

  // Grimmjow
  GRIM_SPAWN_MEDIA,
  GRIM_VICTORY_MEDIA,
  GRIM_DEFEAT_MEDIA,
  GRIM_R1,
  GRIM_R2,

  // Mahoraga
  MAHO_TEASER,
  MAHO_SPAWN,
  MAHO_VICTORY,
  MAHO_DEFEAT,
  MAHO_R1,
  MAHO_R2,
  MAHO_R3,
  MAHO_R4_AFTER,
  MAHO_ADAPTED,
  MAHO_R6,
  MAHO_R7,

  // JJK SG
  JJK_SG_SPAWN_MEDIA,
  JJK_SG_VICTORY_MEDIA,
  JJK_SG_DEFEAT_MEDIA,
  JJK_SG_R1,
  JJK_SG_R2,
  JJK_SG_R3,
};
