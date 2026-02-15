const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { spawnBoss } = require('../core/bossEngine');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spawnboss')
    .setDescription('Spawn an event boss in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt
        .setName('boss')
        .setDescription('Boss id')
        .setRequired(true)
        .addChoices(
          { name: 'Vasto Lorde (Bleach)', value: 'vasto_lorde' },
          { name: 'Ulquiorra (Bleach)', value: 'ulquiorra' },
          { name: 'Grimmjow (Bleach)', value: 'grimmjow' },
          { name: 'Mahoraga (JJK)', value: 'mahoraga' },
          { name: 'Special Grade Curse (JJK)', value: 'special_grade' }
        )
    ),

  async execute(interaction, client) {
    const bossId = interaction.options.getString('boss', true);
    return spawnBoss(client, interaction, bossId);
  },
};
