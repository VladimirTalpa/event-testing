// src/ui/cardEmbeds.js
const { EmbedBuilder } = require("discord.js");
const { COLOR, CARD_GIF_PLACEHOLDER } = require("../config");

function rarityTag(r) {
  if (r === "common") return "⚪ Common";
  if (r === "rare") return "🟦 Rare";
  if (r === "legendary") return "🟨 Legendary";
  if (r === "mythic") return "🟥 Mythic";
  return r;
}
function roleTag(role) {
  if (role === "dps") return "⚔ DPS";
  if (role === "tank") return "🛡 Tank";
  if (role === "support") return "✨ Support";
  return role;
}

function cardEmbed(card, opts = {}) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🃏 ${card.name}`)
    .setDescription(
      [
        `**Anime:** ${card.anime === "bleach" ? "🩸 Bleach" : "🟣 JJK"}`,
        `**Rarity:** ${rarityTag(card.rarity)}`,
        `**Role:** ${roleTag(card.role)}`,
        "",
        `❤️ HP: **${card.stats.hp}**`,
        `⚔ ATK: **${card.stats.atk}**`,
        `🛡 DEF: **${card.stats.def}**`,
        card.passiveText ? `\n**Passive:** ${card.passiveText}` : "",
      ].join("\n")
    )
    .setImage(opts.imageUrl || CARD_GIF_PLACEHOLDER)
    .setFooter(opts.footer ? { text: opts.footer } : null);
}

module.exports = { cardEmbed };
