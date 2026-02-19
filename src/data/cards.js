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
    { id: "bl_byakuya", name: "Byakuya Kuchiki", rarity: "Rare", dmg: 460, def: 330, hp: 2400 },
    { id: "bl_ishida", name: "Uryu Ishida", rarity: "Rare", dmg: 390, def: 290, hp: 2150 },
    { id: "bl_kenpachi", name: "Kenpachi Zaraki", rarity: "Epic", dmg: 670, def: 320, hp: 2900 },
    { id: "bl_yoruichi", name: "Yoruichi Shihouin", rarity: "Rare", dmg: 470, def: 340, hp: 2350 },
    { id: "bl_kuchiki_squad", name: "Kuchiki Squad", rarity: "Legendary", dmg: 860, def: 520, hp: 3800 },
    { id: "bl_espada_squad", name: "Espada Squad", rarity: "Mythic", dmg: 980, def: 560, hp: 4100 },
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
    { id: "jjk_nobora", name: "Nobara Kugisaki (Alt)", rarity: "Common", dmg: 270, def: 230, hp: 1750 },
    { id: "jjk_todo", name: "Aoi Todo", rarity: "Epic", dmg: 620, def: 360, hp: 2750 },
    { id: "jjk_todoi", name: "Aoi Todo (Alt)", rarity: "Epic", dmg: 620, def: 360, hp: 2750 },
    { id: "jjk_maki", name: "Maki Zenin", rarity: "Epic", dmg: 600, def: 340, hp: 2680 },
    { id: "jjk_yuta", name: "Yuta Okkotsu", rarity: "Legendary", dmg: 790, def: 450, hp: 3250 },
    { id: "jjk_nanami", name: "Kento Nanami", rarity: "Rare", dmg: 450, def: 300, hp: 2360 },
    { id: "jjk_Gojo_Dimensoon", name: "Gojo Dimensoon", rarity: "Mythic", dmg: 1020, def: 580, hp: 4200 },
  ],
};

const RARITY_WEIGHTS = [
  { rarity: "Common", weight: 58 },
  { rarity: "Rare", weight: 27 },
  { rarity: "Epic", weight: 10 },
  { rarity: "Legendary", weight: 4 },
  { rarity: "Mythic", weight: 1 },
];

const RARITY_COLORS = {
  Common: "#c8d0e0",
  Rare: "#53ccff",
  Epic: "#be6cff",
  Legendary: "#ffb347",
  Mythic: "#ffd86b",
  common: "#c8d0e0",
  rare: "#53ccff",
  epic: "#be6cff",
  legendary: "#ffb347",
  mythic: "#ff004c",
};

const CARD_MAX_LEVEL = 20;
const RARITY_BALANCE = {
  Common: { baseScale: 1.06, dmgGrowth: 0.128, defGrowth: 0.118, hpGrowth: 0.162 },
  Rare: { baseScale: 1.03, dmgGrowth: 0.121, defGrowth: 0.111, hpGrowth: 0.153 },
  Epic: { baseScale: 1.0, dmgGrowth: 0.114, defGrowth: 0.104, hpGrowth: 0.145 },
  Legendary: { baseScale: 0.97, dmgGrowth: 0.107, defGrowth: 0.098, hpGrowth: 0.136 },
  Mythic: { baseScale: 0.95, dmgGrowth: 0.102, defGrowth: 0.094, hpGrowth: 0.131 },
};

function normalizeRarityName(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "mythic") return "Mythic";
  if (v === "legendary") return "Legendary";
  if (v === "epic") return "Epic";
  if (v === "rare") return "Rare";
  return "Common";
}

function pickRarity(weights = RARITY_WEIGHTS) {
  const total = weights.reduce((sum, x) => sum + Number(x.weight || 0), 0);
  const roll = Math.random() * (total || 1);
  let acc = 0;
  for (const r of weights) {
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

function rarityBalance(card) {
  const rarity = normalizeRarityName(card?.rarity);
  return RARITY_BALANCE[rarity] || RARITY_BALANCE.Common;
}

function cardStatsAtLevel(card, level) {
  const bal = rarityBalance(card);
  return {
    dmg: statAtLevel((card?.dmg || 0) * bal.baseScale, level, bal.dmgGrowth),
    def: statAtLevel((card?.def || 0) * bal.baseScale, level, bal.defGrowth),
    hp: statAtLevel((card?.hp || 0) * bal.baseScale, level, bal.hpGrowth),
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
  const available = new Set(pool.map((c) => normalizeRarityName(c?.rarity)));
  const activeWeights = RARITY_WEIGHTS.filter((x) => available.has(x.rarity));
  const rarity = pickRarity(activeWeights.length ? activeWeights : RARITY_WEIGHTS);
  const byRarity = pool.filter((c) => normalizeRarityName(c?.rarity) === rarity);
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
