require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Missing env vars: DISCORD_TOKEN, CLIENT_ID, GUILD_ID");
  process.exit(1);
}

const BOSS_CHOICES = [
  { name: "Vasto Lorde (Bleach)", value: "vasto" },
  { name: "Ulquiorra (Bleach)", value: "ulquiorra" },
  { name: "Grimmjow (Bleach)", value: "grimmjow" },
  { name: "Mahoraga (JJK)", value: "mahoraga" },
  { name: "Special Grade Curse (JJK)", value: "specialgrade" }
];

const commands = [
  new SlashCommandBuilder().setName("profile").setDescription("Open profile menu"),
  new SlashCommandBuilder().setName("store").setDescription("Open store menu"),
  new SlashCommandBuilder().setName("forge").setDescription("Open forge menu"),
  new SlashCommandBuilder()
    .setName("spawnboss")
    .setDescription("Spawn a boss")
    .addStringOption((o) => o.setName("boss").setDescription("Choose boss").setRequired(true).addChoices(...BOSS_CHOICES))
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("Commands deployed");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
