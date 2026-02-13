// src/commands/boss.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const {
  BLEACH_CHANNEL_ID, JJK_CHANNEL_ID, ROUND_COOLDOWN_MS, MAX_HITS, PING_BOSS_ROLE_ID
} = require("../config");

const { bossByChannel } = require("../core/state");
const { clamp, safeName, sleep } = require("../core/utils");
const { getPlayer, setPlayer } = require("../core/players");
const { BOSSES } = require("../data/bosses");
const { bossButtons, singleActionRow, comboDefenseRows, dualChoiceRow, triChoiceRow } = require("../ui/components");
const {
  bossSpawnEmbed, bossRoundEmbed, bossVictoryEmbed, bossDefeatEmbed,
  calcBleachSurvivalBonus, calcBleachReiatsuMultiplier, calcBleachDropLuckMultiplier,
  calcJjkSurvivalBonus, calcJjkCEMultiplier, calcJjkDropLuckMultiplier
} = require("../ui/embeds");

function isAllowedSpawnChannel(eventKey, channelId) {
  if (!BLEACH_CHANNEL_ID && !JJK_CHANNEL_ID) return true;
  if (eventKey === "bleach") return channelId === BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return channelId === JJK_CHANNEL_ID;
  return false;
}
function getMaxHits(def) { return def.maxHits ?? MAX_HITS; }

function computeSurviveChance(eventKey, player, baseChance, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  if (eventKey === "bleach") {
    const itemBonus = calcBleachSurvivalBonus(player.bleach.items);
    const perm = clamp(player.bleach.survivalBonus, 0, bonusMaxBleach);
    return Math.min(0.95, baseChance + (itemBonus + perm) / 100);
  }
  const itemBonus = calcJjkSurvivalBonus(player.jjk.items);
  const perm = clamp(player.jjk.survivalBonus, 0, bonusMaxJjk);
  return Math.min(0.95, baseChance + (itemBonus + perm) / 100);
}
function getEventMultiplier(eventKey, player) {
  return eventKey === "bleach"
    ? calcBleachReiatsuMultiplier(player.bleach.items)
    : calcJjkCEMultiplier(player.jjk.items);
}
function getEventDropMult(eventKey, player) {
  return eventKey === "bleach"
    ? calcBleachDropLuckMultiplier(player.bleach.items)
    : calcJjkDropLuckMultiplier(player.jjk.items);
}
function aliveIds(boss) {
  const maxHits = getMaxHits(boss.def);
  return [...boss.participants.entries()].filter(([, st]) => st.hits < maxHits).map(([uid]) => uid);
}

