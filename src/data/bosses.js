const {
  E_VASTO,
  E_REIATSU,
  BOSS_JOIN_MS,
  BOSS_ROUNDS,
  ROUND_COOLDOWN_MS,
  BASE_SURVIVE_CHANCE,
  BOSS_REIATSU_REWARD,
  BOSS_SURVIVE_HIT_REIATSU,
  DROP_ROLE_CHANCE_BASE,
  DROP_ROLE_CHANCE_CAP,
  DROP_ROBUX_CHANCE_REAL_BASE,
  DROP_ROBUX_CHANCE_DISPLAY,
  DROP_ROBUX_CHANCE_CAP,
  ROBUX_CLAIM_TEXT,
  BONUS_MAX,
} = require("../config");

const { bossSpawnEmbed, bossStateEmbed, bossVictoryEmbed, bossDefeatEmbed } = require("../embeds");
const { bossButtons } = require("../components");
const { PermissionsBitField } = require("discord.js");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function calcItemSurvivalBonus(items) {
  let bonus = 0;
  if (items.zanpakuto_basic) bonus += 4;
  if (items.hollow_mask_fragment) bonus += 7;
  if (items.soul_reaper_cloak) bonus += 9;
  if (items.reiatsu_amplifier) bonus += 2;
  return bonus;
}
function calcReiatsuMultiplier(items) {
  return items.reiatsu_amplifier ? 1.25 : 1.0;
}
function calcDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.zanpakuto_basic) mult += 0.05;
  if (items.hollow_mask_fragment) mult += 0.10;
  if (items.soul_reaper_cloak) mult += 0.06;
  return mult;
}

function computeBossSurviveChance(player) {
  const itemBonus = calcItemSurvivalBonus(player.items);
  const perm = clamp(player.survivalBonus, 0, BONUS_MAX);
  return Math.min(0.95, BASE_SURVIVE_CHANCE + (itemBonus + perm) / 100);
}

async function editMessageSafe(channel, messageId, payload) {
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return null;
  await msg.edit(payload).catch(() => {});
  return msg;
}

async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return { ok: false, reason: "Bot has no Manage Roles permission." };
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

async function updateBossSpawnMessage(channel, boss) {
  const fighters = [...boss.participants.values()];
  const fightersText = fighters.length
    ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000)
    : "`No fighters yet`";

  await editMessageSafe(channel, boss.messageId, {
    embeds: [bossSpawnEmbed(boss.cfg, channel.name, fighters.length, fightersText)],
    components: bossButtons(!boss.joining),
  });
}

async function runBoss(channel, boss, players) {
  const roundBonusMap = new Map();

  try {
    boss.joining = false;
    await updateBossSpawnMessage(channel, boss);

    let alive = [...boss.participants.keys()];
    if (!alive.length) {
      await channel.send(`${E_VASTO} No one joined. ${boss.cfg.name} vanished.`).catch(() => {});
      return;
    }

    for (let round = 1; round <= BOSS_ROUNDS; round++) {
      if (!alive.length) break;

      await channel.send(`${E_VASTO} **Round ${round}/${BOSS_ROUNDS}** begins!`).catch(() => {});
      const nextAlive = [];

      for (const uid of alive) {
        const state = boss.participants.get(uid);
        const player = await players.get(uid);

        const survived = Math.random() < computeBossSurviveChance(player);
        const name = safeName(state.displayName);

        if (!survived) {
          state.hits++;
          await channel.send(`💥 **${name}** was hit by ${boss.cfg.name}! (${state.hits}/2)`).catch(() => {});
          if (state.hits < 2) nextAlive.push(uid);
          else await channel.send(`☠️ **${name}** was eliminated.`).catch(() => {});
        } else {
          const mult = calcReiatsuMultiplier(player.items);
          const bonus = Math.floor(BOSS_SURVIVE_HIT_REIATSU * mult);
          player.reiatsu += bonus;
          roundBonusMap.set(uid, (roundBonusMap.get(uid) || 0) + bonus);

          await channel.send(`⚔️ **${name}** resisted and dealt damage!`).catch(() => {});
          nextAlive.push(uid);
        }

        await players.set(uid, player);
        await sleep(600);
      }

      alive = nextAlive;

      if (alive.length) {
        await channel.send({ embeds: [bossStateEmbed(boss.cfg, round, alive.length)] }).catch(() => {});
        if (round < BOSS_ROUNDS) {
          await channel.send(`⏳ Cooldown: **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
      }
    }

    if (!alive.length) {
      await channel.send({ embeds: [bossDefeatEmbed(boss.cfg)] }).catch(() => {});
      return;
    }

    // Rewards + drops
    const lines = [];

    for (const uid of alive) {
      const player = await players.get(uid);
      const mult = calcReiatsuMultiplier(player.items);

      const baseReward = Math.floor(BOSS_REIATSU_REWARD * mult);
      player.reiatsu += baseReward;

      const roundBonus = roundBonusMap.get(uid) || 0;
      lines.push(`• <@${uid}> +${E_REIATSU} ${baseReward} (Round hits: +${E_REIATSU} ${roundBonus})`);

      const luckMult = calcDropLuckMultiplier(player.items);

      // Role drop
      const roleChance = Math.min(DROP_ROLE_CHANCE_CAP, DROP_ROLE_CHANCE_BASE * luckMult);
      if (Math.random() < roleChance) {
        const res = await tryGiveRole(channel.guild, uid, boss.cfg.dropRoleId);
        lines.push(res.ok ? `🎭 <@${uid}> obtained **${boss.cfg.name} role**!`
                          : `⚠️ <@${uid}> won role but bot couldn't assign: ${res.reason}`);
      }

      // Robux drop
      const robuxChance = Math.min(DROP_ROBUX_CHANCE_CAP, DROP_ROBUX_CHANCE_REAL_BASE * luckMult);
      if (Math.random() < robuxChance) {
        lines.push(`🎁 <@${uid}> won **100 Robux** (${(DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}%) — ${ROBUX_CLAIM_TEXT}`);
      }

      await players.set(uid, player);
    }

    await channel.send({ embeds: [bossVictoryEmbed(boss.cfg, alive.length)] }).catch(() => {});
    await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
  } catch (e) {
    console.error("runBoss crashed:", e);
    await channel.send("⚠️ Boss event crashed. Please report to admin.").catch(() => {});
  }
}

async function spawnBoss(channel, bossCfg, bossByChannel, players, withPingRoleId) {
  if (bossByChannel.has(channel.id)) return;

  if (withPingRoleId) await channel.send(`<@&${withPingRoleId}>`).catch(() => {});
  const boss = { cfg: bossCfg, messageId: null, joining: true, participants: new Map() };

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(bossCfg, channel.name, 0, "`No fighters yet`")],
    components: bossButtons(false),
  });

  boss.messageId = msg.id;
  bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    const still = bossByChannel.get(channel.id);
    if (!still || still.messageId !== boss.messageId) return;

    still.joining = false;
    updateBossSpawnMessage(channel, still).catch(() => {});
    runBoss(channel, still, players)
      .catch(() => {})
      .finally(() => bossByChannel.delete(channel.id));
  }, BOSS_JOIN_MS);
}

module.exports = { spawnBoss };
