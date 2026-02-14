// src/handlers/slash.js
const fs = require("fs");
const path = require("path");

const {
  profileHomeEmbed,
  storeHomeEmbed,
  simpleErrorEmbed,
} = require("../ui/embeds");

const { closeRow, homeRow } = require("../ui/components");

function loadCommands() {
  const dir = path.join(__dirname, "..", "commands");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".js") && !f.startsWith("_"));

  const map = new Map();
  for (const file of files) {
    const cmd = require(path.join(dir, file));
    if (!cmd?.data?.name || typeof cmd.execute !== "function") continue;
    map.set(cmd.data.name, cmd);
  }
  return map;
}

const COMMANDS = loadCommands();

/**
 * customId format:
 *  ui:close
 *  ui:home:<screen>
 *  profile:home
 *  store:home
 */
async function handleComponent(interaction) {
  const raw = interaction.customId || "";
  const parts = raw.split(":");
  const scope = parts[0];
  const action = parts[1];

  // Always ACK fast (no "application did not respond")
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate().catch(() => null);
  }

  // ---------- Universal UI ----------
  if (scope === "ui" && action === "close") {
    // delete message if possible, else just remove components
    const msg = interaction.message;
    if (msg?.deletable) {
      await msg.delete().catch(() => null);
      return;
    }
    await interaction.editReply({ components: [] }).catch(() => null);
    return;
  }

  if (scope === "ui" && action === "home") {
    const screen = parts[2] || "profile";
    if (screen === "store") {
      const view = storeHomeEmbed(interaction.user);
      await interaction.editReply({
        ...view,
        components: [homeRow("profile"), closeRow()],
      });
      return;
    }
    // default: profile
    const view = profileHomeEmbed(interaction.user);
    await interaction.editReply({
      ...view,
      components: [homeRow("store"), closeRow()],
    });
    return;
  }

  // ---------- Profile ----------
  if (scope === "profile" && action === "home") {
    const view = profileHomeEmbed(interaction.user);
    await interaction.editReply({
      ...view,
      components: [homeRow("store"), closeRow()],
    });
    return;
  }

  // ---------- Store ----------
  if (scope === "store" && action === "home") {
    const view = storeHomeEmbed(interaction.user);
    await interaction.editReply({
      ...view,
      components: [homeRow("profile"), closeRow()],
    });
    return;
  }

  // unknown component → just ignore safely
  return;
}

async function handleSlash(interaction) {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const cmd = COMMANDS.get(interaction.commandName);

      if (!cmd) {
        return interaction.reply({
          embeds: [
            simpleErrorEmbed(
              "Command is not implemented.",
              `/${interaction.commandName}`
            ),
          ],
          ephemeral: true,
        });
      }

      // each command отвечает сам (reply/defer)
      await cmd.execute(interaction);
      return;
    }

    // Buttons / Selects
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await handleComponent(interaction);
      return;
    }
  } catch (err) {
    console.error("Interaction error:", err);

    // If already responded → try edit
    const payload = {
      embeds: [simpleErrorEmbed("Error handling this action.", "Check logs.")],
      components: [closeRow()],
      ephemeral: true,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }
}

module.exports = { handleSlash };
