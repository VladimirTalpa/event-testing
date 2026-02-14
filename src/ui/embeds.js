// src/ui/embeds.js
const { EmbedBuilder } = require("discord.js");
const {
  COLOR,
  E_REIATSU,
  E_CE,
  E_DRAKO,
  E_BLEACH,
  E_JJK,
} = require("../config");

const { CARD_FRAME_GIF } = require("./assets");

function base(title, description = "") {
  const e = new EmbedBuilder().setColor(COLOR).setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

/* ===================== PROFILE ===================== */

function profileHomeEmbed(user) {
  return base(
    "🏆 Profile",
    `User: **${user.username}**\n\nSelect a section below.`
  ).setThumbnail(user.displayAvatarURL({ size: 256 }));
}

function profileCurrencyEmbed(user, wallet) {
  const rei = wallet?.reiatsu ?? 0;
  const ce = wallet?.cursed_energy ?? 0;
  const dr = wallet?.drako ?? 0;

  return base("💰 Currency", `User: **${user.username}**`)
    .addFields(
      { name: `${E_REIATSU} Reiatsu`, value: `**${rei}**`, inline: true },
      { name: `${E_CE} Cursed Energy`, value: `**${ce}**`, inline: true },
      { name: `${E_DRAKO} Drako Coin`, value: `**${dr}**`, inline: true }
    )
    .setFooter({ text: "Tip: Use /dailyclaim to get daily Reiatsu (Bleach)" });
}

function profileCardsEmbed(user, cardsSummaryText) {
  return base("🃏 Cards", `User: **${user.username}**\n\n${cardsSummaryText || "No cards yet."}`)
    .setFooter({ text: "Cards can permanently die in expeditions." });
}

function profileGearsEmbed(user, gearsText) {
  return base("🛡 Gears", `User: **${user.username}**\n\n${gearsText || "No gear equipped."}`);
}

/**
 * Titles = Wardrobe: роли/титулы которые можно надеть/снять
 */
function profileTitlesEmbed(user, titlesText) {
  return base("🎖 Titles", `User: **${user.username}**\n\n${titlesText || "You don't own any titles yet."}`)
    .setFooter({ text: "Titles are wearable roles (cosmetic)." });
}

function profileLeaderboardEmbed(eventName, lbText) {
  return base(`📌 Leaderboard — ${eventName}`, lbText || "No data yet.");
}

/* ===================== STORE ===================== */

function storeHomeEmbed(user) {
  return base(
    "🛒 Store",
    `User: **${user.username}**\n\nSelect a section below.`
  ).setThumbnail(user.displayAvatarURL({ size: 256 }));
}

function storeEventShopEmbed(text) {
  return base("🎟 Event Shop", text || "No items available yet.");
}

function storePacksEmbed(text) {
  return base("🎁 Card Packs", text || "Choose a pack from the menu below.");
}

function storeGearShopEmbed(text) {
  return base("⚙ Gear Shop", text || "No gear items available yet.");
}

/* ===================== PACK OPEN / CARD VIEW ===================== */

function packOpeningEmbed(packName) {
  return base("✨ Opening Pack", `Pack: **${packName}**\n\nRevealing cards…`)
    .setImage(CARD_FRAME_GIF);
}

/**
 * Отображение одной карточки персонажа.
 * Пока нет дизайна — используем гифку как фон/рамку и выводим статы текстом.
 */
function cardRevealEmbed(card) {
  // card: { name, anime, rarity, role, level, stars, hp, atk, def, passive }
  const animeTag = card.anime === "bleach" ? `${E_BLEACH} Bleach` : `${E_JJK} JJK`;

  const e = base(
    `🃏 ${card.name}`,
    `${animeTag}\nRarity: **${card.rarity}**\nRole: **${card.role}**`
  )
    .addFields(
      { name: "Level", value: `**${card.level ?? 1}**`, inline: true },
      { name: "Stars", value: `**${card.stars ?? 0}⭐**`, inline: true },
      { name: " ", value: " ", inline: true },
      { name: "HP", value: `**${card.hp}**`, inline: true },
      { name: "ATK", value: `**${card.atk}**`, inline: true },
      { name: "DEF", value: `**${card.def}**`, inline: true }
    )
    .setImage(CARD_FRAME_GIF);

  if (card.passive) {
    e.addFields({ name: "Passive", value: card.passive });
  }

  return e;
}

module.exports = {
  profileHomeEmbed,
  profileCurrencyEmbed,
  profileCardsEmbed,
  profileGearsEmbed,
  profileTitlesEmbed,
  profileLeaderboardEmbed,

  storeHomeEmbed,
  storeEventShopEmbed,
  storePacksEmbed,
  storeGearShopEmbed,

  packOpeningEmbed,
  cardRevealEmbed,
};
