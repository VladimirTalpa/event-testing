const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const cfg = require("../config");
const { getPlayer } = require("../core/players");
const { CARD_BY_ID } = require("../data/cards");

function color() {
  return cfg.COLOR || 0x8a2be2;
}

function rarityEmoji(r) {
  if (r === "Mythic") return "💠";
  if (r === "Legendary") return "🌟";
  if (r === "Rare") return "🟣";
  return "⚪";
}

function calcStarBonus(stars) {
  return 1 + stars * 0.08;
}

function calcFinalStats(base, stars) {
  const m = calcStarBonus(stars);
  return {
    hp: Math.floor(base.hp * m),
    atk: Math.floor(base.atk * m),
    def: Math.floor(base.def * m),
  };
}

async function renderStore(userId, section = "event") {
  const p = await getPlayer(userId);

  if (section === "packs") {
    return new EmbedBuilder()
      .setColor(color())
      .setTitle("📦 Store — Card Packs")
      .setDescription(
        [
          "Buy packs with event currency.",
          "",
          `**Basic Pack**`,
          `• Bleach: **${cfg.PACK_BASIC_PRICE_BLEACH} Reiatsu**`,
          `• JJK: **${cfg.PACK_BASIC_PRICE_JJK} Cursed Energy**`,
          "",
          `**Legendary Pack**`,
          `• Bleach: **${cfg.PACK_LEGENDARY_PRICE_BLEACH} Reiatsu**`,
          `• JJK: **${cfg.PACK_LEGENDARY_PRICE_JJK} Cursed Energy**`,
          "",
          `Inventory: **Basic ${p.packs.basic}**, **Legendary ${p.packs.legendary}**`,
        ].join("\n")
      );
  }

  if (section === "gear") {
    return new EmbedBuilder()
      .setColor(color())
      .setTitle("🛡 Store — Gear Shop")
      .setDescription("Gear Shop: craft in **/forge** and equip in **/profile → Gears**.");
  }

  return new EmbedBuilder()
    .setColor(color())
    .setTitle("🛒 Store — Event Shop")
    .setDescription("Use **Card Packs** for the new system.\nOpen: **/store → Card Packs**");
}

function buildCardsSelectMenu(player) {
  const owned = player.cards || [];
  const options = owned.slice(0, 25).map((ci) => {
    const c = CARD_BY_ID.get(ci.cardId);
    return {
      label: c ? `${c.name} (Lv.${ci.level} ⭐${ci.stars})` : `Unknown (${ci.cardId})`,
      value: ci.instanceId,
      description: c ? `${c.rarity} • ${c.role}` : "Unknown",
    };
  });

  if (!options.length) return null;

  const menu = new StringSelectMenuBuilder()
    .setCustomId("profile:cards:select")
    .setPlaceholder("Select a card…")
    .addOptions(options);

  return new ActionRowBuilder().addComponents(menu);
}

function buildGearRows(player) {
  const gears = player.gears || [];
  // кнопки: craft weapon / craft armor
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("gear:craft:weapon").setLabel("Craft Weapon (+ATK)").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("gear:craft:armor").setLabel("Craft Armor (+HP)").setStyle(ButtonStyle.Success),
  );

  // equip/unequip открываем через отдельный экран: выбрать карту → выбрать gear
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("gear:assign:start").setLabel("Equip / Unequip").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("gear:list").setLabel(`List (${gears.length})`).setStyle(ButtonStyle.Secondary),
  );

  return [row1, row2];
}

async function renderProfile(userId, section = "currency") {
  const p = await getPlayer(userId);

  if (section === "currency") {
    return new EmbedBuilder()
      .setColor(color())
      .setTitle("🏆 Profile — Currency")
      .addFields(
        { name: "Reiatsu (Bleach)", value: `${p.bleach.reiatsu}`, inline: true },
        { name: "Cursed Energy (JJK)", value: `${p.jjk.cursedEnergy}`, inline: true },
        { name: "Drako Coin", value: `${p.drako}`, inline: true },
        { name: "Bleach Shards", value: `${p.shards.bleach}`, inline: true },
        { name: "Cursed Shards", value: `${p.shards.jjk}`, inline: true },
      );
  }

  if (section === "cards") {
    const owned = p.cards || [];
    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle("🃏 Profile — Cards")
      .setDescription(
        owned.length
          ? `You own **${owned.length}** cards.\nSelect one from the menu below.`
          : "You have **0** cards.\nBuy packs in **/store → Card Packs**."
      );

    if (owned.length) {
      const preview = owned.slice(0, 10).map((ci) => {
        const c = CARD_BY_ID.get(ci.cardId);
        if (!c) return `• Unknown (${ci.cardId})`;
        return `• ${rarityEmoji(c.rarity)} **${c.name}** — Lv.${ci.level} ⭐${ci.stars} — ${ci.dead ? "💀 dead" : ci.status}`;
      });
      embed.addFields({ name: "Preview", value: preview.join("\n") });
    }

    return embed;
  }

  if (section === "gears") {
    const count = (p.gears || []).length;
    return new EmbedBuilder()
      .setColor(color())
      .setTitle("🛡 Profile — Gears")
      .setDescription(
        [
          `You have **${count}** gear items.`,
          "",
          "• Weapon = +ATK",
          "• Armor = +HP",
          "",
          "Equip/Unequip via buttons below.",
        ].join("\n")
      );
  }

  if (section === "titles") {
    const titles = p.titles || [];
    return new EmbedBuilder()
      .setColor(color())
      .setTitle("🏷 Profile — Titles")
      .setDescription(titles.length ? titles.map((t) => `• ${t}`).join("\n") : "No titles yet.");
  }

  if (section === "leaderboard") {
    return new EmbedBuilder()
      .setColor(color())
      .setTitle("📊 Profile — Leaderboard")
      .setDescription("Open via **/leaderboard** (bleach/jjk).");
  }

  return new EmbedBuilder().setColor(color()).setTitle("Profile").setDescription("Unknown section.");
}

async function renderCardInstanceEmbed(userId, instanceId) {
  const p = await getPlayer(userId);
  const inst = (p.cards || []).find((x) => x.instanceId === instanceId);
  if (!inst) return { ok: false, error: "Card not found." };

  const card = CARD_BY_ID.get(inst.cardId);
  if (!card) return { ok: false, error: "Card base not found." };

  const final = calcFinalStats(card.base, inst.stars);

  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle(`${rarityEmoji(card.rarity)} ${card.name}`)
    .setDescription(
      [
        `**Anime:** ${card.anime.toUpperCase()}`,
        `**Rarity:** ${card.rarity}`,
        `**Role:** ${card.role}`,
        `**Level:** ${inst.level}   **XP:** ${inst.xp}`,
        `**Stars:** ⭐ ${inst.stars} (+8% stats each)`,
        `**Status:** ${inst.dead ? "💀 dead" : inst.status}`,
        "",
        `**HP:** ${final.hp}`,
        `**ATK:** ${final.atk}`,
        `**DEF:** ${final.def}`,
        "",
        `**Passive:** ${card.passive}`,
      ].join("\n")
    )
    .setImage(card.art);

  if (card.evolvesTo) {
    embed.addFields({ name: "Evolution", value: `✅ Can evolve → **${card.evolvesTo}** (use /forge evolve)` });
  }

  return { ok: true, embed };
}

module.exports = {
  renderStore,
  renderProfile,
  renderCardInstanceEmbed,
  buildCardsSelectMenu,
  buildGearRows,
};
