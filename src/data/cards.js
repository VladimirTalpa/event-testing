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
    { id: "bl_rukia", name: "Rukia Kuchiki", rarity: "Rare", dmg: 410, def: 300, hp: 2200 },
    { id: "bl_renji", name: "Renji Abarai", rarity: "Common", dmg: 290, def: 220, hp: 1650 },
    { id: "bl_toshiro", name: "Toshiro Hitsugaya", rarity: "Rare", dmg: 430, def: 320, hp: 2300 },
    { id: "bl_yamamoto", name: "Genryusai Yamamoto", rarity: "Legendary", dmg: 820, def: 500, hp: 3600 },
    { id: "bl_orihime", name: "Orihime Inoue", rarity: "Common", dmg: 240, def: 340, hp: 1700 },
    { id: "bl_urahara", name: "Kisuke Urahara", rarity: "Epic", dmg: 640, def: 360, hp: 2860 },
    { id: "bl_shunsui", name: "Shunsui Kyoraku", rarity: "Legendary", dmg: 790, def: 470, hp: 3520 },
    { id: "bl_gin", name: "Gin Ichimaru", rarity: "Epic", dmg: 630, def: 330, hp: 2700 },
    { id: "bl_harribel", name: "Tier Harribel", rarity: "Rare", dmg: 470, def: 320, hp: 2420 },
    { id: "bl_mayuri", name: "Mayuri Kurotsuchi", rarity: "Epic", dmg: 620, def: 360, hp: 2820 },
    { id: "bl_unohana", name: "Retsu Unohana", rarity: "Legendary", dmg: 780, def: 500, hp: 3550 },
    { id: "bl_shinji", name: "Shinji Hirako", rarity: "Rare", dmg: 440, def: 310, hp: 2320 },
    { id: "bl_komamura", name: "Sajin Komamura", rarity: "Rare", dmg: 430, def: 340, hp: 2400 },
    { id: "bl_soifon", name: "Soi Fon", rarity: "Rare", dmg: 460, def: 300, hp: 2240 },
    { id: "bl_nnoitra", name: "Nnoitra Gilga", rarity: "Epic", dmg: 650, def: 320, hp: 2920 },
    { id: "bl_starrk", name: "Coyote Starrk", rarity: "Legendary", dmg: 810, def: 450, hp: 3460 },
    { id: "bl_barragan", name: "Baraggan Louisenbairn", rarity: "Legendary", dmg: 830, def: 470, hp: 3580 },
    { id: "bl_nelliel", name: "Nelliel Tu Odelschwanck", rarity: "Epic", dmg: 610, def: 350, hp: 2810 },
    { id: "bl_isshin", name: "Isshin Kurosaki", rarity: "Epic", dmg: 600, def: 340, hp: 2760 },
    { id: "bl_hitsugaya_bankai", name: "Toshiro (Bankai)", rarity: "Legendary", dmg: 770, def: 460, hp: 3420 },
    { id: "bl_ukitake", name: "Jushiro Ukitake", rarity: "Rare", dmg: 420, def: 330, hp: 2360 },
    { id: "bl_asnodt", name: "As Nodt", rarity: "Epic", dmg: 660, def: 340, hp: 2870 },
    { id: "bl_yhwach", name: "Yhwach", rarity: "Mythic", dmg: 1040, def: 590, hp: 4250 },
    { id: "bl_ichibei", name: "Ichibe Hyosube", rarity: "Legendary", dmg: 860, def: 500, hp: 3690 },
    { id: "bl_hisagi", name: "Shuhei Hisagi", rarity: "Common", dmg: 300, def: 240, hp: 1790 },
    { id: "bl_ikkaku", name: "Ikkaku Madarame", rarity: "Common", dmg: 310, def: 230, hp: 1760 },
    { id: "bl_uryu_vollstandig", name: "Uryu (Vollstandig)", rarity: "Legendary", dmg: 780, def: 440, hp: 3340 },
    { id: "bl_ryuken", name: "Ryuken Ishida", rarity: "Rare", dmg: 440, def: 300, hp: 2310 },
    { id: "bl_white_ichigo", name: "White Ichigo", rarity: "Legendary", dmg: 820, def: 430, hp: 3360 },
    { id: "bl_hollow_ichigo", name: "Hollow Ichigo", rarity: "Mythic", dmg: 990, def: 550, hp: 4120 },
    { id: "bl_jugram", name: "Jugram Haschwalth", rarity: "Legendary", dmg: 840, def: 470, hp: 3520 },
    { id: "bl_bambietta", name: "Bambietta Basterbine", rarity: "Epic", dmg: 680, def: 330, hp: 2790 },
    { id: "bl_candice", name: "Candice Catnipp", rarity: "Epic", dmg: 670, def: 320, hp: 2740 },
    { id: "bl_gremmy", name: "Gremmy Thoumeaux", rarity: "Mythic", dmg: 1010, def: 560, hp: 4190 },
    { id: "bl_askin", name: "Askin Nakk Le Vaar", rarity: "Legendary", dmg: 800, def: 460, hp: 3450 },
    { id: "bl_lille", name: "Lille Barro", rarity: "Legendary", dmg: 850, def: 450, hp: 3480 },
    { id: "bl_pernida", name: "Pernida Parnkgjas", rarity: "Legendary", dmg: 790, def: 490, hp: 3590 },
    { id: "bl_kisuke_bankai", name: "Urahara (Bankai)", rarity: "Mythic", dmg: 960, def: 540, hp: 4050 },
    { id: "bl_unohana_kenpachi", name: "Unohana (Kenpachi)", rarity: "Mythic", dmg: 980, def: 560, hp: 4140 },
    { id: "bl_komamura_human", name: "Komamura (Human)", rarity: "Epic", dmg: 650, def: 370, hp: 2950 },
    { id: "bl_mask_de_masculine", name: "Mask De Masculine", rarity: "Epic", dmg: 640, def: 340, hp: 2890 },
    { id: "bl_bazzb", name: "Bazz-B", rarity: "Epic", dmg: 660, def: 330, hp: 2860 },
    { id: "bl_giselle", name: "Giselle Gewelle", rarity: "Rare", dmg: 420, def: 310, hp: 2340 },
    { id: "bl_cirucci", name: "Cirucci Sanderwicci", rarity: "Rare", dmg: 410, def: 300, hp: 2290 },
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
    { id: "jjk_Gojo_Dimensoon", name: "Gojo (Domain)", rarity: "Mythic", dmg: 1020, def: 580, hp: 4200 },
    { id: "jjk_geto", name: "Suguru Geto", rarity: "Legendary", dmg: 810, def: 430, hp: 3330 },
    { id: "jjk_toji", name: "Toji Fushiguro", rarity: "Epic", dmg: 700, def: 320, hp: 2780 },
    { id: "jjk_mahoraga", name: "Mahoraga", rarity: "Mythic", dmg: 980, def: 560, hp: 4100 },
    { id: "jjk_choso", name: "Choso", rarity: "Rare", dmg: 470, def: 300, hp: 2400 },
    { id: "jjk_inumaki", name: "Toge Inumaki", rarity: "Common", dmg: 300, def: 240, hp: 1820 },
    { id: "jjk_panda", name: "Panda", rarity: "Common", dmg: 310, def: 260, hp: 1880 },
    { id: "jjk_meimei", name: "Mei Mei", rarity: "Rare", dmg: 450, def: 310, hp: 2340 },
    { id: "jjk_hakari", name: "Kinji Hakari", rarity: "Legendary", dmg: 820, def: 460, hp: 3500 },
    { id: "jjk_kashimo", name: "Hajime Kashimo", rarity: "Legendary", dmg: 840, def: 430, hp: 3410 },
    { id: "jjk_higuruma", name: "Hiromi Higuruma", rarity: "Epic", dmg: 620, def: 360, hp: 2860 },
    { id: "jjk_jogo", name: "Jogo", rarity: "Epic", dmg: 690, def: 330, hp: 2720 },
    { id: "jjk_hanami", name: "Hanami", rarity: "Epic", dmg: 600, def: 390, hp: 2980 },
    { id: "jjk_dagon", name: "Dagon", rarity: "Rare", dmg: 460, def: 320, hp: 2420 },
    { id: "jjk_mahito", name: "Mahito", rarity: "Legendary", dmg: 800, def: 440, hp: 3360 },
    { id: "jjk_uraume", name: "Uraume", rarity: "Epic", dmg: 650, def: 350, hp: 2840 },
    { id: "jjk_miguel", name: "Miguel", rarity: "Rare", dmg: 430, def: 320, hp: 2330 },
    { id: "jjk_yorozu", name: "Yorozu", rarity: "Legendary", dmg: 810, def: 450, hp: 3440 },
    { id: "jjk_rika", name: "Rika", rarity: "Mythic", dmg: 1000, def: 570, hp: 4180 },
    { id: "jjk_agito", name: "Agito", rarity: "Epic", dmg: 640, def: 370, hp: 2910 },
    { id: "jjk_kusakabe", name: "Atsuya Kusakabe", rarity: "Common", dmg: 280, def: 250, hp: 1800 },
    { id: "jjk_shoko", name: "Shoko Ieiri", rarity: "Common", dmg: 250, def: 280, hp: 1840 },
    { id: "jjk_mai", name: "Mai Zenin", rarity: "Common", dmg: 290, def: 230, hp: 1720 },
    { id: "jjk_naobito", name: "Naobito Zenin", rarity: "Rare", dmg: 460, def: 320, hp: 2380 },
    { id: "jjk_nanami_overtime", name: "Nanami (Overtime)", rarity: "Epic", dmg: 680, def: 350, hp: 2870 },
    { id: "jjk_yuji_bf", name: "Yuji (Black Flash)", rarity: "Legendary", dmg: 800, def: 420, hp: 3300 },
    { id: "jjk_megumi_domain", name: "Megumi (Domain)", rarity: "Epic", dmg: 640, def: 360, hp: 2890 },
    { id: "jjk_nobara_resonance", name: "Nobara (Resonance)", rarity: "Rare", dmg: 480, def: 290, hp: 2320 },
    { id: "jjk_ino", name: "Takuma Ino", rarity: "Common", dmg: 300, def: 240, hp: 1780 },
    { id: "jjk_angel", name: "Angel", rarity: "Legendary", dmg: 790, def: 460, hp: 3380 },
    { id: "jjk_kenjaku", name: "Kenjaku", rarity: "Mythic", dmg: 990, def: 560, hp: 4170 },
    { id: "jjk_naoya", name: "Naoya Zenin", rarity: "Epic", dmg: 630, def: 330, hp: 2800 },
    { id: "jjk_tengen", name: "Master Tengen", rarity: "Rare", dmg: 380, def: 360, hp: 2460 },
    { id: "jjk_reggie", name: "Reggie Star", rarity: "Rare", dmg: 440, def: 300, hp: 2310 },
    { id: "jjk_ishigori", name: "Ryu Ishigori", rarity: "Epic", dmg: 700, def: 340, hp: 2880 },
    { id: "jjk_uro", name: "Takako Uro", rarity: "Epic", dmg: 660, def: 350, hp: 2860 },
    { id: "jjk_kurourushi", name: "Kurourushi", rarity: "Rare", dmg: 450, def: 310, hp: 2370 },
    { id: "jjk_hana", name: "Hana Kurusu", rarity: "Common", dmg: 270, def: 250, hp: 1810 },
    { id: "jjk_jinichi", name: "Jinichi Zenin", rarity: "Rare", dmg: 420, def: 320, hp: 2350 },
    { id: "jjk_esobrothers", name: "Eso & Kechizu", rarity: "Epic", dmg: 620, def: 350, hp: 2900 },
    { id: "jjk_sukuna_true", name: "Sukuna (True Form)", rarity: "Mythic", dmg: 1060, def: 570, hp: 4270 },
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
  Mythic: "#ff004c",
  common: "#c8d0e0",
  rare: "#53ccff",
  epic: "#be6cff",
  legendary: "#ffb347",
  mythic: "#ff004c",
};

