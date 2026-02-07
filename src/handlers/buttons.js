
const cfg = require("../config");
const { CID } = require("../components");
const { bossByChannel, hollowByChannel } = require("../state");
const { safeName, editMessageSafe } = require("../utils");
const { bossButtons, hollowButtons } = require("../components");
const { spawnBoss, updateBossSpawnMessage, calcReiatsuMultiplier, calcDropLuckMultiplier, calcItemSurvivalBonus } = require("../events/boss");
const { getPlayer, setPlayer } = require("../players");
const { handleClashButton } = require("../events/clash");
const embeds = require("../embeds");
const { PermissionsBitField } = require("discord.js");

// shop list (same as slash)
const SHOP_ITEMS = [
  { key: "zanpakuto_basic", name: "Zanpakutō (basic)", price: 350, desc: `+4% survive vs ${cfg.BOSS_NAME} • +5% drop luck` },
  { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: `+7% survive vs ${cfg.BOSS_NAME} • +10% drop luck` },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: `+9% survive vs ${cfg.BOSS_NAME} • +6% drop luck` },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: `${cfg.E_REIATSU} +25% Reiatsu rewards • +2% survive vs ${cfg.BOSS_NAME}` },
  { key: "cosmetic_role", name: "Sousuke Aizen role", price: 6000, desc: "Cosmetic Discord role (no stats).", roleId: cfg.SHOP_COSMETIC_ROLE_ID },
];

function shopEmbed(player) {
  const inv = player.items;
  const lines = SHOP_ITEMS.map((it) => {
    const owned = inv[it.key] ? "✅ Owned" : `${cfg.E_REIATSU} ${it.price} Reiatsu`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });
  return new (require("discord.js").EmbedBuilder)()
    .setColor(cfg.COLOR)
    .setTitle("🛒 Shop")
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: `${cfg.E_REIATSU} Your Reiatsu`, value: `\`${player.reiatsu}\``, inline: true },
      { name: `${cfg.E_VASTO} Boss bonus`, value: `\`${player.survivalBonus}% / ${cfg.BONUS_MAX}%\``, inline: true }
    );
}

function shopButtons(player) {
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
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

async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return { ok: false, reason: "Bot has no Manage Roles permission." };
    }
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role add (permissions/hierarchy)." };
  }
}

module.exports = async function handleButtons(interaction) {
  try { await interaction.deferUpdate(); } catch {}

  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  const cid = interaction.customId;

  // Boss join
  if (CID.BOSS_JOIN.includes(cid)) {
    const boss = bossByChannel.get(channel.id);
    if (!boss || !boss.joining) {
      await interaction.followUp({ content: "❌ No active boss join.", ephemeral: true }).catch(() => {});
      return;
    }

    const uid = interaction.user.id;
    if (boss.participants.has(uid)) {
      await interaction.followUp({ content: "⚠️ You already joined.", ephemeral: true }).catch(() => {});
      return;
    }

    boss.participants.set(uid, {
      hits: 0,
      displayName: interaction.member?.displayName || interaction.user.username,
    });

    await updateBossSpawnMessage(channel, boss);
    await interaction.followUp({ content: "✅ Joined the boss fight.", ephemeral: true }).catch(() => {});
    return;
  }

  // Boss rules
  if (CID.BOSS_RULES.includes(cid)) {
    await interaction.followUp({
      content:
        `${cfg.E_VASTO} Boss: ${cfg.BOSS_ROUNDS} rounds • 2 hits = defeat • Cooldown 10s\n` +
        `${cfg.E_REIATSU} You gain +${cfg.BOSS_SURVIVE_HIT_REIATSU} Reiatsu per successful round hit\n` +
        `🎁 Robux shown: ${(cfg.DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}% (actual lower)`,
      ephemeral: true,
    }).catch(() => {});
    return;
  }

  // Hollow attack
  if (CID.HOLLOW_ATTACK.includes(cid)) {
    const hollow = hollowByChannel.get(channel.id);
    if (!hollow || hollow.resolved) {
      await interaction.followUp({ content: "❌ No active Hollow event.", ephemeral: true }).catch(() => {});
      return;
    }

    const uid = interaction.user.id;
    if (hollow.attackers.has(uid)) {
      await interaction.followUp({ content: "⚠️ You already attacked.", ephemeral: true }).catch(() => {});
      return;
    }

    hollow.attackers.set(uid, { displayName: interaction.member?.displayName || interaction.user.username });

    await editMessageSafe(channel, hollow.messageId, {
      embeds: [embeds.hollowEmbed(hollow.attackers.size)],
      components: hollowButtons(false),
    });

    await interaction.followUp({ content: "⚔️ Attack registered!", ephemeral: true }).catch(() => {});
    return;
  }

  // Shop buys
  if (cid.startsWith("buy_")) {
    const player = await getPlayer(interaction.user.id);

    const map = {
      buy_zanpakuto_basic: "zanpakuto_basic",
      buy_hollow_mask_fragment: "hollow_mask_fragment",
      buy_soul_reaper_cloak: "soul_reaper_cloak",
      buy_reiatsu_amplifier: "reiatsu_amplifier",
      buy_cosmetic_role: "cosmetic_role",
    };

    const key = map[cid];
    const item = SHOP_ITEMS.find((x) => x.key === key);

    if (!key || !item) {
      await interaction.followUp({ content: "❌ Unknown item.", ephemeral: true }).catch(() => {});
      return;
    }

    if (player.items[key]) {
      await interaction.followUp({ content: "✅ You already own this item.", ephemeral: true }).catch(() => {});
      return;
    }

    if (player.reiatsu < item.price) {
      await interaction.followUp({ content: `❌ Not enough Reiatsu. Need ${cfg.E_REIATSU} ${item.price}.`, ephemeral: true }).catch(() => {});
      return;
    }

    player.reiatsu -= item.price;
    player.items[key] = true;
    await setPlayer(interaction.user.id, player);

    if (item.roleId) {
      const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
      if (!res.ok) {
        await interaction.followUp({ content: `⚠️ Bought role, but bot couldn't assign it: ${res.reason}`, ephemeral: true }).catch(() => {});
      }
    }

    const msgId = interaction.message?.id;
    if (msgId) {
      await editMessageSafe(channel, msgId, { embeds: [shopEmbed(player)], components: shopButtons(player) });
    }

    await interaction.followUp({ content: "✅ Purchased!", ephemeral: true }).catch(() => {});
    return;
  }

  // Clash buttons
  if (cid === "clash_accept" || cid === "clash_decline") {
    return handleClashButton({ interaction, channel, customId: cid });
  }
};
