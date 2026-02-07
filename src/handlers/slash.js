const {
  EVENT_ROLE_IDS,
  E_REIATSU,
  BOSSES,
  PING_BOSS_ROLE_ID,
  PING_HOLLOW_ROLE_ID,
  DAILY_COOLDOWN_MS,
  DAILY_NORMAL,
  DAILY_BOOSTER,
  BOOSTER_ROLE_ID,
  SHOP_COSMETIC_ROLE_ID,
} = require("../config");

const { inventoryEmbed, leaderboardEmbed, shopEmbed } = require("../embeds");
const { shopButtons } = require("../components");
const { spawnBoss } = require("../events/boss");
const { spawnHollow } = require("../events/hollow");
const { startClash } = require("../events/clash");

function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }

function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
}

function hasBoosterRole(member) {
  return !!member?.roles?.cache?.has(BOOSTER_ROLE_ID);
}

/* ===================== SHOP ===================== */
const SHOP_ITEMS = [
  { key: "zanpakuto_basic", name: "Zanpakutō (basic)", price: 350, desc: `+4% survive vs bosses • +5% drop luck` },
  { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: `+7% survive vs bosses • +10% drop luck` },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: `+9% survive vs bosses • +6% drop luck` },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: `${E_REIATSU} +25% Reiatsu rewards • +2% survive vs bosses` },
  { key: "cosmetic_role", name: "Sousuke Aizen role", price: 6000, desc: "Cosmetic Discord role (no stats).", roleId: SHOP_COSMETIC_ROLE_ID },
];

function calcItemSurvivalBonus(items) {
  let bonus = 0;
  if (items.zanpakuto_basic) bonus += 4;
  if (items.hollow_mask_fragment) bonus += 7;
  if (items.soul_reaper_cloak) bonus += 9;
  if (items.reiatsu_amplifier) bonus += 2;
  return bonus;
}
function calcReiatsuMultiplier(items) {
  return items.reiatsu_amplifier ? 1.25 : 1.0;
}
function calcDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.zanpakuto_basic) mult += 0.05;
  if (items.hollow_mask_fragment) mult += 0.10;
  if (items.soul_reaper_cloak) mult += 0.06;
  return mult;
}

async function handleSlash(interaction, state) {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) {
    return interaction.reply({ content: "❌ Use commands in a text channel.", ephemeral: true });
  }

  const players = state.players;

  if (interaction.commandName === "spawn_boss") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
    }
    const bossKey = interaction.options.getString("boss", true);
    const cfg = BOSSES[bossKey];
    if (!cfg) return interaction.reply({ content: "❌ Unknown boss.", ephemeral: true });

    await interaction.reply({ content: `✅ Boss spawned: **${cfg.name}**`, ephemeral: true });
    await spawnBoss(channel, cfg, state.bossByChannel, players, PING_BOSS_ROLE_ID);
    return;
  }

  if (interaction.commandName === "spawn_hollowling") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
    }
    await interaction.reply({ content: "✅ Hollow spawned.", ephemeral: true });
    await spawnHollow(channel, state.hollowByChannel, players, PING_HOLLOW_ROLE_ID);
    return;
  }

  if (interaction.commandName === "reatsu") {
    const target = interaction.options.getUser("user") || interaction.user;
    const p = await players.get(target.id);
    return interaction.reply({ content: `${E_REIATSU} **${safeName(target.username)}** has **${p.reiatsu} Reiatsu**.`, ephemeral: false });
  }

  if (interaction.commandName === "inventory") {
    const p = await players.get(interaction.user.id);
    return interaction.reply({
      embeds: [inventoryEmbed(p, calcItemSurvivalBonus, calcReiatsuMultiplier, calcDropLuckMultiplier)],
      ephemeral: true,
    });
  }

  if (interaction.commandName === "shop") {
    const p = await players.get(interaction.user.id);
    return interaction.reply({
      embeds: [shopEmbed(p, SHOP_ITEMS, calcDropLuckMultiplier)],
      components: shopButtons(p),
      ephemeral: true,
    });
  }

  if (interaction.commandName === "leaderboard") {
    const rows = await players.allTop(10);

    const entries = [];
    for (const r of rows) {
      let name = r.userId;
      try {
        const m = await interaction.guild.members.fetch(r.userId);
        name = safeName(m?.displayName || m?.user?.username || r.userId);
      } catch {}
      entries.push({ name, reiatsu: r.reiatsu });
    }
    return interaction.reply({ embeds: [leaderboardEmbed(entries)], ephemeral: false });
  }

  if (interaction.commandName === "give_reatsu") {
    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    if (amount < 50) return interaction.reply({ content: `❌ Minimum transfer is ${E_REIATSU} 50.`, ephemeral: true });
    if (target.bot) return interaction.reply({ content: "❌ You can't transfer to a bot.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't transfer to yourself.", ephemeral: true });

    const sender = await players.get(interaction.user.id);
    const receiver = await players.get(target.id);

    if (sender.reiatsu < amount) {
      return interaction.reply({ content: `❌ Not enough Reiatsu. You have ${sender.reiatsu}.`, ephemeral: true });
    }

    sender.reiatsu -= amount;
    receiver.reiatsu += amount;
    await players.set(interaction.user.id, sender);
    await players.set(target.id, receiver);

    return interaction.reply({
      content: `${E_REIATSU} **${safeName(interaction.user.username)}** sent **${amount} Reiatsu** to **${safeName(target.username)}**.`,
      ephemeral: false,
    });
  }

  if (interaction.commandName === "dailyclaim") {
    const p = await players.get(interaction.user.id);
    const now = Date.now();

    if (now - p.lastDaily < DAILY_COOLDOWN_MS) {
      const hrs = Math.ceil((DAILY_COOLDOWN_MS - (now - p.lastDaily)) / 3600000);
      return interaction.reply({ content: `⏳ Come back in **${hrs}h**.`, ephemeral: true });
    }

    const amount = hasBoosterRole(interaction.member) ? DAILY_BOOSTER : DAILY_NORMAL;
    p.reiatsu += amount;
    p.lastDaily = now;
    await players.set(interaction.user.id, p);

    return interaction.reply({ content: `🎁 You claimed **${E_REIATSU} ${amount} Reiatsu**!`, ephemeral: false });
  }

  if (interaction.commandName === "reatsu_clash") {
    return startClash(interaction, state, players);
  }
}

module.exports = { handleSlash, SHOP_ITEMS, calcDropLuckMultiplier };
