const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder
} = require("discord.js");
const { getDungeon, addParticipant, activeDungeons } = require("../core/dungeon");
const { getPlayer } = require("../core/players");
const { getCardById, cardStatsAtLevel } = require("../data/cards");

module.exports = async function handleDungeon(interaction) {
  // JOIN RAID — сразу предлагаем выбрать карту
  if (interaction.customId?.startsWith("dungeon_join:")) {
    const dungeonId = interaction.customId.slice("dungeon_join:".length);
    const dungeon = getDungeon(dungeonId);
    if (!dungeon) return interaction.reply({ content: "Dungeon expired.", ephemeral: true });

    const userId = interaction.user.id;
    if (dungeon.participants.includes(userId)) return interaction.reply({ content: "Already joined.", ephemeral: true });
    addParticipant(dungeonId, userId);

    // теперь создаём select menu из всех карт игрока
    const player = await getPlayer(userId);
    const eventKey = dungeon.event;
    const cards = Object.entries((player.cards?.[eventKey] || {}))
      .filter(([_, amt]) => amt > 0)
      .map(([cardId]) => getCardById(eventKey, cardId))
      .filter(Boolean);

    if (!cards.length) {
      return interaction.reply({ content: "You have no cards for this event!", ephemeral: true });
    }

    // Строим select menu
    const options = cards.slice(0, 25).map(card => ({
      label: card.name,
      value: card.id,
    }));
    const select = new StringSelectMenuBuilder()
      .setCustomId(`dungeon_select_card:${dungeonId}`)
      .setPlaceholder("Select a card for battle")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.reply({
      content: "Select a card to join the dungeon raid.",
      components: [row],
      ephemeral: true,
    });
  }

  // SELECT CARD — обработка выбора
  else if (interaction.customId?.startsWith("dungeon_select_card:")) {
    const dungeonId = interaction.customId.slice("dungeon_select_card:".length);
    const dungeon = getDungeon(dungeonId);

    if (!dungeon) return interaction.reply({ content: "Dungeon expired.", ephemeral: true });

    const userId = interaction.user.id;
    const selected = interaction.values[0];
    // Можно хранить выбор: dungeon.selectedCards = {userId: cardId, ...}
    if (!dungeon.selectedCards) dungeon.selectedCards = {};
    dungeon.selectedCards[userId] = selected;

    await interaction.reply({ content: `You selected card: ${selected}.`, ephemeral: true });
  }

  // ... остальные действия ...
};
