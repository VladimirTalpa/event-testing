require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ Missing env vars. Need: DISCORD_TOKEN, CLIENT_ID, GUILD_ID');
  process.exit(1);
}

const cfg = require('./src/config');

const EVENT_CHOICES = [
  { name: 'Bleach', value: 'bleach' },
  { name: 'Jujutsu Kaisen', value: 'jjk' },
];

const EVENT_CHOICES_EXCHANGE = [
  { name: `Bleach — Rate: ${cfg.DRAKO_RATE_BLEACH} Reiatsu → 1 Drako`, value: 'bleach' },
  { name: `Jujutsu Kaisen — Rate: ${cfg.DRAKO_RATE_JJK} CE → 1 Drako`, value: 'jjk' },
];

const CURRENCY_CHOICES = [
  { name: 'Reiatsu (Bleach)', value: 'reiatsu' },
  { name: 'Cursed Energy (JJK)', value: 'cursed_energy' },
  { name: 'Drako Coin (Global)', value: 'drako' },
];

const BOSS_CHOICES = Object.values(cfg.BOSS_IDS).map((b) => ({ name: b.label, value: b.id }));

const commands = [
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your balance (Reiatsu / Cursed Energy / Drako)')
    .addUserOption((opt) => opt.setName('user').setDescription('User to check').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dailyclaim')
    .setDescription('Claim your daily reward for the selected faction')
    .addStringOption((opt) => opt.setName('event').setDescription('Which faction?').setRequired(true).addChoices(...EVENT_CHOICES)),

  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Open your profile (buttons)')
    .addUserOption((opt) => opt.setName('user').setDescription('User to view').setRequired(false)),

  new SlashCommandBuilder()
    .setName('store')
    .setDescription('Open store (Event Shop / Card Packs / Gear)')
    .addStringOption((opt) => opt.setName('event').setDescription('Faction store context').setRequired(true).addChoices(...EVENT_CHOICES)),

  new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Quick inventory view')
    .addStringOption((opt) => opt.setName('event').setDescription('Which faction?').setRequired(true).addChoices(...EVENT_CHOICES)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Leaderboard for selected faction currency')
    .addStringOption((opt) => opt.setName('event').setDescription('Which faction?').setRequired(true).addChoices(...EVENT_CHOICES)),

  new SlashCommandBuilder()
    .setName('give')
    .setDescription('Transfer currency to another player')
    .addStringOption((opt) => opt.setName('currency').setDescription('Which currency?').setRequired(true).addChoices(...CURRENCY_CHOICES))
    .addIntegerOption((opt) => opt.setName('amount').setDescription('Amount to send').setRequired(true).setMinValue(1))
    .addUserOption((opt) => opt.setName('user').setDescription('Target player').setRequired(true)),

  new SlashCommandBuilder()
    .setName('exchange_drako')
    .setDescription('Buy Drako Coin using faction currency (NO reverse exchange)')
    .addStringOption((opt) => opt.setName('event').setDescription('Pay with which faction currency?').setRequired(true).addChoices(...EVENT_CHOICES_EXCHANGE))
    .addIntegerOption((opt) => opt.setName('drako').setDescription('How many Drako you want to buy').setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName('spawnboss')
    .setDescription('Spawn a boss (event staff only)')
    .addStringOption((opt) => opt.setName('boss').setDescription('Choose boss').setRequired(true).addChoices(...BOSS_CHOICES)),

  new SlashCommandBuilder()
    .setName('spawnmob')
    .setDescription('Spawn a mob (event staff only)')
    .addStringOption((opt) => opt.setName('event').setDescription('Which faction mob?').setRequired(true).addChoices(...EVENT_CHOICES)),
].map((c) => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Deploying slash commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Slash commands successfully deployed!');
  } catch (e) {
    console.error('❌ Failed to deploy commands:', e);
    process.exit(1);
  }
})();
