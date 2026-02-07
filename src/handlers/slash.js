
const cfg = require("../config");
const { safeName } = require("../utils");
const { getPlayer, setPlayer, getTopPlayers } = require("../players");
const embeds = require("../embeds");
const { spawnBoss } = require("../events/boss");
const { spawnHollow } = require("../events/hollow");
const { startClash } = require("../events/clash");
const { PermissionsBitField } = require("discord.js");

// shop (same as before)
const SHOP_ITEMS = [
  { key: "zanpakuto_basic", name: "Zanpakutō (basic)", price: 350, desc: `+4% survive vs ${cfg.BOSS_NAME} • +5% drop luck` },
  { key: "hollow_mask_fragment", name: "Hollow Mask Fragment", price: 900, desc: `+7% survive vs ${cfg.BOSS_NAME} • +10% drop luck` },
  { key: "soul_reaper_cloak", name: "Soul Reaper Cloak", price: 1200, desc: `+9% survive vs ${cfg.BOSS_NAME} • +6% drop luck` },
  { key: "reiatsu_amplifier", name: "Reiatsu Amplifier", price: 1500, desc: `${cfg.E_REIATSU} +25% Reiatsu rewards • +2% survive vs ${cfg.BOSS_NAME}` },
  { key: "cosmetic_role", name: "Sousuke Aizen role", price: 6000, desc: "Cosmetic Discord role (no stats).", roleId: cfg.SHOP_COSMETIC_ROLE_ID },
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

function inventoryEmbed(player) {
  const inv = player.items;
  const itemBonus = calcItemSurvivalBonus(inv);
  const mult = calcReiatsuMultiplier(inv);
  return new (require("discord.js").EmbedBuilder)()
    .setColor(cfg.COLOR)
    .setTitle("🎒 Inventory")
    .setDescription(
      [
        `${cfg.E_REIATSU} Reiatsu: **${player.reiatsu}**`,
        `${cfg.E_VASTO} Permanent boss bonus: **${player.survivalBonus}% / ${cfg.BONUS_MAX}%**`,
        `🛡 Item boss bonus: **${itemBonus}%**`,
        `🍀 Drop luck: **x${calcDropLuckMultiplier(inv).toFixed(2)}**`,
        `💰 Reiatsu multiplier: **x${mult}**`,
        "",
        `• Zanpakutō: ${inv.zanpakuto_basic ? "✅" : "❌"}`,
        `• Mask Fragment: ${inv.hollow_mask_fragment ? "✅" : "❌"}`,
        `• Cloak: ${inv.soul_reaper_cloak ? "✅" : "❌"}`,
        `• Amplifier: ${inv.reiatsu_amplifier ? "✅" : "❌"}`,
        `• Sousuke Aizen role: ${inv.cosmetic_role ? "✅" : "❌"}`,
      ].join("\n")
    );
}

function shopEmbed(player) {
  const inv = player.items;
  const lines = SHOP_ITEMS.map((it) => {
    const owned = inv[it.key] ? "✅ Owned" : `${cfg.E_REIATSU} ${it.price} Reiatsu`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });
  return new (require("discord.js").EmbedBuilder)()
    .setColor(cfg.COLOR)
    .setTitle("🛒 Shop")
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: `${cfg.E_REIATSU} Your Reiatsu`, value: `\`${player.reiatsu}\``, inline: true },
      { name: `${cfg.E_VASTO} Boss bonus`, value: `\`${player.survivalBonus}% / ${cfg.BONUS_MAX}%\``, inline: true }
    );
}

function shopButtons(player) {
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
  const inv = player.items;

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_zanpakuto_basic").setLabel("Buy Zanpakutō").setStyle(ButtonStyle.Secondary).setDisabled(inv.zanpakuto_basic),
    new ButtonBuilder().setCustomId("buy_hollow_mask_fragment").setLabel("Buy Mask Fragment").setStyle(ButtonStyle.Secondary).setDisabled(inv.hollow_mask_fragment),
    new ButtonBuilder().setCustomId("buy_soul_reaper_cloak").setLabel("Buy Cloak").setStyle(ButtonStyle.Secondary).setDisabled(inv.soul_reaper_cloak)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("buy_reiatsu_amplifier").setLabel("Buy Amplifier").setStyle(ButtonStyle.Secondary).setDisabled(inv.reiatsu_amplifier),
    new ButtonBuilder().setCustomId("buy_cosmetic_role").setLabel("Buy Sousuke Aizen role").setStyle(ButtonStyle.Danger).setDisabled(inv.cosmetic_role)
  );
  return [row1, row2];
}

