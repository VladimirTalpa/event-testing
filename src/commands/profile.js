const { SlashCommandBuilder } = require('discord.js');
const { mutate, getUser } = require('../core/db');
const { walletEmbed } = require('../ui/embeds');
const { profileNavRow, titlesSelect } = require('../ui/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Open profile')
    .addUserOption((o) => o.setName('user').setDescription('User to view').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    const payload = mutate((db) => {
      const u = getUser(db, target.id);
      return { wallet: u.wallet, titles: u.titles };
    });

    const components = [profileNavRow('wallet')];
    if (target.id === interaction.user.id) {
      // show select only when viewing yourself
      components.unshift(titlesSelect(payload.titles.ownedRoleIds, payload.titles.equippedRoleId));
    }

    await interaction.reply({
      embeds: [walletEmbed(target.tag, payload.wallet)],
      components: [profileNavRow('wallet')],
      ephemeral: true,
    });
  },
};
