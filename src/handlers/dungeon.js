const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const { getDungeon, addParticipant, activeDungeons } = require("../core/dungeon");
const { getPlayer } = require("../core/players");
const { getCardById } = require("../data/cards");

module.exports = async function handleDungeon(interaction) {
  // --- JOIN RAID: показать меню выбора карты ---
  if (interaction.customId?.startsWith("dungeon_join:")) {
    const dungeonId = interaction.customId.slice("dungeon_join:".length);
    const dungeon = getDungeon(dungeonId);

    if (!dungeon)
      return interaction.reply({
        content: "❌ This dungeon is no longer active or was not found.",
        ephemeral: true,
      });

    const userId = interaction.user.id;
    if (dungeon.participants.includes(userId))
      return interaction.reply({
        content: "❗ You have already joined the raid.",
        ephemeral: true,
      });

    addParticipant(dungeonId, userId);

    // Получаем карты игрока для события
    const player = await getPlayer(userId);
    const eventKey = dungeon.event;
    const cards = Object.entries(player.cards?.[eventKey] || {})
      .filter(([_, amt]) => amt > 0)
      .map(([cardId]) => getCardById(eventKey, cardId))
      .filter(Boolean);

    if (!cards.length) {
      return interaction.reply({
        content: "You have no cards for this event!",
        ephemeral: true,
      });
    }

    // Select menu максимум 25 карт (ограничение Discord API)
    const options = cards.slice(0, 25).map((card) => ({
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
    return;
  }

  // --- SELECT CARD ---
  if (interaction.customId?.startsWith("dungeon_select_card:")) {
    const dungeonId = interaction.customId.slice("dungeon_select_card:".length);
    const dungeon = getDungeon(dungeonId);
    if (!dungeon)
      return interaction.reply({
        content: "Dungeon expired.",
        ephemeral: true,
      });

    const userId = interaction.user.id;
    const selectedCardId = interaction.values[0];

    // Сохраняем выбранную карту
    if (!dungeon.selectedCards) dungeon.selectedCards = {};
    dungeon.selectedCards[userId] = selectedCardId;

    await interaction.reply({
      content: `You selected card: **${getCardById(dungeon.event, selectedCardId)?.name || selectedCardId}**.`,
      ephemeral: true,
    });
    return;
  }

  // --- INFO ---
  if (interaction.customId?.startsWith("dungeon_info:")) {
    const dungeonId = interaction.customId.slice("dungeon_info:".length);
    const dungeon = getDungeon(dungeonId);

    if (!dungeon)
      return interaction.reply({
        content: "❌ Info: this raid is finished or not found!",
        ephemeral: true,
      });

    const embed = new EmbedBuilder()
      .setColor(0x7b2cff)
      .setTitle(`🏰 ${dungeon.event.toUpperCase()} Dungeon Info`)
      .setDescription(
        `**Objective:**  Deal 1000 damage\n` +
        `**Participants:** ${dungeon.participants.length}\n` +
        `**Status:** ${dungeon.status}\n` +
        `Time left: ~${Math.max(0, Math.round((dungeon.endsAt - Date.now()) / 1000))} sec.`
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // --- START BATTLE ---
  if (interaction.customId?.startsWith("dungeon_battle_start:")) {
    const dungeonId = interaction.customId.slice("dungeon_battle_start:".length);
    const dungeon = getDungeon(dungeonId);

    if (!dungeon)
      return interaction.reply({
        content: "❌ Dungeon not found or expired.",
        ephemeral: true,
      });

    // Логика начала боя
    if (dungeon.status !== "Registration") {
      return interaction.reply({
        content: "Battle has already started!",
        ephemeral: true,
      });
    }

    // Проверим, выбрали ли все участники карты
    const required = dungeon.participants.length;
    const selected = dungeon.selectedCards ? Object.keys(dungeon.selectedCards).length : 0;
    if (selected < required) {
      return interaction.reply({
        content: `Not all participants have selected their cards yet! (${selected}/${required})`,
        ephemeral: true,
      });
    }

    dungeon.status = "Battle";

    // Здесь вы бы просчитывали урон по выбранным картам игроков
    // Для примера: покажем embed со списком участников и выбраными картами
    let desc = dungeon.participants
      .map((userId, i) => {
        let cardId = dungeon.selectedCards?.[userId];
        return `#${i + 1}: <@${userId}> — ${cardId ? "`" + cardId + "`" : "_no card_"}`;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("⚡ Dungeon Battle Started!")
      .setDescription(
        `Participants: **${dungeon.participants.length}**\n\n` + desc +
        `\n\n(Battle logic and damage calculation is your next step!)`
      );

    return interaction.reply({ embeds: [embed] });
  }
};
