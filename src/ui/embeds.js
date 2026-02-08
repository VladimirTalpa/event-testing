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


/* ===================== LEADERBOARD ===================== */

function leaderboardEmbed(eventKey, rows, page = 0, pageSize = 10) {

  const start = page * pageSize;
  const slice = rows.slice(start, start + pageSize);

  const logo = eventKey === "bleach" ? E_BLEACH : E_JJK;
  const cur = eventKey === "bleach" ? E_REIATSU : E_CE;


  const lines = slice.map((r, i) => {

    const pos = start + i + 1;

    return `**#${pos}** • ${safeName(r.name)} — ${cur} **${r.score}**`;
  });


  const maxPage = Math.max(1, Math.ceil(rows.length / pageSize));


  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🏆 ${logo} Leaderboard`)
    .setDescription(lines.join("\n") || "_No data yet_")
    .setFooter({
      text: `Page ${page + 1}/${maxPage} • Players: ${rows.length}`,
    });
}


/* ===================== INVENTORY ===================== */

function inventoryEmbed(eventKey, player) {

  const logo = eventKey === "bleach" ? E_BLEACH : E_JJK;


  if (eventKey === "bleach") {

    const inv = player.bleach.items;

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${logo} Bleach Inventory`)
      .setDescription([

        `${E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**`,
        `${E_DRAKO} Drako: **${player.drako}**`,

        `🔁 Rate: ${DRAKO_RATE_BLEACH} = 1 Drako`,

        "",
        "🛡️ Items:",

        `• Zanpakuto: ${inv.zanpakuto_basic ? "✅" : "❌"}`,
        `• Mask: ${inv.hollow_mask_fragment ? "✅" : "❌"}`,
        `• Cloak: ${inv.soul_reaper_cloak ? "✅" : "❌"}`,
        `• Amplifier: ${inv.reiatsu_amplifier ? "✅" : "❌"}`,

        "",
        `🧥 Roles: **${player.ownedRoles.length}**`,

      ].join("\n"));
  }


  /* ================= JJK ================= */

  const inv = player.jjk.items;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${logo} JJK Inventory`)
    .setDescription([

      `${E_CE} CE: **${player.jjk.cursedEnergy}**`,
      `${E_DRAKO} Drako: **${player.drako}**`,

      `🔁 Rate: ${DRAKO_RATE_JJK} = 1 Drako`,

      "",
      "🛡️ Items:",

      `• Black Flash: ${inv.black_flash_manual ? "✅" : "❌"}`,
      `• Domain: ${inv.domain_charm ? "✅" : "❌"}`,
      `• Tool: ${inv.cursed_tool ? "✅" : "❌"}`,
      `• Reverse: ${inv.reverse_talisman ? "✅" : "❌"}`,
      `• Binding: ${inv.binding_vow_seal ? "✅" : "❌"}`,

      "",
      `🧥 Roles: **${player.ownedRoles.length}**`,

    ].join("\n"));
}


/* ===================== SHOP ===================== */

function shopEmbed(eventKey, player) {

  const logo = eventKey === "bleach" ? E_BLEACH : E_JJK;


  if (eventKey === "bleach") {

    const inv = player.bleach.items;

    const lines = BLEACH_SHOP_ITEMS.map(it => {

      const owned = inv[it.key]
        ? "✅ Owned"
        : `${E_REIATSU} ${it.price}`;

      return `**${it.name}** — ${owned}\n> ${it.desc}`;
    });


    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${logo} Bleach Shop`)
      .setDescription(lines.join("\n\n"));
  }


  /* ================= JJK ================= */

  const inv = player.jjk.items;

  const lines = JJK_SHOP_ITEMS.map(it => {

    const owned = inv[it.key]
      ? "✅ Owned"
      : `${E_CE} ${it.price}`;

    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });


  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${logo} JJK Shop`)
    .setDescription(lines.join("\n\n"));
}


/* ===================== EXPORT ===================== */

module.exports = {

  leaderboardEmbed,
  inventoryEmbed,
  shopEmbed,
};
