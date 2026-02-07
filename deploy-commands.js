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
  // balances
  new SlashCommandBuilder()
    .setName("reatsu")
    .setDescription("Check Reiatsu balance (Bleach)")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to check").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("cursedenergy")
    .setDescription("Check Cursed Energy balance (JJK)")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to check").setRequired(false)
    ),

  // inventories
  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory (choose event)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which event inventory?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach", value: "bleach" },
          { name: "Jujutsu Kaisen", value: "jjk" }
        )
    ),

  // shops
  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Open the shop (choose event)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which event shop?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach", value: "bleach" },
          { name: "Jujutsu Kaisen", value: "jjk" }
        )
    ),

  // wardrobe
  new SlashCommandBuilder()
    .setName("wardrobe")
    .setDescription("Open your role wardrobe (choose event)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which event wardrobe?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach", value: "bleach" },
          { name: "Jujutsu Kaisen", value: "jjk" }
        )
    ),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View leaderboard (choose event)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which event leaderboard?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach (Reiatsu)", value: "bleach" },
          { name: "Jujutsu Kaisen (Cursed Energy)", value: "jjk" }
        )
    ),

  // transfers (only inside same event currency)
  new SlashCommandBuilder()
    .setName("give_currency")
    .setDescription("Transfer currency to another player (same event only)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which currency?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach (Reiatsu)", value: "bleach" },
          { name: "Jujutsu Kaisen (Cursed Energy)", value: "jjk" }
        )
    )
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Target player").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Amount (minimum 50)")
        .setRequired(true)
        .setMinValue(50)
    ),

  // daily
  new SlashCommandBuilder()
    .setName("dailyclaim")
    .setDescription("Claim daily reward (choose event)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which event daily?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach", value: "bleach" },
          { name: "Jujutsu Kaisen", value: "jjk" }
        )
    ),

  // spawn boss (event staff)
  new SlashCommandBuilder()
    .setName("spawnboss")
    .setDescription("Spawn a boss event (event staff only)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which event?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach", value: "bleach" },
          { name: "Jujutsu Kaisen", value: "jjk" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("boss")
        .setDescription("Choose boss")
        .setRequired(true)
        .addChoices(
          { name: "Vasto Lorde", value: "vasto" },
          { name: "Ulquiorra", value: "ulquiorra" },
          { name: "Special Grade Curse", value: "special_grade" }
        )
    ),

  // spawn mob (event staff)
  new SlashCommandBuilder()
    .setName("spawnmob")
    .setDescription("Spawn a mob event (event staff only)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which event?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach (Hollow)", value: "bleach" },
          { name: "Jujutsu Kaisen (Cursed Spirit)", value: "jjk" }
        )
    ),

  // exchange to drako (NO REVERSE)
  new SlashCommandBuilder()
    .setName("exchange_drako")
    .setDescription("Exchange event currency to Drako Coin (NO reverse exchange)")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which event currency to exchange?")
        .setRequired(true)
        .addChoices(
          { name: "Bleach (47 Reiatsu = 1 Drako)", value: "bleach" },
          { name: "Jujutsu Kaisen (18 Cursed Energy = 1 Drako)", value: "jjk" }
        )
    )
    .addIntegerOption((opt) =>
      opt
        .setName("drako")
        .setDescription("How many Drako you want to buy")
        .setRequired(true)
        .setMinValue(1)
    ),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔄 Deploying slash commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("✅ Slash commands successfully deployed!");
  } catch (e) {
    console.error("❌ Failed to deploy commands:", e);
    process.exit(1);
  }
})();
