// src/handlers/slash.js
const { AttachmentBuilder } = require("discord.js");
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
const { hasEventRole, hasBoosterRole, wardrobeComponents, pvpButtons } = require("../ui/components");
const { leaderboardEmbed, wardrobeEmbed } = require("../ui/embeds");
const { buildInventoryImage } = require("../ui/inventory-card");
const { buildBossResultImage, buildBossRewardImage, buildBossLiveImage } = require("../ui/boss-card");
const { buildExchangeImage } = require("../ui/exchange-card");
const { buildShopV2Payload } = require("../ui/shop-v2");

const { spawnBoss } = require("../events/boss");
const { spawnMob } = require("../events/mob");
const { pvpById } = require("../core/state");
const EXCHANGE_CE_EMOJI_ID = "1473448154220335339";

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
    const png = await buildInventoryImage(eventKey, p, interaction.user, BLEACH_BONUS_MAX, JJK_BONUS_MAX);
    const file = new AttachmentBuilder(png, { name: `inventory-${eventKey}.png` });
    return interaction.reply({
      files: [file],
      ephemeral: true,
    });
  }

  if (interaction.commandName === "shop") {
    const eventKey = interaction.options.getString("event", true);
    const p = await getPlayer(interaction.user.id);
    return interaction.reply(buildShopV2Payload({
      eventKey,
      player: p,
      page: 0,
      selectedKey: null,
      withFlags: true,
    }));
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

  /* ===================== /give (new) ===================== */
  if (interaction.commandName === "give") {
    const currency = interaction.options.getString("currency", true);
    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    if (amount < 1) return interaction.reply({ content: "❌ Amount must be >= 1.", ephemeral: true });
    if (target.bot) return interaction.reply({ content: "❌ You can't transfer to a bot.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't transfer to yourself.", ephemeral: true });

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
    if (s < amount) return interaction.reply({ content: `❌ Not enough funds. You have ${s}.`, ephemeral: true });

    setBal(sender, s - amount);
    setBal(receiver, getBal(receiver) + amount);

    await setPlayer(interaction.user.id, sender);
    await setPlayer(target.id, receiver);

    const emoji = currency === "reiatsu" ? E_REIATSU : currency === "cursed_energy" ? E_CE : E_DRAKO;

    return interaction.reply({
      content: `${emoji} **${safeName(interaction.user.username)}** sent **${amount}** to **${safeName(target.username)}**.`,
      ephemeral: false,
    });
  }

  if (interaction.commandName === "exchange_drako") {
    const eventKey = interaction.options.getString("event", true);
    const drakoWanted = interaction.options.getInteger("drako", true);

    const rate = eventKey === "bleach" ? DRAKO_RATE_BLEACH : DRAKO_RATE_JJK;
    const cost = drakoWanted * rate;
    const currencyEmoji = eventKey === "bleach" ? E_REIATSU : `<:ce:${EXCHANGE_CE_EMOJI_ID}>`;

    const p = await getPlayer(interaction.user.id);

    if (eventKey === "bleach") {
      if (p.bleach.reiatsu < cost) {
        return interaction.reply({
          content:
            `Need ${currencyEmoji} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\n` +
            `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
            `You have ${currencyEmoji} **${p.bleach.reiatsu}**.`,
          ephemeral: true,
        });
      }
      p.bleach.reiatsu -= cost;
      p.drako += drakoWanted;
      await setPlayer(interaction.user.id, p);

      const png = await buildExchangeImage({
        eventKey,
        rate,
        cost,
        drakoWanted,
        currencyEmoji,
        drakoEmoji: E_DRAKO,
        afterCurrency: p.bleach.reiatsu,
        afterDrako: p.drako,
      });
      const file = new AttachmentBuilder(png, { name: `exchange-${eventKey}.png` });
      return interaction.reply({ files: [file], ephemeral: false });
    }

    if (p.jjk.cursedEnergy < cost) {
      return interaction.reply({
        content:
          `Need ${currencyEmoji} **${cost}** to buy ${E_DRAKO} **${drakoWanted} Drako**.\n` +
          `Rate: **${rate} ${currencyEmoji} = 1 ${E_DRAKO}** (one-way)\n` +
          `You have ${currencyEmoji} **${p.jjk.cursedEnergy}**.`,
        ephemeral: true,
      });
    }
    p.jjk.cursedEnergy -= cost;
    p.drako += drakoWanted;
    await setPlayer(interaction.user.id, p);

    const png = await buildExchangeImage({
      eventKey,
      rate,
      cost,
      drakoWanted,
      currencyEmoji,
      drakoEmoji: E_DRAKO,
      afterCurrency: p.jjk.cursedEnergy,
      afterDrako: p.drako,
    });
    const file = new AttachmentBuilder(png, { name: `exchange-${eventKey}.png` });
    return interaction.reply({ files: [file], ephemeral: false });
  }
  if (interaction.commandName === "spawnboss") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
    }

    const bossId = interaction.options.getString("boss", true);
    const def = BOSSES[bossId];
    if (!def) return interaction.reply({ content: "❌ Unknown boss.", ephemeral: true });

    if (!isAllowedSpawnChannel(def.event, channel.id)) {
      const needed = def.event === "bleach" ? `<#${BLEACH_CHANNEL_ID}>` : `<#${JJK_CHANNEL_ID}>`;
      return interaction.reply({ content: `❌ This boss can only be spawned in ${needed}.`, ephemeral: true });
    }

    await interaction.reply({ content: `✅ Spawned **${def.name}**.`, ephemeral: true });
    await spawnBoss(channel, bossId, true);
    return;
  }

  if (interaction.commandName === "testreciview") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
    }

    const bossId = interaction.options.getString("boss", true);
    const mode = interaction.options.getString("mode", true);
    const def = BOSSES[bossId];
    if (!def) return interaction.reply({ content: "❌ Unknown boss.", ephemeral: true });

    const sampleTop = [
      { name: safeName(interaction.member?.displayName || interaction.user.username), dmg: 45000 },
      { name: "Silvers Rayleigh", dmg: 30000 },
      { name: "Red_thz", dmg: 15000 },
      { name: "Charlotte Katakuri", dmg: 15000 },
    ];

    if (mode === "reward") {
      const png = await buildBossRewardImage(def, {
        rows: [
          { name: sampleTop[0].name, text: "+850 Win | +45 Bank | Total 895 | 12 Shards" },
          { name: sampleTop[1].name, text: "+780 Win | +30 Bank | Total 810" },
          { name: sampleTop[2].name, text: "+720 Win | +15 Bank | Total 735" },
        ],
      });
      const file = new AttachmentBuilder(png, { name: `test-reward-${def.id}.png` });
      return interaction.reply({ files: [file], ephemeral: true });
    }

    if (mode === "action") {
      const png = await buildBossLiveImage(def, {
        phase: "ROUND ACTIVE — COOP BLOCK",
        hpLeft: 1825,
        hpTotal: 1930,
        topDamage: sampleTop,
        noteA: "Status: BEGIN",
        noteB: "Need 4 different players to press Block",
        noteC: "Window ends in 5s",
      });
      const file = new AttachmentBuilder(png, { name: `test-action-${def.id}.png` });
      return interaction.reply({ files: [file], ephemeral: true });
    }

    const victory = mode === "result_win";
    const png = await buildBossResultImage(def, {
      victory,
      topDamage: sampleTop,
      hpLeft: victory ? 0 : 1825,
      hpTotal: 1930,
      survivors: victory ? 3 : 0,
      joined: 4,
      deadOverlay: !victory,
    });
    const file = new AttachmentBuilder(png, { name: `test-result-${def.id}.png` });
    return interaction.reply({ files: [file], ephemeral: true });
  }

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

  if (interaction.commandName === "adminadd") {
    const allowed = hasEventRole(interaction.member);
    if (!allowed) return interaction.reply({ content: "⛔ No permission.", ephemeral: true });

    const currency = interaction.options.getString("currency", true);
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("user") || interaction.user;

    const p = await getPlayer(target.id);

    if (currency === "drako") p.drako += amount;
    if (currency === "reiatsu") p.bleach.reiatsu += amount;
    if (currency === "cursed_energy") p.jjk.cursedEnergy += amount;

    await setPlayer(target.id, p);

    return interaction.reply({
      content:
        `✅ Added **${amount}** to <@${target.id}>.\n` +
        `${E_REIATSU} Reiatsu: **${p.bleach.reiatsu}** • ${E_CE} CE: **${p.jjk.cursedEnergy}** • ${E_DRAKO} Drako: **${p.drako}**`,
      ephemeral: false,
    });
  }
};


