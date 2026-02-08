// src/events/boss.js
const { PermissionsBitField } = require("discord.js");

const {
  BLEACH_CHANNEL_ID,
  JJK_CHANNEL_ID,
  ROUND_COOLDOWN_MS,
  MAX_HITS,
  PING_BOSS_ROLE_ID,

  DROP_ROBUX_CHANCE_REAL_BASE,
  DROP_ROBUX_CHANCE_CAP,
  ROBUX_CLAIM_TEXT,
} = require("../config");

const { bossByChannel } = require("../core/state");
const { clamp, safeName, sleep } = require("../core/utils");
const { getPlayer, setPlayer } = require("../core/players");
const { BOSSES } = require("../data/bosses");
const { bossButtons, singleActionRow, comboDefenseRows } = require("../ui/components");
const {
  bossSpawnEmbed,
  bossRoundEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
  calcBleachSurvivalBonus,
  calcBleachReiatsuMultiplier,
  calcBleachDropLuckMultiplier,
  calcJjkSurvivalBonus,
  calcJjkCEMultiplier,
  calcJjkDropLuckMultiplier,
} = require("../ui/embeds");

/* ===================== ROLE ADD/REMOVE ===================== */
async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return { ok: false, reason: "Bot lacks Manage Roles permission." };
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

function ensureOwnedRole(player, roleId) {
  if (!roleId) return;
  const id = String(roleId);
  if (!player.ownedRoles.includes(id)) player.ownedRoles.push(id);
}

function isAllowedSpawnChannel(eventKey, channelId) {
  if (eventKey === "bleach") return channelId === BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return channelId === JJK_CHANNEL_ID;
  return false;
}

function computeSurviveChance(eventKey, player, baseChance, bonusMaxBleach, bonusMaxJjk) {
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
  if (eventKey === "bleach") return calcBleachReiatsuMultiplier(player.bleach.items);
  return calcJjkCEMultiplier(player.jjk.items);
}
function getEventDropMult(eventKey, player) {
  if (eventKey === "bleach") return calcBleachDropLuckMultiplier(player.bleach.items);
  return calcJjkDropLuckMultiplier(player.jjk.items);
}

function aliveIds(boss) {
  return [...boss.participants.entries()]
    .filter(([, st]) => st.hits < MAX_HITS)
    .map(([uid]) => uid);
}

async function applyHit(uid, boss, channel, reasonText) {
  const st = boss.participants.get(uid);
  if (!st) return;
  st.hits++;
  const name = safeName(st.displayName);
  await channel.send(`💥 **${name}** ${reasonText} (**${st.hits}/${MAX_HITS}**)`).catch(() => {});
  if (st.hits >= MAX_HITS) await channel.send(`☠️ **${name}** was eliminated.`).catch(() => {});
}

function bankSuccess(uid, boss, amount) {
  boss.hitBank.set(uid, (boss.hitBank.get(uid) || 0) + amount);
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
    ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000)
    : "`No fighters yet`";

  const msg = await channel.messages.fetch(boss.messageId).catch(() => null);
  if (!msg) return;

  await msg.edit({
    embeds: [bossSpawnEmbed(boss.def, channel.name, fighters.length, fightersText)],
    components: bossButtons(!boss.joining),
  }).catch(() => {});
}

async function runBoss(channel, boss, bonusMaxBleach = 30, bonusMaxJjk = 30) {
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

      if (r.type === "pressure" || r.type === "attack") {
        for (const uid of alive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.def.event, player, boss.def.baseChance, bonusMaxBleach, bonusMaxJjk);
          const ok = Math.random() < chance;

          if (!ok) {
            await applyHit(uid, boss, channel, `couldn't withstand **${boss.def.name}**!`);
          } else {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);

            const nm = safeName(boss.participants.get(uid)?.displayName);
            await channel.send(`✅ **${nm}** succeeded! (+ ${add} banked)`).catch(() => {});
          }
          await sleep(250);
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

      if (r.type === "coop_block") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "coop",
          pressed: new Set(),
          requiredPresses: r.requiredPresses || 4,
        };

        const customId = `boss_action:${boss.def.id}:${i}:${token}:press:block`;
        const msg = await channel.send({
          content:
            `🛡️ **COOP BLOCK WINDOW: ${Math.round((r.windowMs || 5000) / 1000)}s**\n` +
            `Requirement: **${boss.activeAction.requiredPresses} different players** must press **Block**.`,
          components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", false),
        }).catch(() => null);

        await sleep(r.windowMs || 5000);

        if (msg?.id) await msg.edit({ components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "🛡️", true) }).catch(() => {});

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        const req = boss.activeAction?.requiredPresses || 4;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        const success = pressed.size >= req;

        if (!success) {
          await channel.send(`❌ Not enough blocks (${pressed.size}/${req}). Everyone takes a hit!`).catch(() => {});
          for (const uid of nowAlive) {
            await applyHit(uid, boss, channel, `failed to block in time!`);
            await sleep(140);
          }
        } else {
          await channel.send(`✅ Block succeeded (${pressed.size}/${req}). Pressers counterattacked!`).catch(() => {});
          for (const uid of nowAlive) {
            if (pressed.has(uid)) {
              const player = await getPlayer(uid);
              const mult = getEventMultiplier(boss.def.event, player);
              const add = Math.floor(boss.def.hitReward * mult);
              bankSuccess(uid, boss, add);
            }
          }
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

      if (r.type === "quick_block" || r.type === "finisher") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = { token, roundIndex: i, mode: "press", pressed: new Set() };

        const label = r.buttonLabel || (r.type === "finisher" ? "Finisher" : "Block");
        const emoji = r.buttonEmoji || (r.type === "finisher" ? "⚔️" : "🛡️");
        const customId = `boss_action:${boss.def.id}:${i}:${token}:press:${r.type}`;

        const msg = await channel.send({
          content: `⚠️ **${label.toUpperCase()} WINDOW: ${Math.round((r.windowMs || 5000) / 1000)}s** — press **${label}**!`,
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

          if (pressed.has(uid)) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
          } else {
            if (hasReverse && !boss.reverseUsed.has(uid)) {
              boss.reverseUsed.add(uid);
              const nm = safeName(boss.participants.get(uid)?.displayName);
              await channel.send(`✨ **${nm}** was saved by Reverse Technique! (ignored 1 hit)`).catch(() => {});
            } else {
              await applyHit(uid, boss, channel, `was too slow!`);
            }
          }
          await sleep(170);
        }

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`⏳ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

      if (r.type === "combo_defense") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const seq = randomComboSeq();

        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "combo",
          comboSeq: seq,
          comboProgress:
