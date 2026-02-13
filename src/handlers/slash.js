// src/handlers/slash.js
const { BOSSES } = require("../data/bosses");
const { MOBS } = require("../data/mobs");

const {
  BLEACH_CHANNEL_ID,
  JJK_CHANNEL_ID,
  DAILY_COOLDOWN_MS,
  DAILY_NORMAL,
  DAILY_BOOSTER,
  DRAKO_RATE_BLEACH,
  DRAKO_RATE_JJK,

  E_REIATSU,
  E_CE,
  E_DRAKO,

  BLEACH_BONUS_MAX,
  JJK_BONUS_MAX,
} = require("../config");

const { getPlayer, setPlayer, getTopPlayers } = require("../core/players");
const { safeName } = require("../core/utils");
const { hasEventRole, hasBoosterRole, shopButtons, wardrobeComponents, pvpButtons } = require("../ui/components");
const { inventoryEmbed, shopEmbed, leaderboardEmbed, wardrobeEmbed } = require("../ui/embeds");

const { spawnBoss } = require("../events/boss");
const { spawnMob } = require("../events/mob");
const { pvpById } = require("../core/state");

function isAllowedSpawnChannel(eventKey, channelId) {
  if (eventKey === "bleach") return channelId === BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return channelId === JJK_CHANNEL_ID;
  return false;
}

module.exports = async function handleSlash(interaction) {
  // ✅ ВСЕГДА отвечаем (defer), чтобы не было "did not respond"
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true }).catch(() => {});
    }

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) {
      return interaction.editReply("❌ Use commands in a text channel.");
    }

    if (interaction.commandName === "balance") {
      const target = interaction.options.getUser("user") || interaction.user;
      const p = await getPlayer(target.id);
      return interaction.editReply(
        `**${safeName(target.username)}**\n` +
        `${E_REIATSU} Reiatsu: **${p.bleach.reiatsu}**\n` +
        `${E_CE} Cursed Energy: **${p.jjk.cursedEnergy}**\n` +
        `${E_DRAKO} Drako: **${p.drako}**`
      );
    }

    if (interaction.commandName === "inventory") {
      const eventKey = interaction.options.getString("event", true);
      const p = await getPlayer(interaction.user.id);
      return interaction.editReply({ embeds: [inventoryEmbed(eventKey, p, BLEACH_BONUS_MAX, JJK_BONUS_MAX)] });
    }

    if (interaction.commandName === "shop") {
      const eventKey = interaction.options.getString("event", true);
      const p = await getPlayer(interaction.user.id);
      return interaction.editReply({
        embeds: [shopEmbed(eventKey, p)],
        components: shopButtons(eventKey, p),
      });
    }

    if (interaction.commandName === "leaderboard") {
      const eventKey = interaction.options.getString("event", true);
      const rows = await getTopPlayers(eventKey, 10);
      const entries = [];

      for (const r of rows) {
        let name = r.userId;
        try {
          const m = await interaction.guild.members.fetch(r.userId);
          name = safeName(m?.displayName || m?.user?.username || r.userId);
        } catch {}
        entries.push({ name, score: r.score });
      }

      // leaderboard обычно public — но мы уже defer ephemeral=true.
      // Сделаем editReply public нельзя. Поэтому просто оставляем ephemeral.
      return interaction.editReply({ embeds: [leaderboardEmbed(eventKey, entries)] });
    }

    if (interaction.commandName === "dailyclaim") {
      const p = await getPlayer(interaction.user.id);
      const now = Date.now();

      if (now - p.bleach.lastDaily < DAILY_COOLDOWN_MS) {
        const hrs = Math.ceil((DAILY_COOLDOWN_MS - (now - p.bleach.lastDaily)) / 3600000);
        return interaction.editReply(`⏳ Come back in **${hrs}h**.`);
      }

      const amount = hasBoosterRole(interaction.member) ? DAILY_BOOSTER : DAILY_NORMAL;
      p.bleach.reiatsu += amount;
      p.bleach.lastDaily = now;

      await setPlayer(interaction.user.id, p);
      return interaction.editReply(`🎁 You claimed **${E_REIATSU} ${amount} Reiatsu**!`);
    }

    if (interaction.commandName === "spawnboss") {
      if (!hasEventRole(interaction.member)) {
        return interaction.editReply("⛔ You don’t have the required role.");
      }

      const bossId = interaction.options.getString("boss", true);
      const def = BOSSES[bossId];
      if (!def) return interaction.editReply("❌ Unknown boss.");

      if (!isAllowedSpawnChannel(def.event, channel.id)) {
        const needed = def.event === "bleach" ? `<#${BLEACH_CHANNEL_ID}>` : `<#${JJK_CHANNEL_ID}>`;
        return interaction.editReply(`❌ This boss can only be spawned in ${needed}.`);
      }

      await spawnBoss(channel, bossId, true);
      return interaction.editReply(`✅ Spawned **${def.name}**.`);
    }

    if (interaction.commandName === "spawnmob") {
      if (!hasEventRole(interaction.member)) {
        return interaction.editReply("⛔ You don’t have the required role.");
      }

      const eventKey = interaction.options.getString("event", true);
      if (!MOBS[eventKey]) return interaction.editReply("❌ Unknown event.");

      if (!isAllowedSpawnChannel(eventKey, channel.id)) {
        const needed = eventKey === "bleach" ? `<#${BLEACH_CHANNEL_ID}>` : `<#${JJK_CHANNEL_ID}>`;
        return interaction.editReply(`❌ This mob can only be spawned in ${needed}.`);
      }

      await spawnMob(channel, eventKey, { bleachChannelId: BLEACH_CHANNEL_ID, jjkChannelId: JJK_CHANNEL_ID, withPing: true });
      return interaction.editReply(`✅ Mob spawned (${eventKey}).`);
    }

    if (interaction.commandName === "wardrobe") {
      const p = await getPlayer(interaction.user.id);
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) return interaction.editReply("❌ Can't read your member data.");

      return interaction.editReply({
        embeds: [wardrobeEmbed(interaction.guild, p)],
        components: wardrobeComponents(interaction.guild, member, p),
      });
    }

    // ✅ если команда не найдена — тоже отвечаем
    return interaction.editReply(`❌ Command \`/${interaction.commandName}\` is not implemented.`);
  } catch (e) {
    console.error("handleSlash crashed:", e);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply("⚠️ Command error. Check logs.");
      } else {
        await interaction.reply({ content: "⚠️ Command error. Check logs.", ephemeral: true });
      }
    } catch {}
  }
};
