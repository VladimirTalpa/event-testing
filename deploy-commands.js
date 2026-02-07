require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Missing env vars: DISCORD_TOKEN, CLIENT_ID, GUILD_ID");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("reatsu")
    .setDescription("Check Reiatsu balance")
    .addUserOption(opt => opt.setName("user").setDescription("User to check").setRequired(false)),

  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory and bonuses"),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Open the Reiatsu shop"),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the Reiatsu leaderboard"),

  new SlashCommandBuilder()
    .setName("give_reatsu")
    .setDescription("Transfer Reiatsu to another player")
    .addUserOption(opt => opt.setName("user").setDescription("Target player").setRequired(true))
    .addIntegerOption(opt => opt.setName("amount").setDescription("Amount (min 50)").setRequired(true).setMinValue(50)),

  new SlashCommandBuilder()
    .setName("reatsu_clash")
    .setDescription("Challenge another player to a Reiatsu clash (50/50)")
    .addUserOption(opt => opt.setName("user").setDescription("Opponent").setRequired(true))
    .addIntegerOption(opt => opt.setName("stake").setDescription("Reiatsu stake").setRequired(true).setMinValue(50)),

  new SlashCommandBuilder()
    .setName("dailyclaim")
    .setDescription("Claim your daily Reiatsu reward"),

  // ✅ Hollow
  new SlashCommandBuilder()
    .setName("spawn_hollowling")
    .setDescription("Manually spawn a mini Hollow event"),

  // ✅ 2 bosses
  new SlashCommandBuilder()
    .setName("spawn_boss")
    .setDescription("Manually spawn a boss")
    .addStringOption(opt =>
      opt.setName("boss")
        .setDescription("Which boss")
        .setRequired(true)
        .addChoices(
          { name: "Vasto Lorde", value: "vasto" },
          { name: "Ulquiorra", value: "ulquiorra" }
        )
    ),
].map(c => c.toJSON());

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
