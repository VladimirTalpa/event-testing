// src/events/boss.js

const {
  BLEACH_CHANNEL_ID,
  JJK_CHANNEL_ID,
  ROUND_COOLDOWN_MS,
  MAX_HITS,
  PING_BOSS_ROLE_ID,
} = require("../config");

const { bossByChannel } = require("../core/state");
const { clamp, safeName, sleep } = require("../core/utils");
const { getPlayer, setPlayer } = require("../core/players");

const {
  bossSpawnEmbed,
  bossRoundEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
} = require("../ui/embeds");

const {
  bossButtons,
  singleActionRow,
  comboDefenseRows,
} = require("../ui/components");

const { BOSSES } = require("../data/bosses");


/* ===================== HELPERS ===================== */

function isAllowedSpawnChannel(eventKey, channelId) {
  if (eventKey === "bleach") return channelId === BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return channelId === JJK_CHANNEL_ID;
  return false;
}

function aliveIds(boss) {
  return [...boss.participants.entries()]
    .filter(([, st]) => st.hits < MAX_HITS)
    .map(([uid]) => uid);
}

async function applyHit(uid, boss, channel, text) {
  const st = boss.participants.get(uid);

  if (!st) return;

  st.hits++;

  const name = safeName(st.displayName);

  await channel.send(
    `💥 **${name}** ${text} (${st.hits}/${MAX_HITS})`
  ).catch(() => {});
}


/* ===================== MAIN ===================== */

async function runBoss(channel, boss) {
  try {
    boss.joining = false;

    let alive = aliveIds(boss);

    if (!alive.length) {
      await channel.send("💨 Nobody joined.").catch(() => {});
      return;
    }

    /* ========== ROUNDS ========== */

    for (let i = 0; i < boss.def.rounds.length; i++) {
      alive = aliveIds(boss);

      if (!alive.length) break;

      const r = boss.def.rounds[i];

      await channel.send({
        embeds: [bossRoundEmbed(boss.def, i, alive.length)],
      }).catch(() => {});


      /* ===== PRESS ===== */

      if (r.type === "press") {
        const token = Date.now().toString();

        boss.activeAction = {
          token,
          pressed: new Set(),
        };

        const id =
          `boss:${boss.def.id}:${token}`;

        const msg = await channel.send({
          content: `⚠️ Press **${r.label}**!`,
          components: singleActionRow(
            id,
            r.label,
            r.emoji
          ),
        });

        await sleep(r.windowMs);

        boss.activeAction = null;

        const pressed =
          boss.activeAction?.pressed || new Set();

        for (const uid of alive) {
          if (!pressed.has(uid)) {
            await applyHit(
              uid,
              boss,
              channel,
              "was too slow"
            );
          }
        }
      }


      /* ===== COMBO (15s) ===== */

      if (r.type === "combo") {
        const token = Date.now().toString();

        boss.activeAction = {
          token,
          mode: "combo",
          seq: ["red", "blue", "green", "yellow"],
          prog: new Map(),
          failed: new Set(),
        };

        const msg = await channel.send({
          content: "🎮 COMBO (15s)",
          components: comboDefenseRows(
            token,
            boss.def.id,
            i
          ),
        });

        await sleep(15000);

        const action = boss.activeAction;

        boss.activeAction = null;

        for (const uid of alive) {
          const ok =
            action &&
            action.prog.get(uid) >= 4 &&
            !action.failed.has(uid);

          if (!ok) {
            await applyHit(
              uid,
              boss,
              channel,
              "failed combo"
            );
          }
        }
      }


      await sleep(ROUND_COOLDOWN_MS);
    }


    /* ========== FINISH ========== */

    const survivors = aliveIds(boss);

    if (!survivors.length) {
      await channel.send({
        embeds: [bossDefeatEmbed(boss.def)],
      });
      return;
    }


    /* ========== REWARDS ========== */

    const lines = [];

    for (const uid of survivors) {
      const p = await getPlayer(uid);

      if (boss.def.event === "bleach") {
        p.bleach.reiatsu += boss.def.winReward;
      } else {
        p.jjk.cursedEnergy += boss.def.winReward;
        p.jjk.cursedShard =
          (p.jjk.cursedShard || 0) + 1;
      }

      await setPlayer(uid, p);

      lines.push(
        `• <@${uid}> +${boss.def.winReward}`
      );
    }

    await channel.send({
      embeds: [bossVictoryEmbed(boss.def)],
    });

    await channel.send(lines.join("\n"));

  } catch (e) {
    console.error(e);

    await channel.send(
      "⚠️ Boss crashed."
    );
  } finally {
    bossByChannel.delete(channel.id);
  }
}


/* ===================== SPAWN ===================== */

async function spawnBoss(channel, bossId) {
  const def = BOSSES[bossId];

  if (!def) return;

  if (!isAllowedSpawnChannel(def.event, channel.id)) {
    return;
  }

  if (bossByChannel.has(channel.id)) return;

  await channel.send(`<@&${PING_BOSS_ROLE_ID}>`);

  const boss = {
    def,
    joining: true,
    participants: new Map(),
    activeAction: null,
  };

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(def)],
    components: bossButtons(false),
  });

  boss.messageId = msg.id;

  bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    runBoss(channel, boss);
  }, def.joinMs);
}

module.exports = {
  spawnBoss,
  runBoss,
};
