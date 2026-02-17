const { E_REIATSU, E_CE, SHOP_COSMETIC_ROLE_ID } = require("../config");
const { CARD_PACKS } = require("./cards");

const BLEACH_SHOP_ITEMS = [
  { ...CARD_PACKS.bleach, type: "pack" },
  { key: "zanpakuto_basic", name: "Zanpakuto (Basic)", price: 350, desc: "+4% survive vs Bleach bosses • +5% drop luck" },
  { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: "+7% survive vs Bleach bosses • +10% drop luck" },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: "+9% survive vs Bleach bosses • +6% drop luck" },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: `${E_REIATSU} +25% Reiatsu rewards • +2% survive vs Bleach bosses` },
  { key: "cosmetic_role", name: "Sosuke Aizen Role", price: 6000, desc: "Cosmetic Discord role (no stats).", roleId: SHOP_COSMETIC_ROLE_ID },
];

const JJK_SHOP_ITEMS = [
  { ...CARD_PACKS.jjk, type: "pack" },
  { key: "black_flash_manual", name: "Black Flash Manual", price: 260, desc: `${E_CE} +20% Cursed Energy rewards • +2% survive vs Special Grade` },
  { key: "domain_charm", name: "Domain Expansion Charm", price: 520, desc: "+8% survive vs Special Grade • +4% mob hit chance" },
  { key: "cursed_tool", name: "Cursed Tool: Split-Soul Edge", price: 740, desc: "+10% survive vs Special Grade • +8% drop luck (JJK)" },
  { key: "reverse_talisman", name: "Reverse Technique Talisman", price: 980, desc: "Once per boss fight: ignore your first hit (soft shield)" },
  { key: "binding_vow_seal", name: "Binding Vow Seal", price: 1200, desc: "+15% survive vs Special Grade • -10% rewards (tradeoff)" },
];

module.exports = { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS };
