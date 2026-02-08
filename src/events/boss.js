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


/* ================= ROLE ================= */

async function tryGiveRole(guild, userId, roleId) {
  try {
    const bot = await guild.members.fetchMe();

    if (!bot.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return { ok: false };

    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false };

    if (bot.roles.highest.position <= role.position)
      return { ok: false };

    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);

    return { ok: true };

  } catch {
    return { ok: false };
  }
}

function ensureOwnedRole(player, roleId) {
  if (!roleId) return;

  const id = String(roleId);

  if (!player.ownedRoles.includes(id))
    player.ownedRoles.push(id);
}


/* ================= HELPERS ================= */

function allowed(event, id) {
  if (event === "bleach") return id === BLEACH_CHANNEL_ID;
  if (event === "jjk") return id === JJK_CHANNEL_ID;
  return false;
}

function alive(boss) {
  return [...boss.participants.entries()]
    .filter(([, s]) => s.hits < MAX_HITS)
    .map(([id]) => id);
}

function surviveChance(event, p, base, maxB, maxJ) {

  if (event === "bleach") {
    const bonus =
      calcBleachSurvivalBonus(p.bleach.items) +
      clamp(p.bleach.survivalBonus, 0, maxB);

    return Math.min(0.95, base + bonus / 100);
  }

  const bonus =
    calcJjkSurvivalBonus(p.jjk.items) +
    clamp(p.jjk.survivalBonus, 0, maxJ);

  return Math.min(0.95, base + bonus / 100);
}

function rewardMult(event, p) {
  return event === "bleach"
    ? calcBleachReiatsuMultiplier(p.bleach.items)
    : calcJjkCEMultiplier(p.jjk.items);
}

function dropMult(event, p) {
  return event === "bleach"
    ? calcBleachDropLuckMultiplier(p.bleach.items)
    : calcJjkDropLuckMultiplier(p.jjk.items);
}


/* ================= HIT / BANK ================= */

async function hit(uid, boss, channel) {

  const st = boss.participants.get(uid);
  if (!st) return;

  st.hits++;

  await channel.send(
    `💥 <@${uid}> took damage (${st.hits}/${MAX_HITS})`
  ).catch(() => {});

  if (st.hits >= MAX_HITS)
    await channel.send(`☠️ <@${uid}> eliminated`).catch(() => {});
}

function bank(uid, boss, player) {

  const mult = rewardMult(boss.def.event, player);

  const add = Math.floor(boss.def.hitReward * mult);

  boss.hitBank.set(uid, (boss.hitBank.get(uid) || 0) + add);
}


/* ================= MAIN ================= */

