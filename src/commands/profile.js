// src/commands/profile.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getOrCreateUser } = require("../services/db");
const {
  profileHomeEmbed,
  profileCardsEmbed,
  profileGearsEmbed,
  profileTitlesEmbed,
} = require("../ui/embeds");
const { navRow } = require("../ui/components");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Open your profile menu"),
  async execute(interaction) {
    const u = await getOrCreateUser(interaction.user.id);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("profile:cards").setLabel("Cards").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("profile:gears").setLabel("Gears").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("profile:titles").setLabel("Titles").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ui:close").setLabel("Close").setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      embeds: [profileHomeEmbed(interaction.user, {
        money: u.money,
        bleach: u.bleach,
        jjk: u.jjk,
        bleachShards: u.bleachShards,
        cursedShards: u.cursedShards,
        cards: (u.cards || []).length,
        gears: (u.gears || []).length,
        titles: (u.titles || []).length,
      })],
      components: [row],
      ephemeral: true,
    });
  },

  // кнопки профиля
  async onButton(interaction) {
    const u = await getOrCreateUser(interaction.user.id);

    if (interaction.customId === "profile:cards") {
      const preview = (u.cards || []).slice(0, 15).map((c, i) => `**${i+1}.** ${c.name} — ${c.rarity} — ${c.role}`);
      return interaction.update({
        embeds: [profileCardsEmbed(interaction.user, preview)],
        components: [navRow({ backId: "profile:home" })],
      });
    }

    if (interaction.customId === "profile:gears") {
      const preview = (u.gears || []).slice(0, 15).map((g, i) => `**${i+1}.** ${g.name} (${g.type}) +${g.value}`);
      return interaction.update({
        embeds: [profileGearsEmbed(interaction.user, preview)],
        components: [navRow({ backId: "profile:home" })],
      });
    }

    if (interaction.customId === "profile:titles") {
      const equipped = u.equippedTitle || null;
      const lines = (u.titles || []).slice(0, 20).map((t) => {
        const mark = equipped === t ? "✅" : "▫️";
        return `${mark} ${t}`;
      });
      return interaction.update({
        embeds: [profileTitlesEmbed(interaction.user, lines, equipped)],
        components: [navRow({ backId: "profile:home" })],
      });
    }

    if (interaction.customId === "profile:home") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("profile:cards").setLabel("Cards").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("profile:gears").setLabel("Gears").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("profile:titles").setLabel("Titles").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("ui:close").setLabel("Close").setStyle(ButtonStyle.Secondary),
      );

      return interaction.update({
        embeds: [profileHomeEmbed(interaction.user, {
          money: u.money,
          bleach: u.bleach,
          jjk: u.jjk,
          bleachShards: u.bleachShards,
          cursedShards: u.cursedShards,
          cards: (u.cards || []).length,
          gears: (u.gears || []).length,
          titles: (u.titles || []).length,
        })],
        components: [row],
      });
    }
  },
};
