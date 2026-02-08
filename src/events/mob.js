// src/events/mob.js
const { mobByChannel } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName, sleep } = require("../core/utils");

const { mobEmbed } = require("../ui/embeds");
const { mobButtons } = require("../ui/components");

const { MOBS } = require("../data/mobs");
const { PING_HOLLOW_ROLE_ID } = require("../config");

function isAllowedSpawnChannel(eventKey, channelId, bleachId, jjkId) {
  if (eventKey === "bleach") return channelId === bleachId;
  if (eventKey === "jjk") return channelId === jjkId;
  return false;
}

/* ===================== JJK MULT ===================== */
function calcJjkCEMult(items) {
  let mult = 1.0;
  if (items.black_flash_manual) mult *= 1.2;
  if (items.binding_vow_seal) mult *= 0.9;
  return mult;
}

async function spawnMob(channel, eventKey, opts) {
  const { bleachChannelId, jjkChannelId, withPing = true } = opts || {};

  if (!MOBS[eventKey]) return;
  if (mobByChannel.has(channel.id)) return;

  if (!isAllowedSpawnChannel(eventKey, channel.id, bleachChannelId, jjkChannelId)) {
    await channel.send("❌ Wrong channel for this mob.").catch(() => {});
    return;
  }

  if (withPing) {
    await channel.send(`<@&${PING_HOLLOW_ROLE_ID}>`).catch(() => {});
  }

  const mob = MOBS[eventKey];

  const state = {
    eventKey,
    messageId: null,
    attackers: new Map(),
    resolved: false,
  };

  const msg = await channel.send({
    embeds: [mobEmbed(eventKey, 0, mob)],
    components: mobButtons(eventKey, false),
  });

  state.messageId = msg.id;
  mobByChannel.set(channel.id, state);

  /* ===================== RESOLVE ===================== */

  setTimeout(async () => {
    const still = mobByChannel.get(channel.id);
    if (!still || still.resolved) return;

    still.resolved = true;

    let anyHit = false;
    const lines = [];

    for (const [uid, info] of still.attackers.entries()) {
      const player = await getPlayer(uid);

      let hitChance = 0.5;
      if (eventKey === "jjk" && player.jjk.items.domain_charm) {
        hitChance += 0.04;
      }

      const success = Math.random() < hitChance;
      const name = safeName(info.displayName);

      /* ========== HIT ========== */
      if (success) {
        anyHit = true;

        if (eventKey === "bleach") {
          player.bleach.reiatsu += mob.hitReward;

          player.bleach.survivalBonus = Math.min(
            mob.bonusMax,
            player.bleach.survivalBonus + mob.bonusPerKill
          );

          lines.push(
            `⚔️ **${name}** ${mob.hitText}! +${mob.currencyEmoji} ${mob.hitReward}`
          );
        } else {
          const mult = calcJjkCEMult(player.jjk.items);
          const add = Math.floor(mob.hitReward * mult);

          player.jjk.cursedEnergy += add;

          player.jjk.survivalBonus = Math.min(
            mob.bonusMax,
            player.jjk.survivalBonus + mob.bonusPerKill
          );

          lines.push(
            `🪬 **${name}** ${mob.hitText}! +${mob.currencyEmoji} ${add}`
          );
        }
      }

      /* ========== MISS ========== */
      else {
        if (eventKey === "bleach") {
          player.bleach.reiatsu += mob.missReward;

          lines.push(
            `💨 **${name}** ${mob.missText}. +${mob.currencyEmoji} ${mob.missReward}`
          );
        } else {
          const mult = calcJjkCEMult(player.jjk.items);
          const add = Math.floor(mob.missReward * mult);

          player.jjk.cursedEnergy += add;

          lines.push(
            `💨 **${name}** ${mob.missText}. +${mob.currencyEmoji} ${add}`
          );
        }
      }

      await setPlayer(uid, player);
      await sleep(120);
    }

    /* ===================== DISABLE BUTTON ===================== */

    await channel.messages
      .fetch(still.messageId)
      .then((m) =>
        m.edit({ components: mobButtons(eventKey, true) })
      )
      .catch(() => {});

    /* ===================== RESULT ===================== */

    if (!still.attackers.size) {
      await channel.send("💨 Nobody reacted. It vanished.").catch(() => {});
    } else {
      await channel.send(
        anyHit
          ? "✅ **Cursed Spirit has been exorcised!**"
          : "❌ It escaped..."
      );

      await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
    }

    mobByChannel.delete(channel.id);
  }, mob.joinMs);
}

module.exports = { spawnMob };
