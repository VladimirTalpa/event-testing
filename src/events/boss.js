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

const {
  bossButtons,
  singleActionRow,
  comboDefenseRows,
  multiPressRows,
} = require("../ui/components");

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


/* ===================== ROLE HELPERS ===================== */

async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();

    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return { ok: false, reason: "Bot lacks Manage Roles permission." };
    }

    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };

    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) {
      return { ok: false, reason: "Bot role is below target role." };
    }

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
  if (!player.ownedRoles.includes(id)) {
    player.ownedRoles.push(id);
  }
}


/* ===================== HELPERS ===================== */

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

  await channel
    .send(`💥 **${name}** ${reasonText} (**${st.hits}/${MAX_HITS}**)`)
    .catch(() => {});

  if (st.hits >= MAX_HITS) {
    await channel
      .send(`☠️ **${name}** was eliminated.`)
      .catch(() => {});
  }
}

function bankSuccess(uid, boss, amount) {
  boss.hitBank.set(uid, (boss.hitBank.get(uid) || 0) + amount);
}

function randomComboSeq() {
  const colors = ["red", "blue", "green", "yellow"];
  const seq = [];

  for (let i = 0; i < 4; i++) {
    seq.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  return seq;
}

function comboToEmoji(c) {
  if (c === "red") return "🔴";
  if (c === "blue") return "🔵";
  if (c === "green") return "🟢";
  return "🟡";
}


/* ===================== MAIN ===================== */

async function runBoss(channel, boss, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  try {
    boss.joining = false;

    let alive = aliveIds(boss);

    if (!alive.length) {
      await channel.send(`💨 Nobody joined. **${boss.def.name}** vanished.`).catch(() => {});
      return;
    }

    for (let i = 0; i < boss.def.rounds.length; i++) {
      alive = aliveIds(boss);
      if (!alive.length) break;

      const r = boss.def.rounds[i];

      await channel.send({
        embeds: [bossRoundEmbed(boss.def, i, alive.length)],
      }).catch(() => {});


      /* ===== NORMAL ROLLS ===== */

      if (r.type === "pressure" || r.type === "attack") {
        for (const uid of alive) {
          const player = await getPlayer(uid);

          const chance = computeSurviveChance(
            boss.def.event,
            player,
            boss.def.baseChance,
            bonusMaxBleach,
            bonusMaxJjk
          );

          const ok = Math.random() < chance;

          if (!ok) {
            await applyHit(uid, boss, channel, `couldn't withstand **${boss.def.name}**!`);
          } else {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);

            bankSuccess(uid, boss, add);

            const nm = safeName(boss.participants.get(uid)?.displayName);

            await channel.send(`✅ **${nm}** succeeded! (+${add} banked)`).catch(() => {});
          }

          await sleep(250);
        }

        await sleep(ROUND_COOLDOWN_MS);
        continue;
      }


      /* ===== MULTI PRESS (GRIMMJOW) ===== */

      if (r.type === "multi_press") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "multi",
          neededPresses: r.neededPresses || 3,
          perUser: new Map(),
        };

        const msg = await channel.send({
          content:
            `🛡️ **MULTI BLOCK — ${Math.round(r.windowMs / 1000)}s**\n` +
            `Press ${boss.activeAction.neededPresses} different buttons.`,
          components: multiPressRows(token, boss.def.id, i),
        }).catch(() => null);

        await sleep(r.windowMs);

        if (msg?.id) {
          const rows = multiPressRows(token, boss.def.id, i);
          rows.forEach((r) => r.components.forEach((b) => b.setDisabled(true)));
          await msg.edit({ components: rows }).catch(() => {});
        }

        const action = boss.activeAction;
        boss.activeAction = null;

        for (const uid of alive) {
          const set = action?.perUser?.get(uid);
          const done = (set?.size || 0) >= action.neededPresses;

          const player = await getPlayer(uid);

          if (done) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
          } else {
            await applyHit(uid, boss, channel, `failed to block enough times!`);
          }

          await sleep(150);
        }

        await sleep(ROUND_COOLDOWN_MS);
        continue;
      }


      /* ===== COMBO ===== */

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
          content:
            `🎮 **COMBO DEFENSE — ${Math.round(r.windowMs / 1000)}s**\n` +
            `Press: ${seqText}`,
          components: comboDefenseRows(token, boss.def.id, i),
        }).catch(() => null);

        await sleep(r.windowMs);

        if (msg?.id) {
          const rows = comboDefenseRows(token, boss.def.id, i);
          rows.forEach((r) => r.components.forEach((b) => b.setDisabled(true)));
          await msg.edit({ components: rows }).catch(() => {});
        }

        const action = boss.activeAction;
        boss.activeAction = null;

        for (const uid of alive) {
          const prog = action?.comboProgress?.get(uid) ?? 0;
          const failed = action?.comboFailed?.has(uid);

          const completed = !failed && prog >= 4;
          const player = await getPlayer(uid);

          if (completed) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
          } else {
            await applyHit(uid, boss, channel, `failed the combo!`);
          }

          await sleep(150);
        }

        await sleep(ROUND_COOLDOWN_MS);
        continue;
      }
    }


    /* ===================== END ===================== */

    const survivors = aliveIds(boss);

    if (!survivors.length) {
      await channel.send({ embeds: [bossDefeatEmbed(boss.def)] }).catch(() => {});
      return;
    }

    const lines = [];

    for (const uid of survivors) {
      const player = await getPlayer(uid);

      const mult = getEventMultiplier(boss.def.event, player);

      const win = Math.floor(boss.def.winReward * mult);
      const hits = boss.hitBank.get(uid) || 0;

      const total = win + hits;

      if (boss.def.event === "bleach") {
        player.bleach.reiatsu += total;
      } else {
        player.jjk.cursedEnergy += total;
      }

      /* === JJK MATERIALS === */
      if (boss.def.event === "jjk" && boss.def.materialRewards) {
        if (!player.jjk.materials) {
          player.jjk.materials = { cursed_shard: 0 };
        }

        for (const [k, v] of Object.entries(boss.def.materialRewards)) {
          player.jjk.materials[k] =
            (player.jjk.materials[k]()
