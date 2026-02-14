const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const cfg = require('../config');
const { BOSSES, makeBossEmbed } = require('../core/bosses');
const { bossRow } = require('../ui/components');

function isEventStaff(member) {
  if (!member) return false;
  return cfg.EVENT_ROLE_IDS.some((rid) => member.roles.cache.has(rid)) || member.permissions.has(PermissionsBitField.Flags.Administrator);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spawnboss')
    .setDescription('Spawn a boss (staff)')
    .addStringOption((o) =>
      o.setName('boss')
        .setDescription('Boss')
        .setRequired(true)
        .addChoices(
          { name: 'Vasto Lorde (Bleach)', value: 'vasto' },
          { name: 'Ulquiorra (Bleach)', value: 'ulquiorra' },
          { name: 'Grimmjow (Bleach)', value: 'grimmjow' },
          { name: 'Mahoraga (JJK)', value: 'mahoraga' },
          { name: 'Special Grade Curse (JJK)', value: 'specialgrade' },
        )
    ),

  async execute(interaction, client) {
    if (!isEventStaff(interaction.member)) {
      await interaction.reply({ content: '❌ You are not allowed to spawn bosses.', ephemeral: true });
      return;
    }

    const bossId = interaction.options.getString('boss');
    const boss = BOSSES[bossId];

    // Channel lock
    const allowed = boss.anime === 'bleach' ? cfg.BLEACH_CHANNEL_ID : cfg.JJK_CHANNEL_ID;
    if (interaction.channelId !== allowed) {
      await interaction.reply({ content: `❌ Wrong channel for this boss. Use <#${allowed}>`, ephemeral: true });
      return;
    }

    const embed = makeBossEmbed({
      bossId,
      round: 1,
      maxRounds: boss.rounds,
      aliveCount: 0,
      eliminatedCount: 0,
      stateText: '**HP:** 100%\nPress **Join**, then **Hit**.',
    });

    await interaction.reply({
      content: cfg.PING_BOSS_ROLE_ID ? `<@&${cfg.PING_BOSS_ROLE_ID}>` : '',
      embeds: [embed],
      components: [bossRow({ canJoin: true, canHit: true, canNext: true, canEnd: true })],
      allowedMentions: { roles: cfg.PING_BOSS_ROLE_ID ? [cfg.PING_BOSS_ROLE_ID] : [] },
    });

    const msg = await interaction.fetchReply();

    client.state.bosses.set(msg.id, {
      bossId,
      round: 1,
      maxRounds: boss.rounds,
      players: new Map(),
      eliminated: new Set(),
    });
  },
};
