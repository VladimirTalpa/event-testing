// src/commands/balance.js
const { SlashCommandBuilder } = require("discord.js");
const { getOrCreateUser } = require("../services/db");
const { balanceEmbed } = require("../ui/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Show your balance"),
  async execute(interaction) {
    const u = await getOrCreateUser(interaction.user.id);
    await interaction.reply({
      embeds: [balanceEmbed(interaction.user, u)],
      ephemeral: true,
    });
  },
};
