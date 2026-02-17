// src/ui/components.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");

const { EVENT_ROLE_IDS, BOOSTER_ROLE_ID } = require("../config");

const CID = {
  BOSS_JOIN: "boss_join",
  BOSS_RULES: "boss_rules",
  BOSS_ACTION: "boss_action",
  MOB_ATTACK: "mob_attack",
  PVP_ACCEPT: "pvp_accept",
  PVP_DECLINE: "pvp_decline",
};

function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
}

function hasBoosterRole(member) {
  return !!member?.roles?.cache?.has(BOOSTER_ROLE_ID);
}

function isBrokenEmojiString(v) {
  const s = String(v || "");
  return !s || /ðŸ|âš|ï¸|â€”|â€“/.test(s);
}

function applyOptionalEmoji(btn, emoji) {
  if (!emoji || isBrokenEmojiString(emoji)) return btn;
  try {
    return btn.setEmoji(emoji);
  } catch {
    return btn;
  }
}

function bossButtons(disabled = false) {
  const joinBtn = applyOptionalEmoji(
    new ButtonBuilder().setCustomId(CID.BOSS_JOIN).setLabel("Join Battle").setStyle(ButtonStyle.Danger).setDisabled(disabled),
    "🗡"
  );
  const rulesBtn = applyOptionalEmoji(
    new ButtonBuilder().setCustomId(CID.BOSS_RULES).setLabel("Rules").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    "📜"
  );
  return [new ActionRowBuilder().addComponents(joinBtn, rulesBtn)];
}

function singleActionRow(customId, label, emoji, disabled = false) {
  const btn = applyOptionalEmoji(
    new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(ButtonStyle.Danger).setDisabled(disabled),
    emoji
  );
  return [new ActionRowBuilder().addComponents(btn)];
}

function dualChoiceRow(customIdA, labelA, emojiA, customIdB, labelB, emojiB, disabled = false) {
  const a = applyOptionalEmoji(
    new ButtonBuilder().setCustomId(customIdA).setLabel(labelA).setStyle(ButtonStyle.Primary).setDisabled(disabled),
    emojiA
  );
  const b = applyOptionalEmoji(
    new ButtonBuilder().setCustomId(customIdB).setLabel(labelB).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    emojiB
  );
  return [new ActionRowBuilder().addComponents(a, b)];
}

function triChoiceRow(buttons, disabled = false) {
  const row = new ActionRowBuilder();
  for (const b of buttons.slice(0, 5)) {
    const btn = applyOptionalEmoji(
      new ButtonBuilder().setCustomId(b.customId).setLabel(b.label).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      b.emoji
    );
    row.addComponents(btn);
  }
  return [row];
}

function comboDefenseRows(token, bossId, roundIndex) {
  const mk = (kind) => `boss_action:${bossId}:${roundIndex}:${token}:combo:${kind}`;
  const red = applyOptionalEmoji(new ButtonBuilder().setCustomId(mk("red")).setLabel("Red").setStyle(ButtonStyle.Secondary), "🔴");
  const blue = applyOptionalEmoji(new ButtonBuilder().setCustomId(mk("blue")).setLabel("Blue").setStyle(ButtonStyle.Secondary), "🔵");
  const green = applyOptionalEmoji(new ButtonBuilder().setCustomId(mk("green")).setLabel("Green").setStyle(ButtonStyle.Secondary), "🟢");
  const yellow = applyOptionalEmoji(new ButtonBuilder().setCustomId(mk("yellow")).setLabel("Yellow").setStyle(ButtonStyle.Secondary), "🟡");
  return [new ActionRowBuilder().addComponents(red, blue, green, yellow)];
}

function mobButtons(eventKey, disabled = false) {
  const label = eventKey === "bleach" ? "Attack Hollow" : "Exorcise Spirit";
  const emoji = eventKey === "bleach" ? "⚔️" : "🪬";
  const btn = applyOptionalEmoji(
    new ButtonBuilder()
      .setCustomId(`${CID.MOB_ATTACK}:${eventKey}`)
      .setLabel(label)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    emoji
  );
  return [new ActionRowBuilder().addComponents(btn)];
}

