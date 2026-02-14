// src/ui/old_embeds_inventory_shop.js
// Тут мы держим твои старые функции inventoryEmbed/shopEmbed чтобы ничего не ломалось

const {
  mobEmbed,
  inventoryEmbed,
  shopEmbed,
  leaderboardEmbed,
  wardrobeEmbed,

  // бонусы (если тебе надо где-то ещё)
  calcBleachSurvivalBonus,
  calcBleachReiatsuMultiplier,
  calcBleachDropLuckMultiplier,
  calcJjkSurvivalBonus,
  calcJjkCEMultiplier,
  calcJjkDropLuckMultiplier,
} = require("./embeds_legacy");

module.exports = {
  mobEmbed,
  inventoryEmbed,
  shopEmbed,
  leaderboardEmbed,
  wardrobeEmbed,

  calcBleachSurvivalBonus,
  calcBleachReiatsuMultiplier,
  calcBleachDropLuckMultiplier,
  calcJjkSurvivalBonus,
  calcJjkCEMultiplier,
  calcJjkDropLuckMultiplier,
};
