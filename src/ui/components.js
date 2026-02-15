const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");

function bossButtons(disableAll = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("boss_join")
      .setLabel("Join")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disableAll),
    new ButtonBuilder()
      .setCustomId("boss_leave")
      .setLabel("Leave")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disableAll)
  );
  return [row];
}

function mobButtons(disableAll = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mob_join")
      .setLabel("Join")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disableAll),
    new ButtonBuilder()
      .setCustomId("mob_leave")
      .setLabel("Leave")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disableAll)
  );
  return [row];
}

function singleActionRow(customId, label, emoji, disabled = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setEmoji(emoji)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled)
  );
  return [row];
}

function dualChoiceRow(aId, aLabel, aEmoji, bId, bLabel, bEmoji, disabled = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(aId).setLabel(aLabel).setEmoji(aEmoji).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(bId).setLabel(bLabel).setEmoji(bEmoji).setStyle(ButtonStyle.Secondary).setDisabled(disabled)
  );
  return [row];
}

function triChoiceRow(buttons, disabled = false) {
  const row = new ActionRowBuilder();
  for (const b of buttons.slice(0, 5)) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(b.customId)
        .setLabel(b.label)
        .setEmoji(b.emoji)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    );
  }
  return [row];
}

// combo_defense: 4 цветные кнопки
function comboDefenseRows(token, bossId, roundIndex) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`boss_action:${bossId}:${roundIndex}:${token}:combo:red`)
      .setLabel("Red")
      .setEmoji("🔴")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`boss_action:${bossId}:${roundIndex}:${token}:combo:blue`)
      .setLabel("Blue")
      .setEmoji("🔵")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`boss_action:${bossId}:${roundIndex}:${token}:combo:green`)
      .setLabel("Green")
      .setEmoji("🟢")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`boss_action:${bossId}:${roundIndex}:${token}:combo:yellow`)
      .setLabel("Yellow")
      .setEmoji("🟡")
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
}

/**
 * Ниже — заглушки/простые реализации, чтобы slash.js не падал,
 * если у тебя пока не готов полноценный магазин/гардероб/pvp UI.
 */

function hasEventRole(member) {
  // Если у тебя в config есть EVENT_ROLE_ID — добавь и проверь здесь.
  // Сейчас: любой админ может, обычные — нет (упрощение).
  return member?.permissions?.has?.("Administrator") ?? false;
}

function hasBoosterRole(member) {
  // Если у тебя есть Booster role id — проверь тут.
  return Boolean(member?.premiumSince);
}

// Shop UI
function shopButtons(eventKey, player) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`shop:${eventKey}:buy1`).setLabel("Buy").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`shop:${eventKey}:close`).setLabel("Close").setStyle(ButtonStyle.Secondary)
  );
  return [row];
}

// Wardrobe UI
function wardrobeComponents(guild, member, player) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("wardrobe:select")
    .setPlaceholder("Select a role to wear (example)")
    .addOptions([{ label: "None", value: "none" }]);

  return [new ActionRowBuilder().addComponents(menu)];
}

// PVP UI
function pvpButtons(currency, amount, challengerId, targetId, disabled = false) {
  const key = `${Date.now()}:${challengerId}:${targetId}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pvp:${key}:accept`).setLabel("Accept").setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`pvp:${key}:decline`).setLabel("Decline").setStyle(ButtonStyle.Danger).setDisabled(disabled)
  );
  return [row];
}

module.exports = {
  bossButtons,
  mobButtons,
  singleActionRow,
  dualChoiceRow,
  triChoiceRow,
  comboDefenseRows,

  hasEventRole,
  hasBoosterRole,

  shopButtons,
  wardrobeComponents,
  pvpButtons,
};
