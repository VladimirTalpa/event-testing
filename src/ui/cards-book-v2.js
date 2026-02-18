const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const { CARD_POOL, cardStatsAtLevel, cardPower } = require("../data/cards");
const { buildCardCollectionImage } = require("./card-collection");

const PAGE_SIZE = 6;

function safeName(v) {
  return String(v || "unknown").replace(/[*_`~|]/g, "").slice(0, 60);
}

function collectRowsForPlayer(player, eventKey) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const cardsMap = ek === "bleach" ? (player?.cards?.bleach || {}) : (player?.cards?.jjk || {});
  const levels = ek === "bleach" ? (player?.cardLevels?.bleach || {}) : (player?.cardLevels?.jjk || {});
  const rows = [];
  for (const c of CARD_POOL[ek] || []) {
    const amount = Math.max(0, Number(cardsMap[c.id] || 0));
    if (amount <= 0) continue;
    const lv = Math.max(1, Number(levels[c.id] || 1));
    const stats = cardStatsAtLevel(c, lv);
    const power = cardPower(stats);
    rows.push({ card: c, amount, level: lv, power });
  }
  rows.sort((a, b) => b.power - a.power);
  return rows;
}

function toPage(rows, page) {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const p = Math.max(0, Math.min(totalPages - 1, Number(page || 0)));
  const slice = rows.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);
  return { page: p, totalPages, slice };
}

async function buildCardsBookPayload({ eventKey, targetId, targetName, ownerId, rows, page }) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const { page: p, totalPages, slice } = toPage(rows, page);
  const totalCards = rows.reduce((sum, x) => sum + x.amount, 0);
  const top = rows[0];

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${ek.toUpperCase()} Collection\n` +
        `Player: **${safeName(targetName)}**\n` +
        `Unique: **${rows.length}** • Total Cards: **${totalCards}**`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Top Card: **${top.card.name}** (Lv.${top.level}, PWR ${top.power})\n` +
        `Book Page: **${p + 1}/${totalPages}** • Cards on page: **${slice.length}**\n` +
        `Stats are rendered on the card images.`
      )
    );

  const files = [];
  const imageRows = slice.map((x) => ({
    card: x.card,
    amount: x.amount,
    level: x.level,
    power: x.power,
  }));

  const png = await buildCardCollectionImage({
    eventKey: ek,
    username: safeName(targetName),
    ownedRows: imageRows,
  }).catch(() => null);

  if (png) {
    const fileName = `cards-${ek}-${targetId}-p${p + 1}.png`;
    files.push({ attachment: png, name: fileName });

    if (typeof MediaGalleryBuilder === "function" && typeof MediaGalleryItemBuilder === "function") {
      try {
        const gallery = new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`)
        );
        container.addMediaGalleryComponents(gallery);
      } catch {}
    }
  } else {
    const lines = slice.map((x, i) => `${i + 1}. **${x.card.name}** • Lv.${x.level} • x${x.amount} • PWR ${x.power}`);
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n") || "No card images/stats found."));
  }

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cardsbook_nav:${ek}:${targetId}:${ownerId}:${p}:prev`)
        .setLabel("Prev")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(p <= 0),
      new ButtonBuilder()
        .setCustomId(`cardsbook_nav:${ek}:${targetId}:${ownerId}:${p}:next`)
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(p >= totalPages - 1)
    )
  );

  return {
    files,
    components: [container],
    meta: { page: p, totalPages, shown: slice.length },
  };
}

module.exports = {
  collectRowsForPlayer,
  buildCardsBookPayload,
};
