// src/core/profile_helpers.js
const { safeName } = require("./utils");

function getCardsSummaryText(p) {
  const cards = p.cards || [];
  if (!cards.length) return "No cards yet.\nBuy packs in /store → Card Packs.";

  // маленький красивый список
  const lines = cards.slice(0, 12).map((c) => {
    const stars = c.stars ? `${c.stars}⭐` : "0⭐";
    return `• **${safeName(c.name)}** — ${c.rarity} — Lv.${c.level} — ${stars}`;
  });

  let more = "";
  if (cards.length > 12) more = `\n…and **${cards.length - 12}** more`;

  return lines.join("\n") + more;
}

function getTitlesText(guild, p) {
  const roles = (p.ownedRoles || [])
    .map((rid) => guild.roles.cache.get(rid))
    .filter(Boolean);

  if (!roles.length) return "You don't own any titles yet.";

  return roles.slice(0, 25).map((r) => `• <@&${r.id}>`).join("\n");
}

module.exports = {
  getCardsSummaryText,
  getTitlesText,
};
