const { EmbedBuilder } = require("discord.js");
const {
  COLOR,
  E_BLEACH,
  E_JJK,
  E_REIATSU,
  E_CE,
  E_DRAKO
} = require("../config");

function baseEmbed(title) {
  return new EmbedBuilder().setColor(COLOR).setTitle(title);
}

function balanceEmbed(user, player) {
  return baseEmbed(`Balance — ${user.username}`).setDescription(
    [
      `${E_REIATSU} **Reiatsu:** ${player.bleach.reiatsu}`,
      `${E_CE} **Cursed Energy:** ${player.jjk.cursedEnergy}`,
      `${E_DRAKO} **Drako:** ${player.drako}`
    ].join("\n")
  );
}

function shopEmbed(eventKey, items) {
  const title = eventKey === "bleach" ? `${E_BLEACH} Bleach Shop` : `${E_JJK} JJK Shop`;
  const e = baseEmbed(title);
  if (!items.length) return e.setDescription("No items.");
  for (const it of items) {
    const priceLine =
      it.currency === "reiatsu"
        ? `${E_REIATSU} ${it.price}`
        : it.currency === "cursed_energy"
          ? `${E_CE} ${it.price}`
          : `${E_DRAKO} ${it.price}`;
    e.addFields({ name: `${it.name} — ${priceLine}`, value: it.description || "—", inline: false });
  }
  e.setFooter({ text: "Use buttons below. Close available." });
  return e;
}

function inventoryEmbed(eventKey, user, player) {
  const title = eventKey === "bleach" ? `${E_BLEACH} Inventory — ${user.username}` : `${E_JJK} Inventory — ${user.username}`;
  const items = player.inventory[eventKey] || [];
  const e = baseEmbed(title);
  e.setDescription(items.length ? items.map((x, i) => `**${i + 1}.** ${x}`).join("\n") : "Empty.");
  return e;
}

module.exports = {
  balanceEmbed,
  shopEmbed,
  inventoryEmbed,
  baseEmbed
};