async function runBoss(channel, boss, maxB = 30, maxJ = 30) {

  try {

    boss.joining = false;

    let aliveIds = alive(boss);

    if (!aliveIds.length) {
      await channel.send("💨 Nobody joined.");
      return;
    }


    /* ============ ROUNDS ============ */

    for (let i = 0; i < boss.def.rounds.length; i++) {

      aliveIds = alive(boss);
      if (!aliveIds.length) break;

      const r = boss.def.rounds[i];


      /* Ulquiorra QTE = 15s */
      if (boss.def.id === "ulquiorra" && r.type === "combo_defense") {
        r.windowMs = 15000;
      }


      await channel.send({
        embeds: [bossRoundEmbed(boss.def, i, aliveIds.length)],
      }).catch(() => {});


      /* BASIC */

      if (r.type === "pressure" || r.type === "attack") {

        for (const uid of aliveIds) {

          const p = await getPlayer(uid);

          const ok =
            Math.random() <
            surviveChance(
              boss.def.event,
              p,
              boss.def.baseChance,
              maxB,
              maxJ
            );

          if (!ok) await hit(uid, boss, channel);
          else bank(uid, boss, p);

          await sleep(200);
        }

        await sleep(ROUND_COOLDOWN_MS);
        continue;
      }


      /* QUICK / FINISH */

      if (["quick_block", "finisher"].includes(r.type)) {

        const token = Date.now().toString();

        boss.activeAction = {
          token,
          pressed: new Set(),
        };

        const cid =
          `boss_action:${boss.def.id}:${i}:${token}:press`;


        const msg = await channel.send({
          content: `⚠️ ${r.title}`,
          components: singleActionRow(
            cid,
            r.buttonLabel || "Block",
            r.buttonEmoji || "🛡️"
          ),
        }).catch(() => null);


        await sleep(r.windowMs);


        if (msg) {
          await msg.edit({
            components: singleActionRow(
              cid,
              r.buttonLabel || "Block",
              r.buttonEmoji || "🛡️",
              true
            ),
          }).catch(() => {});
        }


        const pressed = boss.activeAction.pressed;

        boss.activeAction = null;


        for (const uid of aliveIds) {

          const p = await getPlayer(uid);

          if (pressed.has(uid)) bank(uid, boss, p);
          else await hit(uid, boss, channel);

          await sleep(150);
        }

        await sleep(ROUND_COOLDOWN_MS);
        continue;
      }


      /* COOP */

      if (r.type === "coop_block") {

        const token = Date.now().toString();

        boss.activeAction = {
          token,
          pressed: new Set(),
          req: r.requiredPresses,
        };


        const cid =
          `boss_action:${boss.def.id}:${i}:${token}:press`;


        const msg = await channel.send({
          content: `🛡️ Need ${r.requiredPresses} blocks!`,
          components: singleActionRow(cid, "Block", "🛡️"),
        }).catch(() => null);


        await sleep(r.windowMs);


        if (msg) {
          await msg.edit({
            components: singleActionRow(cid, "Block", "🛡️", true),
          }).catch(() => {});
        }


        const ok =
          boss.activeAction.pressed.size >= r.requiredPresses;


        boss.activeAction = null;


        for (const uid of aliveIds) {

          const p = await getPlayer(uid);

          if (ok) bank(uid, boss, p);
          else await hit(uid, boss, channel);

          await sleep(150);
        }

        await sleep(ROUND_COOLDOWN_MS);
      }

    }


    /* ============ END ============ */

    const survivors = alive(boss);

    if (!survivors.length) {
      await channel.send({
        embeds: [bossDefeatEmbed(boss.def)],
      });
      return;
    }


    const lines = [];


    for (const uid of survivors) {

      const p = await getPlayer(uid);

      const mult = rewardMult(boss.def.event, p);

      const win = Math.floor(boss.def.winReward * mult);
      const banked = boss.hitBank.get(uid) || 0;

      const total = win + banked;


      if (boss.def.event === "bleach")
        p.bleach.reiatsu += total;
      else
        p.jjk.cursedEnergy += total;


      await setPlayer(uid, p);

      lines.push(`• <@${uid}> +${total}`);


      /* ROLE DROP */

      const chance =
        Math.min(
          0.12,
          (boss.def.roleDropChance || 0) *
          dropMult(boss.def.event, p)
        );


      if (boss.def.roleDropId && Math.random() < chance) {

        ensureOwnedRole(p, boss.def.roleDropId);

        await setPlayer(uid, p);

        await tryGiveRole(
          channel.guild,
          uid,
          boss.def.roleDropId
        );
      }


      /* ROBUX */

      const robux =
        Math.min(
          DROP_ROBUX_CHANCE_CAP,
          DROP_ROBUX_CHANCE_REAL_BASE *
          dropMult(boss.def.event, p)
        );


      if (Math.random() < robux) {

        lines.push(
          `🎁 <@${uid}> won Robux — ${ROBUX_CLAIM_TEXT}`
        );
      }

    }


    await channel.send({
      embeds: [bossVictoryEmbed(boss.def, survivors.length)],
    });

    await channel.send(lines.join("\n").slice(0, 1900));


  } catch (e) {

    console.error("Boss error:", e);

    await channel.send("⚠️ Boss crashed.");

  } finally {

    bossByChannel.delete(channel.id);
  }
}


/* ================= SPAWN ================= */

async function spawnBoss(channel, id, ping = true) {

  const def = BOSSES[id];
  if (!def) return;

  if (!allowed(def.event, channel.id)) return;

  if (bossByChannel.has(channel.id)) return;


  if (ping)
    await channel.send(`<@&${PING_BOSS_ROLE_ID}>`)
      .catch(() => {});


  const boss = {
    def,
    joining: true,
    participants: new Map(),
    hitBank: new Map(),
    activeAction: null,
  };


  const msg = await channel.send({
    embeds: [
      bossSpawnEmbed(def, channel.name, 0, "`None`"),
    ],
    components: bossButtons(false),
  });


  boss.messageId = msg.id;

  bossByChannel.set(channel.id, boss);


  setTimeout(() => {

    const b = bossByChannel.get(channel.id);

    if (b) runBoss(channel, b);

  }, def.joinMs);
}


module.exports = {
  spawnBoss,
  runBoss,
};
