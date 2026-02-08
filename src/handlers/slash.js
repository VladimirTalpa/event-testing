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


function allowed(event, id) {
  if (event === "bleach") return id === BLEACH_CHANNEL_ID;
  if (event === "jjk") return id === JJK_CHANNEL_ID;
  return false;
}


module.exports = async function handleSlash(interaction) {

  const channel = interaction.channel;

  if (!channel || !channel.isTextBased())
    return;


  /* ================= BALANCE ================= */

  if (interaction.commandName === "balance") {

    const u =
      interaction.options.getUser("user") ||
      interaction.user;

    const p = await getPlayer(u.id);


    return interaction.reply({

      content:

        `**${safeName(u.username)}**\n` +
        `${E_REIATSU} ${p.bleach.reiatsu}\n` +
        `${E_CE} ${p.jjk.cursedEnergy}\n` +
        `${E_DRAKO} ${p.drako}`,

    });
  }


  /* ================= INVENTORY ================= */

  if (interaction.commandName === "inventory") {

    const e =
      interaction.options.getString("event", true);

    const p =
      await getPlayer(interaction.user.id);


    return interaction.reply({

      embeds: [
        inventoryEmbed(e, p),
      ],

      ephemeral: true,
    });
  }


  /* ================= SHOP ================= */

  if (interaction.commandName === "shop") {

    const e =
      interaction.options.getString("event", true);

    const p =
      await getPlayer(interaction.user.id);


    return interaction.reply({

      embeds: [
        shopEmbed(e, p),
      ],

      components: shopButtons(e, p),

      ephemeral: true,
    });
  }


  /* ================= LEADERBOARD ================= */

  if (interaction.commandName === "leaderboard") {

    const e =
      interaction.options.getString("event", true);


    const rows =
      await getTopPlayers(e, 9999);


    const list = [];


    for (const r of rows) {

      let name = r.userId;

      try {

        const m =
          await interaction.guild.members.fetch(r.userId);

        name =
          safeName(
            m.displayName || m.user.username
          );

      } catch {}


      list.push({
        name,
        score: r.score,
      });
    }


    const row = {

      type: 1,

      components: [

        {
          type: 2,
          style: 2,
          label: "◀",
          custom_id: `lb_${e}_0_prev`,
        },

        {
          type: 2,
          style: 2,
          label: "▶",
          custom_id: `lb_${e}_0_next`,
        },
      ],
    };


    return interaction.reply({

      embeds: [
        leaderboardEmbed(e, list, 0),
      ],

      components: [row],
    });
  }


  /* ================= DAILY ================= */

  if (interaction.commandName === "dailyclaim") {

    const p =
      await getPlayer(interaction.user.id);

    const now = Date.now();


    if (now - p.bleach.lastDaily < DAILY_COOLDOWN_MS) {

      return interaction.reply({
        content: "⏳ Come later.",
        ephemeral: true,
      });
    }


    const add =
      hasBoosterRole(interaction.member)
        ? DAILY_BOOSTER
        : DAILY_NORMAL;


    p.bleach.reiatsu += add;
    p.bleach.lastDaily = now;


    await setPlayer(interaction.user.id, p);


    return interaction.reply({
      content: `🎁 +${add} Reiatsu`,
    });
  }


  /* ================= SPAWN BOSS ================= */

  if (interaction.commandName === "spawnboss") {

    if (!hasEventRole(interaction.member))
      return interaction.reply({
        content: "No permission",
        ephemeral: true,
      });


    const id =
      interaction.options.getString("boss", true);

    const def = BOSSES[id];

    if (!def) return;


    await interaction.reply({
      content: "✅ Boss spawned",
      ephemeral: true,
    });


    await spawnBoss(channel, id, true);

    return;
  }


  /* ================= SPAWN MOB ================= */

  if (interaction.commandName === "spawnmob") {

    if (!hasEventRole(interaction.member))
      return interaction.reply({
        content: "No permission",
        ephemeral: true,
      });


    const e =
      interaction.options.getString("event", true);


    if (!MOBS[e]) return;


    await interaction.reply({
      content: "✅ Mob spawned",
      ephemeral: true,
    });


    await spawnMob(channel, e, {
      bleachChannelId: BLEACH_CHANNEL_ID,
      jjkChannelId: JJK_CHANNEL_ID,
      withPing: true,
    });

    return;
  }


  /* ================= WARDROBE ================= */

  if (interaction.commandName === "wardrobe") {

    const p =
      await getPlayer(interaction.user.id);


    const m =
      await interaction.guild.members.fetch(
        interaction.user.id
      ).catch(() => null);


    if (!m) return;


    return interaction.reply({

      embeds: [
        wardrobeEmbed(interaction.guild, p),
      ],

      components:
        wardrobeComponents(
          interaction.guild,
          m,
          p
        ),

      ephemeral: true,
    });
  }

};
