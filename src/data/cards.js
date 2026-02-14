// src/config.js
require("dotenv").config();

module.exports = {
  // ================== REQUIRED ==================
  TOKEN: process.env.TOKEN,

  // ================== UI ==================
  COLOR: 0x8a2be2, // фиолетовый (можешь поменять)

  // ================== PACK PRICES ==================
  // цены за пак (покупка в /store -> Card Packs)
  PACK_BASIC_PRICE_BLEACH: 250,
  PACK_BASIC_PRICE_JJK: 250,

  PACK_LEGENDARY_PRICE_BLEACH: 1200,
  PACK_LEGENDARY_PRICE_JJK: 1200,

  // ================== EVOLVE COSTS ==================
  // forge evolve (cost)
  EVOLVE_RARE_TO_LEGENDARY_SHARDS: 120,
  EVOLVE_LEGENDARY_TO_MYTHIC_SHARDS: 280,

  EVOLVE_RARE_TO_LEGENDARY_DRKO: 25,
  EVOLVE_LEGENDARY_TO_MYTHIC_DRKO: 60,

  // ================== EXPEDITION SETTINGS ==================
  // лимит экспедиций в день
  EXPEDITION_DAILY_LIMIT: 2,

  // старт через 1 час
  EXPEDITION_START_DELAY_MIN: 60,

  // обновление сообщения каждые 10 минут
  EXPEDITION_TICK_MIN: 10,

  // сколько тиков всего (6 тиков = 60 минут при 10 мин)
  EXPEDITION_TOTAL_TICKS: 6,
};
