const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const cfg = require("../config");
const { getPlayer, setPlayer } = require("../core/players");
const { CARDS } = require("../data/cards");

function color() {
  return cfg.COLOR || 0x8a2be2;
}

function randomId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function pickWeighted(table) {
  const total = table.reduce((a, x) => a + x.w, 0);
  let r = Math.random() * total;
  for (const x of table) {
    r -= x.w;
    if (r <= 0) return x.v;
  }
  return table[table.length - 1].v;
}

function getAnimePool(event) {
  // event is bleach or jjk
  return CARDS.filter((c) => c.anime === event);
}

function rollRarity(packType) {
  // basic: common-heavy
  // legendary: guaranteed legendary (small mythic chance)
  if (packType === "basic") {
    return pickWeighted([
      { v: "Common", w: 78 },
      { v: "Rare", w: 20 },
      { v: "Legendary", w: 2 },
    ]);
  }

  // legendary pack
  return pickWeighted([
    { v: "Legendary", w: 92 },
    { v: "Mythic", w: 8 },
  ]);
}

function rollCard(event, packType) {
  const pool = getAnimePool(event);
  const rarity = rollRarity(packType);

  const candidates = pool.filter((c) => c.rarity === rarity);
  const chosen = candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : pool[Math.floor(Math.random() * pool.length)];

  return chosen;
}

function makeCardInstance(cardId) {
  return {
    instanceId: randomId(),
    cardId,
    level: 1,
    xp: 0,
    stars: 0,
    dead: false,
    status: "idle",
    weaponGearId: null,
    armorGearId: null,
  };
}

async function buyPack(userId, type, event) {
  if (!["basic", "legendary"].includes(type)) return { ok: false, error: "Unknown pack type." };
  if (!["bleach", "jjk"].includes(event)) return { ok: false, error: "Unknown event." };

  const p = await getPlayer(userId);

  if (type === "basic") {
    if (event === "bleach") {
      const cost = cfg.PACK_BASIC_PRICE_BLEACH;
      if (p.bleach.reiatsu < cost) return { ok: false, error: `Need ${cost} Reiatsu.` };
      p.bleach.reiatsu -= cost;
    } else {
      const cost = cfg.PACK_BASIC_PRICE_JJK;
      if (p.jjk.cursedEnergy < cost) return { ok: false, error: `Need ${cost} Cursed Energy.` };
      p.jjk.cursedEnergy -= cost;
    }
    p.packs.basic += 1;
  } else {
    if (event === "bleach") {
      const cost = cfg.PACK_LEGENDARY_PRICE_BLEACH;
      if (p.bleach.reiatsu < cost) return { ok: false, error: `Need ${cost} Reiatsu.` };
      p.bleach.reiatsu -= cost;
    } else {
      const cost = cfg.PACK_LEGENDARY_PRICE_JJK;
      if (p.jjk.cursedEnergy < cost) return { ok: false, error: `Need ${cost} Cursed Energy.` };
      p.jjk.cursedEnergy -= cost;
    }
    p.packs.legendary += 1;
  }

  await setPlayer(userId, p);
  return { ok: true };
}

async function openPack(userId, type) {
  if (!["basic", "legendary"].includes(type)) return { ok: false, error: "Unknown pack type." };

  const p = await getPlayer(userId);

  if (type === "basic" && p.packs.basic <= 0) return { ok: false, error: "You have 0 Basic packs." };
  if (type === "legendary" && p.packs.legendary <= 0) return { ok: false, error: "You have 0 Legendary packs." };

  // consume pack
  if (type === "basic") p.packs.basic -= 1;
  else p.packs.legendary -= 1;

  // choose which anime pack belongs to:
  // мы делаем так: basic/legendary при открытии спрашивать не будем,
  // просто случайно выбираем event по шансам 50/50
  const event = Math.random() < 0.5 ? "bleach" : "jjk";

  const card = rollCard(event, type);
  const inst = makeCardInstance(card.id);

  // add to collection
  p.cards.push(inst);

  // shards reward for duplicates is later; пока просто даём shards небольшие за открытие
  if (event === "bleach") p.shards.bleach += type === "legendary" ? 8 : 3;
  else p.shards.jjk += type === "legendary" ? 8 : 3;

  await setPlayer(userId, p);

  // reveal embed
  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle(`🎁 Pack Opened — ${type.toUpperCase()}`)
    .setDescription(
      [
        `**Pulled:** ${card.name}`,
        `**Anime:** ${card.anime.toUpperCase()}`,
        `**Rarity:** ${card.rarity}`,
        `**Role:** ${card.role}`,
        "",
        `**HP:** ${card.base.hp}  •  **ATK:** ${card.base.atk}  •  **DEF:** ${card.base.def}`,
        "",
        `**Passive:** ${card.passive}`,
      ].join("\n")
    )
    .setImage(card.art)
    .setFooter({ text: `Instance ID: ${inst.instanceId}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`card:view:${inst.instanceId}`)
      .setLabel("View Card")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("profile:nav:cards")
      .setLabel("Go to Profile → Cards")
      .setStyle(ButtonStyle.Secondary),
  );

  return { ok: true, embeds: [embed], components: [row] };
}

module.exports = {
  buyPack,
  openPack,
};
