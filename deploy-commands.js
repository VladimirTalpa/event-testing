require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const cfg = require("./src/config");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Missing env vars. Need: DISCORD_TOKEN, CLIENT_ID, GUILD_ID");
  process.exit(1);
}

const EVENT_CHOICES_EXCHANGE = [
  { name: `Bleach — Rate: ${cfg.DRAKO_RATE_BLEACH} Reiatsu → 1 Drako`, value: "bleach" },
  { name: `Jujutsu Kaisen — Rate: ${cfg.DRAKO_RATE_JJK} CE → 1 Drako`, value: "jjk" },
];

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
    .setName("inventory")
    .setDescription("View your inventory and bonuses (choose event)")
    .addStringOption((opt) => opt.setName("event").setDescription("Which event inventory?").setRequired(true).addChoices(...EVENT_CHOICES)),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Open shop (choose event)")
    .addStringOption((opt) => opt.setName("event").setDescription("Which shop?").setRequired(true).addChoices(...EVENT_CHOICES)),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Leaderboard (choose event currency)")
    .addStringOption((opt) => opt.setName("event").setDescription("Which event leaderboard?").setRequired(true).addChoices(...EVENT_CHOICES)),

  //  new give
  new SlashCommandBuilder()
    .setName("give")
    .setDescription("Transfer currency to another player")
    .addStringOption((opt) => opt.setName("currency").setDescription("Which currency?").setRequired(true).addChoices(...CURRENCY_CHOICES))
    .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount to send").setRequired(true).setMinValue(1))
    .addUserOption((opt) => opt.setName("user").setDescription("Target player").setRequired(true)),

  new SlashCommandBuilder()
    .setName("exchange_drako")
    .setDescription("Buy Drako Coin using event currency (NO reverse exchange)")
    .addStringOption((opt) => opt.setName("event").setDescription("Pay with which event currency?").setRequired(true).addChoices(...EVENT_CHOICES_EXCHANGE))
    .addIntegerOption((opt) => opt.setName("drako").setDescription("How many Drako you want to buy").setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName("dailyclaim")
    .setDescription("Claim your daily Reiatsu reward (Bleach)"),

  new SlashCommandBuilder()
    .setName("spawnboss")
    .setDescription("Spawn a boss (event staff only)")
    .addStringOption((opt) => opt.setName("boss").setDescription("Choose boss").setRequired(true).addChoices(...BOSS_CHOICES)),

  new SlashCommandBuilder()
    .setName("testreciview")
    .setDescription("Preview boss PNG cards (staff)")
    .addStringOption((opt) => opt.setName("boss").setDescription("Choose boss").setRequired(true).addChoices(...BOSS_CHOICES))
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Preview mode")
        .setRequired(true)
        .addChoices(
          { name: "Action Preview", value: "action" },
          { name: "Result Win", value: "result_win" },
          { name: "Result Defeat", value: "result_lose" },
          { name: "Reward Preview", value: "reward" }
        )
    ),

  new SlashCommandBuilder()
    .setName("spawnmob")
    .setDescription("Spawn a mob (event staff only)")
    .addStringOption((opt) => opt.setName("event").setDescription("Which event mob?").setRequired(true).addChoices(...EVENT_CHOICES)),

  new SlashCommandBuilder()
    .setName("wardrobe")
    .setDescription("Open your role wardrobe (equip/unequip saved roles)"),

  new SlashCommandBuilder()
    .setName("cards")
    .setDescription("Show your card collection for one event")
    .addStringOption((opt) => opt.setName("event").setDescription("Bleach or JJK").setRequired(true).addChoices(...EVENT_CHOICES))
    .addUserOption((opt) => opt.setName("user").setDescription("User to check").setRequired(false)),

  new SlashCommandBuilder()
    .setName("cardlevel")
    .setDescription("Upgrade one card level (consumes duplicates + Drako)")
    .addStringOption((opt) => opt.setName("event").setDescription("Bleach or JJK").setRequired(true).addChoices(...EVENT_CHOICES))
    .addStringOption((opt) => opt.setName("card").setDescription("Card id or name").setRequired(true))
    .addIntegerOption((opt) => opt.setName("times").setDescription("How many upgrades").setRequired(false).setMinValue(1).setMaxValue(10)),

  new SlashCommandBuilder()
    .setName("cardslash")
    .setDescription("Clash your card against another user")
    .addStringOption((opt) => opt.setName("event").setDescription("Bleach or JJK").setRequired(true).addChoices(...EVENT_CHOICES))
    .addStringOption((opt) => opt.setName("card").setDescription("Your card id or name").setRequired(true))
    .addUserOption((opt) => opt.setName("user").setDescription("Opponent").setRequired(true))
    .addStringOption((opt) => opt.setName("enemy_card").setDescription("Enemy card id/name (optional, else strongest)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("testcardpull")
    .setDescription("Test pull: always gives bl_ichigo (staff only)"),

  //  pvpclash
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

  new SlashCommandBuilder()
    .setName("clan")
    .setDescription("Clan system commands")
    .addSubcommand((sc) =>
      sc
        .setName("create")
        .setDescription("Create a clan")
        .addStringOption((opt) => opt.setName("name").setDescription("Clan name (3-32 chars)").setRequired(true))
        .addStringOption((opt) => opt.setName("icon").setDescription("Short icon/tag like ⚔️ or [MOHG]").setRequired(false))
    )
    .addSubcommand((sc) =>
      sc
        .setName("request")
        .setDescription("Request to join a clan")
        .addStringOption((opt) => opt.setName("name").setDescription("Exact clan name").setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName("accept")
        .setDescription("Accept a clan invite by clan name")
        .addStringOption((opt) => opt.setName("name").setDescription("Exact clan name").setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName("invite")
        .setDescription("Invite a player to your clan (owner/officer)")
        .addUserOption((opt) => opt.setName("user").setDescription("User to invite").setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName("approve")
        .setDescription("Approve a join request (owner/officer)")
        .addUserOption((opt) => opt.setName("user").setDescription("User to approve").setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName("deny")
        .setDescription("Deny a join request (owner/officer)")
        .addUserOption((opt) => opt.setName("user").setDescription("User to deny").setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName("promote")
        .setDescription("Promote member to officer (owner only)")
        .addUserOption((opt) => opt.setName("user").setDescription("Member to promote").setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName("demote")
        .setDescription("Demote officer to member (owner only)")
        .addUserOption((opt) => opt.setName("user").setDescription("Officer to demote").setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName("transfer")
        .setDescription("Transfer clan ownership (owner only)")
        .addUserOption((opt) => opt.setName("user").setDescription("New owner").setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName("kick")
        .setDescription("Kick a member (owner/officer)")
        .addUserOption((opt) => opt.setName("user").setDescription("Member to kick").setRequired(true))
    )
    .addSubcommand((sc) => sc.setName("requests").setDescription("Show pending join requests + invites"))
    .addSubcommand((sc) => sc.setName("leave").setDescription("Leave your current clan"))
    .addSubcommand((sc) =>
      sc
        .setName("info")
        .setDescription("Show clan info")
        .addStringOption((opt) => opt.setName("name").setDescription("Clan name (optional)").setRequired(false))
    ),

  new SlashCommandBuilder()
    .setName("clanboss")
    .setDescription("Clan boss commands")
    .addSubcommand((sc) =>
      sc
        .setName("start")
        .setDescription("Start a clan-exclusive boss")
        .addStringOption((opt) => opt.setName("event").setDescription("Bleach or JJK").setRequired(true).addChoices(...EVENT_CHOICES))
    )
    .addSubcommand((sc) =>
      sc
        .setName("hit")
        .setDescription("Hit active clan boss with your strongest card in the event")
        .addStringOption((opt) => opt.setName("event").setDescription("Bleach or JJK").setRequired(true).addChoices(...EVENT_CHOICES))
    )
    .addSubcommand((sc) => sc.setName("status").setDescription("Show active clan boss status")),

  new SlashCommandBuilder()
    .setName("clanleaderboard")
    .setDescription("Weekly clan ranking by damage/activity/clears"),

  new SlashCommandBuilder()
    .setName("cardmastery")
    .setDescription("Card mastery progression M1 -> M2 -> M3")
    .addSubcommand((sc) =>
      sc
        .setName("info")
        .setDescription("Show mastery status for a card")
        .addStringOption((opt) => opt.setName("event").setDescription("Bleach or JJK").setRequired(true).addChoices(...EVENT_CHOICES))
        .addStringOption((opt) => opt.setName("card").setDescription("Card id or name").setRequired(true))
    )
    .addSubcommand((sc) =>
      sc
        .setName("upgrade")
        .setDescription("Upgrade card mastery if requirements are met")
        .addStringOption((opt) => opt.setName("event").setDescription("Bleach or JJK").setRequired(true).addChoices(...EVENT_CHOICES))
        .addStringOption((opt) => opt.setName("card").setDescription("Card id or name").setRequired(true))
    ),

  new SlashCommandBuilder()
    .setName("cardfuse")
    .setDescription("Fuse two M3 cards into a duo card")
    .addStringOption((opt) => opt.setName("event").setDescription("Bleach or JJK").setRequired(true).addChoices(...EVENT_CHOICES))
    .addStringOption((opt) => opt.setName("card_a").setDescription("First card id or name").setRequired(true))
    .addStringOption((opt) => opt.setName("card_b").setDescription("Second card id or name").setRequired(true)),
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
