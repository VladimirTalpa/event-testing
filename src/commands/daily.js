// src/commands/daily.js
const { SlashCommandBuilder } = require("discord.js");
const { getOrCreateUser, setUser } = require("../services/db");
const { dailyEmbed } = require("../ui/embeds");

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_AMOUNT = 250;

function msToText(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim daily reward"),
  async execute(interaction) {
    const u = await getOrCreateUser(interaction.user.id);
    const now = Date.now();

    const nextIn = (u.dailyLast || 0) + COOLDOWN_MS - now;
    if (nextIn > 0) {
      return interaction.reply({
        embeds: [dailyEmbed(interaction.user, 0, msToText(nextIn))],
        ephemeral: true,
      });
    }

    u.money = (u.money || 0) + DAILY_AMOUNT;
    u.dailyLast = now;
    await setUser(interaction.user.id, u);

    return interaction.reply({
      embeds: [dailyEmbed(interaction.user, DAILY_AMOUNT, msToText(COOLDOWN_MS))],
      ephemeral: true,
    });
  },
};
