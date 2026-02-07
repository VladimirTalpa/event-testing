
const cfg = require("../config");
const { bossByChannel } = require("../state");
const { safeName, sleep, clamp, editMessageSafe } = require("../utils");
const { bossButtons } = require("../components");
const embeds = require("../embeds");
const { getPlayer, setPlayer } = require("../players");
const { PermissionsBitField } = require("discord.js");

/* ===== shop stats (same as before) ===== */
const SHOP_ITEMS = [
  { key: "zanpakuto_basic", dropLuck: 0.05, survive: 4 },
  { key: "hollow_mask_fragment", dropLuck: 0.10, survive: 7 },
  { key: "soul_reaper_cloak", dropLuck: 0.06, survive: 9 },
  { key: "reiatsu_amplifier", dropLuck: 0.00, survive: 2, mult: 1.25 },
];

function calcItemSurvivalBonus(items) {
  let bonus = 0;
  for (const it of SHOP_ITEMS) if (items[it.key]) bonus += it.survive || 0;
  return bonus;
}
function calcReiatsuMultiplier(items) {
  return items.reiatsu_amplifier ? 1.25 : 1.0;
}
function calcDropLuckMultiplier(items) {
  let mult = 1.0;
  for (const it of SHOP_ITEMS) if (items[it.key]) mult += it.dropLuck || 0;
  return mult; // max ~1.21
}

function computeBossSurviveChance(player) {
  const itemBonus = calcItemSurvivalBonus(player.items);
  const perm = clamp(player.survivalBonus, 0, cfg.BONUS_MAX);
  return Math.min(0.95, cfg.BASE_SURVIVE_CHANCE + (itemBonus + perm) / 100);
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
    embeds: [embeds.bossSpawnEmbed(channel.name, fighters.length, fightersText)],
    components: bossButtons(!boss.joining),
  });
}

async function runBoss(channel, boss) {
  const roundBonusMap = new Map();

  try {
    boss.joining = false;
    await updateBossSpawnMessage(channel, boss);

    let alive = [...boss.participants.keys()];
    if (!alive.length) {
      await channel.send(`${cfg.E_VASTO} No one joined. ${cfg.BOSS_NAME} vanished.`).catch(() => {});
      return;
    }

    for (let round = 1; round <= cfg.BOSS_ROUNDS; round++) {
      if (!alive.length) break;

      await channel.send(`${cfg.E_VASTO} **Round ${round}/${cfg.BOSS_ROUNDS}** begins!`).catch(() => {});
      const nextAlive = [];

      for (const uid of alive) {
        const state = boss.participants.get(uid);
        const player = await getPlayer(uid);

        const survived = Math.random() < computeBossSurviveChance(player);
        const name = safeName(state.displayName);

        if (!survived) {
          state.hits++;
          await channel.send(`💥 **${name}** was hit by ${cfg.BOSS_NAME}! (${state.hits}/2)`).catch(() => {});
          if (state.hits < 2) nextAlive.push(uid);
          else await channel.send(`☠️ **${name}** was eliminated.`).catch(() => {});
        } else {
          const mult = calcReiatsuMultiplier(player.items);
          const bonus = Math.floor(cfg.BOSS_SURVIVE_HIT_REIATSU * mult);
          player.reiatsu += bonus;
          roundBonusMap.set(uid, (roundBonusMap.get(uid) || 0) + bonus);

          await channel.send(`⚔️ **${name}** resisted and dealt damage!`).catch(() => {});
          nextAlive.push(uid);
        }

        await setPlayer(uid, player);
        await sleep(600);
      }

      alive = nextAlive;

      if (alive.length) {
        await channel.send({ embeds: [embeds.bossStateEmbed(round, alive.length)] }).catch(() => {});
        if (round < cfg.BOSS_ROUNDS) {
          await channel.send(`⏳ Cooldown: **${Math.round(cfg.ROUND_COOLDOWN_MS / 1000)}s**`).catch(() => {});
          await sleep(cfg.ROUND_COOLDOWN_MS);
        }
      }
    }

    if (!alive.length) {
      await channel.send({ embeds: [embeds.bossDefeatEmbed()] }).catch(() => {});
      return;
    }

    const lines = [];

    for (const uid of alive) {
      const player = await getPlayer(uid);
      const mult = calcReiatsuMultiplier(player.items);
      const baseReward = Math.floor(cfg.BOSS_REIATSU_REWARD * mult);
      player.reiatsu += baseReward;

      const roundBonus = roundBonusMap.get(uid) || 0;
      lines.push(`• <@${uid}> +${cfg.E_REIATSU} ${baseReward} (Round hits: +${cfg.E_REIATSU} ${roundBonus})`);

      const luckMult = calcDropLuckMultiplier(player.items);

      const roleChance = Math.min(cfg.DROP_ROLE_CHANCE_CAP, cfg.DROP_ROLE_CHANCE_BASE * luckMult);
      if (Math.random() < roleChance) {
        const res = await tryGiveRole(channel.guild, uid, cfg.BOSS_DROP_ROLE_ID);
        lines.push(
          res.ok
            ? `🎭 <@${uid}> obtained **Ulquiorra role**!`
            : `⚠️ <@${uid}> won role but bot couldn't assign: ${res.reason}`
        );
      }

      const robuxChance = Math.min(cfg.DROP_ROBUX_CHANCE_CAP, cfg.DROP_ROBUX_CHANCE_REAL_BASE * luckMult);
      if (Math.random() < robuxChance) {
        lines.push(`🎁 <@${uid}> won **100 Robux** (${(cfg.DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}%) — ${cfg.ROBUX_CLAIM_TEXT}`);
      }

      await setPlayer(uid, player);
    }

    await channel.send({ embeds: [embeds.bossVictoryEmbed(alive.length)] }).catch(() => {});
    await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
  } catch (e) {
    console.error("runBoss crashed:", e);
    await channel.send("⚠️ Boss event crashed. Please report to admin.").catch(() => {});
  } finally {
    bossByChannel.delete(channel.id);
  }
}

async function spawnBoss(channel, withPing = true) {
  if (bossByChannel.has(channel.id)) return;

  if (withPing) await channel.send(`<@&${cfg.PING_BOSS_ROLE_ID}>`).catch(() => {});
  const boss = { messageId: null, joining: true, participants: new Map() };

  const msg = await channel.send({
    embeds: [embeds.bossSpawnEmbed(channel.name, 0, "`No fighters yet`")],
    components: bossButtons(false),
  });

  boss.messageId = msg.id;
  bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    const still = bossByChannel.get(channel.id);
    if (still && still.messageId === boss.messageId) runBoss(channel, still).catch(() => {});
  }, cfg.BOSS_JOIN_MS);
}

module.exports = { spawnBoss, runBoss, updateBossSpawnMessage, calcReiatsuMultiplier, calcDropLuckMultiplier, calcItemSurvivalBonus };
