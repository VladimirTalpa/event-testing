const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const cfg = require('../config');
const { mobRow } = require('../ui/components');

function isEventStaff(member) {
  if (!member) return false;
  return cfg.EVENT_ROLE_IDS.some((rid) => member.roles.cache.has(rid)) || member.permissions.has(PermissionsBitField.Flags.Administrator);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spawnmob')
    .setDescription('Spawn a mob (staff)')
    .addStringOption((o) =>
      o.setName('event').setDescription('Faction').setRequired(true).addChoices(
        { name: 'Bleach', value: 'bleach' },
        { name: 'JJK', value: 'jjk' },
      )
    ),

  async execute(interaction, client) {
    if (!isEventStaff(interaction.member)) {
      await interaction.reply({ content: '❌ You are not allowed to spawn mobs.', ephemeral: true });
      return;
    }

    const event = interaction.options.getString('event');
    const allowed = event === 'bleach' ? cfg.BLEACH_CHANNEL_ID : cfg.JJK_CHANNEL_ID;
    if (interaction.channelId !== allowed) {
      await interaction.reply({ content: `❌ Wrong channel. Use <#${allowed}>`, ephemeral: true });
      return;
    }

    const duration = event === 'bleach' ? cfg.BLEACH_MOB_MS : cfg.JJK_MOB_MS;
    const endsAt = Date.now() + duration;

    await interaction.reply({
      content: cfg.PING_HOLLOW_ROLE_ID && event === 'bleach' ? `<@&${cfg.PING_HOLLOW_ROLE_ID}>` : '',
      embeds: [
        {
          color: cfg.COLOR,
          title: `👹 Mob Spawned — ${event.toUpperCase()}`,
          description:
            `Spam **Hit** to farm currency.\n` +
            `Ends <t:${Math.floor(endsAt / 1000)}:R>.`,
        },
      ],
      components: [mobRow()],
      allowedMentions: { roles: cfg.PING_HOLLOW_ROLE_ID && event === 'bleach' ? [cfg.PING_HOLLOW_ROLE_ID] : [] },
    });

    const msg = await interaction.fetchReply();
    client.state.mobs.set(msg.id, { event, endsAt });
  },
};
