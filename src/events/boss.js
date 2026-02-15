const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { BOSSES } = require("../data/bosses");
const {
  COLOR,
  MAX_HITS,
  PING_BOSS_ROLE_ID,
  BLEACH_BONUS_MAX,
  JJK_BONUS_MAX,
  E_REIATSU,
  E_CE,
  E_DRAKO,
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

function pickComboSeq() {
  const all = ["red", "blue", "green", "yellow"];
  // random sequence of length 4
  const seq = [];
  for (let i = 0; i < 4; i++) seq.push(all[Math.floor(Math.random() * all.length)]);
  return seq;
}

function mkToken() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

async function sendPreTeaser(channel, def) {
  if (def.preText) {
    await channel.send(def.preText).catch(() => {});
    if (def.preTextDelayMs) await sleep(def.preTextDelayMs);
  }
  if (def.teaserMedia) {
    await channel.send({ files: [def.teaserMedia] }).catch(() => {});
    if (def.teaserDelayMs) await sleep(def.teaserDelayMs);
  }
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
  // baseline boss chance (def.baseChance) + event mob bonus + item survival bonus
  // item bonus already calculated in embeds; we keep it simple:
  const def = state.def;
  const maxBonus = def.event === "bleach" ? (BLEACH_BONUS_MAX ?? 30) : (JJK_BONUS_MAX ?? 30);

  const st = state.participants.get(uid);
  const mobBonus = st?.mobBonus ?? 0; // if you want to integrate later; safe default

  const base = def.baseChance ?? 0.3;
  const bonus = Math.min(mobBonus, maxBonus) / 100;

  // clamp 0.02..0.95
  const p = Math.max(0.02, Math.min(0.95, base + bonus));
  return p;
}

function isAlive(state, uid) {
  const maxHits = state.def.maxHits ?? MAX_HITS;
  const st = state.participants.get(uid);
  if (!st) return false;
  return (st.hits ?? 0) < maxHits;
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

/**
 * Core runner
 */
async function runBoss(channel, state) {
  const def = state.def;

  for (let roundIndex = 0; roundIndex < def.rounds.length; roundIndex++) {
    const r = def.rounds[roundIndex];

    // stop if nobody alive
    const alive = aliveList(state);
    if (!alive.length) break;

    // show round embed
    await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), []);

    // Small delay so people see round screen
    await sleep(1200);

    // Setup action state
    const token = mkToken();
    state.activeAction = { token, roundIndex, mode: null };

    // Round handlers
    if (r.type === "pressure" || r.type === "attack") {
      // Individual survival roll
      const p = [];
      for (const [uid] of alive) {
        const chance = survivalChance(state, uid);
        const ok = Math.random() < chance;
        if (ok) bankSuccess(state, uid);
        else applyHit(state, uid);
        p.push({ uid, ok });
      }

      // quick feedback
      const maxHits = def.maxHits ?? MAX_HITS;
      const afterAlive = aliveList(state).length;

      await channel.send(
        `**${def.name} — ${r.title || `Round ${roundIndex + 1}`}**\n` +
          `✅ Survived: **${p.filter((x) => x.ok).length}** • ❌ Hit: **${p.filter((x) => !x.ok).length}**\n` +
          `Alive: **${afterAlive}** • (${maxHits} hits = eliminated)`
      ).catch(() => {});

      await sleep(1200);
      continue;
    }

    if (r.type === "scripted_hit_all") {
      // Optional delay and spam
      if (r.media) await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), []);
      if (r.delayMs) await sleep(r.delayMs);

      if (Array.isArray(r.spamLines)) {
        for (const line of r.spamLines) {
          await channel.send(line).catch(() => {});
          await sleep(450);
        }
      }

      // Everyone takes a hit
      for (const [uid] of alive) applyHit(state, uid);

      if (r.endText) await channel.send(r.endText).catch(() => {});
      if (r.endMedia) await channel.send({ files: [r.endMedia] }).catch(() => {});

      await sleep(1200);
      continue;
    }

    if (r.type === "coop_block") {
      // Need N presses within window
      state.activeAction.mode = "press";
      state.activeAction.requiredPresses = r.requiredPresses ?? 3;
      state.activeAction.pressed = new Set();

      const customId = `boss_action:${def.id}:${roundIndex}:${token}:press:block`;
      const comps = singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false);

      // show actionable buttons
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);

      await sleep(r.windowMs ?? 5000);

      // resolve
      const presses = state.activeAction.pressed.size;
      const ok = presses >= state.activeAction.requiredPresses;

      if (!ok) {
        // everyone gets hit
        for (const [uid] of alive) applyHit(state, uid);
        await channel.send(`❌ Not enough blocks (**${presses}/${state.activeAction.requiredPresses}**) — everyone takes a hit.`).catch(() => {});
      } else {
        // everyone survives and banks
        for (const [uid] of alive) bankSuccess(state, uid);
        await channel.send(`✅ Defense succeeded (**${presses}/${state.activeAction.requiredPresses}**) — everyone survives.`).catch(() => {});
      }

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "quick_block" || r.type === "finisher") {
      // Everyone must press within window or take hit
      state.activeAction.mode = "press";
      state.activeAction.pressed = new Set();

      const customId = `boss_action:${def.id}:${roundIndex}:${token}:press:go`;
      const comps = singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false);

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);

      await sleep(r.windowMs ?? 5000);

      const pressed = state.activeAction.pressed;

      let survived = 0;
      let hit = 0;

      for (const [uid] of alive) {
        if (pressed.has(uid)) {
          bankSuccess(state, uid);
          survived++;
        } else {
          applyHit(state, uid);
          hit++;
        }
      }

      await channel.send(`✅ Pressed: **${survived}** • ❌ Missed: **${hit}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "multi_press") {
      // Each player needs X presses within window
      state.activeAction.mode = "multi_press";
      state.activeAction.requiredPresses = r.requiredPresses ?? 3;
      state.activeAction.counts = new Map();

      const customId = `boss_action:${def.id}:${roundIndex}:${token}:multi:block`;
      const comps = singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false);

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);

      await sleep(r.windowMs ?? 10000);

      let ok = 0;
      let fail = 0;

      for (const [uid] of alive) {
        const c = state.activeAction.counts.get(uid) || 0;
        if (c >= state.activeAction.requiredPresses) {
          bankSuccess(state, uid);
          ok++;
        } else {
          applyHit(state, uid);
          fail++;
        }
      }

      await channel.send(`✅ Completed: **${ok}** • ❌ Failed: **${fail}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "combo_defense") {
      // Each player must input 4-seq correctly
      state.activeAction.mode = "combo";
      state.activeAction.comboSeq = pickComboSeq();
      state.activeAction.comboProgress = new Map();
      state.activeAction.comboFailed = new Set();

      const comps = comboDefenseRows(token, def.id, roundIndex);

      // Announce sequence privately? We can't DM reliably; so we just show "match the correct order"
      await channel.send(
        `🧩 **Combo Defense** started. Press colors in the correct order (4 steps).`
      ).catch(() => {});

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);

      await sleep(r.windowMs ?? 15000);

      let ok = 0;
      let fail = 0;

      for (const [uid] of alive) {
        const prog = state.activeAction.comboProgress.get(uid) || 0;
        const bad = state.activeAction.comboFailed.has(uid);
        if (!bad && prog >= 4) {
          bankSuccess(state, uid);
          ok++;
        } else {
          applyHit(state, uid);
          fail++;
        }
      }

      await channel.send(`✅ Combo success: **${ok}** • ❌ Failed: **${fail}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "choice_qte") {
      // Choose correct of 2 within window or hit
      state.activeAction.mode = "choice";
      state.activeAction.choice = new Map();

      const cA = r.choices?.[0];
      const cB = r.choices?.[1];

      // HARD anti-crash
      if (!cA || !cB || !cA.key || !cB.key) {
        await channel.send("⚠️ Boss config error: choice_qte choices are invalid. Skipping round safely.").catch(() => {});
        continue;
      }

      const aId = `boss_action:${def.id}:${roundIndex}:${token}:choice:${cA.key}`;
      const bId = `boss_action:${def.id}:${roundIndex}:${token}:choice:${cB.key}`;

      const comps = dualChoiceRow(aId, cA.label || cA.key, cA.emoji || "🅰️", bId, cB.label || cB.key, cB.emoji || "🅱️", false);

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);

      await sleep(r.windowMs ?? 3000);

      let ok = 0;
      let fail = 0;

      for (const [uid] of alive) {
        const chosen = state.activeAction.choice.get(uid);
        if (chosen && chosen === r.correct) {
          bankSuccess(state, uid);
          ok++;
        } else {
          applyHit(state, uid);
          fail++;
        }
      }

      await channel.send(`✅ Correct: **${ok}** • ❌ Wrong/No pick: **${fail}**`).catch(() => {});
      if (r.afterText) await channel.send(r.afterText).catch(() => {});
      if (r.afterMedia) await channel.send({ files: [r.afterMedia] }).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "tri_press") {
      // Must press all 3 unique buttons within window
      state.activeAction.mode = "tri_press";
      state.activeAction.pressed = new Map(); // uid -> Set

      const btns = (r.buttons || []).map((b) => ({
        customId: `boss_action:${def.id}:${roundIndex}:${token}:tri:${b.key}`,
        label: b.label || b.key,
        emoji: b.emoji || "🔘",
      }));
      const comps = triChoiceRow(btns, false);

      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, alive.length), comps);

      await sleep(r.windowMs ?? 12000);

      let ok = 0;
      let fail = 0;

      for (const [uid] of alive) {
        const set = state.activeAction.pressed.get(uid);
        if (set && set.size >= 3) {
          bankSuccess(state, uid);
          ok++;
        } else {
          applyHit(state, uid);
          fail++;
        }
      }

      await channel.send(`✅ Focus success: **${ok}** • ❌ Failed: **${fail}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "final_quiz") {
      // Choose correct among N options
      state.activeAction.mode = "quiz";
      state.activeAction.choice = new Map();

      const choices = Array.isArray(r.choices) ? r.choices.slice(0, 5) : [];
      if (!choices.length) {
        await channel.send("⚠️ Boss config error: final_quiz has no choices. Skipping round safely.").catch(() => {});
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

      let ok = 0;
      let fail = 0;

      for (const [uid] of alive) {
        const chosen = state.activeAction.choice.get(uid);
        if (chosen && chosen === r.correct) {
          bankSuccess(state, uid);
          ok++;
        } else {
          applyHit(state, uid);
          fail++;
        }
      }

      await channel.send(`✅ Correct: **${ok}** • ❌ Wrong/No pick: **${fail}**`).catch(() => {});
      await editBossMessage(channel, state, bossRoundEmbed(def, roundIndex, aliveList(state).length), disableComponents(comps));
      await sleep(900);
      continue;
    }

    if (r.type === "group_final") {
      // Need at least requiredWins to succeed. Each alive rolls survival.
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
        // winners bank, losers hit (so it's not free)
        for (const x of results) {
          if (x.ok) bankSuccess(state, x.uid);
          else applyHit(state, x.uid);
        }
        await channel.send(`✅ Group succeeded: **${wins}/${requiredWins}**.`).catch(() => {});
      } else {
        // everyone loses -> hit all (and likely wipes)
        for (const [uid] of alive) applyHit(state, uid);
        await channel.send(`❌ Group failed: **${wins}/${requiredWins}** — everyone takes a hit.`).catch(() => {});
      }

      await sleep(900);
      continue;
    }

    // Unknown type fallback (safe)
    await channel.send(`⚠️ Unknown round type: \`${r.type}\` (skipped safely)`).catch(() => {});
    await sleep(800);
  }

  // Resolve win/lose
  const survivors = aliveList(state);
  const survivedCount = survivors.length;

  if (survivedCount <= 0) {
    await editBossMessage(channel, state, bossDefeatEmbed(state.def), bossButtons(true));
    await channel.send("☠️ Everyone was eliminated.").catch(() => {});
  } else {
    // Grant rewards to survivors: winReward / winRewardRange + banked
    const def = state.def;
    const emoji = currencyEmoji(def.event);

    let winMin = def.winRewardRange?.min;
    let winMax = def.winRewardRange?.max;

    const rewards = [];

    for (const [uid, st] of survivors) {
      const p = await getPlayer(uid);

      const winBase = (winMin != null && winMax != null)
        ? randInt(winMin, winMax)
        : (def.winReward ?? 0);

      const banked = st.banked ?? 0;
      const total = winBase + banked;

      if (def.event === "bleach") p.bleach.reiatsu += total;
      else p.jjk.cursedEnergy += total;

      // Extra drops for JJK boss if configured
      if (def.event === "jjk") {
        if (def.expeditionKeyChance && Math.random() < def.expeditionKeyChance) {
          p.jjk.materials = p.jjk.materials || { cursedShards: 0, expeditionKeys: 0 };
          p.jjk.materials.expeditionKeys += 1;
        }
        if (def.shardDropRange) {
          p.jjk.materials = p.jjk.materials || { cursedShards: 0, expeditionKeys: 0 };
          const add = randInt(def.shardDropRange.min, def.shardDropRange.max);
          p.jjk.materials.cursedShards += add;
        }
      }

      await setPlayer(uid, p);
      rewards.push({ uid, total, winBase, banked });
    }

    // Role drop (random among survivors)
    let dropped = null;
    if (def.roleDropId && def.roleDropChance && Math.random() < def.roleDropChance) {
      const pick = survivors[Math.floor(Math.random() * survivors.length)]?.[0];
      if (pick) {
        // Save role to player ownedRoles (so wardrobe works)
        const p = await getPlayer(pick);
        p.ownedRoles = Array.isArray(p.ownedRoles) ? p.ownedRoles : [];
        if (!p.ownedRoles.includes(String(def.roleDropId))) p.ownedRoles.push(String(def.roleDropId));
        await setPlayer(pick, p);

        // Try assign on discord (best effort; buttons.js has robust version, here also)
        try {
          const botMember = await channel.guild.members.fetchMe();
          const role = channel.guild.roles.cache.get(def.roleDropId);
          if (role && botMember.permissions.has("ManageRoles")) {
            const botTop = botMember.roles.highest?.position ?? 0;
            if (botTop > role.position) {
              const member = await channel.guild.members.fetch(pick);
              await member.roles.add(def.roleDropId).catch(() => {});
            }
          }
        } catch {}

        dropped = { userId: pick, roleId: def.roleDropId };
      }
    }

    await editBossMessage(channel, state, bossVictoryEmbed(def, survivedCount), bossButtons(true));

    // Summary message
    const lines = rewards
      .slice(0, 25)
      .map((r) => `• <@${r.uid}>: ${emoji} **${r.total}** (win ${r.winBase} + bank ${r.banked})`);

    await channel.send(
      `🎉 **Victory!** Survivors: **${survivedCount}**\n` +
      lines.join("\n") +
      (rewards.length > 25 ? `\n… and ${rewards.length - 25} more` : "") +
      (dropped ? `\n\n🎭 **Role Drop:** <@${dropped.userId}> won <@&${dropped.roleId}>` : "")
    ).catch(() => {});
  }

  // Cleanup
  bossByChannel.delete(channel.id);
}

