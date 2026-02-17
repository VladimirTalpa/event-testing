const CARD_PACKS = {
  bleach: {
    key: "pack_bleach_core",
    name: "Bleach Card Pack",
    price: 650,
    currency: "reiatsu",
    desc: "Open and pull 1 Bleach card (weighted rarity).",
  },
  jjk: {
    key: "pack_jjk_core",
    name: "JJK Card Pack",
    price: 520,
    currency: "cursed_energy",
    desc: "Open and pull 1 JJK card (weighted rarity).",
  },
};

const CARD_POOL = {
  bleach: [
    { id: "bl_ichigo", name: "Ichigo Kurosaki", rarity: "Rare" },
    { id: "bl_aizen", name: "Sosuke Aizen", rarity: "Legendary" },
    { id: "bl_ulquiorra", name: "Ulquiorra Cifer", rarity: "Epic" },
    { id: "bl_grimmjow", name: "Grimmjow Jaegerjaquez", rarity: "Epic" },
    { id: "bl_rukia", name: "Rukia Kuchiki", rarity: "Rare" },
    { id: "bl_renji", name: "Renji Abarai", rarity: "Common" },
    { id: "bl_toshiro", name: "Toshiro Hitsugaya", rarity: "Rare" },
    { id: "bl_yamamoto", name: "Genryusai Yamamoto", rarity: "Legendary" },
    { id: "bl_orihime", name: "Orihime Inoue", rarity: "Common" },
  ],
  jjk: [
    { id: "jjk_gojo", name: "Satoru Gojo", rarity: "Legendary" },
    { id: "jjk_sukuna", name: "Ryomen Sukuna", rarity: "Legendary" },
    { id: "jjk_yuji", name: "Yuji Itadori", rarity: "Rare" },
    { id: "jjk_megumi", name: "Megumi Fushiguro", rarity: "Rare" },
    { id: "jjk_nobara", name: "Nobara Kugisaki", rarity: "Common" },
    { id: "jjk_todo", name: "Aoi Todo", rarity: "Epic" },
    { id: "jjk_maki", name: "Maki Zenin", rarity: "Epic" },
    { id: "jjk_yuta", name: "Yuta Okkotsu", rarity: "Legendary" },
    { id: "jjk_nanami", name: "Kento Nanami", rarity: "Rare" },
  ],
};

const RARITY_WEIGHTS = [
  { rarity: "Common", weight: 60 },
  { rarity: "Rare", weight: 27 },
  { rarity: "Epic", weight: 10 },
  { rarity: "Legendary", weight: 3 },
];

const RARITY_COLORS = {
  Common: "#c8d0e0",
  Rare: "#53ccff",
  Epic: "#be6cff",
  Legendary: "#ffb347",
};

function pickRarity() {
  const total = RARITY_WEIGHTS.reduce((sum, x) => sum + Number(x.weight || 0), 0);
  const roll = Math.random() * (total || 1);
  let acc = 0;
  for (const r of RARITY_WEIGHTS) {
    acc += Number(r.weight || 0);
    if (roll <= acc) return r.rarity;
  }
  return "Common";
}

function randomFrom(arr) {
  if (!Array.isArray(arr) || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)] || null;
}

function getCardById(eventKey, cardId) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const pool = CARD_POOL[ek] || [];
  return pool.find((c) => c.id === cardId) || null;
}

function rollCard(eventKey) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const pool = CARD_POOL[ek] || [];
  if (!pool.length) return null;
  const rarity = pickRarity();
  const byRarity = pool.filter((c) => c.rarity === rarity);
  return randomFrom(byRarity.length ? byRarity : pool);
}

module.exports = {
  CARD_PACKS,
  CARD_POOL,
  RARITY_WEIGHTS,
  RARITY_COLORS,
  getCardById,
  rollCard,
};
