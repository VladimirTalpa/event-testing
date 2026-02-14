const { SlashCommandBuilder } = require('discord.js');
const cfg = require('../config');
const { mutate, getUser } = require('../core/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('exchange_drako')
    .setDescription('Buy Drako using faction currency')
    .addStringOption((o) =>
      o.setName('event').setDescription('Pay with which currency?').setRequired(true).addChoices(
        { name: 'Bleach', value: 'bleach' },
        { name: 'JJK', value: 'jjk' },
      )
    )
    .addIntegerOption((o) => o.setName('drako').setDescription('Drako to buy').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const event = interaction.options.getString('event');
    const drako = interaction.options.getInteger('drako');

    const rate = event === 'bleach' ? cfg.DRAKO_RATE_BLEACH : cfg.DRAKO_RATE_JJK;
    const key = event === 'bleach' ? 'reiatsu' : 'cursed_energy';
    const cost = drako * rate;

    const res = mutate((db) => {
      const u = getUser(db, interaction.user.id);
      if (u.wallet[key] < cost) return { ok: false, have: u.wallet[key] };
      u.wallet[key] -= cost;
      u.wallet.drako += drako;
      return { ok: true, left: u.wallet[key] };
    });

    if (!res.ok) {
      await interaction.reply({ content: `❌ Not enough. Need **${cost}**, you have **${res.have}**.`, ephemeral: true });
      return;
    }

    await interaction.reply({
      content: `✅ Exchanged **${cost}** ${(event === 'bleach' ? cfg.E_REIATSU : cfg.E_CE)} → **${drako}** ${cfg.E_DRAKO}.`,
      ephemeral: true,
    });
  },
};