async function spawnBoss(channel, bossId, withPing = true) {
  const def = BOSSES[bossId];
  if (!def) return;

  // Prevent multiple bosses in channel
  if (bossByChannel.has(channel.id)) {
    await channel.send("⚠️ A boss is already active in this channel.").catch(() => {});
    return;
  }

  // Pre teasers (optional)
  await sendPreTeaser(channel, def);

  // Create state
  const state = {
    def,
    messageId: null,
    joining: true,
    participants: new Map(), // uid -> { hits, banked, displayName }
    activeAction: null,
  };

  // Initial message
  const joinSeconds = Math.round((def.joinMs ?? 30000) / 1000);

  // Ping only if requested
  if (withPing && PING_BOSS_ROLE_ID) {
    await channel.send(`<@&${PING_BOSS_ROLE_ID}>`).catch(() => {});
  }

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(def, channel.name, 0, fightersText(state))],
    components: bossButtons(false),
  }).catch(() => null);

  if (!msg) return;

  state.messageId = msg.id;
  bossByChannel.set(channel.id, state);

  // Join phase timer
  await sleep(def.joinMs ?? 30000);

  // Lock join
  state.joining = false;
  bossByChannel.set(channel.id, state);

  // Update message: disable join
  await editBossMessage(
    channel,
    state,
    bossSpawnEmbed(def, channel.name, state.participants.size, fightersText(state)),
    bossButtons(true)
  );

  // If no one joined
  if (state.participants.size === 0) {
    await channel.send(`⏳ Join phase ended (**${joinSeconds}s**). No fighters joined.`).catch(() => {});
    bossByChannel.delete(channel.id);
    return;
  }

  await channel.send(`⚔️ Boss fight started with **${state.participants.size}** fighters.`).catch(() => {});

  // Run fight
  await runBoss(channel, state);
}

module.exports = { spawnBoss };
