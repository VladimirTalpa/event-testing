// src/data/shop.js
const BLEACH_SHOP_ITEMS = [
  { key: "zanpakuto_basic", name: "Zanpakutō", price: 120, desc: "+Survival chance (boss rounds)" },
  { key: "hollow_mask_fragment", name: "Mask Fragment", price: 180, desc: "+Survival chance" },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 220, desc: "+Survival chance" },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 260, desc: "x1.25 reward multiplier" }
];

const JJK_SHOP_ITEMS = [
  { key: "black_flash_manual", name: "Black Flash Manual", price: 120, desc: "x1.20 reward multiplier" },
  { key: "domain_charm", name: "Domain Charm", price: 200, desc: "+Survival chance" },
  { key: "cursed_tool", name: "Cursed Tool", price: 240, desc: "+Drop luck" },
  { key: "reverse_talisman", name: "Reverse Talisman", price: 300, desc: "Ignore 1 hit per boss" },
  { key: "binding_vow_seal", name: "Binding Vow Seal", price: 280, desc: "+Survival chance, but -10% reward mult" }
];

module.exports = { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS };
