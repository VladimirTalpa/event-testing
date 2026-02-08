// src/events/mob.js

const { mobByChannel } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName, sleep } = require("../core/utils");

const { mobEmbed } = require("../ui/embeds");
const { mobButtons } = require("../ui/components");

const { MOBS } = require("../data/mobs");
const { PING_HOLLOW_ROLE_ID } = require("../config");


/* ===================== HELPERS ===================== */

function isAllowed(channelId, eventKey, bleachId, jjkId) {
  if (eventKey === "bleach") return channelId === bleachId;
  if (eventKey === "jjk") return channelId === jjkId;
  return false;
}


/* ===================== MAIN ===================== */

async function spawnMob(channel, eventKey, opts = {}) {
  const {
    bleachChannelId,
    jjkChannelId,
    withPing = true,
  } = opts;

  if (!MOBS[eventKey]) return;

  if (!isAllowed(
    channel.id,
    eventKey,
    bleachChannelId,
    jjkChannelId
  )) {
    return;
  }

  if (mobByChannel.has(channel.id)) return;


  /* ===== PING ===== */

  if (withPing) {
    await channel.send(`<@&${PING_HOLLOW_ROLE_ID}>`)
      .catch(() => {});
  }


  /* ===== CREATE ===== */

  const mob = MOBS[eventKey];

  const state = {
    eventKey,
    attackers: new Map(),
    messageId: null,
    resolved: false,
  };


  const msg = await channel.send({
    embeds: [mobEmbed(eventKey, 0, mob)],
    components: mobButtons(eventKey, false),
  });

  state.messageId = msg.id;

  mobByChannel.set(channel.id, state);


  /* ===================== TIMER ===================== */

  setTimeout(async () => {
    const still = mobByChannel.get(channel.id);

    if (!still || still.resolved) return;

    still.resolved = true;

    const lines = [];
    let success = false;


    /* ===== RESOLVE ===== */

    for (const [uid, info] of still.attackers) {
      const p = await getPlayer(uid);

      const hit = Math.random() < 0.5;

      const name = safeName(info.displayName);


      /* ===== BLEACH ===== */

      if (eventKey === "bleach") {
        if (hit) {
          success = true;

          p.bleach.reiatsu += mob.hitReward;

          lines.push(
            `⚔️ **${name}** defeated it +${mob.hitReward} ${mob.currencyEmoji}`
          );
        } else {
          p.bleach.reiatsu += mob.missReward;

          lines.push(
            `💨 **${name}** missed +${mob.missReward} ${mob.currencyEmoji}`
          );
        }
      }


      /* ===== JJK ===== */

      if (eventKey === "jjk") {
        if (hit) {
          success = true;

          p.jjk.cursedEnergy += mob.hitReward;

          lines.push(
            `🪬 **${name}** exorcised it +${mob.hitReward} ${mob.currencyEmoji}`
          );
        } else {
          p.jjk.cursedEnergy += mob.missReward;

          lines.push(
            `💨 **${name}** failed +${mob.missReward} ${mob.currencyEmoji}`
          );
        }
      }


      await setPlayer(uid, p);
    }


    /* ===== DISABLE BUTTONS ===== */

    await channel.messages
      .fetch(still.messageId)
      .then(m => {
        m.edit({
          components: mobButtons(eventKey, true),
        });
      })
      .catch(() => {});


    /* ===== RESULT ===== */

    if (!still.attackers.size) {
      await channel.send("💨 Nobody attacked.");
    } else {
      await channel.send(
        success
          ? "✅ Mob exorcised!"
          : "❌ It escaped!"
      );

      await channel.send(lines.join("\n").slice(0, 1900));
    }


    mobByChannel.delete(channel.id);

  }, mob.joinMs);
}


module.exports = {
  spawnMob,
};
