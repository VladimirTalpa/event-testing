const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function bossButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("boss_join").setLabel("Join Battle").setEmoji("🗡").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId("boss_rules").setLabel("Rules").setEmoji("📜").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
  ];
}

function hollowButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("hollow_attack").setLabel("Attack Hollow").setEmoji("⚔️").setStyle(ButtonStyle.Primary).setDisabled(disabled)
    ),
  ];
}

function shopButtons(player) {
  const inv = player.items;
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_zanpakuto_basic").setLabel("Buy Zanpakutō").setStyle(ButtonStyle.Secondary).setDisabled(inv.zanpakuto_basic),
    new ButtonBuilder().setCustomId("buy_hollow_mask_fragment").setLabel("Buy Mask Fragment").setStyle(ButtonStyle.Secondary).setDisabled(inv.hollow_mask_fragment),
    new ButtonBuilder().setCustomId("buy_soul_reaper_cloak").setLabel("Buy Cloak").setStyle(ButtonStyle.Secondary).setDisabled(inv.soul_reaper_cloak)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_reiatsu_amplifier").setLabel("Buy Amplifier").setStyle(ButtonStyle.Secondary).setDisabled(inv.reiatsu_amplifier),
    new ButtonBuilder().setCustomId("buy_cosmetic_role").setLabel("Buy Sousuke Aizen role").setStyle(ButtonStyle.Danger).setDisabled(inv.cosmetic_role)
  );
  return [row1, row2];
}

function clashButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("clash_accept").setLabel("Accept Clash").setEmoji("⚡").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId("clash_decline").setLabel("Decline").setEmoji("❌").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
  ];
}

module.exports = { bossButtons, hollowButtons, shopButtons, clashButtons };
