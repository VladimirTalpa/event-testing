const cfg = require("../config");
const { getPlayer, setPlayer } = require("../core/players");
const { tryGiveRole, ensureOwnedRole } = require("../core/utils");
const { bossSpawnEmbed, bossRoundEmbed, bossVictoryEmbed, bossDefeatEmbed } = require("../ui/embeds");
const { bossButtons, singleActionRow, comboDefenseRows } = require("../ui/components");
const state = require("../core/state");

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function computeSurviveChance(eventKey, player, baseChance) {
  // your shop bonuses can be plugged here later; keep base as requested
  if (eventKey === "bleach") {
    const perm = clamp(player.bleach.survivalBonus || 0, 0, 30);
    return Math.min(0.95, baseChance + perm / 100);
  }
  const perm = clamp(player.jjk.survivalBonus || 0, 0, 30);
  return Math.min(0.95, baseChance + perm / 100);
}

function randomComboSeq() {
  const colors = ["red", "blue", "green", "yellow"];
  const seq = [];
  for (let i = 0; i < 4; i++) seq.push(colors[Math.floor(Math.random() * colors.length)]);
  return seq;
}

function comboToEmoji(c) {
  if (c === "red") return "🔴";
  if (c === "blue") return "🔵";
  if (c === "green") return "🟢";
  return "🟡";
}

function aliveIds(boss) {
  return [...boss.participants.entries()]
    .filter(([, st]) => st.hits < cfg.MAX_HITS)
    .map(([uid]) => uid);
}

async function applyHit(uid, boss, channel, reasonText) {
  const st = boss.participants.get(uid);
  if (!st) return;
  st.hits++;
  await channel.send(`💥 **${st.displayName}** ${reasonText} (**${st.hits}/${cfg.MAX_HITS}**)`).catch(() => {});
  if (st.hits >= cfg.MAX_HITS) await channel.send(`☠️ **${st.displayName}** was eliminated.`).catch(() => {});
}

function bankSuccess(uid, boss, amount) {
  boss.hitBank.set(uid, (boss.hitBank.get(uid) || 0) + amount);
}

async function updateBossSpawnMessage(channel, boss) {
  const fighters = [...boss.participants.values()];
  const fightersText = fighters.length
    ? fighters.map((p) => p.displayName).join(", ").slice(0, 1000)
    : "`No fighters yet`";

  const msg = await channel.messages.fetch(boss.messageId).catch(() => null);
  if (!msg) return;

  await msg.edit({
    embeds: [bossSpawnEmbed(boss.def, channel.name, fighters.length, fightersText)],
    components: bossButtons(!boss.joining),
  }).catch(() => {});
}

