// src/ui/embeds.js
const { EmbedBuilder } = require("discord.js");
const {
  COLOR,
  E_BLEACH,
  E_JJK,
  E_REIATSU,
  E_CE,
  CARD_PLACEHOLDER_GIF,
  PACK_PRICE_BASIC,
  PACK_PRICE_LEGENDARY,
  STAR_STAT_BONUS,
} = require("../config");

function profileCurrencyEmbed(player) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("👤 Profile — Currency")
    .setDescription(
      [
        `🩸 **Bleach**`,
        `${E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**`,
        `🧩 Bleach Shards: **${player.bleach.shards}**`,
        "",
        `🟣 **JJK**`,
        `${E_CE} Cursed Energy: **${player.jjk.cursedEnergy}**`,
        `🧩 Cursed Shards: **${player.jjk.shards}**`,
        "",
        `🗝️ Expedition Keys (global): **${player.keys}**`,
      ].join("\n")
    )
    .setThumbnail(CARD_PLACEHOLDER_GIF);
}

function profileCardsEmbed(player) {
  const total = (player.cards || []).length;
  const bleach = (player.cards || []).filter((c) => c.anime === "bleach").length;
  const jjk = (player.cards || []).filter((c) => c.anime === "jjk").length;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🃏 Profile — Cards")
    .setDescription(
      [
        `Total cards: **${total}**`,
        `🩸 Bleach: **${bleach}**`,
        `🟣 JJK: **${jjk}**`,
        "",
        `Select a card below to view details.`,
      ].join("\n")
    )
    .setImage(CARD_PLACEHOLDER_GIF);
}

function cardDetailsEmbed(card, cardDefName = null) {
  const name = cardDefName || card.charKey;
  const tag = card.anime === "bleach" ? `${E_BLEACH} Bleach` : `${E_JJK} JJK`;

  const starMult = 1 + (card.stars * STAR_STAT_BONUS);
  const hp = Math.floor(card.base.hp * starMult);
  const atk = Math.floor(card.base.atk * starMult);
  const def = Math.floor(card.base.def * starMult);

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${tag} — ${name}`)
    .setDescription(
      [
        `**Rarity:** ${card.rarity}`,
        `**Role:** ${card.role}`,
        `**Level:** ${card.level}  •  **XP:** ${card.xp}`,
        `**Stars:** ⭐ ${card.stars} ( +${Math.round(card.stars * STAR_STAT_BONUS * 100)}% stats )`,
        `**Status:** ${card.status}`,
        "",
        `❤️ HP: **${hp}**`,
        `🗡 ATK: **${atk}**`,
        `🛡 DEF: **${def}**`,
      ].join("\n")
    )
    .setImage(CARD_PLACEHOLDER_GIF);
}

function profileGearsEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🛡 Profile — Gears")
    .setDescription("Gear system is coming in Part 3 update: Equip / Unequip / Who wears it.")
    .setImage(CARD_PLACEHOLDER_GIF);
}

function profileTitlesEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🏷 Profile — Titles")
    .setDescription("Titles are coming later (future update).")
    .setImage(CARD_PLACEHOLDER_GIF);
}

function profileLeaderboardEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🏆 Profile — Leaderboard")
    .setDescription("Leaderboard UI will be connected in Part 3 (based on currency + progression).")
    .setImage(CARD_PLACEHOLDER_GIF);
}

function storePacksEmbed(player) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🛒 Store — Card Packs")
    .setDescription(
      [
        `**Prices:**`,
        `🩸 Bleach Basic: **${PACK_PRICE_BASIC.bleach} ${E_REIATSU}**`,
        `🩸 Bleach Legendary: **${PACK_PRICE_LEGENDARY.bleach} ${E_REIATSU}**`,
        "",
        `🟣 JJK Basic: **${PACK_PRICE_BASIC.jjk} ${E_CE}**`,
        `🟣 JJK Legendary: **${PACK_PRICE_LEGENDARY.jjk} ${E_CE}**`,
        "",
        `Your balance:`,
        `🩸 ${E_REIATSU} **${player.bleach.reiatsu}**`,
        `🟣 ${E_CE} **${player.jjk.cursedEnergy}**`,
      ].join("\n")
    )
    .setImage(CARD_PLACEHOLDER_GIF);
}

function storeEventShopEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🛒 Store — Event Shop")
    .setDescription("Event Shop will be migrated later (old items → new system).")
    .setImage(CARD_PLACEHOLDER_GIF);
}

function storeGearShopEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🛒 Store — Gear Shop")
    .setDescription("Gear Shop goes live in Part 3 (crafting + buying).")
    .setImage(CARD_PLACEHOLDER_GIF);
}

function forgeCraftEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🔨 Forge — Craft")
    .setDescription("Crafting goes live in Part 3 (weapon + armor).")
    .setImage(CARD_PLACEHOLDER_GIF);
}

function forgeEvolveEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🔺 Forge — Evolve")
    .setDescription("Evolution goes live in Part 3 (Rare→Legendary, Legendary→Mythic).")
    .setImage(CARD_PLACEHOLDER_GIF);
}

function expeditionsEmbed(player) {
  const active = player.expeditions?.active;
  const status =
    !active
      ? "No active expedition."
      : `Status: **${active.status}**\nStart at: <t:${Math.floor(active.startAt / 1000)}:R>\nNext tick: <t:${Math.floor(active.nextTickAt / 1000)}:R>`;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🧭 Expeditions")
    .setDescription(
      [
        `Daily limit: **${player.expeditions.dailyUsed}/2**`,
        `Keys: **${player.keys}**`,
        "",
        status,
        "",
        `Start an expedition: pick faction → choose **3 heroes** → start.`,
      ].join("\n")
    )
    .setImage(CARD_PLACEHOLDER_GIF);
}

module.exports = {
  profileCurrencyEmbed,
  profileCardsEmbed,
  cardDetailsEmbed,
  profileGearsEmbed,
  profileTitlesEmbed,
  profileLeaderboardEmbed,

  storePacksEmbed,
  storeEventShopEmbed,
  storeGearShopEmbed,

  forgeCraftEmbed,
  forgeEvolveEmbed,

  expeditionsEmbed,
};
