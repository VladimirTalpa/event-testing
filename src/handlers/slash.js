// src/handlers/slash.js
const { getPlayer, setPlayer } = require("../core/players");
const { safeName } = require("../core/utils");
const { ADMIN_ROLE_ID } = require("../config");

const {
  profileNav,
  storeNav,
  forgeNav,
  packButtons,
} = require("../ui/components");

const {
  profileCurrencyEmbed,
  profileCardsEmbed,
  profileGearsEmbed,
  profileTitlesEmbed,
  profileLeaderboardEmbed,

  storePacksEmbed,
  storeEventShopEmbed,
  storeGearShopEmbed,

  forgeCraftEmbed,
  forgeEvolveEmbed,

  expeditionsEmbed,
} = require("../ui/embeds");

module.exports = async function handleSlash(interaction) {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) {
    return interaction.reply({ content: "❌ Use commands in a text channel.", ephemeral: true });
  }

  /* ===================== /profile ===================== */
  if (interaction.commandName === "profile") {
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({
      embeds: [profileCurrencyEmbed(p)],
      components: profileNav("currency"),
      ephemeral: true,
    });
  }

  /* ===================== /store ===================== */
  if (interaction.commandName === "store") {
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({
      embeds: [storePacksEmbed(p)],
      components: [...storeNav("packs"), ...packButtons()],
      ephemeral: true,
    });
  }

  /* ===================== /forge ===================== */
  if (interaction.commandName === "forge") {
    return interaction.reply({
      embeds: [forgeCraftEmbed()],
      components: forgeNav("craft"),
      ephemeral: true,
    });
  }

  /* ===================== /expeditions ===================== */
  if (interaction.commandName === "expeditions") {
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({
      embeds: [expeditionsEmbed(p)],
      components: [
        // small action row: choose faction
        {
          type: 1,
          components: [
            { type: 2, style: 2, custom_id: "ui_expe:pick:bleach", label: "Pick Bleach", emoji: { name: "🩸" } },
            { type: 2, style: 2, custom_id: "ui_expe:pick:jjk", label: "Pick JJK", emoji: { name: "🟣" } },
          ],
        },
      ],
      ephemeral: true,
    });
  }

  /* ===================== /adminadd ===================== */
  if (interaction.commandName === "adminadd") {
    const allowed = interaction.member?.roles?.cache?.has(ADMIN_ROLE_ID);
    if (!allowed) return interaction.reply({ content: "⛔ No permission.", ephemeral: true });

    const type = interaction.options.getString("type", true);
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("user") || interaction.user;

    const p = await getPlayer(target.id);

    if (type === "bleach_reiatsu") p.bleach.reiatsu += amount;
    if (type === "bleach_shards") p.bleach.shards += amount;
    if (type === "jjk_ce") p.jjk.cursedEnergy += amount;
    if (type === "jjk_shards") p.jjk.shards += amount;
    if (type === "keys") p.keys += amount;

    await setPlayer(target.id, p);

    return interaction.reply({
      content: `✅ Added **${amount}** (${type}) to **${safeName(target.username)}**.`,
      ephemeral: false,
    });
  }

  // keep silent if unknown
};