const CARD_MAX_LEVEL = 50;
const RARITY_BALANCE = {
  Common: { baseScale: 1.06, dmgGrowth: 0.128, defGrowth: 0.118, hpGrowth: 0.162 },
  Rare: { baseScale: 1.03, dmgGrowth: 0.121, defGrowth: 0.111, hpGrowth: 0.153 },
  Epic: { baseScale: 1.0, dmgGrowth: 0.114, defGrowth: 0.104, hpGrowth: 0.145 },
  Legendary: { baseScale: 0.97, dmgGrowth: 0.107, defGrowth: 0.098, hpGrowth: 0.136 },
  Mythic: { baseScale: 0.95, dmgGrowth: 0.102, defGrowth: 0.094, hpGrowth: 0.131 },
};

const FUSION_RECIPES = {
  bleach: [
    { duoId: "duo_bl_ichigo_rukia", name: "Ichigo x Rukia", a: "bl_ichigo", b: "bl_rukia", rarity: "Legendary" },
    { duoId: "duo_bl_aizen_ulquiorra", name: "Aizen x Ulquiorra", a: "bl_aizen", b: "bl_ulquiorra", rarity: "Mythic" },
  ],
  jjk: [
    { duoId: "duo_jjk_itadori_todo", name: "Itadori x Todo", a: "jjk_yuji", b: "jjk_todo", rarity: "Legendary" },
    { duoId: "duo_jjk_gojo_nanami", name: "Gojo x Nanami", a: "jjk_gojo", b: "jjk_nanami", rarity: "Mythic" },
    { duoId: "duo_jjk_sukuna_megumi", name: "Sukuna x Megumi", a: "jjk_sukuna", b: "jjk_megumi", rarity: "Mythic" },
    { duoId: "duo_jjk_gojo_geto", name: "Gojo x Geto", a: "jjk_gojo", b: "jjk_geto", rarity: "Mythic" },
    { duoId: "duo_jjk_sukuna_mahoraga", name: "Sukuna x Mahoraga", a: "jjk_sukuna", b: "jjk_mahoraga", rarity: "Mythic" },
  ],
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

function getFusionRecipesForEvent(eventKey) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  return FUSION_RECIPES[ek] || [];
}

