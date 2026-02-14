const { SlashCommandBuilder } = require('discord.js');
const cfg = require('../config');
const { mutate, getUser } = require('../core/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dailyclaim')
    .setDescription('Claim daily reward')
    .addStringOption((o) =>
      o.setName('event').setDescription('Faction').setRequired(true).addChoices(
        { name: 'Bleach', value: 'bleach' },
        { name: 'JJK', value: 'jjk' },
      )
    ),

  async execute(interaction) {
    const event = interaction.options.getString('event');
    const isBooster = interaction.member.roles.cache.has(cfg.BOOSTER_ROLE_ID);
    const reward = isBooster ? cfg.DAILY_BOOSTER : cfg.DAILY_NORMAL;

    const res = mutate((db) => {
      const u = getUser(db, interaction.user.id);
      const key = event === 'bleach' ? 'daily_bleach' : 'daily_jjk';
      const now = Date.now();
      const last = u.cooldowns[key] || 0;
      if (now - last < cfg.DAILY_COOLDOWN_MS) {
        const left = cfg.DAILY_COOLDOWN_MS - (now - last);
        return { ok: false, left };
      }
      u.cooldowns[key] = now;
      if (event === 'bleach') u.wallet.reiatsu += reward;
      else u.wallet.cursed_energy += reward;
      return { ok: true, reward };
    });

    if (!res.ok) {
      const mins = Math.ceil(res.left / 60000);
      await interaction.reply({ content: `❌ Daily already claimed. Try again in ~${mins} min.`, ephemeral: true });
      return;
    }

    await interaction.reply({
      content:
        `✅ Daily claimed: **+${res.reward}** ` +
        (event === 'bleach' ? cfg.E_REIATSU : cfg.E_CE) +
        (isBooster ? ' (booster bonus)' : ''),
      ephemeral: true,
    });
  },
};
