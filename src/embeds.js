
const { EmbedBuilder } = require("discord.js");
const cfg = require("./config");

function bossSpawnEmbed(channelName, joinedCount, fightersText) {
  return new EmbedBuilder()
    .setColor(cfg.COLOR)
    .setTitle(`${cfg.E_VASTO} ${cfg.BOSS_NAME} Appeared!`)
    .setDescription(`${cfg.E_VASTO} Click **🗡 Join Battle**.\n⏳ **Join time: 2 minutes**`)
    .addFields(
      { name: `${cfg.E_MEMBERS} Fighters`, value: fightersText, inline: false },
      { name: `${cfg.E_MEMBERS} Joined`, value: `\`${joinedCount}\``, inline: true },
      { name: `${cfg.E_REIATSU} Rewards`, value: `\`${cfg.BOSS_REIATSU_REWARD} + round hits\``, inline: true },
      { name: `📌 Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(cfg.MEDIA.BOSS_SPAWN)
    .setFooter({ text: `Boss • ${cfg.BOSS_ROUNDS} rounds • Cooldown 10s` });
}

function bossStateEmbed(round, aliveCount) {
  const title =
    round === 1 ? `${cfg.E_VASTO} ${cfg.BOSS_NAME} is enraged` :
    round === 2 ? `${cfg.E_VASTO} ${cfg.BOSS_NAME} keeps pushing` :
    round === 3 ? `${cfg.E_VASTO} ${cfg.BOSS_NAME} took serious damage` :
                  `${cfg.E_VASTO} ${cfg.BOSS_NAME} is almost defeated`;

  return new EmbedBuilder()
    .setColor(cfg.COLOR)
    .setTitle(title)
    .addFields({ name: `${cfg.E_MEMBERS} Alive fighters`, value: `\`${aliveCount}\``, inline: true })
    .setImage(cfg.MEDIA.BOSS_STATE)
    .setFooter({ text: `State after Round ${round}/${cfg.BOSS_ROUNDS}` });
}

function bossVictoryEmbed(survivorsCount) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`${cfg.E_VASTO} ${cfg.BOSS_NAME} Defeated!`)
    .setDescription(`✅ Rewards granted to survivors.`)
    .addFields(
      { name: `${cfg.E_MEMBERS} Survivors`, value: `\`${survivorsCount}\``, inline: true },
      { name: `🎭 Drops`, value: `\`5% role • ${(cfg.DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}% 100 Robux\``, inline: true }
    )
    .setImage(cfg.MEDIA.BOSS_VICTORY);
}

function bossDefeatEmbed() {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`${cfg.E_VASTO} Defeat`)
    .setDescription(`❌ Everyone lost. ${cfg.BOSS_NAME} wins.`)
    .setImage(cfg.MEDIA.BOSS_DEFEAT);
}

function hollowEmbed(joinedCount) {
  return new EmbedBuilder()
    .setColor(cfg.COLOR)
    .setTitle(`👁️ Hollow Appeared!`)
    .setDescription(
      [
        `⏳ **Time: 2 minutes**`,
        `🎲 50/50 chance to hit`,
        `${cfg.E_REIATSU} Hit: **${cfg.HOLLOW_HIT_REIATSU}** • Miss: **${cfg.HOLLOW_MISS_REIATSU}**`,
        `${cfg.E_VASTO} If defeated: hitters gain +${cfg.BONUS_PER_HOLLOW_KILL}% boss bonus (max ${cfg.BONUS_MAX}%).`,
      ].join("\n")
    )
    .addFields({ name: `${cfg.E_MEMBERS} Attackers`, value: `\`${joinedCount}\``, inline: true })
    .setImage(cfg.MEDIA.HOLLOW);
}

function leaderboardEmbed(entries) {
  const lines = entries.map((e, i) => `**#${i + 1}** — ${e.name}: **${cfg.E_REIATSU} ${e.reiatsu}**`);
  return new EmbedBuilder().setColor(cfg.COLOR).setTitle("🏆 Reiatsu Leaderboard").setDescription(lines.join("\n") || "No data yet.");
}

function clashInviteEmbed(chName, tName, stake) {
  return new EmbedBuilder()
    .setColor(cfg.COLOR)
    .setTitle("⚡ Reiatsu Clash")
    .setDescription(`${cfg.E_REIATSU} **${chName}** vs **${tName}**\nStake: **${cfg.E_REIATSU} ${stake}**\n🎲 50/50`)
    .setImage(cfg.MEDIA.CLASH_START);
}

function clashWinEmbed(wName, lName, stake) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🏆 Reiatsu Overwhelmed")
    .setDescription(`**${wName}** defeated **${lName}**\n+${cfg.E_REIATSU} ${stake}`)
    .setImage(cfg.MEDIA.CLASH_VICTORY);
}

module.exports = {
  bossSpawnEmbed,
  bossStateEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
  hollowEmbed,
  leaderboardEmbed,
  clashInviteEmbed,
  clashWinEmbed,
};
