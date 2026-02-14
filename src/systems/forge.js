const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const cfg = require("../config");
const { getPlayer, setPlayer } = require("../core/players");
const { CARD_BY_ID } = require("../data/cards");

function buildEvolveSelectMenu(player) {
  const options = (player.cards || []).slice(0, 25).map((ci) => {
    const base = CARD_BY_ID.get(ci.cardId);
    const label = base ? `${base.name} (${base.rarity})` : `Unknown (${ci.cardId})`;
    const desc = base ? `${base.anime.toUpperCase()} • Lv.${ci.level} ⭐${ci.stars}` : "Unknown";
    return { label, value: ci.instanceId, description: desc };
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("forge:evolve:select")
    .setPlaceholder("Select a card to evolve…")
    .addOptions(options.length ? options : [{ label: "No cards", value: "none", description: "You need cards" }]);

  return new ActionRowBuilder().addComponents(menu);
}

function findMythicVariant(baseCard) {
  // ищем карту с таким же именем но (Mythic) или id _m
  if (!baseCard) return null;

  // hard mapping for your set:
  const map = {
    jjk_toji: "jjk_toji_m",
    bl_ichigo: "bl_ichigo_m",
  };
  if (map[baseCard.id]) return CARD_BY_ID.get(map[baseCard.id]) || null;

  // fallback: try "_m"
  const maybe = CARD_BY_ID.get(baseCard.id + "_m");
  return maybe || null;
}

async function handleEvolve(userId, instanceId) {
  const p = await getPlayer(userId);
  const inst = (p.cards || []).find((c) => c.instanceId === instanceId);
  if (!inst) return { content: "❌ Card not found.", embeds: [], components: [] };

  const base = CARD_BY_ID.get(inst.cardId);
  if (!base) return { content: "❌ Card base not found.", embeds: [], components: [] };

  const anime = base.anime;
  const shardKey = anime === "bleach" ? "bleach" : "jjk";

  // Rare -> Legendary
  if (base.rarity === "Rare") {
    if (p.shards[shardKey] < cfg.EVOLVE_RARE_TO_LEGENDARY_SHARDS) {
      return { content: `❌ Need ${cfg.EVOLVE_RARE_TO_LEGENDARY_SHARDS} ${shardKey} shards.`, embeds: [], components: [] };
    }
    if (p.drako < cfg.EVOLVE_RARE_TO_LEGENDARY_DRKO) {
      return { content: `❌ Need ${cfg.EVOLVE_RARE_TO_LEGENDARY_DRKO} drako.`, embeds: [], components: [] };
    }

    p.shards[shardKey] -= cfg.EVOLVE_RARE_TO_LEGENDARY_SHARDS;
    p.drako -= cfg.EVOLVE_RARE_TO_LEGENDARY_DRKO;

    // апгрейд rarity без смены base (упрощение) — меняем cardId на “легендарного” если есть, иначе апним звёзды
    // для твоего набора нет отдельных Legendary версий Chad/Orihime/Panda/Todo — поэтому даём boost:
    inst.stars += 1;
    inst.level += 10;

    await setPlayer(userId, p);

    return {
      embeds: [
        new EmbedBuilder()
          .setColor(cfg.COLOR || 0x8a2be2)
          .setTitle("🔺 Evolved (Rare → Legendary)")
          .setDescription(`✅ ${base.name} evolved.\n(Boosted: +10 levels and +1⭐)`)
          .setImage(base.art),
      ],
      components: [],
    };
  }

  // Legendary -> Mythic
  if (base.rarity === "Legendary") {
    if (p.shards[shardKey] < cfg.EVOLVE_LEGENDARY_TO_MYTHIC_SHARDS) {
      return { content: `❌ Need ${cfg.EVOLVE_LEGENDARY_TO_MYTHIC_SHARDS} ${shardKey} shards.`, embeds: [], components: [] };
    }
    if (p.drako < cfg.EVOLVE_LEGENDARY_TO_MYTHIC_DRKO) {
      return { content: `❌ Need ${cfg.EVOLVE_LEGENDARY_TO_MYTHIC_DRKO} drako.`, embeds: [], components: [] };
    }

    const mythic = findMythicVariant(base);
    if (!mythic) {
      return { content: "❌ Mythic variant not found for this card.", embeds: [], components: [] };
    }

    p.shards[shardKey] -= cfg.EVOLVE_LEGENDARY_TO_MYTHIC_SHARDS;
    p.drako -= cfg.EVOLVE_LEGENDARY_TO_MYTHIC_DRKO;

    // swap base card to mythic id
    inst.cardId = mythic.id;
    inst.stars += 1;
    inst.level += 20;

    await setPlayer(userId, p);

    return {
      embeds: [
        new EmbedBuilder()
          .setColor(cfg.COLOR || 0x8a2be2)
          .setTitle("💠 Evolved (Legendary → Mythic)")
          .setDescription(`✅ ${base.name} evolved to **${mythic.name}**.\n(Boosted: +20 levels and +1⭐)`)
          .setImage(mythic.art),
      ],
      components: [],
    };
  }

  return { content: "❌ This card cannot be evolved.", embeds: [], components: [] };
}

module.exports = {
  buildEvolveSelectMenu,
  handleEvolve,
};
