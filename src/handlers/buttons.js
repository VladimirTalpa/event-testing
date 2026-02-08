// src/handlers/buttons.js

const { bossByChannel, mobByChannel } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName } = require("../core/utils");

const {
  mobEmbed,
  shopEmbed,
  wardrobeEmbed,
  leaderboardEmbed,
} = require("../ui/embeds");

const {
  CID,
  mobButtons,
  shopButtons,
  wardrobeComponents,
  leaderboardButtons,
} = require("../ui/components");

const { MOBS } = require("../data/mobs");
const {
  BLEACH_SHOP_ITEMS,
  JJK_SHOP_ITEMS,
} = require("../data/shop");


/* ===================== ROLE ===================== */

async function tryGiveRole(guild, userId, roleId) {
  try {
    const bot = await guild.members.fetchMe();

    if (!bot.permissions.has("ManageRoles")) {
      return { ok: false, reason: "No permission" };
    }

    const role = guild.roles.cache.get(roleId);

    if (!role) return { ok: false, reason: "Role not found" };

    if (bot.roles.highest.position <= role.position) {
      return { ok: false, reason: "Role hierarchy" };
    }

    const member = await guild.members.fetch(userId);

    await member.roles.add(roleId);

    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord error" };
  }
}


/* ===================== HELPERS ===================== */

function chunk(arr, size) {
  const out = [];

  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }

  return out;
}


/* ===================== MAIN ===================== */

module.exports = async function handleButtons(interaction) {
  try {
    await interaction.deferUpdate();
  } catch {}

  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  const cid = interaction.customId;


  /* ===================== LEADERBOARD PAGES ===================== */

  if (cid.startsWith("lb_")) {
    const parts = cid.split(":");
    // lb:event:page

    const eventKey = parts[1];
    const page = Number(parts[2]) || 0;

    const rows = await require("../core/players")
      .getTopPlayers(eventKey, 1000);

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
    const maxPage = pages.length || 1;

    const fixed = Math.max(
      0,
      Math.min(page, maxPage - 1)
    );

    return interaction.editReply({
      embeds: [
        leaderboardEmbed(
          eventKey,
          pages[fixed] || [],
          fixed,
          maxPage
        ),
      ],
      components: leaderboardButtons(
        eventKey,
        fixed,
        maxPage
      ),
    });
  }


  /* ===================== BOSS JOIN ===================== */

  if (cid === CID.BOSS_JOIN) {
    const boss = bossByChannel.get(channel.id);

    if (!boss || !boss.joining) {
      return interaction.followUp({
        content: "❌ No boss.",
        ephemeral: true,
      });
    }

    const uid = interaction.user.id;

    if (boss.participants.has(uid)) {
      return interaction.followUp({
        content: "⚠️ Already joined.",
        ephemeral: true,
      });
    }

    boss.participants.set(uid, {
      hits: 0,
      displayName:
        interaction.member?.displayName ||
        interaction.user.username,
    });

    return interaction.followUp({
      content: "✅ Joined!",
      ephemeral: true,
    });
  }


  /* ===================== MOB ATTACK ===================== */

  if (cid.startsWith(`${CID.MOB_ATTACK}:`)) {
    const eventKey = cid.split(":")[1];

    const state = mobByChannel.get(channel.id);

    if (!state || state.resolved) {
      return interaction.followUp({
        content: "❌ No mob.",
        ephemeral: true,
      });
    }

    if (state.attackers.has(interaction.user.id)) {
      return interaction.followUp({
        content: "⚠️ Already attacked.",
        ephemeral: true,
      });
    }

    state.attackers.set(interaction.user.id, {
      displayName:
        interaction.member?.displayName ||
        interaction.user.username,
    });

    const msg = await channel.messages.fetch(
      state.messageId
    ).catch(() => null);

    if (msg) {
      await msg.edit({
        embeds: [
          mobEmbed(
            eventKey,
            state.attackers.size,
            MOBS[eventKey]
          ),
        ],
        components: mobButtons(eventKey, false),
      });
    }

    return interaction.followUp({
      content: "⚔️ Attack!",
      ephemeral: true,
    });
  }


  /* ===================== SHOP ===================== */

  if (cid.startsWith("buy_")) {
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

    let eventKey = null;
    let key = null;

    if (bleachMap[cid]) {
      eventKey = "bleach";
      key = bleachMap[cid];
    }

    if (jjkMap[cid]) {
      eventKey = "jjk";
      key = jjkMap[cid];
    }

    if (!key) {
      return interaction.followUp({
        content: "❌ Unknown item.",
        ephemeral: true,
      });
    }

    const items =
      eventKey === "bleach"
        ? BLEACH_SHOP_ITEMS
        : JJK_SHOP_ITEMS;

    const item = items.find((i) => i.key === key);

    if (!item) return;

    const inv =
      eventKey === "bleach"
        ? p.bleach.items
        : p.jjk.items;

    if (inv[key]) {
      return interaction.followUp({
        content: "✅ Already owned.",
        ephemeral: true,
      });
    }

    if (eventKey === "bleach") {
      if (p.bleach.reiatsu < item.price) {
        return interaction.followUp({
          content: "❌ Not enough Reiatsu.",
          ephemeral: true,
        });
      }

      p.bleach.reiatsu -= item.price;
      inv[key] = true;
    } else {
      if (p.jjk.cursedEnergy < item.price) {
        return interaction.followUp({
          content: "❌ Not enough CE.",
          ephemeral: true,
        });
      }

      p.jjk.cursedEnergy -= item.price;
      inv[key] = true;
    }

    await setPlayer(interaction.user.id, p);

    const msg = await channel.messages.fetch(
      interaction.message.id
    ).catch(() => null);

    if (msg) {
      await msg.edit({
        embeds: [shopEmbed(eventKey, p)],
        components: shopButtons(eventKey, p),
      });
    }

    return interaction.followUp({
      content: "✅ Purchased!",
      ephemeral: true,
    });
  }
};
