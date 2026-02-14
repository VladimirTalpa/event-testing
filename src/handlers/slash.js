const cfg = require("../config");
const { getPlayer, setPlayer } = require("../core/players");
const { clampInt } = require("../core/utils");
const { balanceEmbed, shopEmbed, inventoryEmbed, baseEmbed } = require("../ui/embeds");
const { closeRow, rowOf } = require("../ui/components");
const { ButtonBuilder, ButtonStyle } = require("discord.js");

const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");
const { BOSSES } = require("../data/bosses");
const { activeBossByChannel, activeMobByChannel } = require("../core/state");

function isEventStaff(member) {
  return cfg.EVENT_ROLE_IDS.some((rid) => member.roles.cache.has(rid));
}

function channelMatchesEvent(interaction, eventKey) {
  if (eventKey === "bleach") return interaction.channelId === cfg.BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return interaction.channelId === cfg.JJK_CHANNEL_ID;
  return true;
}

module.exports = async function handleSlash(interaction) {
  const { commandName } = interaction;

  if (commandName === "balance") {
    const user = interaction.options.getUser("user") || interaction.user;
    const p = await getPlayer(user.id);
    return interaction.reply({ embeds: [balanceEmbed(user, p)], components: [closeRow()], ephemeral: true });
  }

  if (commandName === "inventory") {
    const eventKey = interaction.options.getString("event");
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({
      embeds: [inventoryEmbed(eventKey, interaction.user, p)],
      components: [closeRow()],
      ephemeral: true
    });
  }

  if (commandName === "shop") {
    const eventKey = interaction.options.getString("event");
    const items = eventKey === "bleach" ? BLEACH_SHOP_ITEMS : JJK_SHOP_ITEMS;

    // buttons: buy item 1..n
    const buyButtons = items.slice(0, 4).map((it) =>
      new ButtonBuilder()
        .setCustomId(`shop:buy:${eventKey}:${it.id}`)
        .setLabel(`Buy: ${it.name}`.slice(0, 80))
        .setStyle(ButtonStyle.Primary)
    );

    const rows = [];
    if (buyButtons.length) rows.push(rowOf(...buyButtons));
    rows.push(closeRow());

    return interaction.reply({
      embeds: [shopEmbed(eventKey, items)],
      components: rows,
      ephemeral: true
    });
  }

  if (commandName === "leaderboard") {
    // In part3 we will implement persistent lb list.
    const eventKey = interaction.options.getString("event");
    const e = baseEmbed(`Leaderboard (${eventKey})`).setDescription("Leaderboard index will be enabled in Part 3.");
    return interaction.reply({ embeds: [e], components: [closeRow()], ephemeral: true });
  }

  if (commandName === "give") {
    const currency = interaction.options.getString("currency");
    const amount = clampInt(interaction.options.getInteger("amount"), 1, 1_000_000);
    const target = interaction.options.getUser("user");
    if (target.bot) return interaction.reply({ content: "You can't send currency to a bot.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "You can't send currency to yourself.", ephemeral: true });

    const sender = await getPlayer(interaction.user.id);
    const receiver = await getPlayer(target.id);

    // read balance / write balance
    const canPay = (() => {
      if (currency === "drako") return sender.drako >= amount;
      if (currency === "reiatsu") return sender.bleach.reiatsu >= amount;
      if (currency === "cursed_energy") return sender.jjk.cursedEnergy >= amount;
      return false;
    })();

    if (!canPay) return interaction.reply({ content: "Not enough balance.", ephemeral: true });

    if (currency === "drako") {
      sender.drako -= amount;
      receiver.drako += amount;
    } else if (currency === "reiatsu") {
      sender.bleach.reiatsu -= amount;
      receiver.bleach.reiatsu += amount;
    } else if (currency === "cursed_energy") {
      sender.jjk.cursedEnergy -= amount;
      receiver.jjk.cursedEnergy += amount;
    }

    await setPlayer(interaction.user.id, sender);
    await setPlayer(target.id, receiver);

    return interaction.reply({
      content: `✅ Sent **${amount} ${currency}** to <@${target.id}>.`,
      ephemeral: true,
      components: [closeRow()]
    });
  }

  if (commandName === "exchange_drako") {
    const eventKey = interaction.options.getString("event"); // "bleach" or "jjk"
    const drako = clampInt(interaction.options.getInteger("drako"), 1, 1_000_000);
    const p = await getPlayer(interaction.user.id);

    if (eventKey === "bleach") {
      const cost = drako * cfg.DRAKO_RATE_BLEACH;
      if (p.bleach.reiatsu < cost) return interaction.reply({ content: `Not enough Reiatsu. Need ${cost}.`, ephemeral: true });
      p.bleach.reiatsu -= cost;
      p.drako += drako;
    } else {
      const cost = drako * cfg.DRAKO_RATE_JJK;
      if (p.jjk.cursedEnergy < cost) return interaction.reply({ content: `Not enough Cursed Energy. Need ${cost}.`, ephemeral: true });
      p.jjk.cursedEnergy -= cost;
      p.drako += drako;
    }

    await setPlayer(interaction.user.id, p);
    return interaction.reply({ content: `✅ Bought **${drako} Drako**.`, ephemeral: true, components: [closeRow()] });
  }

  if (commandName === "spawnboss") {
    if (!isEventStaff(interaction.member)) {
      return interaction.reply({ content: "No permission.", ephemeral: true });
    }

    const bossId = interaction.options.getString("boss");
    const boss = BOSSES[bossId];
    if (!boss) return interaction.reply({ content: "Boss not found.", ephemeral: true });

    if (!channelMatchesEvent(interaction, boss.event)) {
      return interaction.reply({ content: "Wrong channel for this event.", ephemeral: true });
    }

    // only 1 active boss per channel
    if (activeBossByChannel.get(interaction.channelId)) {
      return interaction.reply({ content: "There is already an active boss in this channel.", ephemeral: true });
    }

    const state = {
      id: boss.id,
      name: boss.name,
      event: boss.event,
      emoji: boss.emoji,
      rounds: boss.rounds,
      round: 1,
      aliveUserIds: new Set(),
      deadUserIds: new Set(),
      startedAt: Date.now()
    };

    activeBossByChannel.set(interaction.channelId, state);

    const joinBtn = new ButtonBuilder().setCustomId("boss:join").setLabel("Join").setStyle(ButtonStyle.Success);
    const hitBtn = new ButtonBuilder().setCustomId("boss:hit").setLabel("Hit").setStyle(ButtonStyle.Primary);
    const nextBtn = new ButtonBuilder().setCustomId("boss:next").setLabel("Next Round").setStyle(ButtonStyle.Secondary);
    const endBtn = new ButtonBuilder().setCustomId("boss:end").setLabel("End").setStyle(ButtonStyle.Danger);

    const pingRole = boss.event === "bleach" ? cfg.PING_BOSS_ROLE_ID : cfg.PING_HOLLOW_ROLE_ID;

    await interaction.reply({
      content: `<@&${pingRole}> **Boss spawned:** ${boss.emoji} **${boss.name}**`,
      components: [rowOf(joinBtn, hitBtn, nextBtn, endBtn)]
    });
    return;
  }

  if (commandName === "spawnmob") {
    if (!isEventStaff(interaction.member)) {
      return interaction.reply({ content: "No permission.", ephemeral: true });
    }

    const eventKey = interaction.options.getString("event");
    if (!channelMatchesEvent(interaction, eventKey)) {
      return interaction.reply({ content: "Wrong channel for this event.", ephemeral: true });
    }

    if (activeMobByChannel.get(interaction.channelId)) {
      return interaction.reply({ content: "There is already an active mob in this channel.", ephemeral: true });
    }

    const state = {
      event: eventKey,
      hp: 100,
      hits: 0,
      startedAt: Date.now()
    };

    activeMobByChannel.set(interaction.channelId, state);

    const hitBtn = new ButtonBuilder().setCustomId("mob:hit").setLabel("Hit Mob").setStyle(ButtonStyle.Primary);
    const endBtn = new ButtonBuilder().setCustomId("mob:end").setLabel("End").setStyle(ButtonStyle.Danger);

    await interaction.reply({
      content: `🐺 **Mob spawned** (${eventKey}). Hit it for currency bonus!`,
      components: [rowOf(hitBtn, endBtn)]
    });
    return;
  }

  if (commandName === "dailyclaim") {
    // implemented in Part 3 to avoid half-logic
    return interaction.reply({ content: "DailyClaim will be enabled in Part 3.", ephemeral: true, components: [closeRow()] });
  }

  if (commandName === "titles") {
    return interaction.reply({ content: "Titles menu will be enabled in Part 3.", ephemeral: true, components: [closeRow()] });
  }

  if (commandName === "pvpclash") {
    return interaction.reply({ content: "PvP Clash will be enabled in Part 3.", ephemeral: true, components: [closeRow()] });
  }

  if (commandName === "adminadd") {
    return interaction.reply({ content: "AdminAdd will be enabled in Part 3.", ephemeral: true, components: [closeRow()] });
  }
};
