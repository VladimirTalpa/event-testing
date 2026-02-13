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

  // ⚠️ чтобы команды не "умирали" от таймаута
  // (особенно если Redis/Discord API тормозят)
  try {
    await interaction.deferReply({ ephemeral: false });
  } catch {
    // если уже deferred/replied — ок
  }

  /* ===================== /profile ===================== */
  if (interaction.commandName === "profile") {
    const p = await getPlayer(interaction.user.id);

    const text =
      [
        `👤 **${safeName(interaction.user.username)} — Profile**`,
        ``,
        `${E_REIATSU} Reiatsu: **${p.bleach?.reiatsu ?? 0}**`,
        `${E_CE} Cursed Energy: **${p.jjk?.cursedEnergy ?? 0}**`,
        `${E_DRAKO} Drako: **${p.drako ?? 0}**`,
        ``,
        `📌 Quick:`,
        `• \`/inventory event:bleach\` или \`/inventory event:jjk\``,
        `• \`/shop event:bleach\` или \`/shop event:jjk\``,
        `• \`/leaderboard event:bleach\` или \`/leaderboard event:jjk\``,
        `• \`/wardrobe\``,
      ].join("\n");

    return interaction.editReply({ content: text });
  }

  if (interaction.commandName === "balance") {
    const target = interaction.options.getUser("user") || interaction.user;
    const p = await getPlayer(target.id);
    return interaction.editReply({
      content:
        `**${safeName(target.username)}**\n` +
        `${E_REIATSU} Reiatsu: **${p.bleach.reiatsu}**\n` +
        `${E_CE} Cursed Energy: **${p.jjk.cursedEnergy}**\n` +
        `${E_DRAKO} Drako: **${p.drako}**`,
    });
  }

  if (interaction.commandName === "inventory") {
    const eventKey = interaction.options.getString("event", true);
    const p = await getPlayer(interaction.user.id);
    return interaction.editReply({ embeds: [inventoryEmbed(eventKey, p, BLEACH_BONUS_MAX, JJK_BONUS_MAX)], ephemeral: true });
  }

  if (interaction.commandName === "shop") {
    const eventKey = interaction.options.getString("event", true);
    const p = await getPlayer(interaction.user.id);
    return interaction.editReply({
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

    return interaction.editReply({ embeds: [leaderboardEmbed(eventKey, entries)] });
  }

  if (interaction.commandName === "dailyclaim") {
    const p = await getPlayer(interaction.user.id);
    const now = Date.now();

    if (now - p.bleach.lastDaily < DAILY_COOLDOWN_MS) {
      const hrs = Math.ceil((DAILY_COOLDOWN_MS - (now - p.bleach.lastDaily)) / 3600000);
      return interaction.editReply({ content: `⏳ Come back in **${hrs}h**.`, ephemeral: true });
    }

    const amount = hasBoosterRole(interaction.member) ? DAILY_BOOSTER : DAILY_NORMAL;
    p.bleach.reiatsu += amount;
    p.bleach.lastDaily = now;

    await setPlayer(interaction.user.id, p);
    return interaction.editReply({ content: `🎁 You claimed **${E_REIATSU} ${amount} Reiatsu**!` });
  }

  /* ===================== /give ===================== */
  if (interaction.commandName === "give") {
    const currency = interaction.options.getString("currency", true);
    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    if (amount < 1) return interaction.editReply({ content: "❌ Amount must be >= 1." });
    if (target.bot) return interaction.editReply({ content: "❌ You can't transfer to a bot." });
    if (target.id === interaction.user.id) return interaction.editReply({ content: "❌ You can't transfer to yourself." });

    const sender = await getPlayer(interaction.user.id);
    const receiver = await getPlayer(target.id);

    function getBal(p) {
      if (currency === "reiatsu") return p.bleach.reiatsu;
      if (currency === "cursed_energy") return p.jjk.cursedEnergy;
      if (currency === "drako") return p.drako;
      return 0;
    }
    function setBal(p, v) {
      if (currency === "reiatsu") p.bleach.reiatsu = v;
      if (currency === "cursed_energy") p.jjk.cursedEnergy = v;
      if (currency === "drako") p.drako = v;
    }

    const s = getBal(sender);
    if (s < amount) return interaction.editReply({ content: `❌ Not enough funds. You have ${s}.` });

    setBal(sender, s - amount);
    setBal(receiver, getBal(receiver) + amount);

    await setPlayer(interaction.user.id, sender);
    await setPlayer(target.id, receiver);

    const emoji = currency === "reiatsu" ? E_REIATSU : currency === "cursed_energy" ? E_CE : E_DRAKO;

    return interaction.editReply({
      content: `${emoji} **${safeName(interaction.user.username)}** sent **${amount}** to **${safeName(target.username)}**.`,
    });
  }

  if (interaction.commandName === "exchange_drako") {
    const eventKey = interaction.options.getString("event", true);
    const drakoWanted = interaction.options.getInteger("drako", true);

    const rate = eventKey === "bleach" ? DRAKO_RATE_BLEACH : DRAKO_RATE_JJK;
    const cost = drakoWanted * rate;
    const currencyEmoji = eventKey === "bleach" ? E_REIATSU : E_CE;

    const p = await getPlayer(interaction.user.id);

    if (eventKey === "bleach") {
      if (p.bleach.reiatsu < cost) {
        return interaction.editReply({
          content:
            `❌ Need ${currencyEmoji} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\n` +
            `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
            `You have ${currencyEmoji} **${p.bleach.reiatsu}**.`,
        });
      }
      p.bleach.reiatsu -= cost;
      p.drako += drakoWanted;
      await setPlayer(interaction.user.id, p);

      return interaction.editReply({
        content:
          `✅ Exchanged ${currencyEmoji} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako**.\n` +
          `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
          `Now: ${currencyEmoji} **${p.bleach.reiatsu}** • ${E_DRAKO} **${p.drako}**\n` +
          `⚠️ Drako cannot be exchanged back.`,
      });
    } else {
      if (p.jjk.cursedEnergy < cost) {
        return interaction.editReply({
          content:
            `❌ Need ${currencyEmoji} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\n` +
            `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
            `You have ${currencyEmoji} **${p.jjk.cursedEnergy}**.`,
        });
      }
      p.jjk.cursedEnergy -= cost;
      p.drako += drakoWanted;
      await setPlayer(interaction.user.id, p);

      return interaction.editReply({
        content:
          `✅ Exchanged ${currencyEmoji} **${cost}** → ${E_DRAKO} **${drakoWanted} Drako**.\n` +
          `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
          `Now: ${currencyEmoji} **${p.jjk.cursedEnergy}** • ${E_DRAKO} **${p.drako}**\n` +
          `⚠️ Drako cannot be exchanged back.`,
      });
    }
  }

  if (interaction.commandName === "spawnboss") {
    if (!hasEventRole(interaction.member)) {
      return interaction.editReply({ content: "⛔ You don’t have the required role." });
    }

    const bossId = interaction.options.getString("boss", true);
    const def = BOSSES[bossId];
    if (!def) return interaction.editReply({ content: "❌ Unknown boss." });

    if (!isAllowedSpawnChannel(def.event, channel.id)) {
      const needed = def.event === "bleach" ? `<#${BLEACH_CHANNEL_ID}>` : `<#${JJK_CHANNEL_ID}>`;
      return interaction.editReply({ content: `❌ This boss can only be spawned in ${needed}.` });
    }

    await interaction.editReply({ content: `✅ Spawned **${def.name}**.` });
    await spawnBoss(channel, bossId, true);
    return;
  }

  if (interaction.commandName === "spawnmob") {
    if (!hasEventRole(interaction.member)) {
      return interaction.editReply({ content: "⛔ You don’t have the required role." });
    }

    const eventKey = interaction.options.getString("event", true);
    if (!MOBS[eventKey]) return interaction.editReply({ content: "❌ Unknown event." });

    if (!isAllowedSpawnChannel(eventKey, channel.id)) {
      const needed = eventKey === "bleach" ? `<#${BLEACH_CHANNEL_ID}>` : `<#${JJK_CHANNEL_ID}>`;
      return interaction.editReply({ content: `❌ This mob can only be spawned in ${needed}.` });
    }

    await interaction.editReply({ content: `✅ Mob spawned (${eventKey}).` });
    await spawnMob(channel, eventKey, { bleachChannelId: BLEACH_CHANNEL_ID, jjkChannelId: JJK_CHANNEL_ID, withPing: true });
    return;
  }

  if (interaction.commandName === "wardrobe") {
    const p = await getPlayer(interaction.user.id);
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) return interaction.editReply({ content: "❌ Can't read your member data." });

    return interaction.editReply({
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

    if (target.bot) return interaction.editReply({ content: "❌ You can't duel a bot." });
    if (target.id === interaction.user.id) return interaction.editReply({ content: "❌ You can't duel yourself." });
    if (amount < 1) return interaction.editReply({ content: "❌ Amount must be >= 1." });

    const key = `${channel.id}:${interaction.user.id}:${target.id}`;
    pvpById.set(key, { createdAt: Date.now(), done: false });

    return interaction.editReply({
      content:
        `⚔️ <@${target.id}> you were challenged by <@${interaction.user.id}>!\n` +
        `Stake: **${amount} ${currency}**`,
      components: pvpButtons(currency, amount, interaction.user.id, target.id, false),
    });
  }

  if (interaction.commandName === "adminadd") {
    const allowed = interaction.member?.roles?.cache?.has("1259865441405501571");
    if (!allowed) return interaction.editReply({ content: "⛔ No permission." });

    const currency = interaction.options.getString("currency", true);
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("user") || interaction.user;

    const p = await getPlayer(target.id);

    if (currency === "drako") p.drako += amount;
    if (currency === "reiatsu") p.bleach.reiatsu += amount;
    if (currency === "cursed_energy") p.jjk.cursedEnergy += amount;

    await setPlayer(target.id, p);

    return interaction.editReply({
      content:
        `✅ Added **${amount}** to <@${target.id}>.\n` +
        `${E_REIATSU} Reiatsu: **${p.bleach.reiatsu}** • ${E_CE} CE: **${p.jjk.cursedEnergy}** • ${E_DRAKO} Drako: **${p.drako}**`,
    });
  }

  // если команда есть в дискорде, но нет реализации
  return interaction.editReply({ content: `❌ Command /${interaction.commandName} is not implemented.` });
};
