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


/* ================= ROLE HELPERS ================= */

async function tryGiveRole(guild, userId, roleId) {
  try {
    const bot = await guild.members.fetchMe();

    if (!bot.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return { ok: false, reason: "No Manage Roles permission" };

    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found" };

    if (bot.roles.highest.position <= role.position)
      return { ok: false, reason: "Role hierarchy too low" };

    const member = await guild.members.fetch(userId);

    await member.roles.add(roleId);

    return { ok: true };

  } catch {
    return { ok: false, reason: "Discord error" };
  }
}


function ensureOwnedRole(player, roleId) {
  if (!roleId) return;

  const id = String(roleId);

  if (!player.ownedRoles.includes(id))
    player.ownedRoles.push(id);
}


/* ================= HELPERS ================= */

function isAllowedChannel(event, id) {
  if (event === "bleach") return id === BLEACH_CHANNEL_ID;
  if (event === "jjk") return id === JJK_CHANNEL_ID;
  return false;
}


function alive(boss) {
  return [...boss.participants.entries()]
    .filter(([, s]) => s.hits < MAX_HITS)
    .map(([id]) => id);
}


function surviveChance(event, player, base, maxB, maxJ) {

  if (event === "bleach") {

    const bonus =
      calcBleachSurvivalBonus(player.bleach.items) +
      clamp(player.bleach.survivalBonus, 0, maxB);

    return Math.min(0.95, base + bonus / 100);
  }

  const bonus =
    calcJjkSurvivalBonus(player.jjk.items) +
    clamp(player.jjk.survivalBonus, 0, maxJ);

  return Math.min(0.95, base + bonus / 100);
}


function rewardMult(event, player) {
  return event === "bleach"
    ? calcBleachReiatsuMultiplier(player.bleach.items)
    : calcJjkCEMultiplier(player.jjk.items);
}


function dropMult(event, player) {
  return event === "bleach"
    ? calcBleachDropLuckMultiplier(player.bleach.items)
    : calcJjkDropLuckMultiplier(player.jjk.items);
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


    /* ================= ROUNDS ================= */

    for (let i = 0; i < boss.def.rounds.length; i++) {

      aliveIds = alive(boss);

      if (!aliveIds.length) break;

      const r = boss.def.rounds[i];

      /* ==== Ulquiorra QTE 15s ==== */

      if (boss.def.id === "ulquiorra" && r.type === "combo_defense") {
        r.windowMs = 15000;
      }


      await channel.send({
        embeds: [bossRoundEmbed(boss.def, i, aliveIds.length)],
      });


      /* ================= BASIC ================= */

      if (r.type === "pressure" || r.type === "attack") {

        for (const uid of aliveIds) {

          const player = await getPlayer(uid);

          const ok =
            Math.random() <
            surviveChance(boss.def.event, player, boss.def.baseChance, maxB, maxJ);

          if (!ok) {
            await hit(uid, boss, channel);
          } else {
            bank(uid, boss, player);
          }

          await sleep(250);
        }

        await sleep(ROUND_COOLDOWN_MS);
        continue;
      }


      /* ================= QUICK / FINISH ================= */

      if (["quick_block", "finisher"].includes(r.type)) {

        const token = Date.now().toString();

        boss.activeAction = {
          token,
          round: i,
          pressed: new Set(),
        };

        const cid = `boss_action:${boss.def.id}:${i}:${token}:press`;

        const msg = await channel.send({
          content: `⚠️ ${r.title}`,
          components: singleActionRow(cid, r.buttonLabel, r.buttonEmoji),
        });


        await sleep(r.windowMs);


        await msg.edit({
          components: singleActionRow(cid, r.buttonLabel, r.buttonEmoji, true),
        });


        const pressed = boss.activeAction.pressed;

        boss.activeAction = null;


        for (const uid of aliveIds) {

          const player = await getPlayer(uid);

          if (pressed.has(uid)) {
            bank(uid, boss, player);
          } else {
            await hit(uid, boss, channel);
          }

          await sleep(150);
        }

        await sleep(ROUND_COOLDOWN_MS);
        continue;
      }


      /* ================= COOP ================= */

      if (r.type === "coop_block") {

        const token = Date.now().toString();

        boss.activeAction = {
          token,
          pressed: new Set(),
          req: r.requiredPresses,
        };


        const cid = `boss_action:${boss.def.id}:${i}:${token}:press`;

        const msg = await channel.send({
          content: `🛡️ Need ${r.requiredPresses} blocks!`,
          components: singleActionRow(cid, "Block", "🛡️"),
        });


        await sleep(r.windowMs);


        await msg.edit({
          components: singleActionRow(cid, "Block", "🛡️", true),
        });


        const ok = boss.activeAction.pressed.size >= r.requiredPresses;

        boss.activeAction = null;


        for (const uid of aliveIds) {

          const player = await getPlayer(uid);

          if (ok && boss.activeAction?.pressed?.has(uid)) {
            bank(uid, boss, player);
          } else if (!ok) {
            await hit(uid, boss, channel);
          }
        }

        await sleep(ROUND_COOLDOWN_MS);
      }

    }


    /* ================= END ================= */

    const survivors = alive(boss);

    if (!survivors.length) {
      await channel.send({ embeds: [bossDefeatEmbed(boss.def)] });
      return;
    }


    const lines = [];


    for (const uid of survivors) {

      const player = await getPlayer(uid);

      const mult = rewardMult(boss.def.event, player);

      const win = Math.floor(boss.def.winReward * mult);

      const banked = boss.hitBank.get(uid) || 0;

      const total = win + banked;


      if (boss.def.event === "bleach")
        player.bleach.reiatsu += total;
      else
        player.jjk.cursedEnergy += total;


      await setPlayer(uid, player);


      lines.push(`• <@${uid}> +${total}`);


      /* ==== DROPS ==== */

      const chance =
        Math.min(
          0.12,
          (boss.def.roleDropChance || 0) * dropMult(boss.def.event, player)
        );


      if (boss.def.roleDropId && Math.random() < chance) {

        ensureOwnedRole(player, boss.def.roleDropId);

        await setPlayer(uid, player);

        await tryGiveRole(channel.guild, uid, boss.def.roleDropId);
      }


      if (Math.random() < Math.min(
        DROP_ROBUX_CHANCE_CAP,
        DROP_ROBUX_CHANCE_REAL_BASE * dropMult(boss.def.event, player)
      )) {

        lines.push(`🎁 <@${uid}> won Robux — ${ROBUX_CLAIM_TEXT}`);
      }

    }


    await channel.send({
      embeds: [bossVictoryEmbed(boss.def, survivors.length)],
    });

    await channel.send(lines.join("\n").slice(0, 1900));


  } catch (e) {

    console.error(e);

    await channel.send("⚠️ Boss crashed.");

  } finally {

    bossByChannel.delete(channel.id);
  }

}


/* ================= HIT / BANK ================= */

async function hit(uid, boss, channel) {

  const st = boss.participants.get(uid);

  if (!st) return;

  st.hits++;

  await channel.send(`💥 <@${uid}> took damage (${st.hits}/${MAX_HITS})`);

  if (st.hits >= MAX_HITS)
    await channel.send(`☠️ <@${uid}> eliminated`);
}


function bank(uid, boss, player) {

  const mult = rewardMult(boss.def.event, player);

  const add = Math.floor(boss.def.hitReward * mult);

  boss.hitBank.set(uid, (boss.hitBank.get(uid) || 0) + add);
}


/* ================= SPAWN ================= */

async function spawnBoss(channel, id, ping = true) {

  const def = BOSSES[id];

  if (!def) return;

  if (!isAllowedChannel(def.event, channel.id)) return;

  if (bossByChannel.has(channel.id)) return;


  if (ping)
    await channel.send(`<@&${PING_BOSS_ROLE_ID}>`);


  const boss = {

    def,

    messageId: null,

    joining: true,

    participants: new Map(),

    hitBank: new Map(),

    activeAction: null,
  };


  const msg = await channel.send({
    embeds: [bossSpawnEmbed(def, channel.name, 0, "`None`")],
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