function shopButtons(eventKey, player) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("buy_bleach_zanpakuto_basic").setLabel("Buy Zanpakuto").setStyle(ButtonStyle.Secondary).setDisabled(inv.zanpakuto_basic),
      new ButtonBuilder().setCustomId("buy_bleach_hollow_mask_fragment").setLabel("Buy Mask Fragment").setStyle(ButtonStyle.Secondary).setDisabled(inv.hollow_mask_fragment),
      new ButtonBuilder().setCustomId("buy_bleach_soul_reaper_cloak").setLabel("Buy Cloak").setStyle(ButtonStyle.Secondary).setDisabled(inv.soul_reaper_cloak)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("buy_bleach_reiatsu_amplifier").setLabel("Buy Amplifier").setStyle(ButtonStyle.Secondary).setDisabled(inv.reiatsu_amplifier),
      new ButtonBuilder().setCustomId("buy_bleach_cosmetic_role").setLabel("Buy Aizen role").setStyle(ButtonStyle.Danger).setDisabled(inv.cosmetic_role)
    );
    return [row1, row2];
  }

  const inv = player.jjk.items;
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_jjk_black_flash_manual").setLabel("Buy Black Flash").setStyle(ButtonStyle.Secondary).setDisabled(inv.black_flash_manual),
    new ButtonBuilder().setCustomId("buy_jjk_domain_charm").setLabel("Buy Domain Charm").setStyle(ButtonStyle.Secondary).setDisabled(inv.domain_charm),
    new ButtonBuilder().setCustomId("buy_jjk_cursed_tool").setLabel("Buy Cursed Tool").setStyle(ButtonStyle.Secondary).setDisabled(inv.cursed_tool)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_jjk_reverse_talisman").setLabel("Buy Reverse Talisman").setStyle(ButtonStyle.Secondary).setDisabled(inv.reverse_talisman),
    new ButtonBuilder().setCustomId("buy_jjk_binding_vow_seal").setLabel("Buy Binding Vow").setStyle(ButtonStyle.Danger).setDisabled(inv.binding_vow_seal)
  );
  return [row1, row2];
}

function wardrobeComponents(guild, member, player) {
  const roles = player.ownedRoles.map((rid) => guild.roles.cache.get(rid)).filter(Boolean);
  if (!roles.length) return [];

  const options = roles.slice(0, 25).map((r) => {
    const equipped = member.roles.cache.has(r.id);
    return {
      label: r.name.slice(0, 100),
      value: r.id,
      description: equipped ? "Equipped (select to remove)" : "Not equipped (select to wear)",
    };
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("wardrobe_select")
    .setPlaceholder("Choose a role to equip/unequip")
    .addOptions(options);

  return [new ActionRowBuilder().addComponents(menu)];
}

function pvpButtons(currency, amount, challengerId, targetId, disabled = false) {
  const accept = applyOptionalEmoji(
    new ButtonBuilder()
      .setCustomId(`${CID.PVP_ACCEPT}:${currency}:${amount}:${challengerId}:${targetId}`)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    "✅"
  );
  const decline = applyOptionalEmoji(
    new ButtonBuilder()
      .setCustomId(`${CID.PVP_DECLINE}:${currency}:${amount}:${challengerId}:${targetId}`)
      .setLabel("Decline")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    "❌"
  );
  return [new ActionRowBuilder().addComponents(accept, decline)];
}

module.exports = {
  CID,
  hasEventRole,
  hasBoosterRole,
  bossButtons,
  singleActionRow,
  dualChoiceRow,
  triChoiceRow,
  comboDefenseRows,
  mobButtons,
  shopButtons,
  wardrobeComponents,
  pvpButtons,
};
