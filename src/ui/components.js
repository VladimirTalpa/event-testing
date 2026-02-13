// src/ui/components.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

const { EVENT_ROLE_IDS, BOOSTER_ROLE_ID } = require("../config");

const CID = {
  // ========= UI NAV =========
  UI_PROFILE: "ui_profile", // ui_profile:<tab>
  UI_STORE: "ui_store",     // ui_store:<tab>:<anime?>
  UI_FORGE: "ui_forge",     // ui_forge:<tab>
  UI_EXPE: "ui_expe",       // ui_expe:<action>

  // ========= STORE ACTIONS =========
  OPEN_PACK: "open_pack",   // open_pack:<anime>:<packType>
  // ========= PROFILE ACTIONS =========
  VIEW_CARD: "view_card",   // view_card:<cardId>
  // ========= EXPEDITION ACTIONS =========
  EXPE_PICK: "expe_pick",   // expe_pick:<anime>
  EXPE_START: "expe_start", // expe_start:<anime>:<cardId1>,<cardId2>,<cardId3>
};

function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
}
function hasBoosterRole(member) {
  return !!member?.roles?.cache?.has(BOOSTER_ROLE_ID);
}

/* ===================== MAIN NAV ===================== */
function profileNav(tab = "currency") {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${CID.UI_PROFILE}:currency`).setLabel("Currency").setStyle(tab === "currency" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CID.UI_PROFILE}:cards`).setLabel("Cards").setStyle(tab === "cards" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CID.UI_PROFILE}:gears`).setLabel("Gears").setStyle(tab === "gears" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CID.UI_PROFILE}:titles`).setLabel("Titles").setStyle(tab === "titles" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CID.UI_PROFILE}:leaderboard`).setLabel("Leaderboard").setStyle(tab === "leaderboard" ? ButtonStyle.Primary : ButtonStyle.Secondary)
    ),
  ];
}

function storeNav(tab = "packs") {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${CID.UI_STORE}:eventshop`).setLabel("Event Shop").setStyle(tab === "eventshop" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CID.UI_STORE}:packs`).setLabel("Card Packs").setStyle(tab === "packs" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CID.UI_STORE}:gearshop`).setLabel("Gear Shop").setStyle(tab === "gearshop" ? ButtonStyle.Primary : ButtonStyle.Secondary)
    ),
  ];
}

function forgeNav(tab = "craft") {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${CID.UI_FORGE}:craft`).setLabel("Craft").setStyle(tab === "craft" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CID.UI_FORGE}:evolve`).setLabel("Evolve").setStyle(tab === "evolve" ? ButtonStyle.Primary : ButtonStyle.Secondary)
    ),
  ];
}

/* ===================== STORE PACK BUTTONS ===================== */
function packButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${CID.OPEN_PACK}:bleach:basic`).setLabel("Open Basic (Bleach)").setEmoji("🩸").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CID.OPEN_PACK}:bleach:legendary`).setLabel("Open Legendary (Bleach)").setEmoji("🩸").setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${CID.OPEN_PACK}:jjk:basic`).setLabel("Open Basic (JJK)").setEmoji("🟣").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CID.OPEN_PACK}:jjk:legendary`).setLabel("Open Legendary (JJK)").setEmoji("🟣").setStyle(ButtonStyle.Danger)
    ),
  ];
}

/* ===================== CARD SELECT (profile -> cards) ===================== */
function cardsSelectMenu(player, anime = "all") {
  const cards = player.cards || [];
  const filtered = anime === "all" ? cards : cards.filter((c) => c.anime === anime);

  if (!filtered.length) return [];

  const options = filtered.slice(0, 25).map((c) => {
    const label = `${c.rarity} • ${c.charKey}`;
    const desc = `Lv ${c.level} • ⭐${c.stars} • ${c.status}`;
    return { label: label.slice(0, 100), value: c.id, description: desc.slice(0, 100) };
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("profile_cards_select")
    .setPlaceholder("Select a card to view")
    .addOptions(options);

  return [new ActionRowBuilder().addComponents(menu)];
}

/* ===================== EXPEDITION PICK MENU (choose 3 heroes) ===================== */
function expeditionPickMenu(player, anime) {
  const cards = (player.cards || []).filter((c) => c.anime === anime && c.status === "idle");
  if (!cards.length) return [];

  const options = cards.slice(0, 25).map((c) => {
    const label = `${c.rarity} • ${c.charKey}`;
    const desc = `Lv ${c.level} • ⭐${c.stars}`;
    return { label: label.slice(0, 100), value: c.id, description: desc.slice(0, 100) };
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`expedition_party_select:${anime}`)
    .setPlaceholder("Pick 3 heroes (select 3)")
    .setMinValues(3)
    .setMaxValues(3)
    .addOptions(options);

  return [new ActionRowBuilder().addComponents(menu)];
}

module.exports = {
  CID,
  hasEventRole,
  hasBoosterRole,
  profileNav,
  storeNav,
  forgeNav,
  packButtons,
  cardsSelectMenu,
  expeditionPickMenu,
};
