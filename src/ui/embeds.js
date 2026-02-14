const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const cfg = require("../config");
const { getPlayer } = require("../core/players");
const { CARDS, CARD_BY_ID } = require("../data/cards");

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
  // 8% per star
  const m = 1 + (stars * 0.08);
  return m;
}

function calcFinalStats(cardBase, stars) {
  const m = calcStarBonus(stars);
  return {
    hp: Math.floor(cardBase.hp * m),
    atk: Math.floor(cardBase.atk * m),
    def: Math.floor(cardBase.def * m),
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
      .setDescription("Gear Shop будет расширен в **части 3/3**.\nПока: пакеты + карточки + shards экономика.");
  }

  // event
  return new EmbedBuilder()
    .setColor(color())
    .setTitle("🛒 Store — Event Shop")
    .setDescription(
      "Event Shop (старый магазин) можно держать отдельно.\nДля новой системы используй **Card Packs**.\n\nОткрой: **/store → Card Packs**"
    );
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
          ? `You own **${owned.length}** cards.\nSelect a card below to view details.\n\n⚠️ If a card dies in expeditions — it will be deleted forever.`
          : "You have **0** cards.\nBuy packs in **/store → Card Packs**."
      );

    // attach select menu here via components from caller? (мы делаем это тут же)
    // Но slash handler уже ставит только nav row.
    // Поэтому: просто embed. Меню карточек добавим в ЧАСТИ 3 через buttons/refresh,
    // а тут — покажем краткий список первых 10.
    const preview = owned.slice(0, 10).map((ci) => {
      const c = CARD_BY_ID.get(ci.cardId);
      if (!c) return `• Unknown (${ci.cardId})`;
      return `• ${rarityEmoji(c.rarity)} **${c.name}** — Lv.${ci.level} ⭐${ci.stars}`;
    });

    if (preview.length) embed.addFields({ name: "Cards (preview)", value: preview.join("\n") });

    // ВАЖНО: если есть карты, мы добавим select menu прямо отсюда, но caller должен его забрать
    // => сделаем хак: прикрепим в embed footer подсказку (а меню будет в handlers/buttons при нажатии “Cards” в части 3).
    embed.setFooter({ text: "Tip: Use the card select menu (will appear after refresh). If not — click Cards again." });

    return embed;
  }

  if (section === "gears") {
    const count = (p.gears || []).length;
    return new EmbedBuilder()
      .setColor(color())
      .setTitle("🛡 Profile — Gears")
      .setDescription(count ? `You have **${count}** gear items.` : "You have **0** gear items.")
      .setFooter({ text: "Gear craft/equip будет в части 3/3." });
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
      .setDescription("Leaderboard открой через **/leaderboard** (Bleach/JJK).");
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
    embed.addFields({ name: "Evolution", value: `✅ Can evolve → **${card.evolvesTo}** (Forge in part 3/3)` });
  }

  return { ok: true, embed };
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

module.exports = {
  renderStore,
  renderProfile,
  renderCardInstanceEmbed,
  buildCardsSelectMenu,
};
