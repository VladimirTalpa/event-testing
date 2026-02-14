const { SlashCommandBuilder } = require('discord.js');
const cfg = require('../config');
const { read } = require('../core/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Faction leaderboard')
    .addStringOption((o) =>
      o.setName('event').setDescription('Faction').setRequired(true).addChoices(
        { name: 'Bleach', value: 'bleach' },
        { name: 'JJK', value: 'jjk' },
      )
    ),

  async execute(interaction) {
    const event = interaction.options.getString('event');
    const key = event === 'bleach' ? 'reiatsu' : 'cursed_energy';

    const db = read();
    const entries = Object.entries(db.users || {})
      .map(([uid, u]) => ({ uid, val: u.wallet?.[key] || 0 }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 10);

    const lines = [];
    let rank = 1;
    for (const e of entries) {
      const member = await interaction.guild.members.fetch(e.uid).catch(() => null);
      const name = member?.user?.tag || e.uid;
      lines.push(`**#${rank}** — ${name} — **${e.val}**`);
      rank += 1;
    }

    await interaction.reply({
      embeds: [
        {
          color: cfg.COLOR,
          title: `🏆 Leaderboard — ${event.toUpperCase()}`,
          description: lines.length ? lines.join('\n') : 'No data yet.',
        },
      ],
      ephemeral: true,
    });
  },
};