async function runBoss(channel, boss) {
  try {
    boss.joining = false;
    await updateBossSpawnMessage(channel, boss);

    let alive = aliveIds(boss);
    if (!alive.length) {
      await channel.send(`💨 Nobody joined. **${boss.def.name}** vanished.`).catch(() => {});
      return;
    }

    for (let i = 0; i < boss.def.rounds.length; i++) {
      alive = aliveIds(boss);
      if (!alive.length) break;

      const r = boss.def.rounds[i];
      await channel.send({ embeds: [bossRoundEmbed(boss.def, i, alive.length)] }).catch(() => {});

      // pressure/attack = normal roll
      if (r.type === "pressure" || r.type === "attack") {
        for (const uid of alive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.def.event, player, boss.def.baseChance);
          const ok = Math.random() < chance;

          if (!ok) await applyHit(uid, boss, channel, `couldn't withstand **${boss.def.name}**!`);
          else bankSuccess(uid, boss, boss.def.hitReward);

          await sleep(150);
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Next round in **${Math.round(cfg.ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(cfg.ROUND_COOLDOWN_MS);
        }
        continue;
      }

      // COOP BLOCK
      if (r.type === "coop_block") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = { token, roundIndex: i, mode: "coop", pressed: new Set(), requiredPresses: r.requiredPresses || 3 };

        const customId = `boss_action:${boss.def.id}:${i}:${token}:press:block`;
        const msg = await channel.send({
          content: `🛡️ **COOP BLOCK: ${Math.round((r.windowMs || 5000) / 1000)}s**\nNeed **${boss.activeAction.requiredPresses} different players**.`,
          components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false),
        }).catch(() => null);

        await sleep(r.windowMs || 5000);
        if (msg?.id) await msg.edit({ components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", true) }).catch(() => {});

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        const req = boss.activeAction?.requiredPresses || 3;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        const success = pressed.size >= req;

        if (!success) {
          await channel.send(`❌ Not enough blocks (${pressed.size}/${req}). Everyone takes a hit!`).catch(() => {});
          for (const uid of nowAlive) {
            await applyHit(uid, boss, channel, `failed to block in time!`);
            await sleep(120);
          }
        } else {
          await channel.send(`✅ Block succeeded (${pressed.size}/${req}). Pressers banked rewards.`).catch(() => {});
          for (const uid of nowAlive) {
            if (pressed.has(uid)) bankSuccess(uid, boss, boss.def.hitReward);
          }
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Next round in **${Math.round(cfg.ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(cfg.ROUND_COOLDOWN_MS);
        }
        continue;
      }

      // MULTI PRESS (Grimmjow R1): each player must press N times
      if (r.type === "multi_press") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const need = r.requiredPressesPerUser || 3;
        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "multi",
          pressCount: new Map(), // uid -> count
        };

        const customId = `boss_action:${boss.def.id}:${i}:${token}:multi:block`;
        const msg = await channel.send({
          content: `🛡️ **MULTI BLOCK: ${Math.round((r.windowMs || 15000) / 1000)}s**\nEach fighter must press **${need} times**.`,
          components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false),
        }).catch(() => null);

        await sleep(r.windowMs || 15000);
        if (msg?.id) await msg.edit({ components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", true) }).catch(() => {});

        const counts = boss.activeAction?.token === token ? boss.activeAction.pressCount : new Map();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const c = counts.get(uid) || 0;
          if (c >= need) {
            bankSuccess(uid, boss, boss.def.hitReward);
          } else {
            await applyHit(uid, boss, channel, `didn't block enough times (${c}/${need})!`);
          }
          await sleep(120);
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Next round in **${Math.round(cfg.ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(cfg.ROUND_COOLDOWN_MS);
        }
        continue;
      }

      // QUICK BLOCK / FINISHER
      if (r.type === "quick_block" || r.type === "finisher") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = { token, roundIndex: i, mode: "press", pressed: new Set() };

        const label = r.buttonLabel || (r.type === "finisher" ? "Finisher" : "Block");
        const emoji = r.buttonEmoji || (r.type === "finisher" ? "⚔️" : "🛡️");
        const customId = `boss_action:${boss.def.id}:${i}:${token}:press:${r.type}`;

        const msg = await channel.send({
          content: `⚠️ **${label.toUpperCase()} WINDOW: ${Math.round((r.windowMs || 5000) / 1000)}s**`,
          components: singleActionRow(customId, label, emoji, false),
        }).catch(() => null);

        await sleep(r.windowMs || 5000);
        if (msg?.id) await msg.edit({ components: singleActionRow(customId, label, emoji, true) }).catch(() => {});

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          if (pressed.has(uid)) bankSuccess(uid, boss, boss.def.hitReward);
          else await applyHit(uid, boss, channel, `was too slow!`);
          await sleep(120);
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Next round in **${Math.round(cfg.ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(cfg.ROUND_COOLDOWN_MS);
        }
        continue;
      }

      // COMBO DEFENSE (Ulquiorra)
      if (r.type === "combo_defense") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const seq = randomComboSeq();

        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "combo",
          comboSeq: seq,
          comboProgress: new Map(),
          comboFailed: new Set(),
        };

        const seqText = seq.map(comboToEmoji).join(" ");
        const msg = await channel.send({
          content: `🎮 **COMBO DEFENSE** — ${Math.round((r.windowMs || 15000) / 1000)}s\nPress in order: ${seqText}`,
          components: comboDefenseRows(token, boss.def.id, i),
        }).catch(() => null);

        await sleep(r.windowMs || 15000);
        if (msg?.id) {
          const disabledRows = comboDefenseRows(token, boss.def.id, i).map((row) => {
            row.components.forEach((b) => b.setDisabled(true));
            return row;
          });
          await msg.edit({ components: disabledRows }).catch(() => {});
        }

        const action = boss.activeAction;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const prog = action?.comboProgress?.get(uid) ?? 0;
          const failed = action?.comboFailed?.has(uid);
          const completed = !failed && prog >= 4;
          if (completed) bankSuccess(uid, boss, boss.def.hitReward);
          else await applyHit(uid, boss, channel, `failed the Combo Defense!`);
          await sleep(120);
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Next round in **${Math.round(cfg.ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(cfg.ROUND_COOLDOWN_MS);
        }
        continue;
      }

      // GROUP FINAL
      if (r.type === "group_final") {
        const nowAlive = aliveIds(boss);
        const required = r.requiredWins || 3;

        let wins = 0;
        const winners = new Set();

        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.def.event, player, boss.def.baseChance);
          const ok = Math.random() < chance;
          if (ok) { wins++; winners.add(uid); }
        }

        if (wins < required) {
          await channel.send(`❌ Not enough successful final hits (${wins}/${required}). **Everyone loses.**`).catch(() => {});
          for (const uid of nowAlive) {
            await applyHit(uid, boss, channel, `was overwhelmed in the final push!`);
            const st = boss.participants.get(uid);
            if (st) st.hits = cfg.MAX_HITS;
            await sleep(100);
          }
        } else {
          await channel.send(`✅ Final push succeeded! (${wins}/${required})`).catch(() => {});
          for (const uid of nowAlive) {
            if (winners.has(uid)) bankSuccess(uid, boss, boss.def.hitReward);
          }
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Next round in **${Math.round(cfg.ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(cfg.ROUND_COOLDOWN_MS);
        }
        continue;
      }
    }

    // ===== RESULT =====
    const survivors = aliveIds(boss);
    if (!survivors.length) {
      await channel.send({ embeds: [bossDefeatEmbed(boss.def)] }).catch(() => {});
      return;
    }

    const lines = [];
    for (const uid of survivors) {
      const player = await getPlayer(uid);

      // payout
      const win = boss.def.winReward;
      const bank = boss.hitBank.get(uid) || 0;
      const total = win + bank;

      if (boss.def.event === "bleach") player.bleach.reiatsu += total;
      else player.jjk.cursedEnergy += total;

      // material on victory (Special Grade)
      if (boss.def.materialDrop?.key) {
        const k = boss.def.materialDrop.key;
        const amt = boss.def.materialDrop.amount || 1;
        player.jjk.materials[k] = (player.jjk.materials[k] || 0) + amt;
        lines.push(`🧩 <@${uid}> +${amt} **Cursed Shard**`);
      }

      await setPlayer(uid, player);

      lines.push(`• <@${uid}> +${total} ${boss.def.event === "bleach" ? "Reiatsu" : "Cursed Energy"} (Win ${win} + Bank ${bank})`);

      // role drop chance
      const chance = boss.def.roleDropChance || 0;
      if (boss.def.roleDropId && Math.random() < chance) {
        ensureOwnedRole(player, boss.def.roleDropId);
        await setPlayer(uid, player);

        const res = await tryGiveRole(channel.guild, uid, boss.def.roleDropId);
        lines.push(res.ok ? `🎭 <@${uid}> obtained a **Boss role**!` : `⚠️ <@${uid}> won a role but bot couldn't assign (saved).`);
      }

      // robux drop
      const robuxChance = Math.min(cfg.DROP_ROBUX_CHANCE_CAP, cfg.DROP_ROBUX_CHANCE_REAL_BASE);
      if (Math.random() < robuxChance) {
        lines.push(`🎁 <@${uid}> won **100 Robux** (${(cfg.DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}%) — ${cfg.ROBUX_CLAIM_TEXT}`);
      }
    }

    await channel.send({ embeds: [bossVictoryEmbed(boss.def, survivors.length)] }).catch(() => {});
    await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
  } catch (e) {
    console.error("runBoss crashed:", e);
    await channel.send("⚠️ Boss event crashed. Please report to admin.").catch(() => {});
  } finally {
    state.bossByChannel.delete(channel.id);
  }
}

async function spawnBoss(channel, def, withPing = true) {
  if (withPing) await channel.send(`<@&${cfg.PING_BOSS_ROLE_ID}>`).catch(() => {});
  if (state.bossByChannel.has(channel.id)) return;

  const boss = {
    def,
    messageId: null,
    joining: true,
    participants: new Map(),
    hitBank: new Map(),
    activeAction: null,
  };

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(def, channel.name, 0, "`No fighters yet`")],
    components: bossButtons(false),
  });

  boss.messageId = msg.id;
  state.bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    const still = state.bossByChannel.get(channel.id);
    if (still && still.messageId === boss.messageId) runBoss(channel, still).catch(() => {});
  }, def.joinMs);
}

module.exports = { spawnBoss };
