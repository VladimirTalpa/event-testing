
const cfg = require("../config");
const { getPlayer, setPlayer } = require("../core/players");
const { activeBossByChannel, activeMobByChannel } = require("../core/state");
const { BOSSES } = require("../data/bosses");
const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");

function isEventStaff(member) {
  return cfg.EVENT_ROLE_IDS.some((rid) => member.roles.cache.has(rid));
}

function bossRender(state) {
  const boss = BOSSES[state.id];
  const hpPct = boss?.hpPerRound?.[state.round - 1] ?? (100 - (state.round - 1) * 20);
  const alive = state.aliveUserIds.size;
  const dead = state.deadUserIds.size;
  return `👹 ${boss.emoji} **${boss.name}** — Round **${state.round}/${state.rounds}**\n` +
    `❤️ HP: **${hpPct}%**\n` +
    `✅ Alive: **${alive}** | ☠ Dead: **${dead}**\n` +
    `Use **Join** then **Hit** each round.`;
}

module.exports = async function handleButtons(interaction) {
  const id = interaction.customId;

  // Close UI (ephemeral messages)
  if (id === "ui:close") {
    // delete ephemeral reply if possible, otherwise just update to closed
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.deleteReply();
      } else {
        await interaction.reply({ content: "Closed.", ephemeral: true });
      }
    } catch {
      try {
        await interaction.update({ content: "Closed.", embeds: [], components: [] });
      } catch {}
    }
    return;
  }

  // Shop buy
  if (id.startsWith("shop:buy:")) {
    const [, , eventKey, itemId] = id.split(":");
    const items = eventKey === "bleach" ? BLEACH_SHOP_ITEMS : JJK_SHOP_ITEMS;
    const it = items.find((x) => x.id === itemId);
    if (!it) return interaction.reply({ content: "Item not found.", ephemeral: true });

    const p = await getPlayer(interaction.user.id);

    // currency check
    const hasMoney =
      it.currency === "reiatsu"
        ? p.bleach.reiatsu >= it.price
        : it.currency === "cursed_energy"
          ? p.jjk.cursedEnergy >= it.price
          : p.drako >= it.price;

    if (!hasMoney) return interaction.reply({ content: "Not enough currency.", ephemeral: true });

    // charge
    if (it.currency === "reiatsu") p.bleach.reiatsu -= it.price;
    else if (it.currency === "cursed_energy") p.jjk.cursedEnergy -= it.price;
    else p.drako -= it.price;

    // apply reward
    if (it.type === "role" && it.roleId) {
      try {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        await member.roles.add(it.roleId);
      } catch {}
      // add to titles owned (so Titles menu can manage it in part3)
      if (!p.titles.ownedRoleIds.includes(it.roleId)) p.titles.ownedRoleIds.push(it.roleId);
    } else {
      // generic item -> inventory
      p.inventory[eventKey].push(it.name);
    }

    await setPlayer(interaction.user.id, p);
    return interaction.reply({ content: `✅ Bought: **${it.name}**`, ephemeral: true });
  }

  // Boss system
  if (id.startsWith("boss:")) {
    const state = activeBossByChannel.get(interaction.channelId);
    if (!state) return interaction.reply({ content: "No active boss here.", ephemeral: true });

    const boss = BOSSES[state.id];
    if (!boss) return interaction.reply({ content: "Boss data missing.", ephemeral: true });

    if (id === "boss:join") {
      if (state.deadUserIds.has(interaction.user.id)) {
        return interaction.reply({ content: "You are already eliminated.", ephemeral: true });
      }
      state.aliveUserIds.add(interaction.user.id);
      await interaction.reply({ content: "✅ You joined the boss fight.", ephemeral: true });
      // update boss message content
      try { await interaction.message.edit({ content: bossRender(state) }); } catch {}
      return;
    }

    if (id === "boss:hit") {
      if (!state.aliveUserIds.has(interaction.user.id)) {
        return interaction.reply({ content: "Join first.", ephemeral: true });
      }
      if (state.deadUserIds.has(interaction.user.id)) {
        return interaction.reply({ content: "You are eliminated.", ephemeral: true });
      }

      // Simple survival roll:
      // Difficulty increases with boss.difficulty and round
      const diff = (boss.difficulty || 1) + Math.floor((state.round - 1) / 2);
      const chanceDie = Math.min(0.08 * diff, 0.45); // cap 45%
      const roll = Math.random();

      if (roll < chanceDie) {
        state.aliveUserIds.delete(interaction.user.id);
        state.deadUserIds.add(interaction.user.id);
        await interaction.reply({ content: "☠ You failed the hit and got eliminated!", ephemeral: true });
      } else {
        await interaction.reply({ content: "✅ Successful hit. You survived.", ephemeral: true });
      }

      try { await interaction.message.edit({ content: bossRender(state) }); } catch {}
      return;
    }

    if (id === "boss:next") {
      if (!isEventStaff(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });

      if (state.round >= state.rounds) {
        return interaction.reply({ content: "Boss is already at final round. Use End.", ephemeral: true });
      }
      state.round += 1;

      await interaction.reply({ content: `➡️ Round advanced to **${state.round}/${state.rounds}**`, ephemeral: true });

      try { await interaction.message.edit({ content: bossRender(state) }); } catch {}
      return;
    }

    if (id === "boss:end") {
      if (!isEventStaff(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });

      // reward alive players with currency (simple)
      const alive = [...state.aliveUserIds];
      for (const uid of alive) {
        const p = await getPlayer(uid);
        if (boss.event === "bleach") p.bleach.reiatsu += 50 * (boss.difficulty || 1);
        else p.jjk.cursedEnergy += 50 * (boss.difficulty || 1);
        await setPlayer(uid, p);
      }

      activeBossByChannel.delete(interaction.channelId);

      await interaction.reply({
        content: `🏁 Boss ended. Rewarded **${alive.length}** survivors.`,
        ephemeral: false
      });

      // disable buttons on original message
      try {
        await interaction.message.edit({ components: [] });
      } catch {}
      return;
    }
  }

  // Mob system
  if (id.startsWith("mob:")) {
    const state = activeMobByChannel.get(interaction.channelId);
    if (!state) return interaction.reply({ content: "No active mob here.", ephemeral: true });

    if (id === "mob:hit") {
      // each hit reduces hp
      state.hits += 1;
      state.hp = Math.max(0, state.hp - 20);

      const p = await getPlayer(interaction.user.id);

      // reward on each hit
      if (state.event === "bleach") p.bleach.reiatsu += cfg.BLEACH_MOB_HIT;
      else p.jjk.cursedEnergy += cfg.JJK_MOB_HIT;

      // if killed, bonus
      let killed = false;
      if (state.hp <= 0) {
        killed = true;
        activeMobByChannel.delete(interaction.channelId);

        if (state.event === "bleach") {
          p.bleach.kills += 1;
          p.bleach.bonus = Math.min(cfg.BLEACH_BONUS_MAX, p.bleach.bonus + cfg.BLEACH_BONUS_PER_KILL);
        } else {
          p.jjk.kills += 1;
          p.jjk.bonus = Math.min(cfg.JJK_BONUS_MAX, p.jjk.bonus + cfg.JJK_BONUS_PER_KILL);
        }
      }

      await setPlayer(interaction.user.id, p);

      if (killed) {
        // clear buttons
        try { await interaction.message.edit({ content: `✅ Mob defeated by **${interaction.user.username}**!`, components: [] }); } catch {}
        return interaction.reply({ content: "✅ Final hit! Mob defeated.", ephemeral: true });
      }

      // update message
      try {
        await interaction.message.edit({ content: `🐺 Mob (${state.event}) HP: **${state.hp}%** | Hits: **${state.hits}**` });
      } catch {}
      return interaction.reply({ content: "✅ Hit registered.", ephemeral: true });
    }

    if (id === "mob:end") {
      if (!isEventStaff(interaction.member)) return interaction.reply({ content: "No permission.", ephemeral: true });
      activeMobByChannel.delete(interaction.channelId);
      try { await interaction.message.edit({ content: "Mob ended.", components: [] }); } catch {}
      return interaction.reply({ content: "✅ Mob ended.", ephemeral: true });
    }
  }

  // Fallback
  return interaction.reply({ content: "Unknown button.", ephemeral: true });
};
