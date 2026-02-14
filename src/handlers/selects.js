const { renderCardInstanceEmbed } = require("../ui/embeds");
const { backRow } = require("../ui/components");

const expeditions = require("../systems/expeditions");
const forge = require("../systems/forge");
const gears = require("../systems/gears");

module.exports = async function handleSelects(interaction) {
  const id = interaction.customId;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate();
  }

  // profile card select
  if (id === "profile:cards:select") {
    const instanceId = interaction.values?.[0];
    const res = await renderCardInstanceEmbed(interaction.user.id, instanceId);
    if (!res.ok) return interaction.followUp({ content: `❌ ${res.error}`, ephemeral: true }).catch(() => {});
    return interaction.editReply({ embeds: [res.embed], components: [backRow("profile:nav:cards")] });
  }

  // expedition party multi select
  if (id === "expedition:party:select") {
    const res = await expeditions.partySelected(interaction);
    return interaction.editReply(res);
  }

  // forge evolve select
  if (id === "forge:evolve:select") {
    const res = await forge.handleEvolve(interaction.user.id, interaction.values?.[0]);
    return interaction.editReply(res);
  }

  // gear assign: choose card
  if (id === "gear:assign:card") {
    const res = await gears.assignChooseCard(interaction.user.id, interaction.values?.[0]);
    return interaction.editReply(res);
  }

  // gear assign: choose gear
  if (id === "gear:assign:gear") {
    const res = await gears.assignChooseGear(interaction.user.id, interaction.values?.[0]);
    return interaction.editReply(res);
  }

  return;
};
