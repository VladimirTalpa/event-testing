const { EmbedBuilder } = require("discord.js");
const {
  COLOR,
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

/* ===== bonuses / multipliers (оставляю как у тебя) ===== */
function calcBleachSurvivalBonus(items) {
  let bonus = 0;
  if (items.zanpakuto_basic) bonus += 4;
  if (items.hollow_mask_fragment) bonus += 7;
  if (items.soul_reaper_cloak) bonus += 9;
  if (items.reiatsu_amplifier) bonus += 2;
  return bonus;
}
function calcBleachReiatsuMultiplier(items) {
  return items.reiatsu_amplifier ? 1.25 : 1.0;
}
function calcBleachDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.zanpakuto_basic) mult += 0.05;
  if (items.hollow_mask_fragment) mult += 0.10;
  if (items.soul_reaper_cloak) mult += 0.06;
  return mult;
}

function calcJjkSurvivalBonus(items) {
  let bonus = 0;
  if (items.black_flash_manual) bonus += 2;
  if (items.domain_charm) bonus += 8;
  if (items.cursed_tool) bonus += 10;
  if (items.reverse_talisman) bonus += 0;
  if (items.binding_vow_seal) bonus += 15;
  return bonus;
}
function calcJjkCEMultiplier(items) {
  let mult = 1.0;
  if (items.black_flash_manual) mult *= 1.20;
  if (items.binding_vow_seal) mult *= 0.90;
  return mult;
}
function calcJjkDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.cursed_tool) mult += 0.08;
  return mult;
}

/* ===================== NEW: MENU EMBEDS ===================== */
function menuEmbed(user) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("📜 Menu")
    .setDescription(
      [
        `Hello, **${safeName(user.username)}**.`,
        "",
        "Choose a section:",
        "🎒 Inventory • 🃏 Cards • 🛒 Packs • 👤 Profile • 🏆 Drako Top",
      ].join("\n")
    );
}

function profileEmbed(user, player) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`👤 Profile — ${safeName(user.username)}`)
    .setDescription(
      [
        `${E_DRAKO} Drako: **${player.drako}**`,
        "",
        `${E_BLEACH} Bleach`,
        `${E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**`,
        `⭐ Boss bonus: **${player.bleach.survivalBonus}%**`,
        "",
        `${E_JJK} JJK`,
        `${E_CE} Cursed Energy: **${player.jjk.cursedEnergy}**`,
        `⭐ Boss bonus: **${player.jjk.survivalBonus}%**`,
        "",
        `🧥 Wardrobe roles saved: **${player.ownedRoles.length}**`,
      ].join("\n")
    );
}

