
const cfg = require("../config");
const { hollowByChannel } = require("../state");
const { safeName, editMessageSafe } = require("../utils");
const { hollowButtons } = require("../components");
const embeds = require("../embeds");
const { getPlayer, setPlayer } = require("../players");

async function spawnHollow(channel, withPing = true) {
  if (hollowByChannel.has(channel.id)) return;

  if (withPing) await channel.send(`<@&${cfg.PING_HOLLOW_ROLE_ID}>`).catch(() => {});
  const hollow = { messageId: null, attackers: new Map(), resolved: false };

  const msg = await channel.send({
    embeds: [embeds.hollowEmbed(0)],
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
      const player = await getPlayer(uid);
      const name = safeName(info.displayName);

      if (hit) {
        anyHit = true;
        player.reiatsu += cfg.HOLLOW_HIT_REIATSU;
        player.survivalBonus = Math.min(cfg.BONUS_MAX, player.survivalBonus + cfg.BONUS_PER_HOLLOW_KILL);
        lines.push(`⚔️ **${name}** hit! +${cfg.E_REIATSU} ${cfg.HOLLOW_HIT_REIATSU} • bonus +${cfg.BONUS_PER_HOLLOW_KILL}%`);
      } else {
        player.reiatsu += cfg.HOLLOW_MISS_REIATSU;
        lines.push(`💨 **${name}** missed. +${cfg.E_REIATSU} ${cfg.HOLLOW_MISS_REIATSU}`);
      }

      await setPlayer(uid, player);
    }

    await editMessageSafe(channel, still.messageId, { components: hollowButtons(true) });

    if (!still.attackers.size) {
      await channel.send("💨 The Hollow disappeared… nobody attacked.").catch(() => {});
    } else {
      await channel.send(anyHit ? "🕳️ **Hollow defeated!**" : "🕳️ The Hollow escaped…").catch(() => {});
      await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
    }

    hollowByChannel.delete(channel.id);
  }, cfg.HOLLOW_EVENT_MS);
}

module.exports = { spawnHollow };
