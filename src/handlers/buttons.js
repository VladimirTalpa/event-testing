// src/handlers/buttons.js
const { bossByChannel, mobByChannel } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName } = require("../core/utils");
const { mobEmbed, shopEmbed } = require("../ui/embeds");
const { CID, mobButtons, shopButtons } = require("../ui/components");
const { MOBS } = require("../data/mobs");
const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");

async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has("ManageRoles")) return { ok: false, reason: "Missing Manage Roles permission." };
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role add." };
  }
}

function ensureOwnedRole(player, roleId) {
  if (!roleId) return;
  const id = String(roleId);
  if (!player.ownedRoles.includes(id)) player.ownedRoles.push(id);
}

module.exports = async function handleButtons(interaction) {
  try { await interaction.deferUpdate(); } catch {}

  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  const cid = interaction.customId;

  // Boss join
  if (cid === CID.BOSS_JOIN) {
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

    boss.participants.set(uid, { hits: 0, displayName: interaction.member?.displayName || interaction.user.username });

    const fighters = [...boss.participants.values()];
    const fightersText = fighters.length
      ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000)
      : "`No fighters yet`";

    const msg = await channel.messages.fetch(boss.messageId).catch(() => null);
    if (msg) {
      const { bossSpawnEmbed } = require("../ui/embeds");
      const { bossButtons } = require("../ui/components");
      await msg.edit({
        embeds: [bossSpawnEmbed(boss.def, channel.name, fighters.length, fightersText)],
        components: bossButtons(!boss.joining),
      }).catch(() => {});
    }

    await interaction.followUp({ content: "✅ Joined the fight.", ephemeral: true }).catch(() => {});
    return;
  }

  // Boss rules
  if (cid === CID.BOSS_RULES) {
    const boss = bossByChannel.get(channel.id);
    const def = boss?.def;

    const txt = def
      ? `**${def.name}** • Difficulty: **${def.difficulty}** • Rounds: **${def.rounds.length}**\n` +
        `Win: **${def.winReward}**\n` +
        `Success per round: **+${def.hitReward}** (banked, paid only on victory)\n` +
        `2 hits = eliminated`
      : `2 hits = eliminated.`;

    await interaction.followUp({ content: txt, ephemeral: true }).catch(() => {});
    return;
  }

  // Boss action buttons
  if (cid.startsWith("boss_action:")) {
    const parts = cid.split(":");
    // boss_action:<bossId>:<roundIndex>:<token>:<kind>:<payload?>
    const bossId = parts[1];
    const roundIndex = Number(parts[2]);
    const token = parts[3];
    const kind = parts[4]; // "press" or "combo"
    const payload = parts[5];

    const boss = bossByChannel.get(channel.id);
    if (!boss || boss.def.id !== bossId) {
      await interaction.followUp({ content: "❌ No active boss action.", ephemeral: true }).catch(() => {});
      return;
    }
    if (!boss.activeAction || boss.activeAction.token !== token || boss.activeAction.roundIndex !== roundIndex) {
      await interaction.followUp({ content: "⌛ Too late.", ephemeral: true }).catch(() => {});
      return;
    }

    const uid = interaction.user.id;
    const st = boss.participants.get(uid);
    if (!st || st.hits >= 2) {
      await interaction.followUp({ content: "❌ You are not in the fight.", ephemeral: true }).catch(() => {});
      return;
    }

    if (kind === "press") {
      // ✅ NEW: multi_press mode support
      if (boss.activeAction.mode === "multi_press") {
        const map = boss.activeAction.pressCount;
        const prev = map.get(uid) || 0;
        map.set(uid, prev + 1);
        await interaction.followUp({ content: `✅ Block registered! (${prev + 1})`, ephemeral: true }).catch(() => {});
        return;
      }

      // normal press mode
      if (boss.activeAction.pressed.has(uid)) {
        await interaction.followUp({ content: "✅ Already pressed.", ephemeral: true }).catch(() => {});
        return;
      }
      boss.activeAction.pressed.add(uid);
      await interaction.followUp({ content: "✅ Registered!", ephemeral: true }).catch(() => {});
      return;
    }

    if (kind === "combo") {
      if (boss.activeAction.mode !== "combo") {
        await interaction.followUp({ content: "❌ Not a combo phase.", ephemeral: true }).catch(() => {});
        return;
      }
      if (boss.activeAction.comboFailed.has(uid)) {
        await interaction.followUp({ content: "❌ You already failed this combo.", ephemeral: true }).catch(() => {});
        return;
      }
      const seq = boss.activeAction.comboSeq || [];
      const prog = boss.activeAction.comboProgress.get(uid) || 0;
      const expected = seq[prog];

      if (payload !== expected) {
        boss.activeAction.comboFailed.add(uid);
        await interaction.followUp({ content: "❌ Wrong button! (you will take a hit when the timer ends)", ephemeral: true }).catch(() => {});
        return;
      }

      const next = prog + 1;
      boss.activeAction.comboProgress.set(uid, next);

      if (next >= 4) {
        await interaction.followUp({ content: "✅ Combo completed!", ephemeral: true }).catch(() => {});
      } else {
        await interaction.followUp({ content: `✅ Good! (${next}/4)`, ephemeral: true }).catch(() => {});
      }
      return;
    }
  }

  // Mob attack
  if (cid.startsWith(`${CID.MOB_ATTACK}:`)) {
    const eventKey = cid.split(":")[1];
    const state = mobByChannel.get(channel.id);

    if (!state || state.resolved || state.eventKey !== eventKey) {
      await interaction.followUp({ content: "❌ No active mob event.", ephemeral: true }).catch(() => {});
      return;
    }

    const uid = interaction.user.id;
    if (state.attackers.has(uid)) {
      await interaction.followUp({ content: "⚠️ You already attacked.", ephemeral: true }).catch(() => {});
      return;
    }

    state.attackers.set(uid, { displayName: interaction.member?.displayName || interaction.user.username });

    const mob = MOBS[eventKey];
    const msg = await channel.messages.fetch(state.messageId).catch(() => null);
    if (msg) {
      await msg.edit({
        embeds: [mobEmbed(eventKey, state.attackers.size, mob)],
        components: mobButtons(eventKey, false),
      }).catch(() => {});
    }

    await interaction.followUp({ content: eventKey === "bleach" ? "⚔️ Attack registered!" : "🪬 Exorcise registered!", ephemeral: true }).catch(() => {});
    return;
  }

  // Shop buys (без изменений, оставляю как у тебя)
  if (cid.startsWith("buy_")) {
    const p = await getPlayer(interaction.user.id);

    const bleachMap = {
      buy_bleach_zanpakuto_basic: "zanpakuto_basic",
      buy_bleach_hollow_mask_fragment: "hollow_mask_fragment",
      buy_bleach_soul_reaper_cloak: "soul_reaper_cloak",
      buy_bleach_reiatsu_amplifier: "reiatsu_amplifier",
      buy_bleach_cosmetic_role: "cosmetic_role",
    };

    const jjkMap = {
      buy_jjk_black_flash_manual: "black_flash_manual",
      buy_jjk_domain_charm: "domain_charm",
      buy_jjk_cursed_tool: "cursed_tool",
      buy_jjk_reverse_talisman: "reverse_talisman",
      buy_jjk_binding_vow_seal: "binding_vow_seal",
    };

    let eventKey = null;
    let key = null;

    if (bleachMap[cid]) { eventKey = "bleach"; key = bleachMap[cid]; }
    if (jjkMap[cid]) { eventKey = "jjk"; key = jjkMap[cid]; }

    if (!eventKey || !key) {
      await interaction.followUp({ content: "❌ Unknown item.", ephemeral: true }).catch(() => {});
      return;
    }

    const itemList = eventKey === "bleach" ? BLEACH_SHOP_ITEMS : JJK_SHOP_ITEMS;
    const item = itemList.find((x) => x.key === key);
    if (!item) {
      await interaction.followUp({ content: "❌ Unknown item.", ephemeral: true }).catch(() => {});
      return;
    }

    const inv = eventKey === "bleach" ? p.bleach.items : p.jjk.items;
    if (inv[key]) {
      await interaction.followUp({ content: "✅ You already own this item.", ephemeral: true }).catch(() => {});
      return;
    }

    const { E_REIATSU, E_CE } = require("../config");

    if (eventKey === "bleach") {
      if (p.bleach.reiatsu < item.price) {
        await interaction.followUp({ content: `❌ Need ${E_REIATSU} ${item.price}.`, ephemeral: true }).catch(() => {});
        return;
      }
      p.bleach.reiatsu -= item.price;
      p.bleach.items[key] = true;
    } else {
      if (p.jjk.cursedEnergy < item.price) {
        await interaction.followUp({ content: `❌ Need ${E_CE} ${item.price}.`, ephemeral: true }).catch(() => {});
        return;
      }
      p.jjk.cursedEnergy -= item.price;
      p.jjk.items[key] = true;
    }

    if (item.roleId) {
      ensureOwnedRole(p, item.roleId);
      const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
      if (!res.ok) {
        await interaction.followUp({
          content: `⚠️ Bought role, but bot couldn't assign: ${res.reason} (saved to wardrobe)`,
          ephemeral: true
        }).catch(() => {});
      }
    }

    await setPlayer(interaction.user.id, p);

    const msgId = interaction.message?.id;
    if (msgId) {
      const msg = await channel.messages.fetch(msgId).catch(() => null);
      if (msg) {
        await msg.edit({
          embeds: [shopEmbed(eventKey, p)],
          components: shopButtons(eventKey, p),
        }).catch(() => {});
      }
    }

    await interaction.followUp({ content: "✅ Purchased!", ephemeral: true }).catch(() => {});
    return;
  }
};
