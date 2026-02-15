const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { BOSSES } = require("../data/bosses");
const {
  MAX_HITS,
  PING_BOSS_ROLE_ID,
  BLEACH_BONUS_MAX,
  JJK_BONUS_MAX,
  E_REIATSU,
  E_CE,
} = require("../config");

const { bossByChannel } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName, sleep } = require("../core/utils");

const {
  bossSpawnEmbed,
  bossRoundEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
} = require("../ui/embeds");

const {
  bossButtons,
  singleActionRow,
  dualChoiceRow,
  triChoiceRow,
  comboDefenseRows,
} = require("../ui/components");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mkToken() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function comboEmoji(c) {
  if (c === "red") return "🔴";
  if (c === "blue") return "🔵";
  if (c === "green") return "🟢";
  return "🟡";
}

function pickComboSeq() {
  const all = ["red", "blue", "green", "yellow"];
  const seq = [];
  for (let i = 0; i < 4; i++) seq.push(all[Math.floor(Math.random() * all.length)]);
  return seq;
}

function aliveList(state) {
  const maxHits = state.def.maxHits ?? MAX_HITS;
  const out = [];
  for (const [uid, st] of state.participants.entries()) {
    if ((st.hits ?? 0) < maxHits) out.push([uid, st]);
  }
  return out;
}

function fightersText(state) {
  const list = [...state.participants.values()];
  if (!list.length) return "`No fighters yet`";
  return list.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000);
}

function currencyEmoji(eventKey) {
  return eventKey === "bleach" ? E_REIATSU : E_CE;
}

async function editBossMessage(channel, state, embed, components) {
  const msg = await channel.messages.fetch(state.messageId).catch(() => null);
  if (!msg) return;
  await msg.edit({ embeds: [embed], components }).catch(() => {});
}

function applyHit(state, uid) {
  const st = state.participants.get(uid);
  if (!st) return;
  st.hits = (st.hits ?? 0) + 1;
  state.participants.set(uid, st);
}

function bankSuccess(state, uid) {
  const st = state.participants.get(uid);
  if (!st) return;
  st.banked = (st.banked ?? 0) + (state.def.hitReward ?? 0);
  state.participants.set(uid, st);
}

function survivalChance(state, uid) {
  const def = state.def;
  const maxBonus = def.event === "bleach" ? (BLEACH_BONUS_MAX ?? 30) : (JJK_BONUS_MAX ?? 30);
  const st = state.participants.get(uid);
  const mobBonus = st?.mobBonus ?? 0;
  const base = def.baseChance ?? 0.3;
  const bonus = Math.min(mobBonus, maxBonus) / 100;
  const p = Math.max(0.02, Math.min(0.95, base + bonus));
  return p;
}

function disableComponents(components) {
  if (!components || !components.length) return components;
  const out = [];
  for (const row of components) {
    const nrow = ActionRowBuilder.from(row);
    nrow.components = nrow.components.map((c) => {
      const btn = ButtonBuilder.from(c);
      btn.setDisabled(true);
      return btn;
    });
    out.push(nrow);
  }
  return out;
}

