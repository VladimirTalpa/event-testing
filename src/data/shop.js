const {
  E_REIATSU,
  HOLLOW_EVENT_MS,
  HOLLOW_HIT_REIATSU,
  HOLLOW_MISS_REIATSU,
  BONUS_PER_HOLLOW_KILL,
  BONUS_MAX,
} = require("../config");

const { hollowEmbed } = require("../embeds");
const { hollowButtons } = require("../components");

function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }

async function editMessageSafe(channel, messageId, payload) {
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return null;
  await msg.edit(payload).catch(() => {});
  return msg;
}

async function spawnHollow(channel, hollowByChannel, players, pingRoleId) {
  if (hollowByChannel.has(channel.id)) return;

  if (pingRoleId) await channel.send(`<@&${pingRoleId}>`).catch(() => {});
  const hollow = { messageId: null, attackers: new Map(), resolved: false };

  const msg = await channel.send({
    embeds: [hollowEmbed(0)],
    components: hollowButtons(false),
  });

  hollow.messageId = msg.id;
  hollowByChannel.set(channel.id, hollow);

  setTimeout(async () => {
    const still = hollowByChannel.get(channel.id);
    if (!still || still.resolved) return;
    still.resolved = true;

    let anyHit = false;
    const lines = [];

    for (const [uid, info] of still.attackers.entries()) {
      const hit = Math.random() < 0.5;
      const player = await players.get(uid);
      const name = safeName(info.displayName);

      if (hit) {
        anyHit = true;
        player.reiatsu += HOLLOW_HIT_REIATSU;
        player.survivalBonus = Math.min(BONUS_MAX, player.survivalBonus + BONUS_PER_HOLLOW_KILL);
        lines.push(`⚔️ **${name}** hit! +${E_REIATSU} ${HOLLOW_HIT_REIATSU} • bonus +${BONUS_PER_HOLLOW_KILL}%`);
      } else {
        player.reiatsu += HOLLOW_MISS_REIATSU;
        lines.push(`💨 **${name}** missed. +${E_REIATSU} ${HOLLOW_MISS_REIATSU}`);
      }

      await players.set(uid, player);
    }

    await editMessageSafe(channel, still.messageId, { components: hollowButtons(true) });

    if (!still.attackers.size) {
      await channel.send("💨 The Hollow disappeared… nobody attacked.").catch(() => {});
    } else {
      await channel.send(anyHit ? "🕳️ **Hollow defeated!**" : "🕳️ The Hollow escaped…").catch(() => {});
      await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
    }

    hollowByChannel.delete(channel.id);
  }, HOLLOW_EVENT_MS);
}

module.exports = { spawnHollow };
