// src/ui/embeds.js
const { EmbedBuilder } = require("discord.js");

const {
  COLOR,

  E_MEMBERS,
  E_BLEACH,
  E_JJK,
  E_REIATSU,
  E_CE,
  E_DRAKO,

  DRAKO_RATE_BLEACH,
  DRAKO_RATE_JJK,
} = require("../config");

const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");
const { safeName } = require("../core/utils");


/* ===================== HELPERS ===================== */

function line(t) {
  return `• ${t}`;
}


/* ===================== INVENTORY ===================== */

function inventoryEmbed(eventKey, player) {
  const isBleach = eventKey === "bleach";

  const tag = isBleach ? E_BLEACH : E_JJK;
  const cur = isBleach ? E_REIATSU : E_CE;

  const data = isBleach ? player.bleach : player.jjk;
  const inv = data.items;

  const balance = isBleach
    ? player.bleach.reiatsu
    : player.jjk.cursedEnergy;

  const rate = isBleach
    ? DRAKO_RATE_BLEACH
    : DRAKO_RATE_JJK;

  const items = Object.entries(inv)
    .map(([k, v]) => `${v ? "✅" : "❌"} ${k.replace(/_/g, " ")}`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${tag} Inventory`)
    .setDescription(
      [
        `💰 Balance: **${cur} ${balance}**`,
        `${E_DRAKO} Drako: **${player.drako}**`,
        `🔁 Rate: **${rate} → 1 Drako**`,
        "",
        "📦 **Items**",
        items || "_No items_",
        "",
        `🧥 Wardrobe roles: **${player.ownedRoles.length}**`,
      ].join("\n")
    );
}


/* ===================== SHOP ===================== */

function shopEmbed(eventKey, player) {
  const isBleach = eventKey === "bleach";

  const tag = isBleach ? E_BLEACH : E_JJK;
  const cur = isBleach ? E_REIATSU : E_CE;

  const data = isBleach ? BLEACH_SHOP_ITEMS : JJK_SHOP_ITEMS;
  const inv = isBleach
    ? player.bleach.items
    : player.jjk.items;

  const balance = isBleach
    ? player.bleach.reiatsu
    : player.jjk.cursedEnergy;

  const lines = data.map((it) => {
    const owned = inv[it.key]
      ? "✅ Owned"
      : `${cur} ${it.price}`;

    return (
      `**${it.name}** — ${owned}\n` +
      `> ${it.desc}`
    );
  });

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${tag} Shop`)
    .setDescription(lines.join("\n\n"))
    .addFields({
      name: "💰 Balance",
      value: `${cur} ${balance}`,
      inline: true,
    });
}


/* ===================== LEADERBOARD ===================== */

function leaderboardEmbed(eventKey, entries, page, maxPage) {
  const tag = eventKey === "bleach" ? E_BLEACH : E_JJK;
  const cur = eventKey === "bleach" ? E_REIATSU : E_CE;

  const lines = entries.map(
    (e, i) =>
      `**#${i + 1 + page * 10}** ${safeName(
        e.name
      )} — ${cur} ${e.score}`
  );

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🏆 ${tag} Leaderboard`)
    .setDescription(lines.join("\n") || "_No data_")
    .setFooter({
      text: `Page ${page + 1}/${maxPage}`,
    });
}


/* ===================== WARDROBE ===================== */

function wardrobeEmbed(guild, player) {
  const roles = player.ownedRoles
    .map((r) => guild.roles.cache.get(r))
    .filter(Boolean);

  const list = roles.length
    ? roles.map((r) => `• <@&${r.id}>`).join("\n")
    : "_No saved roles_";

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🧥 Wardrobe")
    .setDescription(
      [
        "Select role to equip/unequip",
        "",
        list,
      ].join("\n")
    );
}


module.exports = {
  inventoryEmbed,
  shopEmbed,
  leaderboardEmbed,
  wardrobeEmbed,
};
