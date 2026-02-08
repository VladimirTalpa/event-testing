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

} = require("../config");

const {
  getPlayer,
  setPlayer,
  getTopPlayers,
} = require("../core/players");

const { safeName } = require("../core/utils");

const {
  hasEventRole,
  hasBoosterRole,
  shopButtons,
  wardrobeComponents,
} = require("../ui/components");

const {
  inventoryEmbed,
  shopEmbed,
  leaderboardEmbed,
  wardrobeEmbed,
} = require("../ui/embeds");

const { spawnBoss } = require("../events/boss");
const { spawnMob } = require("../events/mob");


/* ===================== HELPERS ===================== */

function isAllowedSpawnChannel(eventKey, channelId) {
  if (eventKey === "bleach") return channelId === BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return channelId === JJK_CHANNEL_ID;
  return false;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}


/* ===================== MAIN ===================== */

module.exports = async function handleSlash(interaction) {
  const channel = interaction.channel;

  if (!channel || !channel.isTextBased()) {
    return interaction.reply({
      content: "❌ Use commands in text channels.",
      ephemeral: true,
    });
  }


  /* ===================== BALANCE ===================== */

  if (interaction.commandName === "balance") {
    const target =
      interaction.options.getUser("user") || interaction.user;

    const p = await getPlayer(target.id);

    return interaction.reply({
      content:
        `**${safeName(target.username)}**\n` +
        `${E_REIATSU} ${p.bleach.reiatsu}\n` +
        `${E_CE} ${p.jjk.cursedEnergy}\n` +
        `${E_DRAKO} ${p.drako}`,
    });
  }


  /* ===================== INVENTORY ===================== */

  if (interaction.commandName === "inventory") {
    const eventKey =
      interaction.options.getString("event", true);

    const p = await getPlayer(interaction.user.id);

    return interaction.reply({
      embeds: [inventoryEmbed(eventKey, p)],
      ephemeral: true,
    });
  }


  /* ===================== SHOP ===================== */

  if (interaction.commandName === "shop") {
    const eventKey =
      interaction.options.getString("event", true);

    const p = await getPlayer(interaction.user.id);

    return interaction.reply({
      embeds: [shopEmbed(eventKey, p)],
      components: shopButtons(eventKey, p),
      ephemeral: true,
    });
  }


  /* ===================== LEADERBOARD (PAGES) ===================== */

  if (interaction.commandName === "leaderboard") {
    const eventKey =
      interaction.options.getString("event", true);

    const rows = await getTopPlayers(eventKey, 1000);

    const entries = [];

    for (const r of rows) {
      let name = r.userId;

      try {
        const m =
          await interaction.guild.members.fetch(r.userId);

        name =
          safeName(
            m?.displayName ||
            m?.user?.username ||
            r.userId
          );
      } catch {}

      entries.push({
        name,
        score: r.score,
      });
    }

    const pages = chunk(entries, 10);

    const page = 0;
    const maxPage = pages.length || 1;

    return interaction.reply({
      embeds: [
        leaderboardEmbed(
          eventKey,
          pages[0] || [],
          page,
          maxPage
        ),
      ],
      ephemeral: false,
    });
  }


  /* ===================== DAILY ===================== */

  if (interaction.commandName === "dailyclaim") {
    const p = await getPlayer(interaction.user.id);

    const now = Date.now();

    if (now - p.bleach.lastDaily < DAILY_COOLDOWN_MS) {
      const hrs = Math.ceil(
        (DAILY_COOLDOWN_MS -
          (now - p.bleach.lastDaily)) /
          3600000
      );

      return interaction.reply({
        content: `⏳ Come back in ${hrs}h.`,
        ephemeral: true,
      });
    }

    const amount = hasBoosterRole(interaction.member)
      ? DAILY_BOOSTER
      : DAILY_NORMAL;

    p.bleach.reiatsu += amount;
    p.bleach.lastDaily = now;

    await setPlayer(interaction.user.id, p);

    return interaction.reply({
      content: `🎁 +${E_REIATSU} ${amount}`,
    });
  }


  /* ===================== GIVE ===================== */

  if (interaction.commandName === "give_reatsu") {
    const target =
      interaction.options.getUser("user", true);

    const amount =
      interaction.options.getInteger("amount", true);

    if (target.bot || target.id === interaction.user.id) {
      return interaction.reply({
        content: "❌ Invalid target.",
        ephemeral: true,
      });
    }

    const sender =
      await getPlayer(interaction.user.id);

    const receiver =
      await getPlayer(target.id);

    if (sender.bleach.reiatsu < amount) {
      return interaction.reply({
        content: "❌ Not enough Reiatsu.",
        ephemeral: true,
      });
    }

    sender.bleach.reiatsu -= amount;
    receiver.bleach.reiatsu += amount;

    await setPlayer(interaction.user.id, sender);
    await setPlayer(target.id, receiver);

    return interaction.reply({
      content:
        `${E_REIATSU} ${amount} sent to ${safeName(
          target.username
        )}`,
    });
  }


  /* ===================== EXCHANGE ===================== */

  if (interaction.commandName === "exchange_drako") {
    const eventKey =
      interaction.options.getString("event", true);

    const drako =
      interaction.options.getInteger("drako", true);

    const p = await getPlayer(interaction.user.id);

    const rate =
      eventKey === "bleach"
        ? DRAKO_RATE_BLEACH
        : DRAKO_RATE_JJK;

    const cost = drako * rate;

    const cur =
      eventKey === "bleach" ? E_REIATSU : E_CE;

    const balance =
      eventKey === "bleach"
        ? p.bleach.reiatsu
        : p.jjk.cursedEnergy;

    if (balance < cost) {
      return interaction.reply({
        content:
          `❌ Need ${cur} ${cost}\n` +
          `Rate: ${rate} = 1 ${E_DRAKO}`,
        ephemeral: true,
      });
    }

    if (eventKey === "bleach") {
      p.bleach.reiatsu -= cost;
    } else {
      p.jjk.cursedEnergy -= cost;
    }

    p.drako += drako;

    await setPlayer(interaction.user.id, p);

    return interaction.reply({
      content:
        `✅ Exchanged!\n` +
        `${cur} ${cost} → ${E_DRAKO} ${drako}\n` +
        `Rate: ${rate} = 1`,
    });
  }


  /* ===================== SPAWN BOSS ===================== */

  if (interaction.commandName === "spawnboss") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({
        content: "⛔ No permission.",
        ephemeral: true,
      });
    }

    const bossId =
      interaction.options.getString("boss", true);

    const def = BOSSES[bossId];

    if (!def) {
      return interaction.reply({
        content: "❌ Unknown boss.",
        ephemeral: true,
      });
    }

    await spawnBoss(channel, bossId, true);

    return interaction.reply({
      content: `✅ ${def.name} spawned.`,
      ephemeral: true,
    });
  }


  /* ===================== SPAWN MOB ===================== */

  if (interaction.commandName === "spawnmob") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({
        content: "⛔ No permission.",
        ephemeral: true,
      });
    }

    const eventKey =
      interaction.options.getString("event", true);

    await spawnMob(channel, eventKey, {
      bleachChannelId: BLEACH_CHANNEL_ID,
      jjkChannelId: JJK_CHANNEL_ID,
      withPing: true,
    });

    return interaction.reply({
      content: "✅ Mob spawned.",
      ephemeral: true,
    });
  }


  /* ===================== WARDROBE ===================== */

  if (interaction.commandName === "wardrobe") {
    const p = await getPlayer(interaction.user.id);

    const member =
      await interaction.guild.members.fetch(
        interaction.user.id
      );

    return interaction.reply({
      embeds: [wardrobeEmbed(interaction.guild, p)],
      components: wardrobeComponents(
        interaction.guild,
        member,
        p
      ),
      ephemeral: true,
    });
  }
};