async function runBoss(channel, state) {
  const def = state.def;

  for (let roundIndex = 0; roundIndex < def.rounds.length; roundIndex++) {
    const r = def.rounds[roundIndex];
    const alive = aliveList(state);
    if (!alive.length) break;

    await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), []);
    await sleep(1200);

    const token = mkToken();
    state.activeAction = { token, roundIndex, mode: null };

    if (r.type === "pressure" || r.type === "attack") {
      let okCount = 0;
      let hitCount = 0;

      for (const [uid] of alive) {
        const chance = survivalChance(state, uid);
        const ok = Math.random() < chance;
        if (ok) { bankSuccess(state, uid); okCount++; }
        else { applyHit(state, uid); hitCount++; }
      }

      const maxHits = def.maxHits ?? MAX_HITS;
      await channel.send(
        `**${def.name} — ${r.title || `Round ${roundIndex + 1}`}**\n` +
        `✅ Survived: **${okCount}** • ❌ Hit: **${hitCount}**\n` +
        `Alive: **${aliveList(state).length}** • (${maxHits} hits = eliminated)`
      ).catch(() => {});
      await sleep(1200);
      continue;
    }

    if (r.type === "scripted_hit_all") {
      if (r.delayMs) await sleep(r.delayMs);
      if (Array.isArray(r.spamLines)) {
        for (const line of r.spamLines) {
          await channel.send(line).catch(() => {});
          await sleep(450);
        }
      }
      for (const [uid] of alive) applyHit(state, uid);
      if (r.endText) await channel.send(r.endText).catch(() => {});
      if (r.endMedia) await channel.send({ files: [r.endMedia] }).catch(() => {});
      await sleep(1200);
      continue;
    }

    if (r.type === "coop_block") {
      state.activeAction.mode = "press";
      state.activeAction.requiredPresses = r.requiredPresses ?? 3;
      state.activeAction.pressed = new Set();

      const customId = `boss_action:${def.id}:${roundIndex}:${token}:press:block`;
      const comps = singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false);

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);
      await sleep(r.windowMs ?? 5000);

      const presses = state.activeAction.pressed.size;
      const ok = presses >= state.activeAction.requiredPresses;

      if (!ok) {
        for (const [uid] of alive) applyHit(state, uid);
        await channel.send(`❌ Not enough blocks (**${presses}/${state.activeAction.requiredPresses}**) — everyone takes a hit.`).catch(() => {});
      } else {
        for (const [uid] of alive) bankSuccess(state, uid);
        await channel.send(`✅ Defense succeeded (**${presses}/${state.activeAction.requiredPresses}**) — everyone survives.`).catch(() => {});
      }

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "quick_block" || r.type === "finisher") {
      state.activeAction.mode = "press";
      state.activeAction.pressed = new Set();

      const customId = `boss_action:${def.id}:${roundIndex}:${token}:press:go`;
      const comps = singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false);

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);
      await sleep(r.windowMs ?? 5000);

      const pressed = state.activeAction.pressed;
      let okCount = 0;
      let hitCount = 0;

      for (const [uid] of alive) {
        if (pressed.has(uid)) { bankSuccess(state, uid); okCount++; }
        else { applyHit(state, uid); hitCount++; }
      }

      await channel.send(`✅ Pressed: **${okCount}** • ❌ Missed: **${hitCount}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "multi_press") {
      state.activeAction.mode = "multi_press";
      state.activeAction.requiredPresses = r.requiredPresses ?? 3;
      state.activeAction.counts = new Map();

      const customId = `boss_action:${def.id}:${roundIndex}:${token}:multi:block`;
      const comps = singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false);

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);
      await sleep(r.windowMs ?? 10000);

      let okCount = 0;
      let hitCount = 0;

      for (const [uid] of alive) {
        const c = state.activeAction.counts.get(uid) || 0;
        if (c >= state.activeAction.requiredPresses) { bankSuccess(state, uid); okCount++; }
        else { applyHit(state, uid); hitCount++; }
      }

      await channel.send(`✅ Completed: **${okCount}** • ❌ Failed: **${hitCount}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "combo_defense") {
      state.activeAction.mode = "combo";
      state.activeAction.comboSeq = pickComboSeq();
      state.activeAction.comboProgress = new Map();
      state.activeAction.comboFailed = new Set();

      const seqText = state.activeAction.comboSeq.map(comboEmoji).join(" ");
      await channel.send(`🎮 Combo order: ${seqText}`).catch(() => {});

      const comps = comboDefenseRows(token, def.id, roundIndex);
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);
      await sleep(r.windowMs ?? 15000);

      let okCount = 0;
      let hitCount = 0;

      for (const [uid] of alive) {
        const prog = state.activeAction.comboProgress.get(uid) || 0;
        const bad = state.activeAction.comboFailed.has(uid);
        if (!bad && prog >= 4) { bankSuccess(state, uid); okCount++; }
        else { applyHit(state, uid); hitCount++; }
      }

      await channel.send(`✅ Combo success: **${okCount}** • ❌ Failed: **${hitCount}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "choice_qte") {
      state.activeAction.mode = "choice";
      state.activeAction.choice = new Map();

      const cA = r.choices?.[0];
      const cB = r.choices?.[1];
      if (!cA || !cB || !cA.key || !cB.key) {
        await channel.send("⚠️ Boss config error: choice_qte choices invalid. Skipped safely.").catch(() => {});
        continue;
      }

      const aId = `boss_action:${def.id}:${roundIndex}:${token}:choice:${cA.key}`;
      const bId = `boss_action:${def.id}:${roundIndex}:${token}:choice:${cB.key}`;
      const comps = dualChoiceRow(aId, cA.label || cA.key, cA.emoji || "🅰️", bId, cB.label || cB.key, cB.emoji || "🅱️", false);

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);
      await sleep(r.windowMs ?? 3000);

      let okCount = 0;
      let hitCount = 0;

      for (const [uid] of alive) {
        const chosen = state.activeAction.choice.get(uid);
        if (chosen && chosen === r.correct) { bankSuccess(state, uid); okCount++; }
        else { applyHit(state, uid); hitCount++; }
      }

      await channel.send(`✅ Correct: **${okCount}** • ❌ Wrong/No pick: **${hitCount}**`).catch(() => {});
      if (r.afterText) await channel.send(r.afterText).catch(() => {});
      if (r.afterMedia) await channel.send({ files: [r.afterMedia] }).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "tri_press") {
      state.activeAction.mode = "tri_press";
      state.activeAction.pressed = new Map();

      const btns = (r.buttons || []).map((b) => ({
        customId: `boss_action:${def.id}:${roundIndex}:${token}:tri:${b.key}`,
        label: b.label || b.key,
        emoji: b.emoji || "🔘",
      }));

      const comps = triChoiceRow(btns, false);
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);
      await sleep(r.windowMs ?? 12000);

      let okCount = 0;
      let hitCount = 0;

      for (const [uid] of alive) {
        const set = state.activeAction.pressed.get(uid);
        if (set && set.size >= 3) { bankSuccess(state, uid); okCount++; }
        else { applyHit(state, uid); hitCount++; }
      }

      await channel.send(`✅ Focus success: **${okCount}** • ❌ Failed: **${hitCount}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "final_quiz") {
      state.activeAction.mode = "quiz";
      state.activeAction.choice = new Map();

      const choices = Array.isArray(r.choices) ? r.choices.slice(0, 5) : [];
      if (!choices.length) {
        await channel.send("⚠️ Boss config error: final_quiz no choices. Skipped safely.").catch(() => {});
        continue;
      }

      const row = new ActionRowBuilder();
      for (const c of choices) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`boss_action:${def.id}:${roundIndex}:${token}:quiz:${c.key}`)
            .setLabel(c.label || c.key)
            .setEmoji(c.emoji || "❔")
            .setStyle(ButtonStyle.Secondary)
        );
      }

      const comps = [row];
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);
      await sleep(r.windowMs ?? 8000);

      let okCount = 0;
      let hitCount = 0;

      for (const [uid] of alive) {
        const chosen = state.activeAction.choice.get(uid);
        if (chosen && chosen === r.correct) { bankSuccess(state, uid); okCount++; }
        else { applyHit(state, uid); hitCount++; }
      }

      await channel.send(`✅ Correct: **${okCount}** • ❌ Wrong/No pick: **${hitCount}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "group_final") {
      const requiredWins = r.requiredWins ?? 3;

      let wins = 0;
      const results = [];
      for (const [uid] of alive) {
        const chance = survivalChance(state, uid);
        const ok = Math.random() < chance;
        results.push({ uid, ok });
        if (ok) wins++;
      }

      if (wins >= requiredWins) {
        for (const x of results) {
          if (x.ok) bankSuccess(state, x.uid);
          else applyHit(state, x.uid);
        }
        await channel.send(`✅ Group succeeded: **${wins}/${requiredWins}**.`).catch(() => {});
      } else {
        for (const [uid] of alive) applyHit(state, uid);
        await channel.send(`❌ Group failed: **${wins}/${requiredWins}** — everyone takes a hit.`).catch(() => {});
      }

      await sleep(900);
      continue;
    }

    await channel.send(`⚠️ Unknown round type: \`${r.type}\` (skipped safely)`).catch(() => {});
    await sleep(800);
  }

  const survivors = aliveList(state);

  if (!survivors.length) {
    await editBossMessage(channel, state, bossDefeatEmbed(state.def), bossButtons(true));
    await channel.send("☠️ Everyone was eliminated.").catch(() => {});
  } else {
    const def = state.def;
    const emoji = currencyEmoji(def.event);

    const rewards = [];

    for (const [uid, st] of survivors) {
      const p = await getPlayer(uid);

      const winBase =
        def.winRewardRange
          ? randInt(def.winRewardRange.min, def.winRewardRange.max)
          : (def.winReward ?? 0);

      const banked = st.banked ?? 0;
      const total = winBase + banked;

      if (def.event === "bleach") p.bleach.reiatsu += total;
      else p.jjk.cursedEnergy += total;

      if (def.event === "jjk") {
        if (def.expeditionKeyChance && Math.random() < def.expeditionKeyChance) {
          p.jjk.materials.expeditionKeys += 1;
        }
        if (def.shardDropRange) {
          const add = randInt(def.shardDropRange.min, def.shardDropRange.max);
          p.jjk.materials.cursedShards += add;
        }
      }

      await setPlayer(uid, p);
      rewards.push({ uid, total, winBase, banked });
    }

    await editBossMessage(channel, state, bossVictoryEmbed(def, survivors.length), bossButtons(true));

    const lines = rewards
      .slice(0, 25)
      .map((r) => `• <@${r.uid}>: ${emoji} **${r.total}** (win ${r.winBase} + bank ${r.banked})`);

    await channel.send(
      `🎉 **Victory!** Survivors: **${survivors.length}**\n` +
      lines.join("\n") +
      (rewards.length > 25 ? `\n… and ${rewards.length - 25} more` : "")
    ).catch(() => {});
  }

  bossByChannel.delete(channel.id);
}

