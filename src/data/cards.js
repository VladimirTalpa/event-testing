// src/data/cards.js
const CARDS = {
  jjk: [
    { id: "miwa", name: "Kasumi Miwa", rarity: "Common", role: "Support", hp: 95, atk: 22, def: 18 },
    { id: "momo", name: "Momo Nishimiya", rarity: "Common", role: "Support", hp: 85, atk: 20, def: 16 },
    { id: "mai", name: "Mai Zenin", rarity: "Common", role: "DPS", hp: 80, atk: 28, def: 14 },
    { id: "todo", name: "Aoi Todo", rarity: "Rare", role: "Tank", hp: 140, atk: 30, def: 32 },
    { id: "panda", name: "Panda", rarity: "Rare", role: "Tank", hp: 130, atk: 27, def: 30 },
    { id: "toji", name: "Toji Fushiguro", rarity: "Legendary", role: "DPS", hp: 160, atk: 55, def: 28 },
    { id: "toji_m", name: "Toji (Mythic)", rarity: "Mythic", role: "DPS", hp: 260, atk: 95, def: 45 }
  ],
  bleach: [
    { id: "ikkaku", name: "Ikkaku Madarame", rarity: "Common", role: "Tank", hp: 120, atk: 24, def: 24 },
    { id: "hisagi", name: "Shuuhei Hisagi", rarity: "Common", role: "DPS", hp: 95, atk: 30, def: 16 },
    { id: "ganju", name: "Ganju Shiba", rarity: "Common", role: "Support", hp: 90, atk: 20, def: 18 },
    { id: "chad", name: "Yasutora Sado (Chad)", rarity: "Rare", role: "Tank", hp: 170, atk: 30, def: 35 },
    { id: "orihime", name: "Orihime Inoue", rarity: "Rare", role: "Support/Healer", hp: 110, atk: 18, def: 22 },
    { id: "ichigo", name: "Ichigo Kurosaki", rarity: "Legendary", role: "DPS", hp: 190, atk: 60, def: 28 },
    { id: "ichigo_m", name: "Ichigo (Mythic)", rarity: "Mythic", role: "DPS", hp: 300, atk: 100, def: 45 }
  ]
};

module.exports = { CARDS };
