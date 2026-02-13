
// src/data/packs.js
const { CARDS, RARITY, getCardsByAnime } = require("./cards");

function weightedPick(list, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

function rollRarity(packType) {
  // You can tweak these later
  if (packType === "basic") {
    // Common 70%, Rare 25%, Legendary 4.5%, Mythic 0.5%
    return weightedPick(
      [RARITY.COMMON, RARITY.RARE, RARITY.LEGENDARY, RARITY.MYTHIC],
      [70, 25, 4.5, 0.5]
    );
  }
  // legendary pack
  // Common 35%, Rare 40%, Legendary 22%, Mythic 3%
  return weightedPick(
    [RARITY.COMMON, RARITY.RARE, RARITY.LEGENDARY, RARITY.MYTHIC],
    [35, 40, 22, 3]
  );
}

function pickCardKey(anime, rarity) {
  const pool = getCardsByAnime(anime).filter((c) => c.rarity === rarity);
  if (!pool.length) {
    // fallback: any from anime
    const any = getCardsByAnime(anime);
    return any[Math.floor(Math.random() * any.length)].key;
  }
  return pool[Math.floor(Math.random() * pool.length)].key;
}

function openPack({ anime, packType }) {
  // pack contains 1 card for now (can expand to multiple later)
  const rarity = rollRarity(packType);
  const cardKey = pickCardKey(anime, rarity);
  const def = CARDS[cardKey];
  return { cardKey, rarity: def.rarity, name: def.name };
}

module.exports = { openPack };
