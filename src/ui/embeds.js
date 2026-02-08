const { EmbedBuilder } = require("discord.js");
const cfg = require("../config");

function bossSpawnEmbed(def, channelName, joinedCount, fightersText) {
  const eventTag = def.event === "bleach" ? `${cfg.E_BLEACH} BLEACH` : `${cfg.E_JJK} JJK`;
  const currency = def.event === "bleach" ? cfg.E_REIATSU : cfg.E_CE;

  return new EmbedBuilder()
    .setColor(cfg.COLOR)
    .setTitle(`${eventTag} — ${def.icon} ${def.name} Appeared!`)
    .setDescription(
      `**Difficulty:** ${def.difficulty}\n` +
      `⏳ **Join time:** ${Math.round(def.joinMs / 60000)} minutes\n` +
      `Press **🗡 Join Battle** to participate.`
    )
    .addFields(
      { name: `${cfg.E_MEMBERS} Fighters`, value: fightersText, inline: false },
      { name: `Joined`, value: `\`${joinedCount}\``, inline: true },
      { name: `${currency} Rewards`, value: `\`${def.winReward} on win • +${def.hitReward}/success (banked)\``, inline: true },
      { name: `📌 Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(def.spawnMedia || null)
    .setFooter({ text: `Boss • ${def.rounds.length} rounds • ${cfg.MAX_HITS} hits = eliminated` });
}

function bossRoundEmbed(def, roundIndex, aliveCount) {
  const r = def.rounds[roundIndex];
  const eventTag = def.event === "bleach" ? `${cfg.E_BLEACH} BLEACH` : `${cfg.E_JJK} JJK`;

  return new EmbedBuilder()
    .setColor(cfg.COLOR)
    .setTitle(`${eventTag} — ${def.icon} ${def.name} • ${r.title}`)
    .setDescription(r.intro)
    .addFields({ name: `${cfg.E_MEMBERS} Alive fighters`, value: `\`${aliveCount}\``, inline: true })
    .setImage(r.media || def.spawnMedia || null)
    .setFooter({ text: `Round ${roundIndex + 1}/${def.rounds.length}` });
}

function bossVictoryEmbed(def, survivorsCount) {
  const extra = def.materialDrop?.key ? "\n🧩 Materials granted." : "";
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`✅ ${def.name} Defeated!`)
    .setDescription(`Rewards granted to survivors.${extra}`)
    .addFields({ name: `${cfg.E_MEMBERS} Survivors`, value: `\`${survivorsCount}\``, inline: true })
    .setImage(def.victoryMedia || null);
}

function bossDefeatEmbed(def) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`❌ Defeat`)
    .setDescription(`Everyone lost. **${def.name}** wins.`)
    .setImage(def.defeatMedia || null);
}

function mobEmbed(eventKey, mob, joinedCount) {
  const eventTag = eventKey === "bleach" ? `${cfg.E_BLEACH} BLEACH` : `${cfg.E_JJK} JJK`;
  const cur = eventKey === "bleach" ? cfg.E_REIATSU : cfg.E_CE;

  const verb = eventKey === "bleach" ? "Attack" : "Exorcise";
  const hitLine = eventKey === "bleach"
    ? `${cur} **Hit:** ${mob.hitReward} • **Miss:** ${mob.missReward}`
    : `${cur} **Exorcise:** ${mob.hitReward} • **Fail:** ${mob.missReward}`;

  return new EmbedBuilder()
    .setColor(cfg.COLOR)
    .setTitle(`${eventTag} — ${mob.icon} ${mob.name} Appeared!`)
    .setDescription(
      [
        `⏳ **Time:** ${Math.round(mob.joinMs / 60000)} minutes`,
        `🎲 **Chance:** ${Math.round(mob.hitChance * 100)}%`,
        hitLine,
        `If success: +${mob.bonusPerKill}% boss bonus (max ${mob.bonusMax}%).`,
        `Press **${verb}** to participate.`,
      ].join("\n")
    )
    .addFields({ name: `${cfg.E_MEMBERS} Participants`, value: `\`${joinedCount}\``, inline: true })
    .setImage(mob.media || null);
}

function inventoryEmbed(eventKey, player) {
  if (eventKey === "bleach") {
    return new EmbedBuilder()
      .setColor(cfg.COLOR)
      .setTitle(`${cfg.E_BLEACH} Bleach — Inventory`)
      .setDescription(
        [
          `${cfg.E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**`,
          `${cfg.E_DRAKO} Drako: **${player.drako}**`,
        ].join("\n")
      );
  }

  return new EmbedBuilder()
    .setColor(cfg.COLOR)
    .setTitle(`${cfg.E_JJK} Jujutsu Kaisen — Inventory`)
    .setDescription(
      [
        `${cfg.E_CE} Cursed Energy: **${player.jjk.cursedEnergy}**`,
        `${cfg.E_DRAKO} Drako: **${player.drako}**`,
        "",
        `🧩 Cursed Shards: **${player.jjk.materials?.cursed_shard || 0}**`,
      ].join("\n")
    );
}

module.exports = {
  bossSpawnEmbed,
  bossRoundEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
  mobEmbed,
  inventoryEmbed,
};
