// key должно совпадать с тем, что ты используешь в players.js items
module.exports = {
  BLEACH_SHOP_ITEMS: [
    { key: "zanpakuto_basic", name: "Zanpakutō", desc: "+survival +luck", price: 250, roleId: null },
    { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", desc: "+survival +luck", price: 450, roleId: null },
    { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", desc: "+survival +luck", price: 600, roleId: null },
    { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", desc: "x1.25 rewards", price: 900, roleId: null },

    // пример роли:
    { key: "cosmetic_role", name: "Aizen Title", desc: "Cosmetic role (Title)", price: 2000, roleId: "PUT_ROLE_ID_HERE" },
  ],

  JJK_SHOP_ITEMS: [
    { key: "black_flash_manual", name: "Black Flash Manual", desc: "x1.2 rewards", price: 300, roleId: null },
    { key: "domain_charm", name: "Domain Charm", desc: "+survival", price: 550, roleId: null },
    { key: "cursed_tool", name: "Cursed Tool", desc: "+survival +luck", price: 800, roleId: null },
    { key: "reverse_talisman", name: "Reverse Talisman", desc: "utility", price: 1000, roleId: null },

    // пример роли:
    { key: "binding_vow_seal", name: "Binding Vow Title", desc: "Cosmetic role (Title)", price: 2500, roleId: "PUT_ROLE_ID_HERE" },
  ],
};
