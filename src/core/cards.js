// src/core/cards.js

const { CARD_GIF_URL } = require('../config');

// TEMP visual for ALL cards
const CARD_ART_DEFAULT = CARD_GIF_URL;

// Base card list (your 12 + 2 mythic evolutions)
const CARDS = [
  // JJK
  {
    id: 'miwa',
    name: 'Kasumi Miwa',
    anime: 'jjk',
    rarity: 'Common',
    role: 'Support',
    hp: 95,
    atk: 22,
    def: 18,
    passive: 'Sometimes reduces incoming damage (good for expeditions).',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'momo',
    name: 'Momo Nishimiya',
    anime: 'jjk',
    rarity: 'Common',
    role: 'Support',
    hp: 85,
    atk: 20,
    def: 16,
    passive: 'Chance to grant small survival bonus to the group.',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'mai',
    name: 'Mai Zenin',
    anime: 'jjk',
    rarity: 'Common',
    role: 'DPS',
    hp: 80,
    atk: 28,
    def: 14,
    passive: 'Chance for a “precise hit” in PvE events (better outcomes).',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'todo',
    name: 'Aoi Todo',
    anime: 'jjk',
    rarity: 'Rare',
    role: 'Tank',
    hp: 140,
    atk: 30,
    def: 32,
    passive: 'Protects the team (holds damage better in expeditions).',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'panda',
    name: 'Panda',
    anime: 'jjk',
    rarity: 'Rare',
    role: 'Tank',
    hp: 130,
    atk: 27,
    def: 30,
    passive: 'High durability (ideal for long runs).',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'toji',
    name: 'Toji Fushiguro',
    anime: 'jjk',
    rarity: 'Legendary',
    role: 'DPS',
    hp: 160,
    atk: 55,
    def: 28,
    passive: 'High chance of success in combat events.',
    evolvesTo: 'toji_mythic',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'toji_mythic',
    name: 'Toji (Mythic)',
    anime: 'jjk',
    rarity: 'Mythic',
    role: 'DPS',
    hp: 260,
    atk: 95,
    def: 45,
    passive: 'Breaks content noticeably; bosses will hit harder to compensate.',
    art: CARD_ART_DEFAULT,
  },

  // BLEACH
  {
    id: 'ikkaku',
    name: 'Ikkaku Madarame',
    anime: 'bleach',
    rarity: 'Common',
    role: 'Tank',
    hp: 120,
    atk: 24,
    def: 24,
    passive: 'Stable tanking; good starter.',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'hisagi',
    name: 'Shuuhei Hisagi',
    anime: 'bleach',
    rarity: 'Common',
    role: 'DPS',
    hp: 95,
    atk: 30,
    def: 16,
    passive: 'Higher chance of successful actions in PvE.',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'ganju',
    name: 'Ganju Shiba',
    anime: 'bleach',
    rarity: 'Common',
    role: 'Support',
    hp: 90,
    atk: 20,
    def: 18,
    passive: 'Luck: slightly higher resource/material find chance.',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'chad',
    name: 'Yasutora Sado (Chad)',
    anime: 'bleach',
    rarity: 'Rare',
    role: 'Tank',
    hp: 170,
    atk: 30,
    def: 35,
    passive: 'Super survivability.',
    evolvesTo: 'chad_legendary',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'orihime',
    name: 'Orihime Inoue',
    anime: 'bleach',
    rarity: 'Rare',
    role: 'Support/Healer',
    hp: 110,
    atk: 18,
    def: 22,
    passive: 'Chance to heal / prevent death (reduces consequences).',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'ichigo',
    name: 'Ichigo Kurosaki',
    anime: 'bleach',
    rarity: 'Legendary',
    role: 'DPS',
    hp: 190,
    atk: 60,
    def: 28,
    passive: 'Strong carry for expeditions/raids.',
    evolvesTo: 'ichigo_mythic',
    art: CARD_ART_DEFAULT,
  },
  {
    id: 'ichigo_mythic',
    name: 'Ichigo (Mythic)',
    anime: 'bleach',
    rarity: 'Mythic',
    role: 'DPS',
    hp: 300,
    atk: 100,
    def: 45,
    passive: 'Very high success chance; near-guaranteed expeditions if prepared.',
    art: CARD_ART_DEFAULT,
  },

  // OPTIONAL extra evolution example for Chad (not in your list but keeps your earlier note)
  {
    id: 'chad_legendary',
    name: 'Chad (Legendary)',
    anime: 'bleach',
    rarity: 'Legendary',
    role: 'Tank',
    hp: 240,
    atk: 45,
    def: 50,
    passive: 'Extreme tank — enables risky teams to survive.',
    art: CARD_ART_DEFAULT,
  },
];

const RARITY_WEIGHTS = {
  Basic: [
    { rarity: 'Common', weight: 80 },
    { rarity: 'Rare', weight: 18 },
    { rarity: 'Legendary', weight: 2 },
  ],
  Legendary: [
    { rarity: 'Rare', weight: 70 },
    { rarity: 'Legendary', weight: 27 },
    { rarity: 'Mythic', weight: 3 },
  ],
};

function pickWeighted(items) {
  const total = items.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function getCardsByAnime(anime) {
  return CARDS.filter((c) => c.anime === anime);
}

function getCardsByAnimeAndRarity(anime, rarity) {
  return CARDS.filter((c) => c.anime === anime && c.rarity === rarity);
}

function drawCard({ anime, packType }) {
  const rarityPick = pickWeighted(RARITY_WEIGHTS[packType]);
  const pool = getCardsByAnimeAndRarity(anime, rarityPick.rarity);
  // Fallback if pool empty
  const chosen = pool.length ? pool[Math.floor(Math.random() * pool.length)] : getCardsByAnime(anime)[0];
  // Return shallow clone so we can add ownership metadata elsewhere
  return { ...chosen };
}

function getCardDef(cardId) {
  return CARDS.find((c) => c.id === cardId) || null;
}

module.exports = {
  CARDS,
  drawCard,
  getCardDef,
};
