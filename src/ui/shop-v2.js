const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

const { E_BLEACH, E_JJK, E_REIATSU, E_CE, E_DRAKO } = require("../config");
const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");

const PAGE_SIZE = 5;

function itemsByEvent(eventKey) {
  return eventKey === "bleach" ? BLEACH_SHOP_ITEMS : JJK_SHOP_ITEMS;
}

function getBalance(player, eventKey) {
  return eventKey === "bleach" ? Number(player?.bleach?.reiatsu || 0) : Number(player?.jjk?.cursedEnergy || 0);
}

function getInventory(player, eventKey) {
  return eventKey === "bleach" ? (player?.bleach?.items || {}) : (player?.jjk?.items || {});
}

function getCardsOwnedCount(player, eventKey) {
  const cards = eventKey === "bleach" ? player?.cards?.bleach : player?.cards?.jjk;
  if (!cards || typeof cards !== "object") return 0;
  return Object.values(cards).reduce((sum, x) => sum + Math.max(0, Number(x || 0)), 0);
}

function currencyEmoji(eventKey) {
  return eventKey === "bleach" ? E_REIATSU : E_CE;
}

function pageClamp(page, totalItems) {
  const maxPage = Math.max(0, Math.ceil(totalItems / PAGE_SIZE) - 1);
  return Math.max(0, Math.min(maxPage, Number(page || 0)));
}

function statusLabel(item, inv, balance) {
  if (item.type === "pack") {
    if (balance >= item.price) return "Can Open";
    return `Need ${item.price - balance} more`;
  }
  if (inv[item.key]) return "Owned";
  if (balance >= item.price) return "Can Buy";
  return `Need ${item.price - balance} more`;
}

function buyDisabled(item, inv, balance) {
  if (!item) return true;
  if (item.type === "pack") return balance < item.price;
  return !!inv[item.key] || balance < item.price;
}

function buildShopV2Payload({ eventKey, player, page = 0, selectedKey = null, withFlags = false, ephemeral = false }) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const eventItems = itemsByEvent(ek);
  const inv = getInventory(player, ek);
  const balance = getBalance(player, ek);
  const curr = currencyEmoji(ek);
  const eventIcon = ek === "bleach" ? E_BLEACH : E_JJK;
  const pageNo = pageClamp(page, eventItems.length);
  const totalPages = Math.max(1, Math.ceil(eventItems.length / PAGE_SIZE));
  const start = pageNo * PAGE_SIZE;
  const pageItems = eventItems.slice(start, start + PAGE_SIZE);
  const selected = pageItems.find((x) => x.key === selectedKey) || pageItems[0] || null;

  const cardsOwned = getCardsOwnedCount(player, ek);
  const header = `## ${eventIcon} SHOP`;
  const topInfo =
    `Balance: ${curr} **${balance}**  |  ${E_DRAKO} Drako: **${Number(player?.drako || 0)}**\n` +
    `Cards: **${cardsOwned}**  |  Page: **${pageNo + 1}/${totalPages}**  |  Event: **${ek.toUpperCase()}**`;

  const eventMenu = new StringSelectMenuBuilder()
    .setCustomId(`shopv2_event:${pageNo}:${selected?.key || "none"}`)
    .setPlaceholder("Choose event")
    .addOptions(
      { label: "Bleach", value: "bleach", default: ek === "bleach", description: "Reiatsu items + card pack" },
      { label: "JJK", value: "jjk", default: ek === "jjk", description: "Cursed Energy items + card pack" }
    );

  const itemOptions = pageItems.map((it) => ({
    label: `${it.name}`.slice(0, 100),
    value: it.key,
    default: selected?.key === it.key,
    description: statusLabel(it, inv, balance).slice(0, 100),
  }));

  const itemMenu = new StringSelectMenuBuilder()
    .setCustomId(`shopv2_pick:${ek}:${pageNo}`)
    .setPlaceholder("Select item for details")
    .addOptions(itemOptions);

  const prevBtn = new ButtonBuilder()
    .setCustomId(`shopv2_nav:${ek}:${pageNo}:${selected?.key || "none"}:prev`)
    .setLabel("Prev")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(pageNo <= 0);
  const nextBtn = new ButtonBuilder()
    .setCustomId(`shopv2_nav:${ek}:${pageNo}:${selected?.key || "none"}:next`)
    .setLabel("Next")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(pageNo >= totalPages - 1);

  const canBuy = !buyDisabled(selected, inv, balance);
  const buyBtn = new ButtonBuilder()
    .setCustomId(`shopv2_buy:${ek}:${pageNo}:${selected?.key || "none"}`)
    .setLabel(selected?.type === "pack" ? "Open Pack" : "Buy Selected")
    .setStyle(ButtonStyle.Success)
    .setDisabled(!canBuy);

  let details = "### No items";
  if (selected) {
    const lines = [
      `### ${selected.name}`,
      `Status: **${statusLabel(selected, inv, balance)}**`,
      `Price: ${curr} **${selected.price}**`,
      `Effect: ${selected.desc || "-"}`,
    ];
    if (selected.type === "pack") {
      lines.push("Contains: **1 random card** (Common/Rare/Epic/Legendary)");
    }
    details = lines.join("\n");
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${header}\n${topInfo}`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(new ActionRowBuilder().addComponents(eventMenu))
    .addActionRowComponents(new ActionRowBuilder().addComponents(itemMenu))
    .addActionRowComponents(new ActionRowBuilder().addComponents(prevBtn, nextBtn, buyBtn))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(details));

  const payload = { components: [container] };
  if (withFlags) payload.flags = MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0);
  return payload;
}

module.exports = { buildShopV2Payload };
