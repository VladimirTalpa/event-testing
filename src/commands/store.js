const { SlashCommandBuilder } = require('discord.js');
const { mutate, getUser } = require('../core/db');
const { storeEmbed } = require('../ui/embeds');
const { storeNavRow } = require('../ui/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('store')
    .setDescription('Open store')
    .addStringOption((o) =>
      o.setName('event').setDescription('Faction context').setRequired(true).addChoices(
        { name: 'Bleach', value: 'bleach' },
        { name: 'JJK', value: 'jjk' },
      )
    ),

  async execute(interaction) {
    const event = interaction.options.getString('event');

    const payload = mutate((db) => {
      const u = getUser(db, interaction.user.id);
      return { wallet: u.wallet };
    });

    // Non-ephemeral: so it looks like a real UI. But locked to the owner by STORE_CTX.
    await interaction.reply({
      content: `STORE_CTX:${event}:${interaction.user.id}`,
      embeds: [storeEmbed('event', event, payload.wallet)],
      components: [storeNavRow('event')],
      ephemeral: false,
    });

    // add action row after sending (needs message)
    const msg = await interaction.fetchReply();
    const buttons = require('../events/buttons');
    // patch in actions row by editing
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('buy:cosmeticrole').setLabel('Buy Cosmetic Title (300)').setStyle(ButtonStyle.Success)
    );
    await msg.edit({ components: [storeNavRow('event'), row] }).catch(() => {});
  },
};
