// src/handlers/buttons.js
const { getPlayer, setPlayer } = require("../core/players");
const { rollFromPool, createCardInstance, CARDS } = require("../core/rpg");
const { safeName } = require("../core/utils");

const {
  CID,
  profileNav,
  storeNav,
  forgeNav,
  packButtons,
  cardsSelectMenu,
  expeditionPickMenu,
} = require("../ui/components");

const {
  profileCurrencyEmbed,
  profileCardsEmbed,
  cardDetailsEmbed,
  profileGearsEmbed,
  profileTitlesEmbed,
  profileLeaderboardEmbed,

  storePacksEmbed,
  storeEventShopEmbed,
  storeGearShopEmbed,

  forgeCraftEmbed,
  forgeEvolveEmbed,

  expeditionsEmbed,
} = require("../ui/embeds");

const { PACK_PRICE_BASIC, PACK_PRICE_LEGENDARY, E_REIATSU, E_CE } = require("../config");
const { startExpedition } = require("../events/expeditions");

function isSameMessage(interaction) {
  return !!interaction.message?.id;
}

async function safeUpdate(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) return await interaction.editReply(payload);
    return await interaction.update(payload);
  } catch {
    try {
      // fallback: ephemeral followUp
      return await interaction.followUp({ content: "⚠️ Couldn't update UI.", ephemeral: true });
    } catch {}
  }
}

module.exports = async function handleButtons(interaction) {
  const cid = interaction.customId;

  // Try deferUpdate to avoid "interaction failed"
  try { await interaction.deferUpdate(); } catch {}

  /* ===================== PROFILE TABS ===================== */
  if (cid.startsWith(`${CID.UI_PROFILE}:`)) {
    const tab = cid.split(":")[1];
    const p = await getPlayer(interaction.user.id);

    if (tab === "currency") {
      return safeUpdate(interaction, { embeds: [profileCurrencyEmbed(p)], components: profileNav("currency") });
    }
    if (tab === "cards") {
      return safeUpdate(interaction, {
        embeds: [profileCardsEmbed(p)],
        components: [...profileNav("cards"), ...cardsSelectMenu(p, "all")],
      });
    }
    if (tab === "gears") {
      return safeUpdate(interaction, { embeds: [profileGearsEmbed()], components: profileNav("gears") });
    }
    if (tab === "titles") {
      return safeUpdate(interaction, { embeds: [profileTitlesEmbed()], components: profileNav("titles") });
    }
    if (tab === "leaderboard") {
      return safeUpdate(interaction, { embeds: [profileLeaderboardEmbed()], components: profileNav("leaderboard") });
    }
    return;
  }

  /* ===================== STORE TABS ===================== */
  if (cid.startsWith(`${CID.UI_STORE}:`)) {
    const tab = cid.split(":")[1];
    const p = await getPlayer(interaction.user.id);

    if (tab === "packs") {
      return safeUpdate(interaction, {
        embeds: [storePacksEmbed(p)],
        components: [...storeNav("packs"), ...packButtons()],
      });
    }
    if (tab === "eventshop") {
      return safeUpdate(interaction, { embeds: [storeEventShopEmbed()], components: storeNav("eventshop") });
    }
    if (tab === "gearshop") {
      return safeUpdate(interaction, { embeds: [storeGearShopEmbed()], components: storeNav("gearshop") });
    }
    return;
  }

  /* ===================== FORGE TABS ===================== */
  if (cid.startsWith(`${CID.UI_FORGE}:`)) {
    const tab = cid.split(":")[1];

    if (tab === "craft") {
      return safeUpdate(interaction, { embeds: [forgeCraftEmbed()], components: forgeNav("craft") });
    }
    if (tab === "evolve") {
      return safeUpdate(interaction, { embeds: [forgeEvolveEmbed()], components: forgeNav("evolve") });
    }
    return;
  }

  /* ===================== OPEN PACK ===================== */
  if (cid.startsWith(`${CID.OPEN_PACK}:`)) {
    const [, anime, packType] = cid.split(":");
    const p = await getPlayer(interaction.user.id);

    const isBleach = anime === "bleach";
    const price =
      packType === "basic"
        ? (isBleach ? PACK_PRICE_BASIC.bleach : PACK_PRICE_BASIC.jjk)
        : (isBleach ? PACK_PRICE_LEGENDARY.bleach : PACK_PRICE_LEGENDARY.jjk);

    // check funds
    if (isBleach) {
      if (p.bleach.reiatsu < price) {
        return interaction.followUp({ content: `❌ Need ${E_REIATSU} ${price}.`, ephemeral: true }).catch(() => {});
      }
      p.bleach.reiatsu -= price;
    } else {
      if (p.jjk.cursedEnergy < price) {
        return interaction.followUp({ content: `❌ Need ${E_CE} ${price}.`, ephemeral: true }).catch(() => {});
      }
      p.jjk.cursedEnergy -= price;
    }

    // roll card
    const charKey = rollFromPool(anime, packType);
    const card = createCardInstance(charKey);

    p.cards = Array.isArray(p.cards) ? p.cards : [];
    p.cards.push(card);
    await setPlayer(interaction.user.id, p);

    // "reveal" effect: edit UI and also send a short reveal message
    await interaction.followUp({
      content: `🎴 **Opening pack...**`,
      ephemeral: true,
    }).catch(() => {});

    const defName = charKey; // direct
    const embed = cardDetailsEmbed(card, defName);

    await interaction.followUp({
      content: `✅ You pulled **${defName}** (${card.rarity})`,
      embeds: [embed],
      ephemeral: true,
    }).catch(() => {});

    // refresh store view
    const newP = await getPlayer(interaction.user.id);
    if (isSameMessage(interaction)) {
      return safeUpdate(interaction, {
        embeds: [storePacksEmbed(newP)],
        components: [...storeNav("packs"), ...packButtons()],
      });
    }
    return;
  }

  /* ===================== EXPEDITIONS UI ===================== */
  // pick faction -> show select menu (pick 3 heroes)
  if (cid.startsWith("ui_expe:pick:")) {
    const anime = cid.split(":")[2]; // bleach / jjk
    const p = await getPlayer(interaction.user.id);

    const comps = expeditionPickMenu(p, anime);
    if (!comps.length) {
      return interaction.followUp({ content: "❌ No idle heroes for that faction.", ephemeral: true }).catch(() => {});
    }

    return interaction.followUp({
      content: `Select **3 heroes** for the expedition (${anime}).`,
      components: comps,
      ephemeral: true,
    }).catch(() => {});
  }

  // start expedition button (created by selects.js)
  if (cid.startsWith("ui_expe:start:")) {
    const parts = cid.split(":"); // ui_expe:start:<anime>:<id1>,<id2>,<id3>
    const anime = parts[2];
    const ids = (parts[3] || "").split(",").filter(Boolean);

    const res = await startExpedition(interaction, anime, ids).catch(() => ({ ok: false, reason: "Expedition crashed." }));
    if (!res.ok) {
      return interaction.followUp({ content: `❌ ${res.reason}`, ephemeral: true }).catch(() => {});
    }

    return interaction.followUp({
      content: `✅ Expedition scheduled! A public progress message was created in this channel.`,
      ephemeral: true,
    }).catch(() => {});
  }
};
