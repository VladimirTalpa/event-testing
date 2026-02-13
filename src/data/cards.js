// src/data/cards.js

/**
 * Card rarity: common | rare | legendary | mythic
 * Role: dps | tank | support
 */
const CARDS = {
  // ===================== JJK =====================
  miwa: {
    id: "miwa",
    name: "Kasumi Miwa",
    anime: "jjk",
    rarity: "common",
    role: "support",
    stats: { hp: 95, atk: 22, def: 18 },
    passiveText: "Sometimes reduces incoming damage (useful in expeditions).",
  },
  momo: {
    id: "momo",
    name: "Momo Nishimiya",
    anime: "jjk",
    rarity: "common",
    role: "support",
    stats: { hp: 85, atk: 20, def: 16 },
    passiveText: "Small group survival bonus chance.",
  },
  mai: {
    id: "mai",
    name: "Mai Zenin",
    anime: "jjk",
    rarity: "common",
    role: "dps",
    stats: { hp: 80, atk: 28, def: 14 },
    passiveText: "Chance for a precise strike (better PvE outcomes).",
  },
  todo: {
    id: "todo",
    name: "Aoi Todo",
    anime: "jjk",
    rarity: "rare",
    role: "tank",
    stats: { hp: 140, atk: 30, def: 32 },
    passiveText: "Protects the team (great for expeditions).",
  },
  panda: {
    id: "panda",
    name: "Panda",
    anime: "jjk",
    rarity: "rare",
    role: "tank",
    stats: { hp: 130, atk: 27, def: 30 },
    passiveText: "High endurance (ideal for long runs).",
  },
  toji_legendary: {
    id: "toji_legendary",
    name: "Toji Fushiguro",
    anime: "jjk",
    rarity: "legendary",
    role: "dps",
    stats: { hp: 160, atk: 55, def: 28 },
    passiveText: "High chance of success in combat events.",
    evolvesTo: "toji_mythic",
  },
  toji_mythic: {
    id: "toji_mythic",
    name: "Toji (Mythic)",
    anime: "jjk",
    rarity: "mythic",
    role: "dps",
    stats: { hp: 260, atk: 95, def: 45 },
    passiveText: "Breaks content noticeably. Bosses scale harder.",
  },

  // ===================== BLEACH =====================
  ikkaku: {
    id: "ikkaku",
    name: "Ikkaku Madarame",
    anime: "bleach",
    rarity: "common",
    role: "tank",
    stats: { hp: 120, atk: 24, def: 24 },
    passiveText: "Stable survival, good starter tank.",
  },
  shuuhei: {
    id: "shuuhei",
    name: "Shuuhei Hisagi",
    anime: "bleach",
    rarity: "common",
    role: "dps",
    stats: { hp: 95, atk: 30, def: 16 },
    passiveText: "High chance of successful PvE action.",
  },
  ganju: {
    id: "ganju",
    name: "Ganju Shiba",
    anime: "bleach",
    rarity: "common",
    role: "support",
    stats: { hp: 90, atk: 20, def: 18 },
    passiveText: "Luck: slightly improves resource finds.",
  },
  chad: {
    id: "chad",
    name: "Yasutora Sado (Chad)",
    anime: "bleach",
    rarity: "rare",
    role: "tank",
    stats: { hp: 170, atk: 30, def: 35 },
    passiveText: "Super survivability.",
    evolvesTo: "chad_legendary",
  },
  orihime: {
    id: "orihime",
    name: "Orihime Inoue",
    anime: "bleach",
    rarity: "rare",
    role: "support",
    stats: { hp: 110, atk: 18, def: 22 },
    passiveText: "Healing chance: reduces death risk in expeditions.",
  },
  ichigo_legendary: {
    id: "ichigo_legendary",
    name: "Ichigo Kurosaki",
    anime: "bleach",
    rarity: "legendary",
    role: "dps",
    stats: { hp: 190, atk: 60, def: 28 },
    passiveText: "Strong carry for expeditions/raids.",
    evolvesTo: "ichigo_mythic",
  },
  ichigo_mythic: {
    id: "ichigo_mythic",
    name: "Ichigo (Mythic)",
    anime: "bleach",
    rarity: "mythic",
    role: "dps",
    stats: { hp: 300, atk: 100, def: 45 },
    passiveText: "Very high success chance (if prepared).",
  },
  // (Если хочешь Chad Legendary / Mythic — добавим позже)
};

function listBy(filterFn) {
  return Object.values(CARDS).filter(filterFn);
}

const POOLS = {
  basic: {
    // basic pack: mostly common/rare, rare legendary
    weights: [
      { rarity: "common", w: 72 },
      { rarity: "rare", w: 25 },
      { rarity: "legendary", w: 3 },
      { rarity: "mythic", w: 0 },
    ],
  },
  legendary: {
    // legendary pack: guaranteed at least rare, higher legendary, tiny mythic
    weights: [
      { rarity: "common", w: 0 },
      { rarity: "rare", w: 65 },
      { rarity: "legendary", w: 33 },
      { rarity: "mythic", w: 2 },
    ],
  },
};

function weightedPick(weights) {
  const total = weights.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const x of weights) {
    r -= x.w;
    if (r <= 0) return x.rarity;
  }
  return weights[weights.length - 1].rarity;
}

function randomCardFromPack(packType, anime) {
  const pool = POOLS[packType] || POOLS.basic;
  const rarity = weightedPick(pool.weights);

  const options = listBy((c) => c.rarity === rarity && (!anime || c.anime === anime));
  // fallback: если редкость пуста в данной фракции — понижаем
  if (!options.length) {
    const fallback = listBy((c) => (!anime || c.anime === anime));
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return options[Math.floor(Math.random() * options.length)];
}

module.exports = { CARDS, POOLS, randomCardFromPack };
