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
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) {
    return interaction.reply({ content: "❌ Use commands in a text channel.", ephemeral: true });
  }

  if (interaction.commandName === "balance") {
    const target = interaction.options.getUser("user") || interaction.user;
    const p = await getPlayer(target.id);
    return interaction.reply({
      content:
        `**${safeName(target.username)}**\n` +
        `${E_REIATSU} Reiatsu: **${p.bleach.reiatsu}**\n` +
        `${E_CE} Cursed Energy: **${p.jjk.cursedEnergy}**\n` +
        `${E_DRAKO} Drako: **${p.drako}**`,
      ephemeral: false,
    });
  }

  if (interaction.commandName === "inventory") {
    const eventKey = interaction.options.getString("event", true);
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({ embeds: [inventoryEmbed(eventKey, p, BLEACH_BONUS_MAX, JJK_BONUS_MAX)], ephemeral: true });
  }

  if (interaction.commandName === "shop") {
    const eventKey = interaction.options.getString("event", true);
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({
      embeds: [shopEmbed(eventKey, p)],
      components: shopButtons(eventKey, p),
      ephemeral: true,
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

    return interaction.reply({ embeds: [leaderboardEmbed(eventKey, entries)], ephemeral: false });
  }

  if (interaction.commandName === "dailyclaim") {
    const p = await getPlayer(interaction.user.id);
    const now = Date.now();

    if (now - p.bleach.lastDaily < DAILY_COOLDOWN_MS) {
      const hrs = Math.ceil((DAILY_COOLDOWN_MS - (now - p.bleach.lastDaily)) / 3600000);
      return interaction.reply({ content: `⏳ Come back in **${hrs}h**.`, ephemeral: true });
    }

    const amount = hasBoosterRole(interaction.member) ? DAILY_BOOSTER : DAILY_NORMAL;
    p.bleach.reiatsu += amount;
    p.bleach.lastDaily = now;

    await setPlayer(interaction.user.id, p);
    return interaction.reply({ content: `🎁 You claimed **${E_REIATSU} ${amount} Reiatsu**!`, ephemeral: false });
  }

  /* ===================== /exchange_drako ===================== */
  if (interaction.commandName === "exchange_drako") {
    const eventKey = interaction.options.getString("event", true);
    const drakoWanted = interaction.options.getInteger("drako", true);

    const rate = eventKey === "bleach" ? DRAKO_RATE_BLEACH : DRAKO_RATE_JJK;
    const cost = drakoWanted * rate;
    const currencyEmoji = eventKey === "bleach" ? E_REIATSU : E_CE;

    const p = await getPlayer(interaction.user.id);

    if (eventKey === "bleach") {
      if (p.bleach.reiatsu < cost) {
        return interaction.reply({
          content:
            `❌ Need ${currencyEmoji} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\n` +
            `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
            `You have ${currencyEmoji} **${p.bleach.reiatsu}**.`,
          ephemeral: true,
        });
      }
      p.bleach.reiatsu -= cost;
      p.drako += drakoWanted;
      await setPlayer(interaction.user.id, p);

      return interaction.reply({
        content:
          `✅ Exchanged ${currencyEmoji} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako**.\n` +
          `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
          `Now: ${currencyEmoji} **${p.bleach.reiatsu}** • ${E_DRAKO} **${p.drako}**\n` +
          `⚠️ Drako cannot be exchanged back.`,
        ephemeral: false,
      });
    } else {
      if (p.jjk.cursedEnergy < cost) {
        return interaction.reply({
          content:
            `❌ Need ${currencyEmoji} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\n` +
            `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
            `You have ${currencyEmoji} **${p.jjk.cursedEnergy}**.`,
          ephemeral: true,
        });
      }
      p.jjk.cursedEnergy -= cost;
      p.drako += drakoWanted;
      await setPlayer(interaction.user.id, p);

      return interaction.reply({
        content:
          `✅ Exchanged ${currencyEmoji} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako**.\n` +
          `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
          `Now: ${currencyEmoji} **${p.jjk.cursedEnergy}** • ${E_DRAKO} **${p.drako}**\n` +
          `⚠️ Drako cannot be exchanged back.`,
        ephemeral: false,
      });
    }
  }

  /* ===================== /spawnboss (FIXED) ===================== */
  if (interaction.commandName === "spawnboss") {
    try {
      // THIS is what prevents "application did not respond"
      await interaction.deferReply({ ephemeral: true });

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

      await interaction.editReply(`✅ Spawned **${def.name}**.`);
      await spawnBoss(channel, bossId, true);
      return;
    } catch (e) {
      console.error("spawnboss error:", e);
      try {
        if (interaction.deferred) return interaction.editReply("⚠️ Error while spawning boss.");
        return interaction.reply({ content: "⚠️ Error while spawning boss.", ephemeral: true });
      } catch {}
      return;
    }
  }

  /* ===================== /spawnmob ===================== */
  if (interaction.commandName === "spawnmob") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
    }

    const eventKey = interaction.options.getString("event", true);
    if (!MOBS[eventKey]) return interaction.reply({ content: "❌ Unknown event.", ephemeral: true });

    if (!isAllowedSpawnChannel(eventKey, channel.id)) {
      const needed = eventKey === "bleach" ? `<#${BLEACH_CHANNEL_ID}>` : `<#${JJK_CHANNEL_ID}>`;
      return interaction.reply({ content: `❌ This mob can only be spawned in ${needed}.`, ephemeral: true });
    }

    await interaction.reply({ content: `✅ Mob spawned (${eventKey}).`, ephemeral: true });
    await spawnMob(channel, eventKey, { bleachChannelId: BLEACH_CHANNEL_ID, jjkChannelId: JJK_CHANNEL_ID, withPing: true });
    return;
  }

  if (interaction.commandName === "wardrobe") {
    const p = await getPlayer(interaction.user.id);
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) return interaction.reply({ content: "❌ Can't read your member data.", ephemeral: true });

    return interaction.reply({
      embeds: [wardrobeEmbed(interaction.guild, p)],
      components: wardrobeComponents(interaction.guild, member, p),
      ephemeral: true,
    });
  }

  /* ===================== /pvpclash ===================== */
  if (interaction.commandName === "pvpclash") {
    const currency = interaction.options.getString("currency", true);
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("user", true);

    if (target.bot) return interaction.reply({ content: "❌ You can't duel a bot.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't duel yourself.", ephemeral: true });
    if (amount < 1) return interaction.reply({ content: "❌ Amount must be >= 1.", ephemeral: true });

    const key = `${channel.id}:${interaction.user.id}:${target.id}`;
    pvpById.set(key, { createdAt: Date.now(), done: false });

    return interaction.reply({
      content:
        `⚔️ <@${target.id}> you were challenged by <@${interaction.user.id}>!\n` +
        `Stake: **${amount} ${currency}**`,
      components: pvpButtons(currency, amount, interaction.user.id, target.id, false),
      ephemeral: false,
    });
  }

  // Fallback: never allow silent timeout
  return interaction.reply({ content: `❌ Command not handled: ${interaction.commandName}`, ephemeral: true });
};
