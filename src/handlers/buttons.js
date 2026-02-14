const { getPlayer } = require("../core/players");
const { renderStore, renderProfile, renderCardInstanceEmbed, buildCardsSelectMenu, buildGearRows } = require("../ui/embeds");
const { buildStoreNavRow, buildProfileNavRow, buildPackBuyRows, backRow } = require("../ui/components");

const packs = require("../systems/packs");
const expeditions = require("../systems/expeditions");
const gears = require("../systems/gears");

module.exports = async function handleButtons(interaction) {
  const id = interaction.customId;

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

  // ===== Buy packs
  if (id.startsWith("packs:buy:")) {
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

  // ===== Open pack
  if (id.startsWith("packs:open:")) {
    const type = id.split(":")[2];
    const result = await packs.openPack(interaction.user.id, type);
    if (!result.ok) return interaction.followUp({ content: `❌ ${result.error}`, ephemeral: true }).catch(() => {});
    return interaction.editReply({ embeds: result.embeds, components: result.components || [] });
  }

  // ===== View card
  if (id.startsWith("card:view:")) {
    const instanceId = id.split(":")[2];
    const res = await renderCardInstanceEmbed(interaction.user.id, instanceId);
    if (!res.ok) return interaction.followUp({ content: `❌ ${res.error}`, ephemeral: true }).catch(() => {});
    return interaction.editReply({ embeds: [res.embed], components: [backRow("profile:nav:cards")] });
  }

  // ===== Expedition confirm party
  if (id === "expedition:confirm") {
    const res = await expeditions.confirmParty(interaction);
    return interaction.editReply(res);
  }

  if (id === "expedition:cancel") {
    return interaction.editReply({ content: "❌ Expedition start cancelled.", embeds: [], components: [] });
  }

  // ===== Gear craft
  if (id.startsWith("gear:craft:")) {
    const type = id.split(":")[2]; // weapon/armor
    const res = await gears.craft(interaction.user.id, type);
    if (!res.ok) return interaction.followUp({ content: `❌ ${res.error}`, ephemeral: true }).catch(() => {});
    // refresh gears page
    const embed = await renderProfile(interaction.user.id, "gears");
    const p = await getPlayer(interaction.user.id);
    const rows = [buildProfileNavRow("gears"), ...buildGearRows(p)];
    return interaction.editReply({ content: `✅ Crafted ${type}.`, embeds: [embed], components: rows });
  }

  // list gears
  if (id === "gear:list") {
    const p = await getPlayer(interaction.user.id);
    const lines = (p.gears || []).slice(0, 25).map((g) => `• **${g.name}** (${g.type}) — ${g.type === "weapon" ? `+${g.atk} ATK` : `+${g.hp} HP`}`);
    return interaction.followUp({ content: lines.length ? lines.join("\n") : "No gears.", ephemeral: true }).catch(() => {});
  }

  // start equip flow
  if (id === "gear:assign:start") {
    const res = await gears.startAssignFlow(interaction.user.id);
    return interaction.editReply(res);
  }

  // back
  if (id.startsWith("ui:back:")) {
    const target = id.split(":").slice(2).join(":");
    interaction.customId = target;
    return module.exports(interaction);
  }

  return;
};
