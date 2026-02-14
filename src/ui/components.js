const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

function buildStoreNavRow(active = "event") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("store:nav:event")
      .setLabel("Event Shop")
      .setStyle(active === "event" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("store:nav:packs")
      .setLabel("Card Packs")
      .setStyle(active === "packs" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("store:nav:gear")
      .setLabel("Gear Shop")
      .setStyle(active === "gear" ? ButtonStyle.Primary : ButtonStyle.Secondary),
  );
}

function buildProfileNavRow(active = "currency") {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("profile:nav:currency")
      .setLabel("Currency")
      .setStyle(active === "currency" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("profile:nav:cards")
      .setLabel("Cards")
      .setStyle(active === "cards" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("profile:nav:gears")
      .setLabel("Gears")
      .setStyle(active === "gears" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("profile:nav:titles")
      .setLabel("Titles")
      .setStyle(active === "titles" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("profile:nav:leaderboard")
      .setLabel("Leaderboard")
      .setStyle(active === "leaderboard" ? ButtonStyle.Primary : ButtonStyle.Secondary),
  );
}

function buildPackBuyRows(player) {
  const rows = [];

  // buy basic
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("packs:buy:basic:bleach")
        .setLabel("Buy Basic (Bleach)")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("packs:buy:basic:jjk")
        .setLabel("Buy Basic (JJK)")
        .setStyle(ButtonStyle.Success),
    )
  );

  // buy legendary
  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("packs:buy:legendary:bleach")
        .setLabel("Buy Legendary (Bleach)")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("packs:buy:legendary:jjk")
        .setLabel("Buy Legendary (JJK)")
        .setStyle(ButtonStyle.Danger),
    )
  );

  // open from inventory
  const basic = player?.packs?.basic || 0;
  const legendary = player?.packs?.legendary || 0;

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("packs:open:basic")
        .setLabel(`Open Basic (${basic})`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(basic <= 0),
      new ButtonBuilder()
        .setCustomId("packs:open:legendary")
        .setLabel(`Open Legendary (${legendary})`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(legendary <= 0),
    )
  );

  return rows;
}

function backRow(targetCustomId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ui:back:${targetCustomId}`)
      .setLabel("⬅ Back")
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = {
  buildStoreNavRow,
  buildProfileNavRow,
  buildPackBuyRows,
  backRow,
};
