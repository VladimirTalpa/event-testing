// src/commands/store.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const {
  storeHomeEmbed,
  storePacksEmbed,
  storeGearEmbed,
  storeEventEmbed,
} = require("../ui/embeds");
const { navRow } = require("../ui/components");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("store")
    .setDescription("Open store menu"),
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("store:packs").setLabel("Card Packs").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("store:gear").setLabel("Gear Shop").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("store:event").setLabel("Event Shop").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ui:close").setLabel("Close").setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      embeds: [storeHomeEmbed()],
      components: [row],
      ephemeral: true,
    });
  },

  async onButton(interaction) {
    if (interaction.customId === "store:packs") {
      return interaction.update({
        embeds: [storePacksEmbed()],
        components: [navRow({ backId: "store:home" })],
      });
    }
    if (interaction.customId === "store:gear") {
      return interaction.update({
        embeds: [storeGearEmbed()],
        components: [navRow({ backId: "store:home" })],
      });
    }
    if (interaction.customId === "store:event") {
      return interaction.update({
        embeds: [storeEventEmbed()],
        components: [navRow({ backId: "store:home" })],
      });
    }
    if (interaction.customId === "store:home") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("store:packs").setLabel("Card Packs").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("store:gear").setLabel("Gear Shop").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("store:event").setLabel("Event Shop").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("ui:close").setLabel("Close").setStyle(ButtonStyle.Secondary),
      );
      return interaction.update({
        embeds: [storeHomeEmbed()],
        components: [row],
      });
    }
  },
};
