const { renderCardInstanceEmbed, renderProfile } = require("../ui/embeds");
const { buildProfileNavRow, backRow } = require("../ui/components");

module.exports = async function handleSelects(interaction) {
  const id = interaction.customId;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate();
  }

  // profile:cards:select => value = cardInstanceId
  if (id === "profile:cards:select") {
    const instanceId = interaction.values?.[0];
    const res = await renderCardInstanceEmbed(interaction.user.id, instanceId);

    if (!res.ok) {
      return interaction.followUp({ content: `❌ ${res.error}`, ephemeral: true }).catch(() => {});
    }

    return interaction.editReply({
      embeds: [res.embed],
      components: [backRow("profile:nav:cards")],
    });
  }

  // fallback: if select breaks, re-render cards page
  if (id === "profile:cards:filter") {
    const embed = await renderProfile(interaction.user.id, "cards");
    return interaction.editReply({
      embeds: [embed],
      components: [buildProfileNavRow("cards")],
    });
  }

  return;
};
