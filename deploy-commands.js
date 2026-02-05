require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commands = [
  new SlashCommandBuilder().setName("spawn_boss").setDescription("Spawn boss"),
  new SlashCommandBuilder().setName("spawn_hollow").setDescription("Spawn hollow"),
  new SlashCommandBuilder().setName("dailyclaim").setDescription("Claim daily"),
  new SlashCommandBuilder().setName("shop").setDescription("Open shop"),
  new SlashCommandBuilder().setName("inventory").setDescription("Show inventory"),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Top reiatsu"),
  new SlashCommandBuilder()
    .setName("reatsu")
    .setDescription("Check reiatsu")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(false)),
  new SlashCommandBuilder()
    .setName("give_reatsu")
    .setDescription("Transfer reiatsu")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("Amount").setRequired(true)),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log("✅ Commands deployed");
})();
