const { getPlayer } = require("../core/players");
const { renderStore, renderProfile, renderCardInstanceEmbed } = require("../ui/embeds");
const { buildStoreNavRow, buildProfileNavRow, buildPackBuyRows, backRow } = require("../ui/components");
const packs = require("../systems/packs");

module.exports = async function handleButtons(interaction) {
  const id = interaction.customId;

  // всегда быстро отвечаем
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate();
  }

  // ===== Store navigation
  if (id.startsWith("store:nav:")) {
    const section = id.split(":")[2] || "event";
    const embed = await renderStore(interaction.user.id, section);
    const rows = [buildStoreNavRow(section)];

    if (section === "packs") {
      const p = await getPlayer(interaction.user.id);
      rows.push(...buildPackBuyRows(p));
    }

    return interaction.editReply({ embeds: [embed], components: rows });
  }

  // ===== Profile navigation
  if (id.startsWith("profile:nav:")) {
    const section = id.split(":")[2] || "currency";
    const embed = await renderProfile(interaction.user.id, section);
    const rows = [buildProfileNavRow(section)];
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  // ===== Buy packs (gives pack item to inventory)
  if (id.startsWith("packs:buy:")) {
    // packs:buy:<type>:<event>
    const [, , type, event] = id.split(":");
    const res = await packs.buyPack(interaction.user.id, type, event);
    if (!res.ok) {
      return interaction.followUp({ content: `❌ ${res.error}`, ephemeral: true }).catch(() => {});
    }

    const embed = await renderStore(interaction.user.id, "packs");
    const p = await getPlayer(interaction.user.id);
    const rows = [buildStoreNavRow("packs"), ...buildPackBuyRows(p)];

    return interaction.editReply({
      content: `✅ Bought **${type}** pack (${event.toUpperCase()}).`,
      embeds: [embed],
      components: rows,
    });
  }

  // ===== Open pack from inventory
  if (id.startsWith("packs:open:")) {
    // packs:open:<type>
    const type = id.split(":")[2];
    const result = await packs.openPack(interaction.user.id, type);

    if (!result.ok) {
      return interaction.followUp({ content: `❌ ${result.error}`, ephemeral: true }).catch(() => {});
    }

    return interaction.editReply({
      embeds: result.embeds,
      components: result.components || [],
    });
  }

  // ===== View specific card instance
  if (id.startsWith("card:view:")) {
    const instanceId = id.split(":")[2];
    const res = await renderCardInstanceEmbed(interaction.user.id, instanceId);
    if (!res.ok) {
      return interaction.followUp({ content: `❌ ${res.error}`, ephemeral: true }).catch(() => {});
    }
    return interaction.editReply({ embeds: [res.embed], components: [backRow("profile:nav:cards")] });
  }

  // back
  if (id.startsWith("ui:back:")) {
    const target = id.split(":").slice(2).join(":"); // restore customId
    // emulate click
    interaction.customId = target;
    // safest: re-run logic by calling ourselves
    return module.exports(interaction);
  }

  return;
};
