const { EmbedBuilder } = require("discord.js");
const {
  COLOR,
  E_VASTO,
  E_MEMBERS,
  E_REIATSU,
  BOSS_ROUNDS,
  DROP_ROBUX_CHANCE_DISPLAY,
  MEDIA,
} = require("./config");

function bossSpawnEmbed(bossCfg, channelName, joinedCount, fightersText) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_VASTO} ${bossCfg.name} Appeared!`)
    .setDescription(`${E_VASTO} Click **🗡 Join Battle**.\n⏳ **Join time: 2 minutes**`)
    .addFields(
      { name: `${E_MEMBERS} Fighters`, value: fightersText, inline: false },
      { name: `${E_MEMBERS} Joined`, value: `\`${joinedCount}\``, inline: true },
      { name: `${E_REIATSU} Rewards`, value: `\`${200} + round hits\``, inline: true },
      { name: `📌 Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(bossCfg.spawn)
    .setFooter({ text: `Boss • ${BOSS_ROUNDS} rounds • Cooldown 10s` });
}

function bossStateEmbed(bossCfg, round, aliveCount) {
  const title =
    round === 1 ? `${E_VASTO} ${bossCfg.name} is enraged` :
    round === 2 ? `${E_VASTO} ${bossCfg.name} keeps pushing` :
    round === 3 ? `${E_VASTO} ${bossCfg.name} took serious damage` :
                  `${E_VASTO} ${bossCfg.name} is almost defeated`;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(title)
    .addFields({ name: `${E_MEMBERS} Alive fighters`, value: `\`${aliveCount}\``, inline: true })
    .setImage(bossCfg.rounds[Math.max(0, Math.min(3, round - 1))])
    .setFooter({ text: `State after Round ${round}/${BOSS_ROUNDS}` });
}

function bossVictoryEmbed(bossCfg, survivorsCount) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`${E_VASTO} ${bossCfg.name} Defeated!`)
    .setDescription(`✅ Rewards granted to survivors.`)
    .addFields(
      { name: `${E_MEMBERS} Survivors`, value: `\`${survivorsCount}\``, inline: true },
      { name: `🎭 Drops`, value: `\`5% role • ${(DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}% 100 Robux\``, inline: true }
    )
    .setImage(bossCfg.victory);
}

function bossDefeatEmbed(bossCfg) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`${E_VASTO} Defeat`)
    .setDescription(`❌ Everyone lost. ${bossCfg.name} wins.`)
    .setImage(bossCfg.defeat);
}

function hollowEmbed(joinedCount) {
  const { E_VASTO, HOLLOW_HIT_REIATSU, HOLLOW_MISS_REIATSU, BONUS_PER_HOLLOW_KILL, BONUS_MAX } = require("./config");
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`👁️ Hollow Appeared!`)
    .setDescription(
      [
        `⏳ **Time: 2 minutes**`,
        `🎲 50/50 chance to hit`,
        `${E_REIATSU} Hit: **${HOLLOW_HIT_REIATSU}** • Miss: **${HOLLOW_MISS_REIATSU}**`,
        `${E_VASTO} If defeated: hitters gain +${BONUS_PER_HOLLOW_KILL}% boss bonus (max ${BONUS_MAX}%).`,
      ].join("\n")
    )
    .addFields({ name: `${E_MEMBERS} Attackers`, value: `\`${joinedCount}\``, inline: true })
    .setImage(MEDIA.HOLLOW);
}

function shopEmbed(player, shopItems, calcDropLuckMultiplier) {
  const inv = player.items;
  const lines = shopItems.map((it) => {
    const owned = inv[it.key] ? "✅ Owned" : `${E_REIATSU} ${it.price} Reiatsu`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🛒 Shop")
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: `${E_REIATSU} Your Reiatsu`, value: `\`${player.reiatsu}\``, inline: true },
      { name: `🍀 Drop luck`, value: `\`x${calcDropLuckMultiplier(inv).toFixed(2)}\``, inline: true }
    );
}

function inventoryEmbed(player, calcItemSurvivalBonus, calcReiatsuMultiplier, calcDropLuckMultiplier) {
  const inv = player.items;
  const itemBonus = calcItemSurvivalBonus(inv);
  const mult = calcReiatsuMultiplier(inv);

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🎒 Inventory")
    .setDescription(
      [
        `${E_REIATSU} Reiatsu: **${player.reiatsu}**`,
        `${E_VASTO} Permanent boss bonus: **${player.survivalBonus}%**`,
        `🛡 Item boss bonus: **${itemBonus}%**`,
        `🍀 Drop luck: **x${calcDropLuckMultiplier(inv).toFixed(2)}**`,
        `💰 Reiatsu multiplier: **x${mult}**`,
        "",
        `• Zanpakutō: ${inv.zanpakuto_basic ? "✅" : "❌"}`,
        `• Mask Fragment: ${inv.hollow_mask_fragment ? "✅" : "❌"}`,
        `• Cloak: ${inv.soul_reaper_cloak ? "✅" : "❌"}`,
        `• Amplifier: ${inv.reiatsu_amplifier ? "✅" : "❌"}`,
        `• Sousuke Aizen role: ${inv.cosmetic_role ? "✅" : "❌"}`,
      ].join("\n")
    );
}

function leaderboardEmbed(entries) {
  const lines = entries.map((e, i) => `**#${i + 1}** — ${e.name}: **${E_REIATSU} ${e.reiatsu}**`);
  return new EmbedBuilder().setColor(COLOR).setTitle("🏆 Reiatsu Leaderboard").setDescription(lines.join("\n") || "No data yet.");
}

function clashInviteEmbed(chName, tName, stake) {
  const { MEDIA } = require("./config");
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("⚡ Reiatsu Clash")
    .setDescription(`${E_REIATSU} **${chName}** vs **${tName}**\nStake: **${E_REIATSU} ${stake}**\n🎲 50/50`)
    .setImage(MEDIA.CLASH_START);
}

function clashWinEmbed(wName, lName, stake) {
  const { MEDIA } = require("./config");
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🏆 Reiatsu Overwhelmed")
    .setDescription(`**${wName}** defeated **${lName}**\n+${E_REIATSU} ${stake}`)
    .setImage(MEDIA.CLASH_VICTORY);
}

module.exports = {
  bossSpawnEmbed,
  bossStateEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
  hollowEmbed,
  shopEmbed,
  inventoryEmbed,
  leaderboardEmbed,
  clashInviteEmbed,
  clashWinEmbed,
};
