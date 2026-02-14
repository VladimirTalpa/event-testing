const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const cfg = require("../config");
const { getPlayer, setPlayer } = require("../core/players");
const { CARD_BY_ID } = require("../data/cards");

function randId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

async function craft(userId, type) {
  if (!["weapon", "armor"].includes(type)) return { ok: false, error: "Unknown gear type." };

  const p = await getPlayer(userId);

  // cost: shards + little drako
  const shardCost = type === "weapon" ? 8 : 8;
  const drakoCost = type === "weapon" ? 3 : 3;

  // выбираем shards по “доминирующей фракции” игрока (простая логика)
  const useBleach = (p.bleach.reiatsu || 0) >= (p.jjk.cursedEnergy || 0);
  const shardKey = useBleach ? "bleach" : "jjk";

  if (p.shards[shardKey] < shardCost) return { ok: false, error: `Need ${shardCost} ${shardKey} shards.` };
  if (p.drako < drakoCost) return { ok: false, error: `Need ${drakoCost} drako.` };

  p.shards[shardKey] -= shardCost;
  p.drako -= drakoCost;

  const item = {
    id: randId(),
    type,
    name: type === "weapon" ? "Forged Weapon" : "Forged Armor",
    atk: type === "weapon" ? 12 + Math.floor(Math.random() * 10) : 0,
    hp: type === "armor" ? 40 + Math.floor(Math.random() * 40) : 0,
    equippedTo: null, // instanceId
  };

  p.gears.push(item);
  await setPlayer(userId, p);

  return { ok: true };
}

function assignState(p) {
  p.gearAssign ||= { cardInstanceId: null };
  return p.gearAssign;
}

async function startAssignFlow(userId) {
  const p = await getPlayer(userId);
  if (!p.cards.length) return { content: "❌ You have 0 cards.", embeds: [], components: [] };
  if (!p.gears.length) return { content: "❌ You have 0 gears. Craft some first.", embeds: [], components: [] };

  const st = assignState(p);
  st.cardInstanceId = null;
  await setPlayer(userId, p);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("gear:assign:card")
    .setPlaceholder("Select a card…")
    .addOptions(
      p.cards.slice(0, 25).map((ci) => {
        const base = CARD_BY_ID.get(ci.cardId);
        return {
          label: base ? `${base.name}` : `Unknown (${ci.cardId})`,
          value: ci.instanceId,
          description: base ? `${base.rarity} • Lv.${ci.level} ⭐${ci.stars}` : "Unknown",
        };
      })
    );

  const embed = new EmbedBuilder()
    .setColor(cfg.COLOR || 0x8a2be2)
    .setTitle("🛡 Equip / Unequip")
    .setDescription("Step 1: Select a **card**.");

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}

async function assignChooseCard(userId, instanceId) {
  const p = await getPlayer(userId);
  const inst = p.cards.find((c) => c.instanceId === instanceId);
  if (!inst) return { content: "❌ Card not found.", embeds: [], components: [] };

  const st = assignState(p);
  st.cardInstanceId = instanceId;
  await setPlayer(userId, p);

  const gears = (p.gears || []).slice(0, 25);
  const options = gears.map((g) => {
    const stat = g.type === "weapon" ? `+${g.atk} ATK` : `+${g.hp} HP`;
    const eq = g.equippedTo ? " (equipped)" : "";
    return { label: `${g.name}${eq}`, value: g.id, description: `${g.type} • ${stat}` };
  });

  // add "unequip all" pseudo option
  options.unshift({ label: "Unequip ALL from this card", value: "UNEQUIP_ALL", description: "Remove weapon+armor" });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("gear:assign:gear")
    .setPlaceholder("Select a gear to equip OR unequip…")
    .addOptions(options);

  const base = CARD_BY_ID.get(inst.cardId);

  const embed = new EmbedBuilder()
    .setColor(cfg.COLOR || 0x8a2be2)
    .setTitle("🛡 Equip / Unequip")
    .setDescription(`Step 2: Choose gear for **${base ? base.name : "Unknown"}**`);

  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}

async function assignChooseGear(userId, gearId) {
  const p = await getPlayer(userId);
  const st = assignState(p);
  const cardId = st.cardInstanceId;

  const inst = p.cards.find((c) => c.instanceId === cardId);
  if (!inst) return { content: "❌ Card not found (flow reset).", embeds: [], components: [] };

  if (gearId === "UNEQUIP_ALL") {
    // unequip weapon/armor from this card
    for (const g of p.gears) {
      if (g.equippedTo === inst.instanceId) g.equippedTo = null;
    }
    inst.weaponGearId = null;
    inst.armorGearId = null;
    await setPlayer(userId, p);

    return {
      embeds: [
        new EmbedBuilder()
          .setColor(cfg.COLOR || 0x8a2be2)
          .setTitle("🛡 Unequipped")
          .setDescription("✅ Removed all gear from the selected card."),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("profile:nav:gears").setLabel("Back to Gears").setStyle(ButtonStyle.Secondary)
        ),
      ],
    };
  }

  const gear = p.gears.find((g) => g.id === gearId);
  if (!gear) return { content: "❌ Gear not found.", embeds: [], components: [] };

  // if gear equipped elsewhere, unequip first
  if (gear.equippedTo && gear.equippedTo !== inst.instanceId) {
    const other = p.cards.find((c) => c.instanceId === gear.equippedTo);
    if (other) {
      if (gear.type === "weapon") other.weaponGearId = null;
      else other.armorGearId = null;
    }
  }

  // equip onto selected card
  gear.equippedTo = inst.instanceId;
  if (gear.type === "weapon") inst.weaponGearId = gear.id;
  else inst.armorGearId = gear.id;

  await setPlayer(userId, p);

  const stat = gear.type === "weapon" ? `+${gear.atk} ATK` : `+${gear.hp} HP`;
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(cfg.COLOR || 0x8a2be2)
        .setTitle("🛡 Equipped")
        .setDescription(`✅ Equipped **${gear.name}** (${gear.type}) on the selected card.\n${stat}`),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("profile:nav:gears").setLabel("Back to Gears").setStyle(ButtonStyle.Secondary)
      ),
    ],
  };
}

module.exports = {
  craft,
  startAssignFlow,
  assignChooseCard,
  assignChooseGear,
};
