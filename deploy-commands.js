require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [
  new SlashCommandBuilder()
    .setName("spawnboss")
    .setDescription("Spawn a Bleach boss (staff only)")
    .addStringOption(opt =>
      opt.setName("boss").setDescription("Choose boss").setRequired(true).addChoices(
        { name: "Vasto Lorde", value: "vasto" },
        { name: "Ulquiorra", value: "ulquiorra" }
      )
    ),
  new SlashCommandBuilder()
    .setName("reatsu")
    .setDescription("Check Reiatsu balance")
    .addUserOption(opt => opt.setName("user").setDescription("User to check").setRequired(false)),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔄 Deploying slash commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ Slash commands successfully deployed!");
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
  }
})();