async function spawnBoss(channel, bossId, withPing = true) {
  const def = BOSSES[bossId];
  if (!def) return;

  if (bossByChannel.has(channel.id)) {
    await channel.send("⚠️ A boss is already active in this channel.").catch(() => {});
    return;
  }

  if (withPing && PING_BOSS_ROLE_ID) {
    await channel.send(`<@&${PING_BOSS_ROLE_ID}>`).catch(() => {});
  }

  if (def.preText) {
    await channel.send(def.preText).catch(() => {});
    await sleep(def.preTextDelayMs || 10000);
    if (def.teaserMedia) {
      await channel.send({ files: [def.teaserMedia] }).catch(() => {});
      await sleep(def.teaserDelayMs || 5000);
    }
  }

  const state = {
    def,
    messageId: null,
    joining: true,
    participants: new Map(),
    activeAction: null,
  };

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(def, channel.name, 0, fightersText(state))],
    components: bossButtons(false),
  }).catch(() => null);

  if (!msg) return;

  state.messageId = msg.id;
  bossByChannel.set(channel.id, state);

  await sleep(def.joinMs ?? 30000);

  state.joining = false;
  bossByChannel.set(channel.id, state);

  await editBossMessage(
    channel,
    state,
    bossSpawnEmbed(def, channel.name, state.participants.size, fightersText(state)),
    bossButtons(true)
  );

  if (state.participants.size === 0) {
    await channel.send("⏳ Join ended. No fighters joined.").catch(() => {});
    bossByChannel.delete(channel.id);
    return;
  }

  await channel.send(`⚔️ Boss fight started with **${state.participants.size}** fighters.`).catch(() => {});
  await runBoss(channel, state);
}

module.exports = { spawnBoss };
