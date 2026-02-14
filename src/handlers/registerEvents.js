const { Events } = require('discord.js');

module.exports = function registerEvents(client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction, client);
        return;
      }

      if (interaction.isButton()) {
        const handler = require('../events/buttons');
        await handler(interaction, client);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        const handler = require('../events/selectMenus');
        await handler(interaction, client);
        return;
      }
    } catch (e) {
      console.error('Interaction error:', e);
      if (interaction.isRepliable()) {
        const content = '❌ Error. Check console for details.';
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content, ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ content, ephemeral: true }).catch(() => {});
        }
      }
    }
  });
};
