// src/events/mob.js
const { mobByChannel } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName } = require("../core/utils");
const { mobEmbed } = require("../ui/embeds");
const { mobButtons } = require("../ui/components");
const { MOBS } = require("../data/mobs");
const { PING_HOLLOW_ROLE_ID } = require("../config");

function isAllowedSpawnChannel(eventKey, channelId, bleachId, jjkId) {
  if (eventKey === "bleach") return channelId === bleachId;
  if (eventKey === "jjk") return channelId === jjkId;
  return false;
}

// helper duplicated from embeds logic
function calcJjkCEMultiplier(items) {
  let mult = 1.0;
  if (items.black_flash_manual) mult *= 1.20;
  if (items.binding_vow_seal) mult *= 0.90;
  return mult;
}
function calcJjkMobHitBonus(items) {
  let bonus = 0.0;
  if (items.domain_charm) bonus += 0.04;
  return bonus;
}

async function spawnMob(channel, eventKey, opts) {
  const { bleachChannelId, jjkChannelId, withPing = true } = opts || {};
  if (!MOBS[eventKey]) return;

  if (!isAllowedSpawnChannel(eventKey, channel.id, bleachChannelId, jjkChannelId)) {
    await channel.send(`❌ This mob can only spawn in the correct event channel.`).catch(() => {});
    return;
  }
  if (mobByChannel.has(channel.id)) return;

  if (withPing) await channel.send(`<@&${PING_HOLLOW_ROLE_ID}>`).catch(() => {});

  const mob = MOBS[eventKey];
  const state = { eventKey, messageId: null, attackers: new Map(), resolved: false };

  const msg = await channel.send({
    embeds: [mobEmbed(eventKey, 0, mob)],
    components: mobButtons(eventKey, false),
  });

  state.messageId = msg.id;
  mobByChannel.set(channel.id, state);

  setTimeout(async () => {
    const still = mobByChannel.get(channel.id);
    if (!still || still.resolved) return;
    still.resolved = true;

    let anyHit = false;
    const lines = [];

    for (const [uid, info] of still.attackers.entries()) {
      const player = await getPlayer(uid);

      let hitChance = 0.5;
      if (eventKey === "jjk") hitChance += calcJjkMobHitBonus(player.jjk.items);

      const hit = Math.random() < hitChance;
      const name = safeName(info.displayName);

      if (hit) {
        anyHit = true;

        if (eventKey === "bleach") {
          player.bleach.reiatsu += mob.hitReward;
          player.bleach.survivalBonus = Math.min(mob.bonusMax, player.bleach.survivalBonus + mob.bonusPerKill);
          lines.push(`⚔️ **${name}** hit! +${mob.currencyEmoji} ${mob.hitReward} • bonus +${mob.bonusPerKill}%`);
        } else {
          const mult = calcJjkCEMultiplier(player.jjk.items);
          const add = Math.floor(mob.hitReward * mult);
          player.jjk.cursedEnergy += add;
          player.jjk.survivalBonus = Math.min(mob.bonusMax, player.jjk.survivalBonus + mob.bonusPerKill);
          lines.push(`🪬 **${name}** exorcised it! +${mob.currencyEmoji} ${add} • bonus +${mob.bonusPerKill}%`);
        }
      } else {
        if (eventKey === "bleach") {
          player.bleach.reiatsu += mob.missReward;
          lines.push(`💨 **${name}** missed. +${mob.currencyEmoji} ${mob.missReward}`);
        } else {
          const mult = calcJjkCEMultiplier(player.jjk.items);
          const add = Math.floor(mob.missReward * mult);
          player.jjk.cursedEnergy += add;
          lines.push(`💨 **${name}** failed. +${mob.currencyEmoji} ${add}`);
        }
      }

      await setPlayer(uid, player);
    }

    await channel.messages
      .fetch(still.messageId)
      .then((m) => m.edit({ components: mobButtons(eventKey, true) }))
      .catch(() => {});

    if (!still.attackers.size) {
      await channel.send(eventKey === "jjk"
        ? "💨 The cursed spirit vanished… nobody tried to exorcise it."
        : "💨 It disappeared… nobody attacked."
      ).catch(() => {});
    } else {
      if (eventKey === "jjk") {
        await channel.send(anyHit ? "✅ **Cursed Spirit exorcised!**" : "❌ It escaped…").catch(() => {});
      } else {
        await channel.send(anyHit ? "✅ **Mob defeated!**" : "❌ It escaped…").catch(() => {});
      }
      await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
    }

    mobByChannel.delete(channel.id);
  }, mob.joinMs);
}

module.exports = { spawnMob };