function drakoLeaderboardEmbed(entries) {
  const lines = entries.map((e, i) => `**#${i + 1}** — ${safeName(e.name)}: **${E_DRAKO} ${e.score}**`);
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🏆 Drako Leaderboard`)
    .setDescription(lines.join("\n") || "No data yet.");
}

/* ===================== EXISTING (твои) ===================== */
function inventoryEmbed(eventKey, player, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const itemBonus = calcBleachSurvivalBonus(inv);
    const mult = calcBleachReiatsuMultiplier(inv);

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${E_BLEACH} Bleach — Inventory`)
      .setDescription(
        [
          `${E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**`,
          `${E_DRAKO} Drako Coin: **${player.drako}**`,
          `🔁 Drako rate: **${DRAKO_RATE_BLEACH} ${E_REIATSU} = 1 ${E_DRAKO}** (one-way)`,
          "",
          `⭐ Boss bonus (mob kills): **${player.bleach.survivalBonus}% / ${bonusMaxBleach}%**`,
          `🛡 Item survival bonus: **${itemBonus}%**`,
          `🍀 Drop luck: **x${calcBleachDropLuckMultiplier(inv).toFixed(2)}**`,
          `💰 Reward multiplier: **x${mult.toFixed(2)}**`,
          "",
          `• Zanpakutō: ${inv.zanpakuto_basic ? "✅" : "❌"}`,
          `• Mask Fragment: ${inv.hollow_mask_fragment ? "✅" : "❌"}`,
          `• Cloak: ${inv.soul_reaper_cloak ? "✅" : "❌"}`,
          `• Amplifier: ${inv.reiatsu_amplifier ? "✅" : "❌"}`,
          `• Aizen role: ${inv.cosmetic_role ? "✅" : "❌"}`,
          "",
          `🧥 Wardrobe saved roles: **${player.ownedRoles.length}**`,
        ].join("\n")
      );
  }

  const inv = player.jjk.items;
  const itemBonus = calcJjkSurvivalBonus(inv);
  const mult = calcJjkCEMultiplier(inv);
  const mats = player.jjk.materials || { cursedShards: 0, expeditionKeys: 0 };

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_JJK} Jujutsu Kaisen — Inventory`)
    .setDescription(
      [
        `${E_CE} Cursed Energy: **${player.jjk.cursedEnergy}**`,
        `${E_DRAKO} Drako Coin: **${player.drako}**`,
        `🔁 Drako rate: **${DRAKO_RATE_JJK} ${E_CE} = 1 ${E_DRAKO}** (one-way)`,
        "",
        `🧩 Materials:`,
        `• Cursed Shards: **${mats.cursedShards}**`,
        `• Expedition Keys: **${mats.expeditionKeys}**`,
        "",
        `⭐ Boss bonus (mob kills): **${player.jjk.survivalBonus}% / ${bonusMaxJjk}%**`,
        `🛡 Item survival bonus: **${itemBonus}%**`,
        `🍀 Drop luck: **x${calcJjkDropLuckMultiplier(inv).toFixed(2)}**`,
        `💰 Reward multiplier: **x${mult.toFixed(2)}**`,
        "",
        `• Black Flash Manual: ${inv.black_flash_manual ? "✅" : "❌"}`,
        `• Domain Charm: ${inv.domain_charm ? "✅" : "❌"}`,
        `• Cursed Tool: ${inv.cursed_tool ? "✅" : "❌"}`,
        `• Reverse Talisman: ${inv.reverse_talisman ? "✅" : "❌"}`,
        `• Binding Vow Seal: ${inv.binding_vow_seal ? "✅" : "❌"}`,
        "",
        `🧥 Wardrobe saved roles: **${player.ownedRoles.length}**`,
      ].join("\n")
    );
}

function shopEmbed(eventKey, player) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const lines = BLEACH_SHOP_ITEMS.map((it) => {
      const owned = inv[it.key] ? "✅ Owned" : `${E_REIATSU} ${it.price} Reiatsu`;
      return `**${it.name}** — ${owned}\n> ${it.desc}`;
    });

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${E_BLEACH} Bleach — Shop`)
      .setDescription(lines.join("\n\n"))
      .addFields(
        { name: `${E_REIATSU} Your Reiatsu`, value: `\`${player.bleach.reiatsu}\``, inline: true },
        { name: `${E_DRAKO} Your Drako`, value: `\`${player.drako}\``, inline: true },
        { name: `🔁 Drako rate`, value: `\`${DRAKO_RATE_BLEACH} Reiatsu = 1 Drako (one-way)\``, inline: false }
      );
  }

  const inv = player.jjk.items;
  const lines = JJK_SHOP_ITEMS.map((it) => {
    const owned = inv[it.key] ? "✅ Owned" : `${E_CE} ${it.price} Cursed Energy`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_JJK} Jujutsu Kaisen — Shop`)
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: `${E_CE} Your Cursed Energy`, value: `\`${player.jjk.cursedEnergy}\``, inline: true },
      { name: `${E_DRAKO} Your Drako`, value: `\`${player.drako}\``, inline: true },
      { name: `🔁 Drako rate`, value: `\`${DRAKO_RATE_JJK} Cursed Energy = 1 Drako (one-way)\``, inline: false }
    );
}

module.exports = {
  // NEW
  menuEmbed,
  profileEmbed,
  drakoLeaderboardEmbed,

  // EXISTING
  inventoryEmbed,
  shopEmbed,

  calcBleachSurvivalBonus,
  calcBleachReiatsuMultiplier,
  calcBleachDropLuckMultiplier,
  calcJjkSurvivalBonus,
  calcJjkCEMultiplier,
  calcJjkDropLuckMultiplier,
};
