const { mobByChannel } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { MOBS } = require("../data/mobs");
const { mobEmbed } = require("../ui/embeds");
const { mobButtons } = require("../ui/components");
const { clamp } = require("../core/utils");
const { BLEACH_BONUS_MAX, JJK_BONUS_MAX } = require("../config");

function bonusCap(eventKey) {
  return eventKey === "bleach" ? BLEACH_BONUS_MAX : JJK_BONUS_MAX;
}

async function spawnMob(channel, eventKey, opts = {}) {
  const mob = MOBS[eventKey];
  if (!mob) return;

  // replace if already exists
  mobByChannel.set(channel.id, {
    eventKey,
    createdAt: Date.now(),
    resolved: false,
    attackers: new Map(),
    messageId: null,
  });

  const msg = await channel.send({
    embeds: [mobEmbed(eventKey, 0, mob)],
    components: mobButtons(eventKey, false),
  });

  const st = mobByChannel.get(channel.id);
  if (st) st.messageId = msg.id;

  // resolve in 2 minutes
  setTimeout(async () => {
    const state = mobByChannel.get(channel.id);
    if (!state || state.resolved) return;
    state.resolved = true;
    mobByChannel.set(channel.id, state);

    const entries = [...state.attackers.keys()];
    const cap = bonusCap(eventKey);

    for (const uid of entries) {
      const p = await getPlayer(uid);
      const hit = Math.random() < 0.5;

      if (eventKey === "bleach") {
        p.bleach.reiatsu += hit ? mob.hitReward : mob.missReward;
        if (hit) p.bleach.survivalBonus = clamp(p.bleach.survivalBonus + mob.bonusPerKill, 0, cap);
      } else {
        p.jjk.cursedEnergy += hit ? mob.hitReward : mob.missReward;
        if (hit) p.jjk.survivalBonus = clamp(p.jjk.survivalBonus + mob.bonusPerKill, 0, cap);
      }

      await setPlayer(uid, p);
    }

    // disable buttons
    const old = await channel.messages.fetch(state.messageId).catch(() => null);
    if (old) {
      await old.edit({ components: mobButtons(eventKey, true) }).catch(() => {});
    }
  }, 2 * 60 * 1000);
}

module.exports = { spawnMob };
