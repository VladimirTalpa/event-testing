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
    { id: "bl_ichigo", name: "Ichigo Kurosaki", rarity: "Rare", dmg: 420, def: 280, hp: 2100 },
    { id: "bl_aizen", name: "Sosuke Aizen", rarity: "Legendary", dmg: 760, def: 460, hp: 3400 },
    { id: "bl_ulquiorra", name: "Ulquiorra Cifer", rarity: "Epic", dmg: 590, def: 350, hp: 2800 },
    { id: "bl_grimmjow", name: "Grimmjow Jaegerjaquez", rarity: "Epic", dmg: 610, def: 330, hp: 2650 },
    { id: "bl_rukia", name: "Rukia Kuchiki", rarity: "Rare", dmg: 410, def: 300, hp: 2200 },
    { id: "bl_renji", name: "Renji Abarai", rarity: "Common", dmg: 290, def: 220, hp: 1650 },
    { id: "bl_toshiro", name: "Toshiro Hitsugaya", rarity: "Rare", dmg: 430, def: 320, hp: 2300 },
    { id: "bl_yamamoto", name: "Genryusai Yamamoto", rarity: "Legendary", dmg: 820, def: 500, hp: 3600 },
    { id: "bl_orihime", name: "Orihime Inoue", rarity: "Common", dmg: 240, def: 340, hp: 1700 },
  ],
  jjk: [
    { id: "jjk_gojo", name: "Satoru Gojo", rarity: "Legendary", dmg: 850, def: 470, hp: 3350 },
    { id: "jjk_sukuna", name: "Ryomen Sukuna", rarity: "Legendary", dmg: 880, def: 440, hp: 3450 },
    { id: "jjk_yuji", name: "Yuji Itadori", rarity: "Rare", dmg: 430, def: 290, hp: 2300 },
    { id: "jjk_megumi", name: "Megumi Fushiguro", rarity: "Rare", dmg: 410, def: 310, hp: 2250 },
    { id: "jjk_nobara", name: "Nobara Kugisaki", rarity: "Common", dmg: 270, def: 230, hp: 1750 },
    { id: "jjk_todo", name: "Aoi Todo", rarity: "Epic", dmg: 620, def: 360, hp: 2750 },
    { id: "jjk_maki", name: "Maki Zenin", rarity: "Epic", dmg: 600, def: 340, hp: 2680 },
    { id: "jjk_yuta", name: "Yuta Okkotsu", rarity: "Legendary", dmg: 790, def: 450, hp: 3250 },
    { id: "jjk_nanami", name: "Kento Nanami", rarity: "Rare", dmg: 450, def: 300, hp: 2360 },
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
  Mythic: "#ffd86b",
};

const CARD_MAX_LEVEL = 20;

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

function findCard(eventKey, query) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const pool = CARD_POOL[ek] || [];
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  return (
    pool.find((c) => c.id.toLowerCase() === q) ||
    pool.find((c) => String(c.name || "").toLowerCase() === q) ||
    pool.find((c) => String(c.name || "").toLowerCase().includes(q)) ||
    null
  );
}

function statAtLevel(base, level, growthPerLevel) {
  const lv = Math.max(1, Math.floor(Number(level || 1)));
  const factor = 1 + Math.max(0, lv - 1) * growthPerLevel;
  return Math.max(1, Math.floor(Number(base || 0) * factor));
}

function cardStatsAtLevel(card, level) {
  return {
    dmg: statAtLevel(card?.dmg || 0, level, 0.12),
    def: statAtLevel(card?.def || 0, level, 0.1),
    hp: statAtLevel(card?.hp || 0, level, 0.15),
  };
}

function cardPower(stats) {
  const dmg = Number(stats?.dmg || 0);
  const def = Number(stats?.def || 0);
  const hp = Number(stats?.hp || 0);
  return Math.floor(dmg * 1.4 + def * 0.95 + hp * 0.28);
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
  CARD_MAX_LEVEL,
  getCardById,
  findCard,
  cardStatsAtLevel,
  cardPower,
  rollCard,
};