function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return cfg.EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
}
function hasBoosterRole(member) {
  return !!member?.roles?.cache?.has(cfg.BOOSTER_ROLE_ID);
}

async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return { ok: false, reason: "Bot has no Manage Roles permission." };
    }
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role add (permissions/hierarchy)." };
  }
}

module.exports = async function handleSlash(interaction) {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) {
    return interaction.reply({ content: "❌ Use commands in a text channel.", ephemeral: true });
  }

  if (interaction.commandName === "spawn_hollow") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
    }
    await interaction.reply({ content: "✅ Hollow spawned.", ephemeral: true });
    await spawnHollow(channel, true);
    return;
  }

  if (interaction.commandName === "spawn_boss") {
    if (!hasEventRole(interaction.member)) {
      return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
    }
    await interaction.reply({ content: `✅ ${cfg.E_VASTO} Boss spawned.`, ephemeral: true });
    await spawnBoss(channel, true);
    return;
  }

  if (interaction.commandName === "reatsu") {
    const target = interaction.options.getUser("user") || interaction.user;
    const p = await getPlayer(target.id);
    return interaction.reply({ content: `${cfg.E_REIATSU} **${safeName(target.username)}** has **${p.reiatsu} Reiatsu**.`, ephemeral: false });
  }

  if (interaction.commandName === "inventory") {
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({ embeds: [inventoryEmbed(p)], ephemeral: true });
  }

  if (interaction.commandName === "shop") {
    const p = await getPlayer(interaction.user.id);
    return interaction.reply({ embeds: [shopEmbed(p)], components: shopButtons(p), ephemeral: true });
  }

  if (interaction.commandName === "leaderboard") {
    const rows = await getTopPlayers(10);
    const entries = [];
    for (const r of rows) {
      let name = r.userId;
      try {
        const m = await interaction.guild.members.fetch(r.userId);
        name = safeName(m?.displayName || m?.user?.username || r.userId);
      } catch {}
      entries.push({ name, reiatsu: r.reiatsu });
    }
    return interaction.reply({ embeds: [embeds.leaderboardEmbed(entries)], ephemeral: false });
  }

  if (interaction.commandName === "give_reatsu") {
    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    if (amount < 50) return interaction.reply({ content: `❌ Minimum transfer is ${cfg.E_REIATSU} 50.`, ephemeral: true });
    if (target.bot) return interaction.reply({ content: "❌ You can't transfer to a bot.", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't transfer to yourself.", ephemeral: true });

    const sender = await getPlayer(interaction.user.id);
    const receiver = await getPlayer(target.id);

    if (sender.reiatsu < amount) {
      return interaction.reply({ content: `❌ Not enough Reiatsu. You have ${sender.reiatsu}.`, ephemeral: true });
    }

    sender.reiatsu -= amount;
    receiver.reiatsu += amount;
    await setPlayer(interaction.user.id, sender);
    await setPlayer(target.id, receiver);

    return interaction.reply({
      content: `${cfg.E_REIATSU} **${safeName(interaction.user.username)}** sent **${amount} Reiatsu** to **${safeName(target.username)}**.`,
      ephemeral: false,
    });
  }

  if (interaction.commandName === "dailyclaim") {
    const p = await getPlayer(interaction.user.id);
    const now = Date.now();

    if (now - p.lastDaily < cfg.DAILY_COOLDOWN_MS) {
      const hrs = Math.ceil((cfg.DAILY_COOLDOWN_MS - (now - p.lastDaily)) / 3600000);
      return interaction.reply({ content: `⏳ Come back in **${hrs}h**.`, ephemeral: true });
    }

    const amount = hasBoosterRole(interaction.member) ? cfg.DAILY_BOOSTER : cfg.DAILY_NORMAL;
    p.reiatsu += amount;
    p.lastDaily = now;
    await setPlayer(interaction.user.id, p);

    return interaction.reply({ content: `🎁 You claimed **${cfg.E_REIATSU} ${amount} Reiatsu**!`, ephemeral: false });
  }

  if (interaction.commandName === "reatsu_clash") {
    const opponent = interaction.options.getUser("user", true);
    const stake = interaction.options.getInteger("stake", true);

    if (opponent.bot) return interaction.reply({ content: "❌ You can't challenge a bot.", ephemeral: true });
    if (opponent.id === interaction.user.id) return interaction.reply({ content: "❌ You can't challenge yourself.", ephemeral: true });

    return startClash({ interaction, channel, opponent, stake });
  }
};
