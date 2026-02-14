const { EmbedBuilder } = require("discord.js");
const cfg = require("../config");

const { getPlayer, setPlayer, getTopPlayers } = require("../core/players");
const { renderStore, renderProfile, buildCardsSelectMenu, buildGearRows } = require("../ui/embeds");
const { buildStoreNavRow, buildProfileNavRow, buildPackBuyRows } = require("../ui/components");

const packs = require("../systems/packs");
const expeditions = require("../systems/expeditions");
const forge = require("../systems/forge");
const bosses = require("../systems/bosses");

module.exports = async function handleSlash(interaction) {
  const name = interaction.commandName;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: false });
  }

  if (name === "store") {
    const section = interaction.options.getString("section") || "event";
    const embed = await renderStore(interaction.user.id, section);
    const rows = [buildStoreNavRow(section)];

    if (section === "packs") {
      const p = await getPlayer(interaction.user.id);
      rows.push(...buildPackBuyRows(p));
    }

    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (name === "profile") {
    const section = interaction.options.getString("section") || "currency";
    const embed = await renderProfile(interaction.user.id, section);
    const rows = [buildProfileNavRow(section)];

    if (section === "cards") {
      const p = await getPlayer(interaction.user.id);
      const menuRow = buildCardsSelectMenu(p);
      if (menuRow) rows.push(menuRow);
    }

    if (section === "gears") {
      const p = await getPlayer(interaction.user.id);
      rows.push(...buildGearRows(p));
    }

    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (name === "packs") {
    const sub = interaction.options.getSubcommand();
    if (sub !== "open") return interaction.editReply({ content: "Unknown packs command." });

    const type = interaction.options.getString("type");
    const result = await packs.openPack(interaction.user.id, type);
    if (!result.ok) return interaction.editReply({ content: `❌ ${result.error}` });

    return interaction.editReply({ embeds: result.embeds, components: result.components || [] });
  }

  if (name === "forge") {
    const section = interaction.options.getString("section") || "craft";

    if (section === "craft") {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(cfg.COLOR || 0x8a2be2)
            .setTitle("🔨 Forge — Craft")
            .setDescription("Craft gear via **/profile → Gears** buttons (Craft Weapon / Craft Armor)."),
        ],
      });
    }

    if (section === "evolve") {
      // запускаем evolve flow (выбор карточки select-menu)
      const p = await getPlayer(interaction.user.id);
      if (!p.cards.length) return interaction.editReply({ content: "❌ You have 0 cards." });

      const embed = new EmbedBuilder()
        .setColor(cfg.COLOR || 0x8a2be2)
        .setTitle("🔺 Forge — Evolve")
        .setDescription(
          [
            "Select a card to evolve.",
            "",
            `Costs:`,
            `• Rare → Legendary: **${cfg.EVOLVE_RARE_TO_LEGENDARY_SHARDS} shards** + **${cfg.EVOLVE_RARE_TO_LEGENDARY_DRKO} drako**`,
            `• Legendary → Mythic: **${cfg.EVOLVE_LEGENDARY_TO_MYTHIC_SHARDS} shards** + **${cfg.EVOLVE_LEGENDARY_TO_MYTHIC_DRKO} drako**`,
          ].join("\n")
        );

      const menuRow = forge.buildEvolveSelectMenu(p);
      return interaction.editReply({ embeds: [embed], components: [menuRow] });
    }
  }

  if (name === "expedition") {
    const sub = interaction.options.getSubcommand();

    if (sub === "status") {
      const p = await getPlayer(interaction.user.id);
      const e = p.expedition || {};
      const text = e.active
        ? `🧭 Expedition active.\nStarts/started: <t:${Math.floor(e.startingAt / 1000)}:R>\nTicks: **${e.ticksDone}/${e.totalTicks}**`
        : "🧭 No active expedition.";

      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(cfg.COLOR || 0x8a2be2).setTitle("🧭 Expeditions").setDescription(text)],
      });
    }

    if (sub === "start") {
      const res = await expeditions.startFlow(interaction);
      return interaction.editReply(res);
    }
  }

  // ==== old basic commands kept alive ====
  if (name === "leaderboard") {
    const event = interaction.options.getString("event");
    const top = await getTopPlayers(event, 10);
    const lines = top.map((r, i) => `**${i + 1}.** <@${r.userId}> — **${r.score}**`);
    const embed = new EmbedBuilder().setColor(cfg.COLOR || 0x8a2be2).setTitle(`🏆 Leaderboard — ${event.toUpperCase()}`).setDescription(lines.join("\n") || "No data.");
    return interaction.editReply({ embeds: [embed] });
  }

  if (name === "spawnboss") {
    if (typeof bosses.spawnBoss === "function") {
      const boss = interaction.options.getString("boss");
      const res = await bosses.spawnBoss(interaction, boss);
      return interaction.editReply(res);
    }
    return interaction.editReply({ content: "⚠️ Boss system file missing." });
  }

  return interaction.editReply({ content: "❌ Unknown command." });
};
