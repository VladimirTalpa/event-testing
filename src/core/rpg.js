// src/core/rpg.js
const { STAR_STAT_BONUS, CARD_PLACEHOLDER_GIF } = require("../config");

/**
 * Base card definitions (your final list)
 * charKey must be stable (used in storage)
 */
const CARDS = {
  // ===== JJK =====
  "Kasumi Miwa": { anime: "jjk", rarity: "Common", role: "Support", base: { hp: 95, atk: 22, def: 18 }, passive: "Sometimes reduces incoming damage (useful in expeditions)." },
  "Momo Nishimiya": { anime: "jjk", rarity: "Common", role: "Support", base: { hp: 85, atk: 20, def: 16 }, passive: "Support chance: small survival bonus for the party." },
  "Mai Zenin": { anime: "jjk", rarity: "Common", role: "DPS", base: { hp: 80, atk: 28, def: 14 }, passive: "Precision strike chance: slightly better outcomes in PvE." },

  "Aoi Todo": { anime: "jjk", rarity: "Rare", role: "Tank", base: { hp: 140, atk: 30, def: 32 }, passive: "Team protection: strong for long expeditions." },
  "Panda": { anime: "jjk", rarity: "Rare", role: "Tank", base: { hp: 130, atk: 27, def: 30 }, passive: "High durability: ideal for long runs." },

  "Toji Fushiguro": { anime: "jjk", rarity: "Legendary", role: "DPS", base: { hp: 160, atk: 55, def: 28 }, passive: "High success chance in combat events." },
  "Toji (Mythic)": { anime: "jjk", rarity: "Mythic", role: "DPS", base: { hp: 260, atk: 95, def: 45 }, passive: "Breaks content, bosses will be stronger." },

  // ===== BLEACH =====
  "Ikkaku Madarame": { anime: "bleach", rarity: "Common", role: "Tank", base: { hp: 120, atk: 24, def: 24 }, passive: "Consistent durability, good starter." },
  "Shuuhei Hisagi": { anime: "bleach", rarity: "Common", role: "DPS", base: { hp: 95, atk: 30, def: 16 }, passive: "High chance of successful action in PvE." },
  "Ganju Shiba": { anime: "bleach", rarity: "Common", role: "Support", base: { hp: 90, atk: 20, def: 18 }, passive: "Luck: slightly improves resource findings." },

  "Yasutora Sado (Chad)": { anime: "bleach", rarity: "Rare", role: "Tank", base: { hp: 170, atk: 30, def: 35 }, passive: "Super survivability." },
  "Orihime Inoue": { anime: "bleach", rarity: "Rare", role: "Support/Healer", base: { hp: 110, atk: 18, def: 22 }, passive: "Healing chance: can prevent death / reduce consequences." },

  "Ichigo Kurosaki": { anime: "bleach", rarity: "Legendary", role: "DPS", base: { hp: 190, atk: 60, def: 28 }, passive: "Carry for expeditions/raids." },
  "Ichigo (Mythic)": { anime: "bleach", rarity: "Mythic", role: "DPS", base: { hp: 300, atk: 100, def: 45 }, passive: "Very high success chance if prepared." },
};

/* ===================== HELPERS ===================== */
function makeId() {
  // short stable enough id
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(2, 6);
}

function starsFromLevel(level) {
  // every 10 levels +1 star
  const lvl = Math.max(1, Math.floor(level || 1));
  return Math.floor(lvl / 10);
}

function calcStats(card) {
  const stars = card.stars ?? starsFromLevel(card.level);
  const mult = 1 + stars * STAR_STAT_BONUS;
  return {
    hp: Math.floor(card.base.hp * mult),
    atk: Math.floor(card.base.atk * mult),
    def: Math.floor(card.base.def * mult),
  };
}

function createCardInstance(charKey) {
  const def = CARDS[charKey];
  if (!def) throw new Error(`Unknown card charKey: ${charKey}`);

  const level = 1;
  const stars = starsFromLevel(level);

  return {
    id: makeId(),
    charKey,
    anime: def.anime,
    rarity: def.rarity,
    role: def.role,
    level,
    xp: 0,
    stars,
    evolution: def.rarity, // same string for now
    base: { ...def.base },
    passive: def.passive,
    gear: { weapon: null, armor: null },
    status: "idle", // idle / expedition / dead
    art: CARD_PLACEHOLDER_GIF,
    createdAt: Date.now(),
  };
}

/**
 * Pack pools (simple):
 * Basic pack: mostly Common, sometimes Rare
 * Legendary pack: Rare/Legendary + small Mythic chance
 */
function rollFromPool(anime, packType) {
  const all = Object.entries(CARDS)
    .filter(([, def]) => def.anime === anime)
    .map(([k, def]) => ({ charKey: k, ...def }));

  const commons = all.filter((x) => x.rarity === "Common");
  const rares = all.filter((x) => x.rarity === "Rare");
  const legs = all.filter((x) => x.rarity === "Legendary");
  const myths = all.filter((x) => x.rarity === "Mythic");

  const r = Math.random();

  if (packType === "basic") {
    // 80% Common, 20% Rare
    if (r < 0.80 && commons.length) return commons[Math.floor(Math.random() * commons.length)].charKey;
    if (rares.length) return rares[Math.floor(Math.random() * rares.length)].charKey;
    // fallback
    return (commons[0]?.charKey || rares[0]?.charKey || legs[0]?.charKey || myths[0]?.charKey);
  }

  // legendary pack
  // 60% Rare, 35% Legendary, 5% Mythic
  if (r < 0.60 && rares.length) return rares[Math.floor(Math.random() * rares.length)].charKey;
  if (r < 0.95 && legs.length) return legs[Math.floor(Math.random() * legs.length)].charKey;
  if (myths.length) return myths[Math.floor(Math.random() * myths.length)].charKey;

  return (legs[0]?.charKey || rares[0]?.charKey || commons[0]?.charKey || myths[0]?.charKey);
}

module.exports = {
  CARDS,
  createCardInstance,
  rollFromPool,
  calcStats,
  starsFromLevel,
};
