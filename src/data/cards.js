const { CARD_GIF_URL } = require("../config");

// NOTE: здесь пока нет gacha-логики. Это просто база карт для будущих pack'ов.
const CARDS = [
  // JJK
  {
    id: "miwa",
    name: "Kasumi Miwa",
    anime: "jjk",
    rarity: "Common",
    role: "Support",
    stats: { hp: 95, atk: 22, def: 18 },
    passive: "Sometimes reduces incoming damage (good for expeditions).",
    image: CARD_GIF_URL
  },
  {
    id: "momo",
    name: "Momo Nishimiya",
    anime: "jjk",
    rarity: "Common",
    role: "Support",
    stats: { hp: 85, atk: 20, def: 16 },
    passive: "Chance to 'support' (small survival bonus to group).",
    image: CARD_GIF_URL
  },
  {
    id: "mai",
    name: "Mai Zenin",
    anime: "jjk",
    rarity: "Common",
    role: "DPS",
    stats: { hp: 80, atk: 28, def: 14 },
    passive: "Chance for 'precise hit' (better PvE outcomes).",
    image: CARD_GIF_URL
  },
  {
    id: "todo",
    name: "Aoi Todo",
    anime: "jjk",
    rarity: "Rare",
    role: "Tank",
    stats: { hp: 140, atk: 30, def: 32 },
    passive: "Team protection (holds damage better in expeditions).",
    image: CARD_GIF_URL
  },
  {
    id: "panda",
    name: "Panda",
    anime: "jjk",
    rarity: "Rare",
    role: "Tank",
    stats: { hp: 130, atk: 27, def: 30 },
    passive: "High durability (good for long runs).",
    image: CARD_GIF_URL
  },
  {
    id: "toji_leg",
    name: "Toji Fushiguro",
    anime: "jjk",
    rarity: "Legendary",
    role: "DPS",
    stats: { hp: 160, atk: 55, def: 28 },
    passive: "High chance of success in combat events.",
    evolvesTo: "toji_myth",
    image: CARD_GIF_URL
  },
  {
    id: "toji_myth",
    name: "Toji (Mythic)",
    anime: "jjk",
    rarity: "Mythic",
    role: "DPS",
    stats: { hp: 260, atk: 95, def: 45 },
    passive: "Breaks content (bosses scale up).",
    image: CARD_GIF_URL
  },

  // Bleach
  {
    id: "ikkaku",
    name: "Ikkaku Madarame",
    anime: "bleach",
    rarity: "Common",
    role: "Tank",
    stats: { hp: 120, atk: 24, def: 24 },
    passive: "Stable tank for early game.",
    image: CARD_GIF_URL
  },
  {
    id: "hisagi",
    name: "Shuuhei Hisagi",
    anime: "bleach",
    rarity: "Common",
    role: "DPS",
    stats: { hp: 95, atk: 30, def: 16 },
    passive: "High success chance in PvE.",
    image: CARD_GIF_URL
  },
  {
    id: "ganju",
    name: "Ganju Shiba",
    anime: "bleach",
    rarity: "Common",
    role: "Support",
    stats: { hp: 90, atk: 20, def: 18 },
    passive: "Luck (slightly higher resource find chance).",
    image: CARD_GIF_URL
  },
  {
    id: "chad",
    name: "Yasutora Sado (Chad)",
    anime: "bleach",
    rarity: "Rare",
    role: "Tank",
    stats: { hp: 170, atk: 30, def: 35 },
    passive: "Super survivability.",
    evolvesTo: "chad_leg",
    image: CARD_GIF_URL
  },
  {
    id: "orihime",
    name: "Orihime Inoue",
    anime: "bleach",
    rarity: "Rare",
    role: "Support/Healer",
    stats: { hp: 110, atk: 18, def: 22 },
    passive: "Chance to heal (prevent death / reduce consequences).",
    image: CARD_GIF_URL
  },
  {
    id: "ichigo_leg",
    name: "Ichigo Kurosaki",
    anime: "bleach",
    rarity: "Legendary",
    role: "DPS",
    stats: { hp: 190, atk: 60, def: 28 },
    passive: "Strong carry for expeditions/raids.",
    evolvesTo: "ichigo_myth",
    image: CARD_GIF_URL
  },
  {
    id: "ichigo_myth",
    name: "Ichigo (Mythic)",
    anime: "bleach",
    rarity: "Mythic",
    role: "DPS",
    stats: { hp: 300, atk: 100, def: 45 },
    passive: "Very high success rate if prepared.",
    image: CARD_GIF_URL
  }
];

module.exports = { CARDS };
