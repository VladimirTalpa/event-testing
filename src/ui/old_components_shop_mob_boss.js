// src/ui/old_components_shop_mob_boss.js
// Здесь прокидываем твои старые компоненты (boss/mob/shop/pvp) чтобы они не сломались

const legacy = require("./components_legacy");

module.exports = {
  CID: legacy.CID,
  hasEventRole: legacy.hasEventRole,
  hasBoosterRole: legacy.hasBoosterRole,
  bossButtons: legacy.bossButtons,
  singleActionRow: legacy.singleActionRow,
  dualChoiceRow: legacy.dualChoiceRow,
  triChoiceRow: legacy.triChoiceRow,
  comboDefenseRows: legacy.comboDefenseRows,
  mobButtons: legacy.mobButtons,
  shopButtons: legacy.shopButtons,
  wardrobeComponents: legacy.wardrobeComponents,
  pvpButtons: legacy.pvpButtons,
};