function findFusionRecipe(eventKey, cardAId, cardBId) {
  const recipes = getFusionRecipesForEvent(eventKey);
  const a = String(cardAId || "");
  const b = String(cardBId || "");
  return (
    recipes.find((r) => {
      const set = new Set([String(r.a), String(r.b)]);
      return set.has(a) && set.has(b);
    }) || null
  );
}

function getDuoCardFromRecipe(eventKey, recipe) {
  if (!recipe) return null;
  const a = getCardById(eventKey, recipe.a);
  const b = getCardById(eventKey, recipe.b);
  if (!a || !b) return null;

  // Fair duo baseline: stronger than each parent, but not equal to raw sum.
  const dmg = Math.max(1, Math.floor((Number(a.dmg || 0) + Number(b.dmg || 0)) * 0.56));
  const def = Math.max(1, Math.floor((Number(a.def || 0) + Number(b.def || 0)) * 0.56));
  const hp = Math.max(1, Math.floor((Number(a.hp || 0) + Number(b.hp || 0)) * 0.56));

  return {
    id: String(recipe.duoId),
    name: String(recipe.name || recipe.duoId),
    rarity: normalizeRarityName(recipe.rarity || "Legendary"),
    dmg,
    def,
    hp,
    isDuo: true,
    parentA: a.id,
    parentB: b.id,
  };
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
  FUSION_RECIPES,
  getFusionRecipesForEvent,
  findFusionRecipe,
  getDuoCardFromRecipe,
};
