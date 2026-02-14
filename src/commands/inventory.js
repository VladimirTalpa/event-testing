const { SlashCommandBuilder } = require('discord.js');
const { mutate, getUser } = require('../core/db');
const cfg = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Inventory view')
    .addStringOption((o) =>
      o.setName('event').setDescription('Faction').setRequired(true).addChoices(
        { name: 'Bleach', value: 'bleach' },
        { name: 'JJK', value: 'jjk' },
      )
    ),

  async execute(interaction) {
    const event = interaction.options.getString('event');

    const payload = mutate((db) => {
      const u = getUser(db, interaction.user.id);
      const cards = u.cards.filter((c) => c.anime === event);
      return { cards, wallet: u.wallet };
    });

    const lines = payload.cards.slice(0, 20).map((c, i) => `**${i + 1}. ${c.name || c.id}** — ${c.rarity} — Lvl ${c.level} ⭐${c.stars}`);

    await interaction.reply({
      embeds: [
        {
          color: cfg.COLOR,
          title: `📦 Inventory — ${event.toUpperCase()}`,
          description:
            (lines.length ? lines.join('\n') : 'No cards yet. Open packs in /store.') +
            `\n\nWallet: ${event === 'bleach' ? cfg.E_REIATSU + ' ' + payload.wallet.reiatsu : cfg.E_CE + ' ' + payload.wallet.cursed_energy}`,
          image: { url: cfg.CARD_GIF_URL },
        },
      ],
      ephemeral: true,
    });
  },
};
