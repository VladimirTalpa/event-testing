require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Missing env vars. Need: DISCORD_TOKEN, CLIENT_ID, GUILD_ID");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Open your RPG profile (Currency / Cards / Gears / Titles / Leaderboard)"),

  new SlashCommandBuilder()
    .setName("store")
    .setDescription("Open the store (Event Shop / Card Packs / Gear Shop)"),

  new SlashCommandBuilder()
    .setName("forge")
    .setDescription("Forge (Craft gear / Evolve characters)"),

  new SlashCommandBuilder()
    .setName("expeditions")
    .setDescription("Daily expeditions (2/day). Requires a key. Choose 3 heroes."),

  // staff / admin utilities (оставил)
  new SlashCommandBuilder()
    .setName("spawnboss")
    .setDescription("Spawn a boss (event staff only)")
    .addStringOption((opt) =>
      opt
        .setName("boss")
        .setDescription("Boss id (from data/bosses.js)")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("spawnmob")
    .setDescription("Spawn a mob (event staff only)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("bleach / jjk")
        .setRequired(true)
        .addChoices({ name: "Bleach", value: "bleach" }, { name: "JJK", value: "jjk" })
    ),

  new SlashCommandBuilder()
    .setName("adminadd")
    .setDescription("Admin: add currency/shards/keys to a user (role-restricted)")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("What to add?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach: Reiatsu", value: "bleach_reiatsu" },
          { name: "Bleach: Shards", value: "bleach_shards" },
          { name: "JJK: Cursed Energy", value: "jjk_ce" },
          { name: "JJK: Cursed Shards", value: "jjk_shards" },
          { name: "Expedition Keys (global)", value: "keys" }
        )
    )
    .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount").setRequired(true).setMinValue(1))
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
