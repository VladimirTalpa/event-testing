const { E_VASTO, E_REIATSU, BOSS_ROUNDS, BOSS_SURVIVE_HIT_REIATSU } = require("../config");
const { hollowEmbed, shopEmbed } = require("../embeds");
const { hollowButtons, shopButtons, clashButtons } = require("../components");
const { handleClashButton } = require("../events/clash");
const { PermissionsBitField } = require("discord.js");

async function editMessageSafe(channel, messageId, payload) {
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return null;
  await msg.edit(payload).catch(() => {});
  return msg;
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

function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }

/* === same shop logic as slash handler === */
const SHOP_ITEMS = [
  { key: "zanpakuto_basic", name: "Zanpakutō (basic)", price: 350, desc: `+4% survive vs bosses • +5% drop luck` },
  { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: `+7% survive vs bosses • +10% drop luck` },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: `+9% survive vs bosses • +6% drop luck` },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: `${E_REIATSU} +25% Reiatsu rewards • +2% survive vs bosses` },
  { key: "cosmetic_role", name: "Sousuke Aizen role", price: 6000, desc: "Cosmetic Discord role (no stats).", roleId: require("../config").SHOP_COSMETIC_ROLE_ID },
];

function calcDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.zanpakuto_basic) mult += 0.05;
  if (items.hollow_mask_fragment) mult += 0.10;
  if (items.soul_reaper_cloak) mult += 0.06;
  return mult;
}

async function handleButtons(interaction, state) {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  const players = state.players;
  const cid = interaction.customId;

  // Always defer safely
  try { await interaction.deferUpdate(); } catch {}

  // Boss join
  if (cid === "boss_join") {
    const boss = state.bossByChannel.get(channel.id);
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

    // update spawn message
    const fighters = [...boss.participants.values()];
    const fightersText = fighters.length
      ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000)
      : "`No fighters yet`";

    await editMessageSafe(channel, boss.messageId, {
      embeds: [require("../embeds").bossSpawnEmbed(boss.cfg, channel.name, fighters.length, fightersText)],
      components: require("../components").bossButtons(false),
    });

    await interaction.followUp({ content: "✅ Joined the boss fight.", ephemeral: true }).catch(() => {});
    return;
  }

  // Boss rules
  if (cid === "boss_rules") {
    const boss = state.bossByChannel.get(channel.id);
    const bossName = boss?.cfg?.name || "Boss";

    await interaction.followUp({
      content:
        `${E_VASTO} Boss: ${BOSS_ROUNDS} rounds • 2 hits = defeat • Cooldown 10s\n` +
        `${E_REIATSU} You gain +${BOSS_SURVIVE_HIT_REIATSU} Reiatsu per successful round hit\n` +
        `📌 Current: **${bossName}**`,
      ephemeral: true,
    }).catch(() => {});
    return;
  }

  // Hollow attack
  if (cid === "hollow_attack") {
    const hollow = state.hollowByChannel.get(channel.id);
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
      embeds: [hollowEmbed(hollow.attackers.size)],
      components: hollowButtons(false),
    });

    await interaction.followUp({ content: "⚔️ Attack registered!", ephemeral: true }).catch(() => {});
    return;
  }

  // Shop buy
  if (cid.startsWith("buy_")) {
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

    const player = await players.get(interaction.user.id);

    if (player.items[key]) {
      await interaction.followUp({ content: "✅ You already own this item.", ephemeral: true }).catch(() => {});
      return;
    }
    if (player.reiatsu < item.price) {
      await interaction.followUp({ content: `❌ Not enough Reiatsu. Need ${E_REIATSU} ${item.price}.`, ephemeral: true }).catch(() => {});
      return;
    }

    player.reiatsu -= item.price;
    player.items[key] = true;
    await players.set(interaction.user.id, player);

    if (item.roleId) {
      const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
      if (!res.ok) {
        await interaction.followUp({ content: `⚠️ Bought role, but bot couldn't assign it: ${res.reason}`, ephemeral: true }).catch(() => {});
      }
    }

    const msgId = interaction.message?.id;
    if (msgId) {
      await editMessageSafe(channel, msgId, {
        embeds: [shopEmbed(player, SHOP_ITEMS, calcDropLuckMultiplier)],
        components: shopButtons(player),
      });
    }

    await interaction.followUp({ content: "✅ Purchased!", ephemeral: true }).catch(() => {});
    return;
  }

  // Clash buttons
  if (cid === "clash_accept" || cid === "clash_decline") {
    return handleClashButton(interaction, state, players);
  }
}

module.exports = { handleButtons };
