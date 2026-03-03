const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const { getDungeon, addParticipant, selectCard, startBattle, executeBattleRound, getDungeonStats } = require("../core/dungeon");
const { getPlayer } = require("../core/players");
const { safeName } = require("../core/utils");
const { getCardById, cardStatsAtLevel } = require("../data/cards");

module.exports = async function handleDungeon(interaction) {
  try {
    // ===== JOIN DUNGEON BUTTON =====
    if (interaction.customId?.startsWith("dungeon_join:")) {
      const dungeonId = interaction.customId.split(":")[1];
      const dungeon = getDungeon(dungeonId);
      
      if (!dungeon) {
        return interaction.reply({ content: "❌ Dungeon not found!", ephemeral: true });
      }
      
      if (dungeon.status !== "REGISTRATION") {
        return interaction.reply({ content: "❌ Registration closed!", ephemeral: true });
      }
      
      const res = addParticipant(dungeonId, interaction.user.id, safeName(interaction.user.username));
      if (!res.ok) {
        return interaction.reply({ content: `❌ ${res.error}`, ephemeral: true });
      }
      
      // Показываем карты для выбора
      const player = await getPlayer(interaction.user.id);
      const eventKey = dungeon.event;
      const cardsMap = eventKey === "bleach" ? (player?.cards?.bleach || {}) : (player?.cards?.jjk || {});
      const levelsMap = eventKey === "bleach" ? (player?.cardLevels?.bleach || {}) : (player?.cardLevels?.jjk || {});
      
      const cardOptions = [];
      for (const [cardId, amount] of Object.entries(cardsMap)) {
        if (amount <= 0) continue;
        const card = getCardById(eventKey, cardId);
        if (!card) continue;
        
        const level = levelsMap[cardId] || 1;
        const stats = cardStatsAtLevel(card, level);
        const power = stats.dmg;
        
        cardOptions.push({
          label: `${card.name} (Lv.${level})`,
          description: `DMG: ${power} | Owned: x${amount}`,
          value: `${cardId}:${level}:${power}`,
        });
      }
      
      if (cardOptions.length === 0) {
        return interaction.reply({ content: "❌ No cards available!", ephemeral: true });
      }
      
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`dungeon_select_card:${dungeonId}`)
        .setPlaceholder("Select your card...")
        .addOptions(cardOptions.slice(0, 25)); // Discord limit: 25 options
      
      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      return interaction.reply({
        content: `✅ **Joined dungeon!**\nSelect your card to participate in the raid:`,
        components: [row],
        ephemeral: true,
      });
    }
    
    // ===== SELECT CARD =====
    if (interaction.customId?.startsWith("dungeon_select_card:")) {
      const dungeonId = interaction.customId.split(":")[1];
      const [cardId, cardLevel, cardDmg] = interaction.values[0].split(":");
      
      const dungeon = getDungeon(dungeonId);
      if (!dungeon) {
        return interaction.reply({ content: "❌ Dungeon not found!", ephemeral: true });
      }
      
      selectCard(dungeonId, interaction.user.id, cardId, parseInt(cardLevel), parseInt(cardDmg));
      
      const participant = dungeon.participants.find(p => p.userId === interaction.user.id);
      const card = getCardById(dungeon.event, cardId);
      
      const confirmEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Card Selected!")
        .setDescription(`**${card.name}** (Lv.${cardLevel})\n**DMG: ${cardDmg}**`)
        .setFooter({ text: `Participants: ${dungeon.participants.length}` });
      
      return interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true,
      });
    }
    
    // ===== START BATTLE BUTTON =====
    if (interaction.customId?.startsWith("dungeon_battle_start:")) {
      const dungeonId = interaction.customId.split(":")[1];
      const dungeon = getDungeon(dungeonId);
      
      if (!dungeon) {
        return interaction.reply({ content: "❌ Dungeon not found!", ephemeral: true });
      }
      
      if (dungeon.participants.length === 0) {
        return interaction.reply({ content: "❌ No participants!", ephemeral: true });
      }
      
      startBattle(dungeonId);
      
      await interaction.deferReply();
      
      // Выполняем раунды
      let finalEmbed;
      for (let round = 1; round <= dungeon.maxRounds; round++) {
        const result = executeBattleRound(dungeonId);
        if (!result.ok) break;
        
        const dmgText = result.roundDamages
          .map(d => `• **${d.userName}**: ${d.damage} DMG (Total: ${d.totalDamage})`)
          .join("\n");
        
        const embed = new EmbedBuilder()
          .setColor(0xff6600)
          .setTitle(`🏰 DUNGEON BATTLE - Round ${result.round}/${dungeon.maxRounds}`)
          .setDescription(dmgText)
          .addFields(
            { name: "Total Raid Damage", value: `**${result.totalDamage} / ${result.targetDamage}**`, inline: false }
          )
          .setFooter({ text: `Progress: ${Math.floor((result.totalDamage / result.targetDamage) * 100)}%` });
        
        finalEmbed = embed;
        
        if (result.completed) break;
        
        // Пауза между раундами
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Финальный результат
      const stats = getDungeonStats(dungeonId);
      const won = stats.totalDamage >= stats.targetDamage;
      
      const resultEmbed = new EmbedBuilder()
        .setColor(won ? 0x00ff00 : 0xff0000)
        .setTitle(won ? "🎉 DUNGEON CLEARED!" : "❌ Dungeon Failed")
        .setDescription(
          won
            ? `Guild dealt **${stats.totalDamage}** damage! Target reached!`
            : `Only **${stats.totalDamage}/${stats.targetDamage}** damage dealt...`
        )
        .addFields(
          ...stats.participants.map(p => ({
            name: p.name,
            value: `**${p.totalDamage}** DMG | Avg: ${p.avgDamage}/round | Rounds: ${p.roundCount}`,
            inline: false,
          }))
        )
        .setFooter({ text: `Dungeon completed in ${stats.round} rounds` });
      
      return interaction.editReply({ embeds: [resultEmbed], components: [] });
    }
    
    // ===== INFO BUTTON =====
    if (interaction.customId?.startsWith("dungeon_info:")) {
      const dungeonId = interaction.customId.split(":")[1];
      const dungeon = getDungeon(dungeonId);
      
      if (!dungeon) {
        return interaction.reply({ content: "❌ Dungeon not found!", ephemeral: true });
      }
      
      const infoEmbed = new EmbedBuilder()
        .setColor(0x7b2cff)
        .setTitle(`🏰 Dungeon Info`)
        .setDescription(
          `**Event:** ${dungeon.event.toUpperCase()}\n` +
          `**Status:** ${dungeon.status}\n` +
          `**Participants:** ${dungeon.participants.length}\n` +
          `**Damage Goal:** ${dungeon.targetDamage}\n` +
          `**Max Rounds:** ${dungeon.maxRounds}`
        )
        .addFields(
          {
            name: "Participants",
            value: dungeon.participants.length > 0
              ? dungeon.participants.map(p => `• ${p.userName}`).join("\n")
              : "_None yet_",
            inline: false,
          }
        );
      
      return interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    }
    
  } catch (error) {
    console.error("Dungeon handler error:", error);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: "❌ Error processing dungeon action", ephemeral: true }).catch(() => {});
    }
  }
};
