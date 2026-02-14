// src/ui/embeds.js

const { COLOR, E_REIATSU, E_CE, E_DRAKO, E_BLEACH, E_JJK, CARD_GIF_URL } = require('../config');
const { getCardDef } = require('../core/cards');

function walletEmbed(userTag, wallet) {
  return {
    color: COLOR,
    title: `💰 Wallet — ${userTag}`,
    description:
      `${E_REIATSU} **Reiatsu:** ${wallet.reiatsu}\n` +
      `${E_CE} **Cursed Energy:** ${wallet.cursed_energy}\n` +
      `${E_DRAKO} **Drako Coin:** ${wallet.drako}\n\n` +
      `🧩 **Bleach Shards:** ${wallet.bleach_shards}\n` +
      `🧩 **Cursed Shards:** ${wallet.cursed_shards}`,
    footer: { text: 'Use buttons below to navigate' },
  };
}

function cardsEmbed(userTag, cards) {
  const total = cards.length;
  const byRarity = { Common: 0, Rare: 0, Legendary: 0, Mythic: 0 };
  for (const c of cards) byRarity[c.rarity] = (byRarity[c.rarity] || 0) + 1;

  return {
    color: COLOR,
    title: `🃏 Cards — ${userTag}`,
    description:
      `**Total:** ${total}\n` +
      `Common: **${byRarity.Common}** • Rare: **${byRarity.Rare}** • Legendary: **${byRarity.Legendary}** • Mythic: **${byRarity.Mythic}**\n\n` +
      `Tip: Open packs in **/store → Card Packs**.`,
    image: { url: CARD_GIF_URL },
    footer: { text: 'Card preview uses the temporary GIF for now' },
  };
}

function gearsEmbed(userTag, gears) {
  const weaponCount = gears.filter((g) => g.type === 'weapon').length;
  const armorCount = gears.filter((g) => g.type === 'armor').length;
  return {
    color: COLOR,
    title: `🛡 Gears — ${userTag}`,
    description:
      `Weapons: **${weaponCount}**\n` +
      `Armors: **${armorCount}**\n\n` +
      `Coming: equip/unequip UI. For now, gears are stored and will be used in future updates.`,
    footer: { text: 'Forge will expand this later' },
  };
}

function titlesEmbed(userTag, titles, guild) {
  const ownedNames = titles.ownedRoleIds
    .slice(0, 10)
    .map((rid) => guild.roles.cache.get(rid)?.name || rid);

  const equippedName = titles.equippedRoleId
    ? guild.roles.cache.get(titles.equippedRoleId)?.name || titles.equippedRoleId
    : 'None';

  return {
    color: COLOR,
    title: `🏷 Titles — ${userTag}`,
    description:
      `This is your **wardrobe** (titles/roles you own).\n\n` +
      `**Equipped:** ${equippedName}\n\n` +
      `**Owned:** ${ownedNames.length ? ownedNames.join(', ') : 'None yet'}\n\n` +
      `Get more titles in **/store → Event Shop** or as **boss drops**.`,
    footer: { text: 'Select a title below to equip/unequip' },
  };
}

function storeEmbed(tab, event, wallet) {
  const header = event === 'bleach' ? `${E_BLEACH} Bleach` : `${E_JJK} JJK`;
  const currencyText = event === 'bleach' ? `${E_REIATSU} ${wallet.reiatsu}` : `${E_CE} ${wallet.cursed_energy}`;

  const titles = {
    event: `🧿 Event Shop — ${header}`,
    packs: `🎁 Card Packs — ${header}`,
    gear: `⚒ Gear Shop — ${header}`,
  };

  const bodies = {
    event:
      `Buy **titles/roles** and event items.\n` +
      `• Example: cosmetic role\n\n` +
      `Your currency: ${currencyText} • ${E_DRAKO} ${wallet.drako}`,
    packs:
      `Open packs to get cards.\n\n` +
      `• **Basic Pack**: mostly Common/Rare\n` +
      `• **Legendary Pack**: higher chance for Legendary/Mythic\n\n` +
      `Your currency: ${currencyText} • ${E_DRAKO} ${wallet.drako}`,
    gear:
      `Gear affects **ATK/HP** in future updates.\n` +
      `For now you can buy and keep gear.\n\n` +
      `Your currency: ${currencyText} • ${E_DRAKO} ${wallet.drako}`,
  };

  return {
    color: COLOR,
    title: titles[tab] || titles.event,
    description: bodies[tab] || bodies.event,
    footer: { text: 'Use buttons below — Close is always available' },
  };
}

function cardRevealEmbed(userTag, card) {
  return {
    color: COLOR,
    title: `🎴 New Card — ${userTag}`,
    description:
      `**${card.name}**\n` +
      `Anime: **${card.anime.toUpperCase()}**\n` +
      `Rarity: **${card.rarity}**\n` +
      `Role: **${card.role}**\n\n` +
      `HP: **${card.hp}** • ATK: **${card.atk}** • DEF: **${card.def}**\n\n` +
      `Passive: *${card.passive}*`,
    image: { url: card.art || CARD_GIF_URL },
  };
}

module.exports = {
  walletEmbed,
  cardsEmbed,
  gearsEmbed,
  titlesEmbed,
  storeEmbed,
  cardRevealEmbed,
};
