const { SlashCommandBuilder } = require('discord.js');
const { mutate, getUser } = require('../core/db');
const { walletEmbed } = require('../ui/embeds');
const { profileNavRow } = require('../ui/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check balance')
    .addUserOption((o) => o.setName('user').setDescription('User to check').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    const payload = mutate((db) => {
      const u = getUser(db, target.id);
      return { wallet: u.wallet };
    });

    await interaction.reply({
      embeds: [walletEmbed(target.tag, payload.wallet)],
      components: [profileNavRow('wallet')],
      ephemeral: true,
    });
  },
};
