// src/handlers/buttons.js
const { bossByChannel, mobByChannel, pvpById } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName } = require("../core/utils");
const { mobEmbed, shopEmbed, wardrobeEmbed } = require("../ui/embeds");
const { CID, bossButtons, mobButtons, shopButtons, pvpButtons } = require("../ui/components");
const {
  AttachmentBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { MOBS } = require("../data/mobs");
const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");
const { CARD_PACKS, rollCard } = require("../data/cards");
const { buildBossLiveImage } = require("../ui/boss-card");
const { buildShopV2Payload } = require("../ui/shop-v2");
const { buildPackOpeningImage, buildCardRevealImage } = require("../ui/card-pack");
const { collectRowsForPlayer, buildCardsBookPayload } = require("../ui/cards-book-v2");
const JOIN_HUD_REFRESH_DELAY_MS = 900;
const joinHudRefreshState = new Map();
const OPENING_SHOWCASE_DELAY_MS = 1500;

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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function editShopMessage(interaction, payload) {
  const msgPayload = { ...payload, flags: undefined };
  try {
    await interaction.editReply(msgPayload);
    return true;
  } catch {}
  try {
    await interaction.message?.edit(msgPayload);
    return true;
  } catch {}
  return false;
}

async function editCardsBookMessage(interaction, payload) {
  const msgPayload = { ...payload, flags: undefined };
  try {
    await interaction.editReply(msgPayload);
    return true;
  } catch {}
  try {
    await interaction.message?.edit(msgPayload);
    return true;
  } catch {}
  return false;
}

function getTopDamageRows(boss, limit = 8) {
  const rows = [...(boss.damageByUser?.entries() || [])]
    .map(([uid, dmg]) => ({
      uid,
      dmg: Math.max(0, Math.floor(dmg || 0)),
      name: safeName(boss.participants.get(uid)?.displayName || uid),
    }))
    .sort((a, b) => b.dmg - a.dmg);
  return rows.slice(0, limit);
}

async function buildBossSpawnPngPayload(boss) {
  const png = await buildBossLiveImage(boss.def, {
    phase: "JOIN WINDOW",
    hpLeft: Math.max(1, Math.floor(boss.currentHp || 1)),
    hpTotal: Math.max(1, Math.floor(boss.totalHp || boss.currentHp || 1)),
    topDamage: getTopDamageRows(boss, 7),
    noteA: `Join time ${Math.round((boss.def?.joinMs || 0) / 1000)}s`,
    noteB: `Joined ${boss.participants.size}`,
    noteC: "Press Join Battle to enter",
  }).catch(() => null);
  if (!png) return null;
  const file = new AttachmentBuilder(png, { name: `raid-join-${boss.def.id}.png` });
  return { files: [file], components: bossButtons(!boss.joining) };
}

async function flushBossJoinHud(channelId) {
  const boss = bossByChannel.get(channelId);
  if (!boss || !boss.joining || !boss.messageId) return;
  const channel = boss.messageChannel;
  if (!channel) return;

  const msg = await channel.messages.fetch(boss.messageId).catch(() => null);
  if (!msg) return;

  const payload = await buildBossSpawnPngPayload(boss);
  if (payload) await msg.edit(payload).catch(() => {});
}

function scheduleBossJoinHudRefresh(channel, boss) {
  if (!channel?.id || !boss) return;
  boss.messageChannel = channel;
  const key = channel.id;

  let st = joinHudRefreshState.get(key);
  if (!st) st = { timer: null, running: false, dirty: false };
  st.dirty = true;

  if (st.timer || st.running) {
    joinHudRefreshState.set(key, st);
    return;
  }

  st.timer = setTimeout(async () => {
    const curr = joinHudRefreshState.get(key);
    if (!curr) return;
    curr.timer = null;
    if (curr.running) return;
    curr.running = true;
    try {
      while (curr.dirty) {
        curr.dirty = false;
        await flushBossJoinHud(key);
      }
    } finally {
      curr.running = false;
      if (!curr.dirty && !curr.timer) joinHudRefreshState.delete(key);
    }
  }, JOIN_HUD_REFRESH_DELAY_MS);
  if (typeof st.timer?.unref === "function") st.timer.unref();
  joinHudRefreshState.set(key, st);
}

module.exports = async function handleButtons(interaction) {
  try { await interaction.deferUpdate(); } catch {}

  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  const cid = interaction.customId;

  if (cid.startsWith("cardsbook_nav:")) {
    const [, eventKeyRaw, targetId, ownerId, pageRaw, dir] = cid.split(":");
    if (String(interaction.user.id) !== String(ownerId)) {
      await interaction.followUp({ content: "Only the command user can turn pages.", ephemeral: true }).catch(() => {});
      return;
    }

    const eventKey = eventKeyRaw === "jjk" ? "jjk" : "bleach";
    const targetUserId = String(targetId || interaction.user.id);
    const page = Math.max(0, Number(pageRaw || 0));
    const nextPage = Math.max(0, page + (dir === "next" ? 1 : -1));

    const p = await getPlayer(targetUserId);
    const rows = collectRowsForPlayer(p, eventKey);
    if (!rows.length) {
      await interaction.followUp({ content: "No cards found.", ephemeral: true }).catch(() => {});
      return;
    }

    let targetName = `User ${targetUserId}`;
    try {
      const member = await interaction.guild?.members?.fetch(targetUserId).catch(() => null);
      if (member?.user?.username) targetName = safeName(member.user.username);
    } catch {}

    const book = await buildCardsBookPayload({
      eventKey,
      targetId: targetUserId,
      targetName,
      ownerId,
      rows,
      page: nextPage,
    });

    await editCardsBookMessage(interaction, {
      components: book.components,
      files: book.files,
    });
    return;
  }

  if (cid.startsWith("shopv2_nav:")) {
    const [, eventKeyRaw, pageRaw, selectedRaw, dir] = cid.split(":");
    const eventKey = eventKeyRaw === "jjk" ? "jjk" : "bleach";
    const page = Number(pageRaw || 0);
    const nextPage = dir === "next" ? page + 1 : page - 1;
    const selectedKey = selectedRaw && selectedRaw !== "none" ? selectedRaw : null;
    const p = await getPlayer(interaction.user.id);
    const payload = buildShopV2Payload({
      eventKey,
      player: p,
      page: nextPage,
      selectedKey,
    });
    await editShopMessage(interaction, payload);
    return;
  }

  if (cid.startsWith("shopv2_buy:")) {
    const [, eventKeyRaw, pageRaw, selectedRaw] = cid.split(":");
    const eventKey = eventKeyRaw === "jjk" ? "jjk" : "bleach";
    const page = Number(pageRaw || 0);
    const key = selectedRaw && selectedRaw !== "none" ? selectedRaw : null;
    if (!key) {
      await interaction.followUp({ content: "Select an item first.", ephemeral: true }).catch(() => {});
      return;
    }

    const p = await getPlayer(interaction.user.id);
    const itemList = eventKey === "bleach" ? BLEACH_SHOP_ITEMS : JJK_SHOP_ITEMS;
    const item = itemList.find((x) => x.key === key);
    if (!item) {
      await interaction.followUp({ content: "Unknown item.", ephemeral: true }).catch(() => {});
      return;
    }

    const inv = eventKey === "bleach" ? p.bleach.items : p.jjk.items;
    if (inv[key] && item.type !== "pack") {
      await interaction.followUp({ content: "You already own this item.", ephemeral: true }).catch(() => {});
      await editShopMessage(interaction, buildShopV2Payload({ eventKey, player: p, page, selectedKey: key }));
      return;
    }

    const balance = eventKey === "bleach" ? p.bleach.reiatsu : p.jjk.cursedEnergy;
    if (balance < item.price) {
      const need = item.price - balance;
      await interaction.followUp({ content: `Need ${need} more to buy this item.`, ephemeral: true }).catch(() => {});
      await editShopMessage(interaction, buildShopV2Payload({ eventKey, player: p, page, selectedKey: key }));
      return;
    }

    if (item.type === "pack" || key === CARD_PACKS[eventKey]?.key) {
      if (eventKey === "bleach") p.bleach.reiatsu -= item.price;
      else p.jjk.cursedEnergy -= item.price;

      if (!p.cards || typeof p.cards !== "object") p.cards = { bleach: {}, jjk: {} };
      if (!p.cards.bleach || typeof p.cards.bleach !== "object") p.cards.bleach = {};
      if (!p.cards.jjk || typeof p.cards.jjk !== "object") p.cards.jjk = {};
      if (!p.cardLevels || typeof p.cardLevels !== "object") p.cardLevels = { bleach: {}, jjk: {} };
      if (!p.cardLevels.bleach || typeof p.cardLevels.bleach !== "object") p.cardLevels.bleach = {};
      if (!p.cardLevels.jjk || typeof p.cardLevels.jjk !== "object") p.cardLevels.jjk = {};

      const rolled = rollCard(eventKey);
      if (!rolled) {
        await interaction.followUp({ content: "Pack failed to open. Try again.", ephemeral: true }).catch(() => {});
        return;
      }

      const cardStore = eventKey === "bleach" ? p.cards.bleach : p.cards.jjk;
      const levelStore = eventKey === "bleach" ? p.cardLevels.bleach : p.cardLevels.jjk;
      const afterCount = Math.max(0, Number(cardStore[rolled.id] || 0)) + 1;
      cardStore[rolled.id] = afterCount;
      if (!levelStore[rolled.id]) levelStore[rolled.id] = 1;

      await setPlayer(interaction.user.id, p);
      await editShopMessage(interaction, buildShopV2Payload({ eventKey, player: p, page, selectedKey: key }));

      const openingPng = await buildPackOpeningImage({
        eventKey,
        username: interaction.user.username,
        packName: item.name,
      }).catch(() => null);
      if (openingPng) {
        const openingFile = new AttachmentBuilder(openingPng, { name: `opening-${eventKey}.png` });
        await interaction.followUp({ files: [openingFile], ephemeral: true }).catch(() => {});
      }

      await delay(OPENING_SHOWCASE_DELAY_MS);

      const revealPng = await buildCardRevealImage({
        eventKey,
        username: interaction.user.username,
        card: rolled,
        countOwned: afterCount,
        level: levelStore[rolled.id] || 1,
      }).catch(() => null);

      if (revealPng) {
        const revealFile = new AttachmentBuilder(revealPng, { name: `card-${rolled.id}.png` });
        await interaction.followUp({ files: [revealFile], ephemeral: true }).catch(() => {});
      }

      await interaction
        .followUp({
          content: `Pulled **${rolled.name}** (${rolled.rarity}) • Owned: **${afterCount}**`,
          ephemeral: true,
        })
        .catch(() => {});
      return;
    }

    if (eventKey === "bleach") p.bleach.reiatsu -= item.price;
    else p.jjk.cursedEnergy -= item.price;
    inv[key] = true;

    if (item.roleId) {
      ensureOwnedRole(p, item.roleId);
      const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
      if (!res.ok) {
        await interaction.followUp({
          content: `Bought role, but bot couldn't assign: ${res.reason} (saved to wardrobe)`,
          ephemeral: true,
        }).catch(() => {});
      }
    }

    await setPlayer(interaction.user.id, p);
    await interaction.followUp({ content: `Purchased: ${item.name}`, ephemeral: true }).catch(() => {});
    await editShopMessage(interaction, buildShopV2Payload({ eventKey, player: p, page, selectedKey: key }));
    return;
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

    boss.participants.set(uid, { hits: 0, displayName: interaction.user.username });

    // Batch join HUD refresh to avoid heavy PNG re-render on every single click.
    scheduleBossJoinHudRefresh(channel, boss);

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

    // Existing press / combo
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

    // NEW: multi_press
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

    // NEW: choice_qte
    if (kind === "choice") {
      if (boss.activeAction.mode !== "choice") {
        await interaction.followUp({ content: "❌ Not a choice phase.", ephemeral: true }).catch(() => {});
        return;
      }
      boss.activeAction.choice.set(uid, payload);
      await interaction.followUp({ content: "✅ Chosen.", ephemeral: true }).catch(() => {});
      return;
    }

    // NEW: tri_press
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

    // NEW: quiz
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

    // Only target can accept/decline
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

    // Accept: do transfer
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

    // 50/50 outcome (simple for now)
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

  /* ===================== Shop buys ===================== */
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
