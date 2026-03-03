const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { getDungeon, addParticipant, activeDungeons } = require("../core/dungeon");

module.exports = async function handleDungeon(interaction) {
  // === JOIN RAID ===
  if (interaction.customId?.startsWith("dungeon_join:")) {
    const dungeonId = interaction.customId.slice("dungeon_join:".length);
    const dungeon = getDungeon(dungeonId);

    if (!dungeon) {
      return interaction.reply({ content: "❌ Этот данж уже неактивен или не найден.", ephemeral: true });
    }

    // П��остой уникальный идентификатор игрока (discord user id)
    const userId = interaction.user.id;
    if (dungeon.participants.includes(userId)) {
      return interaction.reply({ content: "❗ Вы уже присоединились к этому рейду.", ephemeral: true });
    }
    addParticipant(dungeonId, userId);

    await interaction.reply({ content: `✅ Вы присоединились к рейду! Ваш id: \`${userId}\``, ephemeral: true });
  }

  // === INFO ===
  else if (interaction.customId?.startsWith("dungeon_info:")) {
    const dungeonId = interaction.customId.slice("dungeon_info:".length);
    const dungeon = getDungeon(dungeonId);

    if (!dungeon) {
      return interaction.reply({ content: "❌ Информация: этот рейд завершен или не найден!", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x7b2cff)
      .setTitle(`🏰 ${dungeon.event.toUpperCase()} Dungeon Info`)
      .setDescription(
        `**Цель:**  Нанести 1000 урона\n` +
        `**Участников:** ${dungeon.participants.length}\n` +
        `**Статус:** ${dungeon.status}\n` +
        `Данж будет доступен ~${Math.round((dungeon.endsAt - Date.now()) / 1000)} сек.`
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // === START BATTLE ===
  else if (interaction.customId?.startsWith("dungeon_battle_start:")) {
    const dungeonId = interaction.customId.slice("dungeon_battle_start:".length);
    const dungeon = getDungeon(dungeonId);

    if (!dungeon) {
      return interaction.reply({ content: "❌ Данж не найден или время истекло.", ephemeral: true });
    }

    // Можно добавить тут свою логику старта боя
    if (dungeon.status !== "Registration") {
      return interaction.reply({ content: "Бой уже начат!", ephemeral: true });
    }
    dungeon.status = "Battle";

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle("⚡ Битва с рейдовым данжем началась!")
      .setDescription(
        `Участников: **${dungeon.participants.length}**\n` +
        `Бой будет длиться несколько раундов... (логика боя — твоя следующая задача)\n`
      );

    return interaction.reply({ embeds: [embed] });
  }
};
