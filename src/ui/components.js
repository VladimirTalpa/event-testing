// src/ui/components.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');

function closeRow(customId = 'ui:close') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(customId).setLabel('Close').setStyle(ButtonStyle.Secondary)
  );
}

function bossRow({ canJoin = true, canHit = true, canNext = false, canEnd = false } = {}) {
  const row = new ActionRowBuilder();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('boss:join')
      .setLabel('Join')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!canJoin),
    new ButtonBuilder()
      .setCustomId('boss:hit')
      .setLabel('Hit')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!canHit),
    new ButtonBuilder()
      .setCustomId('boss:next')
      .setLabel('Next Round')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!canNext),
    new ButtonBuilder()
      .setCustomId('boss:end')
      .setLabel('End')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!canEnd)
  );
  return row;
}

function mobRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mob:hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('mob:end').setLabel('End').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ui:close').setLabel('Close').setStyle(ButtonStyle.Secondary)
  );
}

function profileNavRow(view) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('profile:wallet').setLabel('Wallet').setStyle(ButtonStyle.Primary).setDisabled(view === 'wallet'),
    new ButtonBuilder().setCustomId('profile:cards').setLabel('Cards').setStyle(ButtonStyle.Primary).setDisabled(view === 'cards'),
    new ButtonBuilder().setCustomId('profile:gears').setLabel('Gears').setStyle(ButtonStyle.Primary).setDisabled(view === 'gears'),
    new ButtonBuilder().setCustomId('profile:titles').setLabel('Titles').setStyle(ButtonStyle.Primary).setDisabled(view === 'titles'),
    new ButtonBuilder().setCustomId('ui:close').setLabel('Close').setStyle(ButtonStyle.Secondary)
  );
  return row;
}

function storeNavRow(tab) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('store:event').setLabel('Event Shop').setStyle(ButtonStyle.Primary).setDisabled(tab === 'event'),
    new ButtonBuilder().setCustomId('store:packs').setLabel('Card Packs').setStyle(ButtonStyle.Primary).setDisabled(tab === 'packs'),
    new ButtonBuilder().setCustomId('store:gear').setLabel('Gear').setStyle(ButtonStyle.Primary).setDisabled(tab === 'gear'),
    new ButtonBuilder().setCustomId('ui:close').setLabel('Close').setStyle(ButtonStyle.Secondary)
  );
  return row;
}

function titlesSelect(ownedRoleIds, equippedRoleId) {
  const options = [
    { label: 'Unequip title', value: 'none', description: 'Remove equipped title/role' },
    ...ownedRoleIds.slice(0, 24).map((rid) => ({
      label: `Role: ${rid}`,
      value: rid,
      description: rid === equippedRoleId ? 'Currently equipped' : 'Equip this title',
    })),
  ];

  const menu = new StringSelectMenuBuilder()
    .setCustomId('titles:select')
    .setPlaceholder('Select a title/role')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(menu);
}

module.exports = {
  closeRow,
  bossRow,
  mobRow,
  profileNavRow,
  storeNavRow,
  titlesSelect,
};
