require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

/* ===================== ENV ===================== */
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Application ID
const GUILD_ID = process.env.GUILD_ID;   // Server ID

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Missing env vars. Need DISCORD_TOKEN, CLIENT_ID, GUILD_ID");
  process.exit(1);
}

/* ===================== COMMANDS ===================== */
const commands = [
  // /reatsu
  new SlashCommandBuilder()
    .setName("reatsu")
    .setDescription("Check Reiatsu balance")
    .addUserOption(opt =>
      opt.setName("user").setDescription("User to check").setRequired(false)
    ),

  // /inventory (placeholder if your index has it; if not, keep it for later)
  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory and bonuses"),

  // /shop
  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Open the shop"),

  // /leaderboard
  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the leaderboard"),

  // /give_reatsu
  new SlashCommandBuilder()
    .setName("give_reatsu")
    .setDescription("Transfer Reiatsu to another player")
    .addUserOption(opt =>
      opt.setName("user").setDescription("Target player").setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName("amount")
        .setDescription("Amount of Reiatsu (minimum 50)")
        .setRequired(true)
        .setMinValue(50)
    ),

  // /reatsu_clash
  new SlashCommandBuilder()
    .setName("reatsu_clash")
    .setDescription("Challenge another player to a Reiatsu clash (50/50)")
    .addUserOption(opt =>
      opt.setName("user").setDescription("Opponent").setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName("stake")
        .setDescription("Reiatsu stake (minimum 50)")
        .setRequired(true)
        .setMinValue(50)
    ),

  // /dailyclaim
  new SlashCommandBuilder()
    .setName("dailyclaim")
    .setDescription("Claim your daily reward"),

  // OLD manual spawns (если хочешь оставить совместимость)
  new SlashCommandBuilder()
    .setName("spawn_hollow")
    .setDescription("Manually spawn a Vasto Lorde boss event (legacy)"),

  new SlashCommandBuilder()
    .setName("spawn_hollowling")
    .setDescription("Manually spawn a mini Hollow event (legacy)"),

  // ✅ NEW: /spawnboss with boss picker
  new SlashCommandBuilder()
    .setName("spawnboss")
    .setDescription("Spawn a Bleach boss (staff only)")
    .addStringOption(opt =>
      opt
        .setName("boss")
        .setDescription("Choose boss")
        .setRequired(true)
        .addChoices(
          { name: "Vasto Lorde", value: "vasto" },
          { name: "Ulquiorra", value: "ulquiorra" }
        )
    ),
].map(cmd => cmd.toJSON());

/* ===================== DEPLOY ===================== */
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔄 Deploying slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log(`✅ Deployed ${commands.length} commands.`);
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
    process.exit(1);
  }
})();
