// deploy-commands.js
const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { TOKEN, CLIENT_ID, GUILD_ID } = require("./src/config");

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Missing TOKEN / CLIENT_ID / GUILD_ID in src/config.js");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Open your profile"),

  new SlashCommandBuilder()
    .setName("store")
    .setDescription("Open store")
    .addStringOption(o =>
      o.setName("event")
        .setDescription("bleach or jjk")
        .setRequired(true)
        .addChoices(
          { name: "Bleach", value: "bleach" },
          { name: "JJK", value: "jjk" }
        )
    ),

  new SlashCommandBuilder()
    .setName("forge")
    .setDescription("Forge: craft gear / evolve (placeholder)"),

  new SlashCommandBuilder()
    .setName("boss")
    .setDescription("Boss controls")
    .addSubcommand(s =>
      s.setName("spawn")
        .setDescription("Spawn a boss")
        .addStringOption(o =>
          o.setName("id").setDescription("Boss ID").setRequired(true)
        )
        .addBooleanOption(o =>
          o.setName("ping").setDescription("Ping boss role").setRequired(false)
        )
    ),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Deploying slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Commands deployed.");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
