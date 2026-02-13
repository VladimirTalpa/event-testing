// src/handlers/selects.js
const { getPlayer } = require("../core/players");
const { cardDetailsEmbed } = require("../ui/embeds");

module.exports = async function handleSelects(interaction) {
  const cid = interaction.customId;

  /* ===================== PROFILE -> CARD VIEW ===================== */
  if (cid === "profile_cards_select") {
    const cardId = interaction.values?.[0];
    if (!cardId) return;

    const p = await getPlayer(interaction.user.id);
    const card = (p.cards || []).find((c) => c.id === cardId);
    if (!card) {
      return interaction.reply({ content: "❌ Card not found.", ephemeral: true }).catch(() => {});
    }

    return interaction.reply({
      embeds: [cardDetailsEmbed(card, card.charKey)],
      ephemeral: true,
    }).catch(() => {});
  }

  /* ===================== EXPEDITION PARTY PICK ===================== */
  if (cid.startsWith("expedition_party_select:")) {
    const anime = cid.split(":")[1];
    const ids = interaction.values || [];
    if (ids.length !== 3) {
      return interaction.reply({ content: "❌ You must pick exactly 3 heroes.", ephemeral: true }).catch(() => {});
    }

    // show start button with those ids embedded
    const startId = `ui_expe:start:${anime}:${ids.join(",")}`;

    return interaction.reply({
      content: `✅ Party selected. Start expedition? (Starts in **1 hour**, ticks every **10 minutes**)`,
      components: [
        {
          type: 1,
          components: [
            { type: 2, style: 3, custom_id: startId, label: "Start Expedition", emoji: { name: "🧭" } },
          ],
        },
      ],
      ephemeral: true,
    }).catch(() => {});
  }
};
