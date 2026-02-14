const { SlashCommandBuilder } = require('discord.js');
const cfg = require('../config');
const { mutate, getUser } = require('../core/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Transfer currency')
    .addStringOption((o) =>
      o.setName('currency').setDescription('Currency').setRequired(true).addChoices(
        { name: 'Reiatsu', value: 'reiatsu' },
        { name: 'Cursed Energy', value: 'cursed_energy' },
        { name: 'Drako', value: 'drako' },
      )
    )
    .addIntegerOption((o) => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1))
    .addUserOption((o) => o.setName('user').setDescription('Target').setRequired(true)),

  async execute(interaction) {
    const currency = interaction.options.getString('currency');
    const amount = interaction.options.getInteger('amount');
    const target = interaction.options.getUser('user');

    if (target.bot) {
      await interaction.reply({ content: '❌ You cannot send to bots.', ephemeral: true });
      return;
    }
    if (target.id === interaction.user.id) {
      await interaction.reply({ content: '❌ You cannot send to yourself.', ephemeral: true });
      return;
    }

    const res = mutate((db) => {
      const from = getUser(db, interaction.user.id);
      const to = getUser(db, target.id);
      if ((from.wallet[currency] || 0) < amount) return { ok: false };
      from.wallet[currency] -= amount;
      to.wallet[currency] = (to.wallet[currency] || 0) + amount;
      return { ok: true };
    });

    if (!res.ok) {
      await interaction.reply({ content: '❌ Not enough balance.', ephemeral: true });
      return;
    }

    const emoji = currency === 'reiatsu' ? cfg.E_REIATSU : currency === 'cursed_energy' ? cfg.E_CE : cfg.E_DRAKO;
    await interaction.reply({ content: `✅ Sent **${amount}** ${emoji} to ${target}.`, ephemeral: true });
  },
};