function applyHitSilent(uid, boss, reasonLabel = "was hit") {
  const maxHits = getMaxHits(boss.def);
  const st = boss.participants.get(uid);
  if (!st) return null;
  st.hits++;
  const name = safeName(st.displayName);
  if (st.hits >= maxHits) return `☠ **${name}** eliminated`;
  return `❌ **${name}** ${reasonLabel} (**${st.hits}/${maxHits}**)`;
}
function eliminate(uid, boss) {
  const st = boss.participants.get(uid);
  if (!st) return;
  st.hits = getMaxHits(boss.def);
}
function bankSuccess(uid, boss, amount) {
  boss.hitBank.set(uid, (boss.hitBank.get(uid) || 0) + amount);
}
function randInt(a, b) {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.floor(min + Math.random() * (max - min + 1));
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

async function updateBossSpawnMessage(channel, boss) {
  const fighters = [...boss.participants.values()];
  const fightersText = fighters.length
    ? fighters.map(p => safeName(p.displayName)).join(", ").slice(0, 1000)
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

      // show round embed
      if (r.type !== "final_quiz") {
        await channel.send({ embeds: [bossRoundEmbed(boss.def, i, alive.length)] }).catch(() => {});
      } else {
        await channel.send(`❓ **${r.title}**\n${r.intro}`).catch(() => {});
      }

      const statusLines = [];

      // pressure/attack = chance check (NO DAMAGE NUMBERS IN TEXT)
      if (r.type === "pressure" || r.type === "attack") {
        for (const uid of alive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.def.event, player, boss.def.baseChance);
          const ok = Math.random() < chance;
          const nm = safeName(boss.participants.get(uid)?.displayName);

          if (ok) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            statusLines.push(`✅ **${nm}** endured`);
          } else {
            statusLines.push(applyHitSilent(uid, boss, "was hit"));
          }
          await sleep(120);
        }
      }

      // quick_block / finisher press window
      if (r.type === "quick_block" || r.type === "finisher") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = { token, mode: "press", pressed: new Set() };

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
          const player = await getPlayer(uid);
          const isJjk = boss.def.event === "jjk";
          const hasReverse = isJjk && player.jjk.items.reverse_talisman;
          const nm = safeName(boss.participants.get(uid)?.displayName);

          if (pressed.has(uid)) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            statusLines.push(`✅ **${nm}** endured`);
          } else {
            if (hasReverse && !boss.reverseUsed.has(uid)) {
              boss.reverseUsed.add(uid);
              statusLines.push(`✨ **${nm}** was saved by Reverse Technique (ignored 1 hit)`);
            } else {
              statusLines.push(applyHitSilent(uid, boss, "was hit"));
            }
          }
          await sleep(110);
        }
      }

      // combo_defense QTE
      if (r.type === "combo_defense") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const seq = randomComboSeq();
        boss.activeAction = {
          token,
          mode: "combo",
          comboSeq: seq,
          comboProgress: new Map(),
          comboFailed: new Set(),
        };

        const seqText = seq.map(comboToEmoji).join(" ");
        const msg = await channel.send({
          content: `🎮 **COMBO DEFENSE** — ${Math.round((r.windowMs || 6000) / 1000)}s\nPress: ${seqText}`,
          components: comboDefenseRows(token, boss.def.id, i),
        }).catch(() => null);

        await sleep(r.windowMs || 6000);

        if (msg?.id) {
          const disabled = comboDefenseRows(token, boss.def.id, i).map(row => {
            row.components.forEach(b => b.setDisabled(true));
            return row;
          });
          await msg.edit({ components: disabled }).catch(() => {});
        }

        const action = boss.activeAction;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const isJjk = boss.def.event === "jjk";
          const hasReverse = isJjk && player.jjk.items.reverse_talisman;

          const prog = action?.comboProgress?.get(uid) ?? 0;
          const failed = action?.comboFailed?.has(uid);
          const completed = !failed && prog >= 4;
          const nm = safeName(boss.participants.get(uid)?.displayName);

          if (completed) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            statusLines.push(`✅ **${nm}** endured`);
          } else {
            if (hasReverse && !boss.reverseUsed.has(uid)) {
              boss.reverseUsed.add(uid);
              statusLines.push(`✨ **${nm}** was saved by Reverse Technique (ignored 1 hit)`);
            } else {
              statusLines.push(applyHitSilent(uid, boss, "was hit"));
            }
          }
          await sleep(90);
        }
      }

      // choice_qte 2 buttons
      if (r.type === "choice_qte") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = { token, mode: "choice", choice: new Map() };

        const cA = r.choices?.[0];
        const cB = r.choices?.[1];
        const idA = `boss_action:${boss.def.id}:${i}:${token}:choice:${cA.key}`;
        const idB = `boss_action:${boss.def.id}:${i}:${token}:choice:${cB.key}`;

        const msg = await channel.send({
          content: `⚡ Choose fast — ${Math.round((r.windowMs || 3000) / 1000)}s`,
          components: dualChoiceRow(idA, cA.label, cA.emoji, idB, cB.label, cB.emoji, false),
        }).catch(() => null);

        await sleep(r.windowMs || 3000);
        if (msg?.id) await msg.edit({ components: dualChoiceRow(idA, cA.label, cA.emoji, idB, cB.label, cB.emoji, true) }).catch(() => {});

        const action = boss.activeAction?.token === token ? boss.activeAction : null;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const picked = action?.choice?.get(uid);
          const nm = safeName(boss.participants.get(uid)?.displayName);

          if (picked === r.correct) {
            const player = await getPlayer(uid);
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            statusLines.push(`✅ **${nm}** endured`);
          } else {
            statusLines.push(applyHitSilent(uid, boss, "was hit"));
          }
          await sleep(90);
        }
      }

      // final_quiz (3 choices) wrong => eliminated
      if (r.type === "final_quiz") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = { token, mode: "quiz", choice: new Map() };

        const btns = (r.choices || []).map(c => ({
          customId: `boss_action:${boss.def.id}:${i}:${token}:quiz:${c.key}`,
          label: c.label,
          emoji: c.emoji
        }));

        const msg = await channel.send({
          content: `⏳ Answer in ${Math.round((r.windowMs || 8000) / 1000)}s`,
          components: triChoiceRow(btns, false),
        }).catch(() => null);

        await sleep(r.windowMs || 8000);
        if (msg?.id) await msg.edit({ components: triChoiceRow(btns, true) }).catch(() => {});

        const action = boss.activeAction?.token === token ? boss.activeAction : null;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const picked = action?.choice?.get(uid);
          const nm = safeName(boss.participants.get(uid)?.displayName);

          if (picked !== r.correct) {
            eliminate(uid, boss);
            statusLines.push(`☠ **${nm}** eliminated`);
          } else {
            const player = await getPlayer(uid);
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            statusLines.push(`✅ **${nm}** endured`);
          }
          await sleep(80);
        }

        // no next after final
        await channel.send(statusLines.join("\n").slice(0, 1900)).catch(() => {});
        continue;
      }

      if (statusLines.length) {
        await channel.send(statusLines.join("\n").slice(0, 1900)).catch(() => {});
      }

      if (i < boss.def.rounds.length - 1) {
        await channel.send(`⏳ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
        await sleep(ROUND_COOLDOWN_MS);
      }
    }

    const survivors = aliveIds(boss);
    if (!survivors.length) {
      await channel.send({ embeds: [bossDefeatEmbed(boss.def)] }).catch(() => {});
      return;
    }

    const payoutLines = [];
    for (const uid of survivors) {
      const player = await getPlayer(uid);
      const mult = getEventMultiplier(boss.def.event, player);

      const winBase = boss.def.winRewardRange
        ? randInt(boss.def.winRewardRange.min, boss.def.winRewardRange.max)
        : boss.def.winReward;

      const win = Math.floor(winBase * mult);
      const bank = boss.hitBank.get(uid) || 0;
      const total = win + bank;

      if (boss.def.event === "bleach") player.bleach.reiatsu += total;
      else player.jjk.cursedEnergy += total;

      if (boss.def.event === "jjk" && boss.def.shardDropRange) {
        const shards = randInt(boss.def.shardDropRange.min, boss.def.shardDropRange.max);
        player.jjk.materials.cursedShards += shards;
        payoutLines.push(`🧩 <@${uid}> получил **${shards} Cursed Shards**.`);
      }
      if (boss.def.event === "jjk" && boss.def.expeditionKeyChance) {
        if (Math.random() < boss.def.expeditionKeyChance) {
          player.jjk.materials.expeditionKeys += 1;
          payoutLines.push(`🗝️ <@${uid}> получил **Expedition Key**!`);
        }
      }

      await setPlayer(uid, player);

      payoutLines.push(`• <@${uid}> +${win} (Win) +${bank} (Bank) = **${total}**`);

      const luckMult = getEventDropMult(boss.def.event, player);
      const baseChance = boss.def.roleDropChance || 0;
      const chance = Math.min(0.25, baseChance * luckMult);

      if (boss.def.roleDropId && Math.random() < chance) {
        payoutLines.push(`🎭 <@${uid}> obtained a **Boss role**!`);
      }
    }

    await channel.send({ embeds: [bossVictoryEmbed(boss.def, survivors.length)] }).catch(() => {});
    await channel.send(payoutLines.join("\n").slice(0, 1900)).catch(() => {});
  } finally {
    bossByChannel.delete(channel.id);
  }
}

async function spawnBoss(channel, bossId, withPing = true) {
  const def = BOSSES[bossId];
  if (!def) return channel.send("❌ Boss not found.").catch(() => {});

  if (!isAllowedSpawnChannel(def.event, channel.id)) {
    return channel.send("❌ This boss can only spawn in the correct event channel.").catch(() => {});
  }
  if (bossByChannel.has(channel.id)) return;

  if (withPing && PING_BOSS_ROLE_ID) {
    await channel.send(`<@&${PING_BOSS_ROLE_ID}>`).catch(() => {});
  }

  const boss = {
    def,
    messageId: null,
    joining: true,
    participants: new Map(),
    hitBank: new Map(),
    activeAction: null,
    reverseUsed: new Set(),
  };

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(def, channel.name, 0, "`No fighters yet`")],
    components: bossButtons(false),
  });

  boss.messageId = msg.id;
  bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    const still = bossByChannel.get(channel.id);
    if (still && still.messageId === boss.messageId) runBoss(channel, still).catch(() => {});
  }, def.joinMs);
}

module.exports = { spawnBoss, runBoss };
