const { bossByChannel, mobByChannel, pvpById } = require("../core/state");
const { getPlayer, setPlayer, getTopPlayers } = require("../core/players");
const { safeName } = require("../core/utils");

const {
  mobEmbed,
  shopEmbed,
  storeHomeEmbed,
  storeEventEmbed,
  forgeHomeEmbed,
  profileCurrencyEmbed,
  titlesEmbed,
  leaderboardEmbed,
} = require("../ui/embeds");

const {
  CID,
  mobButtons,
  shopButtons,
  pvpButtons,
  storeMenuComponents,
  storeEventComponents,
  forgeMenuComponents,
  profileMenuComponents,
  titlesComponents,
} = require("../ui/components");

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

function ownerOnly(interaction, ownerId) {
  if (!ownerId) return true;
  if (interaction.user.id !== ownerId) {
    interaction.followUp({ content: "❌ This menu is not yours.", ephemeral: true }).catch(() => {});
    return false;
  }
  return true;
}

module.exports = async function handleButtons(interaction) {
  try { await interaction.deferUpdate(); } catch {}

  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  const cid = interaction.customId;

  /* ===================== STORE / FORGE / PROFILE MENUS ===================== */
  // customId format: "store:event:<ownerId>" etc
  if (cid.startsWith("store:") || cid.startsWith("forge:") || cid.startsWith("profile:")) {
    const parts = cid.split(":");
    const root = parts[0]; // store/forge/profile
    const page = parts[1]; // home/event/...
    const extra = parts[2]; // bleach/jjk or ownerId depending
    const ownerId = parts[parts.length - 1]; // last segment is ownerId

    if (!ownerOnly(interaction, ownerId)) return;

    // ===== STORE =====
    if (root === "store") {
      if (page === "home") {
        return interaction.editReply({
          embeds: [storeHomeEmbed()],
          components: storeMenuComponents(ownerId),
        });
      }
      if (page === "event") {
        // store:event:<ownerId>
        return interaction.editReply({
          embeds: [storeEventEmbed()],
          components: storeEventComponents(ownerId),
        });
      }
      if (page === "event" && (extra === "bleach" || extra === "jjk")) {
        // store:event:bleach:<ownerId>
        const p = await getPlayer(ownerId);
        return interaction.editReply({
          embeds: [shopEmbed(extra, p)],
          components: shopButtons(extra, p),
        });
      }
      // packs/gear (disabled buttons anyway)
      return;
    }

    // ===== FORGE =====
    if (root === "forge") {
      if (page === "home") {
        return interaction.editReply({
          embeds: [forgeHomeEmbed()],
          components: forgeMenuComponents(ownerId),
        });
      }
      // craft/evolve disabled for now
      return interaction.editReply({
        embeds: [forgeHomeEmbed()],
        components: forgeMenuComponents(ownerId),
      });
    }

    // ===== PROFILE =====
    if (root === "profile") {
      if (page === "home") {
        const p = await getPlayer(ownerId);
        return interaction.editReply({
          embeds: [profileCurrencyEmbed(interaction.user, p)],
          components: profileMenuComponents(ownerId),
        });
      }
      if (page === "currency") {
        const p = await getPlayer(ownerId);
        return interaction.editReply({
          embeds: [profileCurrencyEmbed(interaction.user, p)],
          components: profileMenuComponents(ownerId),
        });
      }
      if (page === "titles") {
        const p = await getPlayer(ownerId);
        const member = await interaction.guild.members.fetch(ownerId).catch(() => null);
        if (!member) return interaction.followUp({ content: "❌ Can't read your member data.", ephemeral: true }).catch(() => {});
        return interaction.editReply({
          embeds: [titlesEmbed(interaction.guild, p)],
          components: titlesComponents(interaction.guild, member, p),
        });
      }
      if (page === "drako_lb") {
        const rows = await getTopPlayers("drako", 10);
        const entries = [];
        for (const r of rows) {
          let name = r.userId;
          try {
            const m = await interaction.guild.members.fetch(r.userId);
            name = safeName(m?.displayName || m?.user?.username || r.userId);
          } catch {}
          entries.push({ name, score: r.score });
        }
        return interaction.editReply({
          embeds: [leaderboardEmbed("drako", entries)],
          components: profileMenuComponents(ownerId),
        });
      }
      if (page === "close") {
        return interaction.editReply({
          content: "✅ Closed.",
          embeds: [],
          components: [],
        });
      }
      // cards/gears disabled
      return;
    }
  }

  /* ===================== Boss join ===================== */
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

  /* ===================== Boss rules ===================== */
  if (cid === CID.BOSS_RULES) {
    const boss = bossByChannel.get(channel.id);
    const def = boss?.def;

    const maxHits = def?.maxHits ?? 2;

    const txt = def
      ? `**${def.name}** • Difficulty: **${def.difficulty}** • Rounds: **${def.rounds.length}**\n` +
        `Win: **${def.winRewardRange ? `${def.winRewardRange.min}-${def.winRewardRange.max}` : def.winReward}**\n` +
        `Success per round: **+${def.hitReward}** (banked, paid only on victory)\n` +
        `${maxHits} hits = eliminated`
      : `${maxHits} hits = eliminated.`;

    await interaction.followUp({ content: txt, ephemeral: true }).catch(() => {});
    return;
  }

  /* ===================== Boss action buttons ===================== */
  if (cid.startsWith("boss_action:")) {
    const parts = cid.split(":");
    const bossId = parts[1];
    const roundIndex = Number(parts[2]);
    const token = parts[3];
    const kind = parts[4];
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
    const maxHits = boss.def.maxHits ?? 2;
    if (!st || st.hits >= maxHits) {
      await interaction.followUp({ content: "❌ You are not in the fight.", ephemeral: true }).catch(() => {});
      return;
    }

    if (kind === "press") {
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

      if (next >= 4) await interaction.followUp({ content: "✅ Combo completed!", ephemeral: true }).catch(() => {});
      else await interaction.followUp({ content: `✅ Good! (${next}/4)`, ephemeral: true }).catch(() => {});
      return;
    }

    if (kind === "multi") {
      if (boss.activeAction.mode !== "multi_press") {
        await interaction.followUp({ content: "❌ Not a multi-press phase.", ephemeral: true }).catch(() => {});
        return;
      }
      const map = boss.activeAction.counts;
      const prev = map.get(uid) || 0;
      map.set(uid, prev + 1);
      await interaction.followUp({ content: `✅ Blocked (${prev + 1})`, ephemeral: true }).catch(() => {});
      return;
    }

    if (kind === "choice") {
      if (boss.activeAction.mode !== "choice") {
        await interaction.followUp({ content: "❌ Not a choice phase.", ephemeral: true }).catch(() => {});
        return;
      }
      boss.activeAction.choice.set(uid, payload);
      await interaction.followUp({ content: "✅ Chosen.", ephemeral: true }).catch(() => {});
      return;
    }

    if (kind === "tri") {
      if (boss.activeAction.mode !== "tri_press") {
        await interaction.followUp({ content: "❌ Not a focus phase.", ephemeral: true }).catch(() => {});
        return;
      }
      const set = boss.activeAction.pressed.get(uid) || new Set();
      set.add(payload);
      boss.activeAction.pressed.set(uid, set);
      await interaction.followUp({ content: `✅ (${set.size}/3)`, ephemeral: true }).catch(() => {});
      return;
    }

    if (kind === "quiz") {
      if (boss.activeAction.mode !== "quiz") {
        await interaction.followUp({ content: "❌ Not a quiz phase.", ephemeral: true }).catch(() => {});
        return;
      }
      boss.activeAction.choice.set(uid, payload);
      await interaction.followUp({ content: "✅ Answer locked.", ephemeral: true }).catch(() => {});
      return;
    }
  }

  /* ===================== Mob attack ===================== */
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

    await interaction.followUp({ content: "⚔️ Action registered!", ephemeral: true }).catch(() => {});
    return;
  }

  /* ===================== PvP Clash ===================== */
  if (cid.startsWith(`${CID.PVP_ACCEPT}:`) || cid.startsWith(`${CID.PVP_DECLINE}:`)) {
    const isAccept = cid.startsWith(`${CID.PVP_ACCEPT}:`);
    const [, currency, amountStr, challengerId, targetId] = cid.split(":");
    const amount = Number(amountStr);

    if (!Number.isFinite(amount) || amount <= 0) {
      await interaction.followUp({ content: "❌ Invalid amount.", ephemeral: true }).catch(() => {});
      return;
    }

    if (interaction.user.id !== targetId) {
      await interaction.followUp({ content: "❌ This is not your duel request.", ephemeral: true }).catch(() => {});
      return;
    }

    const key = `${channel.id}:${challengerId}:${targetId}`;
    const req = pvpById.get(key);
    if (!req || req.done) {
      await interaction.followUp({ content: "⌛ This request expired.", ephemeral: true }).catch(() => {});
      return;
    }

    req.done = true;
    pvpById.set(key, req);

    if (!isAccept) {
      await interaction.message?.edit({ components: pvpButtons(currency, amount, challengerId, targetId, true) }).catch(() => {});
      await interaction.followUp({ content: "❌ Duel declined.", ephemeral: false }).catch(() => {});
      return;
    }

    const p1 = await getPlayer(challengerId);
    const p2 = await getPlayer(targetId);

    function getBal(p, cur) {
      if (cur === "reiatsu") return p.bleach.reiatsu;
      if (cur === "cursed_energy") return p.jjk.cursedEnergy;
      if (cur === "drako") return p.drako;
      return 0;
    }
    function setBal(p, cur, v) {
      if (cur === "reiatsu") p.bleach.reiatsu = v;
      if (cur === "cursed_energy") p.jjk.cursedEnergy = v;
      if (cur === "drako") p.drako = v;
    }

    const b1 = getBal(p1, currency);
    const b2 = getBal(p2, currency);

    if (b1 < amount) {
      await interaction.followUp({ content: `❌ Challenger lacks funds.`, ephemeral: false }).catch(() => {});
      return;
    }
    if (b2 < amount) {
      await interaction.followUp({ content: `❌ You lack funds.`, ephemeral: false }).catch(() => {});
      return;
    }

    const winnerIsChallenger = Math.random() < 0.5;
    const winnerId = winnerIsChallenger ? challengerId : targetId;
    const loserId = winnerIsChallenger ? targetId : challengerId;

    const winner = winnerIsChallenger ? p1 : p2;
    const loser = winnerIsChallenger ? p2 : p1;

    setBal(loser, currency, getBal(loser, currency) - amount);
    setBal(winner, currency, getBal(winner, currency) + amount);

    await setPlayer(challengerId, p1);
    await setPlayer(targetId, p2);

    await interaction.message?.edit({ components: pvpButtons(currency, amount, challengerId, targetId, true) }).catch(() => {});
    await interaction.followUp({
      content: `⚔️ **PvP Clash!** Winner: <@${winnerId}> • Loser: <@${loserId}> • Stake: **${amount} ${currency}**`,
      ephemeral: false,
    }).catch(() => {});
    return;
  }

  /* ===================== Shop buys (unchanged) ===================== */
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
          content: `⚠️ Bought role, but bot couldn't assign: ${res.reason} (saved to titles)`,
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
