// src/events/mob.js

const { mobByChannel } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName } = require("../core/utils");

const { mobEmbed } = require("../ui/embeds");
const { mobButtons } = require("../ui/components");

const { MOBS } = require("../data/mobs");
const { PING_HOLLOW_ROLE_ID } = require("../config");


function allowed(event, id, b, j) {
  if (event === "bleach") return id === b;
  if (event === "jjk") return id === j;
  return false;
}


async function spawnMob(channel, event, opts = {}) {

  const {
    bleachChannelId,
    jjkChannelId,
    withPing = true,
  } = opts;


  if (!MOBS[event]) return;

  if (!allowed(
    event,
    channel.id,
    bleachChannelId,
    jjkChannelId
  )) return;


  if (mobByChannel.has(channel.id)) return;


  if (withPing) {
    await channel.send(`<@&${PING_HOLLOW_ROLE_ID}>`)
      .catch(() => {});
  }


  const mob = MOBS[event];


  const state = {
    event,
    attackers: new Map(),
    resolved: false,
  };


  const msg = await channel.send({
    embeds: [mobEmbed(event, 0, mob)],
    components: mobButtons(event, false),
  });


  state.messageId = msg.id;

  mobByChannel.set(channel.id, state);


  setTimeout(async () => {

    const s = mobByChannel.get(channel.id);

    if (!s || s.resolved) return;

    s.resolved = true;

    let success = false;

    const lines = [];


    for (const [uid, info] of s.attackers) {

      const p = await getPlayer(uid);

      const hit = Math.random() < 0.5;

      const name = safeName(info.displayName);


      if (event === "bleach") {

        if (hit) {

          success = true;

          p.bleach.reiatsu += mob.hitReward;

          lines.push(
            `⚔️ **${name}** defeated it +${mob.hitReward}`
          );

        } else {

          p.bleach.reiatsu += mob.missReward;

          lines.push(
            `💨 **${name}** missed +${mob.missReward}`
          );
        }
      }


      if (event === "jjk") {

        if (hit) {

          success = true;

          p.jjk.cursedEnergy += mob.hitReward;

          lines.push(
            `🪬 **${name}** exorcised it +${mob.hitReward}`
          );

        } else {

          p.jjk.cursedEnergy += mob.missReward;

          lines.push(
            `💨 **${name}** failed +${mob.missReward}`
          );
        }
      }


      await setPlayer(uid, p);
    }


    await channel.messages
      .fetch(s.messageId)
      .then(m => m.edit({
        components: mobButtons(event, true),
      }))
      .catch(() => {});


    if (!s.attackers.size) {

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
