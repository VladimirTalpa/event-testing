// src/ui/menus.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getPlayer, getTopDrakoPlayers } = require("../core/players");
const { safeName } = require("../core/utils");
const { wardrobeComponents } = require("./components");
const { COLOR, E_REIATSU, E_CE, E_DRAKO } = require("../config");

function navRow(prefix) {
  const closeId = `${prefix}:close`;

  if (prefix === "profile") {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("profile:currency").setLabel("Currency").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("profile:gears").setLabel("Gears").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("profile:titles").setLabel("Titles").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("profile:drako_lb").setLabel("Drako LB").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(closeId).setLabel("Close").setStyle(ButtonStyle.Danger),
    );
  }

  if (prefix === "store") {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("store:event").setLabel("Event Shop").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("store:packs").setLabel("Card Packs").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("store:gear").setLabel("Gear Shop").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(closeId).setLabel("Close").setStyle(ButtonStyle.Danger),
    );
  }

  // forge
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("forge:craft").setLabel("Craft").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("forge:evolve").setLabel("Evolve").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(closeId).setLabel("Close").setStyle(ButtonStyle.Danger),
  );
}

function storeEventRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("store:event_bleach").setLabel("Bleach Shop").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("store:event_jjk").setLabel("JJK Shop").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("store:event_back").setLabel("Back").setStyle(ButtonStyle.Secondary),
  );
}

async function openProfile(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("Profile")
    .setDescription("Choose a section below.");

  return interaction.reply({ embeds: [embed], components: [navRow("profile")], ephemeral: true });
}

async function openStore(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("Store")
    .setDescription("Choose a section below.");

  return interaction.reply({ embeds: [embed], components: [navRow("store")], ephemeral: true });
}

async function openForge(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("Forge")
    .setDescription("Choose a section below.");

  return interaction.reply({ embeds: [embed], components: [navRow("forge")], ephemeral: true });
}

async function handleProfileButton(interaction) {
  const page = interaction.customId.split(":")[1];

  if (page === "close") return interaction.update({ content: "Closed.", embeds: [], components: [] });

  const p = await getPlayer(interaction.user.id);

  if (page === "currency") {
    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("Profile • Currency")
      .setDescription(
        [
          `${E_REIATSU} Reiatsu: **${p.bleach.reiatsu}**`,
          `${E_CE} Cursed Energy: **${p.jjk.cursedEnergy}**`,
          `${E_DRAKO} Drako: **${p.drako}**`,
        ].join("\n")
      );

    return interaction.update({ embeds: [embed], components: [navRow("profile")] });
  }

  if (page === "gears") {
    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("Profile • Gears")
      .setDescription("_Gear system will be added here (future)._");

    return interaction.update({ embeds: [embed], components: [navRow("profile")] });
  }

  if (page === "titles") {
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) {
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(COLOR).setTitle("Profile • Titles").setDescription("❌ Can't read your member data.")],
        components: [navRow("profile")],
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("Profile • Titles")
      .setDescription("These are your saved event roles. Select to equip/unequip.");

    // reuse your wardrobe select menu
    const comps = wardrobeComponents(interaction.guild, member, p);

    return interaction.update({ embeds: [embed], components: comps.length ? comps : [navRow("profile")] });
  }

  if (page === "drako_lb") {
    const rows = await getTopDrakoPlayers(10);
    const lines = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      let name = r.userId;
      try {
        const m = await interaction.guild.members.fetch(r.userId);
        name = safeName(m?.displayName || m?.user?.username || r.userId);
      } catch {}
      lines.push(`**#${i + 1}** — ${name}: **${E_DRAKO} ${r.score}**`);
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle("Profile • Drako Leaderboard")
      .setDescription(lines.join("\n") || "No data yet.");

    return interaction.update({ embeds: [embed], components: [navRow("profile")] });
  }

  // fallback
  return interaction.update({ components: [navRow("profile")] });
}

async function handleStoreButton(interaction) {
  const page = interaction.customId.split(":")[1];

  if (page === "close") return interaction.update({ content: "Closed.", embeds: [], components: [] });

  if (page === "event") {
    const embed = new EmbedBuilder().setColor(COLOR).setTitle("Store • Event Shop").setDescription("Choose event shop:");
    return interaction.update({ embeds: [embed], components: [storeEventRow()] });
  }

  if (page === "event_bleach" || page === "event_jjk") {
    const eventKey = page === "event_bleach" ? "bleach" : "jjk";
    const { shopEmbed } = require("./embeds");
    const { shopButtons } = require("./components");
    const p = await getPlayer(interaction.user.id);

    return interaction.update({
      embeds: [shopEmbed(eventKey, p)],
      components: shopButtons(eventKey, p),
    });
  }

  if (page === "event_back") {
    const embed = new EmbedBuilder().setColor(COLOR).setTitle("Store").setDescription("Choose a section below.");
    return interaction.update({ embeds: [embed], components: [navRow("store")] });
  }

  if (page === "packs") {
    const embed = new EmbedBuilder().setColor(COLOR).setTitle("Store • Card Packs").setDescription("_Coming soon._");
    return interaction.update({ embeds: [embed], components: [navRow("store")] });
  }

  if (page === "gear") {
    const embed = new EmbedBuilder().setColor(COLOR).setTitle("Store • Gear Shop").setDescription("_Coming soon._");
    return interaction.update({ embeds: [embed], components: [navRow("store")] });
  }

  return interaction.update({ components: [navRow("store")] });
}

async function handleForgeButton(interaction) {
  const page = interaction.customId.split(":")[1];

  if (page === "close") return interaction.update({ content: "Closed.", embeds: [], components: [] });

  if (page === "craft") {
    const embed = new EmbedBuilder().setColor(COLOR).setTitle("Forge • Craft").setDescription("_Coming soon._");
    return interaction.update({ embeds: [embed], components: [navRow("forge")] });
  }

  if (page === "evolve") {
    const embed = new EmbedBuilder().setColor(COLOR).setTitle("Forge • Evolve").setDescription("_Coming soon._");
    return interaction.update({ embeds: [embed], components: [navRow("forge")] });
  }

  return interaction.update({ components: [navRow("forge")] });
}

module.exports = {
  openProfile,
  openStore,
  openForge,
  handleProfileButton,
  handleStoreButton,
  handleForgeButton,
};
