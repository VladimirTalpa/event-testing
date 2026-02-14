const { SHOP_COSMETIC_ROLE_ID } = require("../config");

const BLEACH_SHOP_ITEMS = [
  {
    id: "bleach_role_cosmetic",
    name: "Cosmetic Role (Bleach)",
    price: 300,
    currency: "reiatsu",
    type: "role",
    roleId: SHOP_COSMETIC_ROLE_ID,
    description: "Buy a cosmetic role (example item)."
  }
];

const JJK_SHOP_ITEMS = [
  {
    id: "jjk_pack_basic",
    name: "Basic Pack (JJK)",
    price: 250,
    currency: "cursed_energy",
    type: "pack",
    description: "Placeholder pack item (future gacha)."
  }
];

module.exports = { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS };
