// src/handlers/buttons.js

const { bossByChannel, mobByChannel } = require("../core/state");
const { getPlayer, setPlayer, getTopPlayers } = require("../core/players");

const { safeName } = require("../core/utils");

const {
  mobEmbed,
  shopEmbed,
  inventoryEmbed,
  leaderboardEmbed,
} = require("../ui/embeds");

const {
  CID,
  mobButtons,
  shopButtons,
} = require("../ui/components");

const { MOBS } = require("../data/mobs");
const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");


/* ================= LEADERBOARD CACHE ================= */

const leaderboardCache = new Map();


/* ================= ROLE HELP ================= */

async function tryGiveRole(guild, userId, roleId) {

  try {

    const bot = await guild.members.fetchMe();

    if (!bot.permissions.has("ManageRoles"))
      return { ok: false };

    const role = guild.roles.cache.get(roleId);

    if (!role) return { ok: false };

    if (bot.roles.highest.position <= role.position)
      return { ok: false };

    const member = await guild.members.fetch(userId);

    await member.roles.add(roleId);

    return { ok: true };

  } catch {
    return { ok: false };
  }
}


/* ================= MAIN ================= */

module.exports = async function handleButtons(interaction) {

  try { await interaction.deferUpdate(); } catch {}

  const channel = interaction.channel;

  if (!channel || !channel.isTextBased()) return;


  const id = interaction.customId;


  /* ================= LEADERBOARD ================= */

  if (id.startsWith("lb_")) {

    // lb_bleach_0_next

    const parts = id.split("_");

    const event = parts[1];
    let page = Number(parts[2]);
    const dir = parts[3];


    if (!leaderboardCache.has(event)) {

      const rows = await getTopPlayers(event, 9999);

      const fixed = [];

      for (const r of rows) {

        let name = r.userId;

        try {
          const m = await interaction.guild.members.fetch(r.userId);

          name =
            safeName(m.displayName || m.user.username);

        } catch {}

        fixed.push({
          name,
          score: r.score,
        });
      }

      leaderboardCache.set(event, fixed);
    }


    const list = leaderboardCache.get(event);

    if (dir === "next") page++;
    if (dir === "prev") page--;


    if (page < 0) page = 0;


    const max = Math.floor((list.length - 1) / 10);

    if (page > max) page = max;


    const row = {

      type: 1,

      components: [

        {
          type: 2,
          style: 2,
          label: "◀",
          custom_id: `lb_${event}_${page}_prev`,
        },

        {
          type: 2,
          style: 2,
          label: "▶",
          custom_id: `lb_${event}_${page}_next`,
        },

      ],
    };


    await interaction.editReply({

      embeds: [
        leaderboardEmbed(event, list, page),
      ],

      components: [row],
    });

    return;
  }


  /* ================= BOSS ================= */

  if (id === CID.BOSS_JOIN) {

    const boss = bossByChannel.get(channel.id);

    if (!boss || !boss.joining) return;

    const uid = interaction.user.id;

    if (boss.participants.has(uid)) return;


    boss.participants.set(uid, {

      hits: 0,

      displayName:
        interaction.member?.displayName ||
        interaction.user.username,
    });


    return;
  }


  /* ================= MOB ================= */

  if (id.startsWith(`${CID.MOB_ATTACK}:`)) {

    const event = id.split(":")[1];

    const state = mobByChannel.get(channel.id);

    if (!state || state.resolved) return;


    const uid = interaction.user.id;

    if (state.attackers.has(uid)) return;


    state.attackers.set(uid, {

      displayName:
        interaction.member?.displayName ||
        interaction.user.username,
    });


    const mob = MOBS[event];


    const msg = await channel.messages
      .fetch(state.messageId)
      .catch(() => null);


    if (msg) {

      await msg.edit({

        embeds: [
          mobEmbed(event, state.attackers.size, mob),
        ],

        components: mobButtons(event, false),
      });
    }

    return;
  }


  /* ================= SHOP ================= */

  if (id.startsWith("buy_")) {

    const p = await getPlayer(interaction.user.id);


    const bleachMap = {
      buy_bleach_zanpakuto_basic: "zanpakuto_basic",
      buy_bleach_hollow_mask_fragment: "hollow_mask_fragment",
      buy_bleach_soul_reaper_cloak: "soul_reaper_cloak",
      buy_bleach_reiatsu_amplifier: "reiatsu_amplifier",
      buy_bleach_cosmetic_role: "cosmetic_role",
    };

    const jjkMap = {
      buy_jjk_black_flash_manual: "black_flash_manual",
      buy_jjk_domain_charm: "domain_charm",
      buy_jjk_cursed_tool: "cursed_tool",
      buy_jjk_reverse_talisman: "reverse_talisman",
      buy_jjk_binding_vow_seal: "binding_vow_seal",
    };


    let event = null;
    let key = null;


    if (bleachMap[id]) {
      event = "bleach";
      key = bleachMap[id];
    }

    if (jjkMap[id]) {
      event = "jjk";
      key = jjkMap[id];
    }


    if (!event) return;


    const items =
      event === "bleach"
        ? BLEACH_SHOP_ITEMS
        : JJK_SHOP_ITEMS;


    const item = items.find(i => i.key === key);

    if (!item) return;


    const inv =
      event === "bleach"
        ? p.bleach.items
        : p.jjk.items;


    if (inv[key]) return;


    if (event === "bleach") {

      if (p.bleach.reiatsu < item.price) return;

      p.bleach.reiatsu -= item.price;

      inv[key] = true;

    } else {

      if (p.jjk.cursedEnergy < item.price) return;

      p.jjk.cursedEnergy -= item.price;

      inv[key] = true;
    }


    await setPlayer(interaction.user.id, p);


    const msg = await channel.messages
      .fetch(interaction.message.id)
      .catch(() => null);


    if (msg) {

      await msg.edit({

        embeds: [
          shopEmbed(event, p),
        ],

        components: shopButtons(event, p),
      });
    }

    return;
  }

};
