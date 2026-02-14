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

const { spawnBoss } = require("../events/boss");
const { spawnMob } = require("../events/mob");
const { pvpById } = require("../core/state");

// UI
const {
  closeRow,
  profileTabsSelect,
  storeTabsSelect,
  packSelect,
} = require("../ui/components");

const {
  profileHomeEmbed,
  profileCurrencyEmbed,
  profileCardsEmbed,
  profileGearsEmbed,
  profileTitlesEmbed,
  profileLeaderboardEmbed,

  storeHomeEmbed,
  storeEventShopEmbed,
  storePacksEmbed,
  storeGearShopEmbed,
} = require("../ui/embeds");

const { getCardsSummaryText, getTitlesText } = require("../core/profile_helpers");
const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");

function isAllowedSpawnChannel(eventKey, channelId) {
  if (eventKey === "bleach") return channelId === BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return channelId === JJK_CHANNEL_ID;
  return false;
}

function walletFromPlayer(p) {
  return {
    reiatsu: p?.bleach?.reiatsu ?? 0,
    cursed_energy: p?.jjk?.cursedEnergy ?? 0,
    drako: p?.drako ?? 0,
  };
}

module.exports = async function handleSlash(interaction) {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) {
    return interaction.reply({ content: "❌ Use commands in a text channel.", ephemeral: true });
  }

  /* ===================== BALANCE (FIXED) ===================== */
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

  /* ===================== INVENTORY (оставил как было) ===================== */
  if (interaction.commandName === "inventory") {
    const eventKey = interaction.options.getString("event", true);
    const { inventoryEmbed } = require("../ui/old_embeds_inventory_shop"); // см. примечание ниже
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({ embeds: [inventoryEmbed(eventKey, p, BLEACH_BONUS_MAX, JJK_BONUS_MAX)], ephemeral: true });
  }

  /* ===================== SHOP (оставил как было) ===================== */
  if (interaction.commandName === "shop") {
    const eventKey = interaction.options.getString("event", true);
    const { shopEmbed } = require("../ui/old_embeds_inventory_shop");
    const { shopButtons } = require("../ui/old_components_shop_mob_boss");
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({
      embeds: [shopEmbed(eventKey, p)],
      components: [...shopButtons(eventKey, p), closeRow()],
      ephemeral: true,
    });
  }

  /* ===================== LEADERBOARD ===================== */
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

    const tag = eventKey === "bleach" ? "Bleach" : "JJK";
    const currency = eventKey === "bleach" ? E_REIATSU : E_CE;
    const text = entries.map((e, i) => `**#${i + 1}** — ${e.name}: **${currency} ${e.score}**`).join("\n") || "No data yet.";

    return interaction.reply({ embeds: [profileLeaderboardEmbed(tag, text)], components: [closeRow()], ephemeral: false });
  }

  /* ===================== DAILY CLAIM (FIXED) ===================== */
  if (interaction.commandName === "dailyclaim") {
    const p = await getPlayer(interaction.user.id);
    const now = Date.now();

    if (now - p.bleach.lastDaily < DAILY_COOLDOWN_MS) {
      const hrs = Math.ceil((DAILY_COOLDOWN_MS - (now - p.bleach.lastDaily)) / 3600000);
      return interaction.reply({ content: `⏳ Come back in **${hrs}h**.`, ephemeral: true });
    }

    const member = interaction.member;
    const boosterRoleId = require("../config").BOOSTER_ROLE_ID;
    const isBooster = !!member?.roles?.cache?.has(boosterRoleId);

    const amount = isBooster ? DAILY_BOOSTER : DAILY_NORMAL;
    p.bleach.reiatsu += amount;
    p.bleach.lastDaily = now;

    await setPlayer(interaction.user.id, p);
    return interaction.reply({ content: `🎁 You claimed **${E_REIATSU} ${amount} Reiatsu**!`, ephemeral: false });
  }

  /* ===================== GIVE ===================== */
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

  /* ===================== EXCHANGE DRAKO ===================== */
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
          `Now: ${currencyEmoji} **${p.bleach.reiatsu}** • ${E_DRAKO} **${p.drako}**`,
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
          `Now: ${currencyEmoji} **${p.jjk.cursedEnergy}** • ${E_DRAKO} **${p.drako}**`,
        ephemeral: false,
      });
    }
  }

  /* ===================== SPAWN BOSS ===================== */
  if (interaction.commandName === "spawnboss") {
    const allowedRoleIds = require("../config").EVENT_ROLE_IDS;
    const hasPerm = allowedRoleIds.some((rid) => interaction.member?.roles?.cache?.has(rid));
    if (!hasPerm) return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });

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

  /* ===================== SPAWN MOB ===================== */
  if (interaction.commandName === "spawnmob") {
    const allowedRoleIds = require("../config").EVENT_ROLE_IDS;
    const hasPerm = allowedRoleIds.some((rid) => interaction.member?.roles?.cache?.has(rid));
    if (!hasPerm) return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });

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

  /* ===================== /profile (NEW UI, красивый) ===================== */
  if (interaction.commandName === "profile") {
    return interaction.reply({
      embeds: [profileHomeEmbed(interaction.user)],
      components: [profileTabsSelect(), closeRow()],
      ephemeral: true,
    });
  }

  /* ===================== /store (NEW UI, красивый) ===================== */
  if (interaction.commandName === "store") {
    return interaction.reply({
      embeds: [storeHomeEmbed(interaction.user)],
      components: [storeTabsSelect(), closeRow()],
      ephemeral: true,
    });
  }

  /* ===================== /forge (пока заглушка, но работает) ===================== */
  if (interaction.commandName === "forge") {
    return interaction.reply({
      content: "🔨 Forge is coming next step: Craft Gear + Evolve Cards.\n(Кнопки сделаем после того как ты скажешь список рецептов/цен.)",
      components: [closeRow()],
      ephemeral: true,
    });
  }

  /* ===================== /pvpclash (оставил как было) ===================== */
  if (interaction.commandName === "pvpclash") {
    const currency = interaction.options.getString("currency", true);
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("user", true);

    if (target.bot) return interaction.reply({ content: "❌ You can't duel a bot.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't duel yourself.", ephemeral: true });
    if (amount < 1) return interaction.reply({ content: "❌ Amount must be >= 1.", ephemeral: true });

    const { pvpButtons } = require("../ui/old_components_shop_mob_boss");
    const key = `${channel.id}:${interaction.user.id}:${target.id}`;
    pvpById.set(key, { createdAt: Date.now(), done: false });

    return interaction.reply({
      content: `⚔️ <@${target.id}> you were challenged by <@${interaction.user.id}>!\nStake: **${amount} ${currency}**`,
      components: [...pvpButtons(currency, amount, interaction.user.id, target.id, false), closeRow()],
      ephemeral: false,
    });
  }

  /* ===================== ADMINADD ===================== */
  if (interaction.commandName === "adminadd") {
    const allowed = interaction.member?.roles?.cache?.has("1259865441405501571");
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
