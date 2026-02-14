// src/ui/embeds.js
const { EmbedBuilder } = require("discord.js");
const { COLOR, CARD_GIF_URL } = require("../config");

function baseEmbed(title, description) {
  const e = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(title)
    .setDescription(description);

  if (CARD_GIF_URL) e.setImage(CARD_GIF_URL);
  return e;
}

/** PROFILE **/
function profileHomeEmbed(user, snapshot) {
  const {
    money = 0,
    bleach = 0,
    jjk = 0,
    bleachShards = 0,
    cursedShards = 0,
    cards = 0,
    gears = 0,
    titles = 0,
  } = snapshot || {};

  return baseEmbed(
    `👤 Profile — ${user.username}`,
    [
      `**Wallet**`,
      `🪙 Money: **${money}**`,
      `🩸 Bleach Currency: **${bleach}**`,
      `🟣 JJK Currency: **${jjk}**`,
      ``,
      `**Shards**`,
      `🩸 Bleach Shards: **${bleachShards}**`,
      `🟣 Cursed Shards: **${cursedShards}**`,
      ``,
      `**Inventory**`,
      `🃏 Cards: **${cards}**`,
      `🛡️ Gears: **${gears}**`,
      `🏷️ Titles owned: **${titles}**`,
      ``,
      `Use buttons to navigate.`,
    ].join("\n")
  );
}

function profileCardsEmbed(user, cardsPreviewLines) {
  return baseEmbed(
    `🃏 Cards — ${user.username}`,
    cardsPreviewLines?.length
      ? cardsPreviewLines.join("\n")
      : `You don’t have cards yet.\nOpen packs in **Store → Card Packs**.`
  );
}

function profileGearsEmbed(user, gearsPreviewLines) {
  return baseEmbed(
    `🛡️ Gears — ${user.username}`,
    gearsPreviewLines?.length
      ? gearsPreviewLines.join("\n")
      : `You don’t have gear yet.\nCraft in **Forge** or buy in **Store → Gear Shop**.`
  );
}

function profileTitlesEmbed(user, titlesLines, equippedTitle) {
  return baseEmbed(
    `🏷️ Titles — ${user.username}`,
    [
      equippedTitle ? `**Equipped:** ${equippedTitle}` : `**Equipped:** *(none)*`,
      ``,
      titlesLines?.length ? titlesLines.join("\n") : `No titles yet.`,
      ``,
      `Tip: Titles are like roles/labels you can equip/unequip.`,
    ].join("\n")
  );
}

/** STORE **/
function storeHomeEmbed() {
  return baseEmbed(
    `📦 Store`,
    `Choose a category.\n\n- 🎁 Card Packs\n- 🛡️ Gear Shop\n- 🎟️ Event Shop`
  );
}

function storePacksEmbed() {
  return baseEmbed(
    `🎁 Card Packs`,
    [
      `**Basic Pack** — cheap, mostly Common/Rare.`,
      `**Legendary Pack** — expensive, higher шанс Legendary/Mythic.`,
      ``,
      `Open packs to get characters.`,
    ].join("\n")
  );
}

function storeGearEmbed() {
  return baseEmbed(
    `🛡️ Gear Shop`,
    [
      `Buy gear for your characters:`,
      `⚔ Weapon → +ATK`,
      `🛡 Armor → +HP`,
    ].join("\n")
  );
}

function storeEventEmbed() {
  return baseEmbed(
    `🎟️ Event Shop`,
    `Event-only items.\nTitles, shards, limited packs.`
  );
}

/** ECONOMY **/
function balanceEmbed(user, snapshot) {
  const { money = 0, bleach = 0, jjk = 0 } = snapshot || {};
  return baseEmbed(
    `💰 Balance — ${user.username}`,
    [
      `🪙 Money: **${money}**`,
      `🩸 Bleach Currency: **${bleach}**`,
      `🟣 JJK Currency: **${jjk}**`,
    ].join("\n")
  );
}

function dailyEmbed(user, amount, nextText) {
  return baseEmbed(
    `🎁 Daily — ${user.username}`,
    [
      `You claimed: **${amount}** 🪙`,
      nextText ? `Next claim: **${nextText}**` : ``,
    ].filter(Boolean).join("\n")
  );
}

module.exports = {
  // profile
  profileHomeEmbed,
  profileCardsEmbed,
  profileGearsEmbed,
  profileTitlesEmbed,

  // store
  storeHomeEmbed,
  storePacksEmbed,
  storeGearEmbed,
  storeEventEmbed,

  // economy
  balanceEmbed,
  dailyEmbed,
};
