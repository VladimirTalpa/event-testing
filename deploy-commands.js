require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Missing env vars. Need: DISCORD_TOKEN, CLIENT_ID, GUILD_ID");
  process.exit(1);
}

const EVENT_CHOICES = [
  { name: "Bleach", value: "bleach" },
  { name: "Jujutsu Kaisen", value: "jjk" },
];

const BOSS_CHOICES = [
  { name: "Vasto Lorde (Bleach)", value: "vasto" },
  { name: "Ulquiorra (Bleach)", value: "ulquiorra" },
  { name: "Grimmjow (Bleach)", value: "grimmjow" },
  { name: "Mahoraga (JJK)", value: "mahoraga" },
  { name: "Special Grade Curse (JJK)", value: "specialgrade" },
];

const CURRENCY_CHOICES = [
  { name: "Reiatsu (Bleach)", value: "reiatsu" },
  { name: "Cursed Energy (JJK)", value: "cursed_energy" },
  { name: "Drako Coin (Global)", value: "drako" },
];

const commands = [
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your balance (Reiatsu / Cursed Energy / Drako)")
    .addUserOption((opt) => opt.setName("user").setDescription("User to check").setRequired(false)),

  new SlashCommandBuilder()
    .setName("dailyclaim")
    .setDescription("Claim your daily Reiatsu reward (Bleach)"),

  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory (event)")
    .addStringOption((opt) => opt.setName("event").setDescription("Which inventory?").setRequired(true).addChoices(...EVENT_CHOICES)),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Leaderboard (event currency)")
    .addStringOption((opt) => opt.setName("event").setDescription("Which event leaderboard?").setRequired(true).addChoices(...EVENT_CHOICES)),

  new SlashCommandBuilder()
    .setName("give")
    .setDescription("Transfer currency to another player")
    .addStringOption((opt) => opt.setName("currency").setDescription("Which currency?").setRequired(true).addChoices(...CURRENCY_CHOICES))
    .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount to send").setRequired(true).setMinValue(1))
    .addUserOption((opt) => opt.setName("user").setDescription("Target player").setRequired(true)),

  new SlashCommandBuilder()
    .setName("exchange_drako")
    .setDescription("Buy Drako Coin using event currency (NO reverse exchange)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Pay with which event currency?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach (Reiatsu -> Drako)", value: "bleach" },
          { name: "JJK (CE -> Drako)", value: "jjk" }
        )
    )
    .addIntegerOption((opt) => opt.setName("drako").setDescription("How many Drako you want to buy").setRequired(true).setMinValue(1)),

  // ✅ NEW MENU COMMANDS
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Open your profile menu (Currency / Cards / Gears / Titles / Leaderboard)"),

  new SlashCommandBuilder()
    .setName("store")
    .setDescription("Open store (Event Shop / Card Packs / Gear Shop)"),

  new SlashCommandBuilder()
    .setName("forge")
    .setDescription("Open forge (Craft / Evolve)"),

  // staff-only
  new SlashCommandBuilder()
    .setName("spawnboss")
    .setDescription("Spawn a boss (event staff only)")
    .addStringOption((opt) => opt.setName("boss").setDescription("Choose boss").setRequired(true).addChoices(...BOSS_CHOICES)),

  new SlashCommandBuilder()
    .setName("spawnmob")
    .setDescription("Spawn a mob (event staff only)")
    .addStringOption((opt) => opt.setName("event").setDescription("Which event mob?").setRequired(true).addChoices(...EVENT_CHOICES)),

  // kept (future)
  new SlashCommandBuilder()
    .setName("pvpclash")
    .setDescription("Challenge a player to a PvP clash (stake currency)")
    .addStringOption((opt) => opt.setName("currency").setDescription("Which currency?").setRequired(true).addChoices(...CURRENCY_CHOICES))
    .addIntegerOption((opt) => opt.setName("amount").setDescription("Stake amount").setRequired(true).setMinValue(1))
    .addUserOption((opt) => opt.setName("user").setDescription("Opponent").setRequired(true)),

  new SlashCommandBuilder()
    .setName("adminadd")
    .setDescription("Admin: add currency to a user (role-restricted)")
    .addStringOption((opt) => opt.setName("currency").setDescription("Which currency?").setRequired(true).addChoices(...CURRENCY_CHOICES))
    .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount to add").setRequired(true).setMinValue(1))
    .addUserOption((opt) => opt.setName("user").setDescription("Target user (optional)").setRequired(false)),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔄 Deploying slash commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ Slash commands successfully deployed!");
  } catch (e) {
    console.error("❌ Failed to deploy commands:", e);
    process.exit(1);
  }
})();
