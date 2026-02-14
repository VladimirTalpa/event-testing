// src/handlers/slash.js
const path = require("path");
const fs = require("fs");

function loadCommands() {
  const commands = new Map();
  const buttonHandlers = new Map();

  const cmdDir = path.join(__dirname, "..", "commands");
  const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const mod = require(path.join(cmdDir, file));
    if (!mod?.data?.name || !mod?.execute) continue;

    commands.set(mod.data.name, mod);

    // если модуль умеет кнопки
    if (typeof mod.onButton === "function") {
      // сохраняем по префиксу (profile:, store: и т.д.)
      const prefix = mod.data.name + ":";
      buttonHandlers.set(prefix, mod.onButton);
      // и ещё кастомные (например profile:home)
      buttonHandlers.set(mod.data.name, mod.onButton);
    }
  }

  return { commands, buttonHandlers };
}

function pickButtonHandler(buttonHandlers, customId) {
  // точное совпадение
  for (const [k, fn] of buttonHandlers.entries()) {
    if (k === customId) return fn;
  }
  // по префиксу
  for (const [k, fn] of buttonHandlers.entries()) {
    if (customId.startsWith(k)) return fn;
  }
  return null;
}

module.exports = {
  loadCommands,
  async handleInteraction(interaction, registry) {
    try {
      // CLOSE
      if (interaction.isButton() && interaction.customId === "ui:close") {
        return interaction.update({ components: [], embeds: interaction.message.embeds }).catch(async () => {
          // если update нельзя (например истёкло), просто ответим
          if (!interaction.replied) {
            await interaction.reply({ content: "Closed.", ephemeral: true });
          }
        });
      }

      // SLASH
      if (interaction.isChatInputCommand()) {
        const cmd = registry.commands.get(interaction.commandName);
        if (!cmd) {
          return interaction.reply({
            content: `❌ Command /${interaction.commandName} is not implemented.`,
            ephemeral: true,
          });
        }
        return cmd.execute(interaction, registry);
      }

      // BUTTONS
      if (interaction.isButton()) {
        const fn = pickButtonHandler(registry.buttonHandlers, interaction.customId);
        if (!fn) {
          return interaction.reply({ content: "❌ This button is not handled.", ephemeral: true });
        }
        return fn(interaction, registry);
      }
    } catch (err) {
      console.error("Interaction error:", err);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: "⚠️ Error handling this action.", ephemeral: true }).catch(() => {});
      }
      return interaction.followUp({ content: "⚠️ Error handling this action.", ephemeral: true }).catch(() => {});
    }
  },
};
