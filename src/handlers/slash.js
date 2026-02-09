// src/handlers/slash.js
const {
  E_REIATSU,
  E_CE,
  E_DRAKO,
} = require("../config");

const { getPlayer, setPlayer } = require("../core/players");
const { buildBalanceEmbed, buildInventoryEmbed } = require("../ui/embeds");
const { buildShopMessage } = require("../ui/components");

module.exports = async function handleSlash(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const name = interaction.commandName;

  /* ===================== BALANCE ===================== */
  if (name === "balance") {
    const user = interaction.options.getUser("user") || interaction.user;
    const p = await getPlayer(user.id);

    return interaction.reply({
      embeds: [buildBalanceEmbed(user, p)],
      ephemeral: false,
    });
  }

  /* ===================== INVENTORY ===================== */
  if (name === "inventory") {
    const event = interaction.options.getString("event", true);
    const p = await getPlayer(interaction.user.id);

    return interaction.reply({
      embeds: [buildInventoryEmbed(interaction.user, p, event)],
      ephemeral: true,
    });
  }

  /* ===================== SHOP ===================== */
  if (name === "shop") {
    const event = interaction.options.getString("event", true);
    return interaction.reply(buildShopMessage(event, interaction.user.id));
  }

  /* ===================== GIVE ===================== */
  if (name === "give") {
    const currency = interaction.options.getString("currency", true);
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("user", true);

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "❌ You cannot give currency to yourself.", ephemeral: true });
    }

    const sender = await getPlayer(interaction.user.id);
    const receiver = await getPlayer(target.id);

    let senderBal, receiverBal;

    if (currency === "drako") {
      senderBal = sender.drako;
      if (senderBal < amount) return interaction.reply({ content: "❌ Not enough Drako.", ephemeral: true });
      sender.drako -= amount;
      receiver.drako += amount;
    }

    if (currency === "reiatsu") {
      senderBal = sender.bleach.reiatsu;
      if (senderBal < amount) return interaction.reply({ content: "❌ Not enough Reiatsu.", ephemeral: true });
      sender.bleach.reiatsu -= amount;
      receiver.bleach.reiatsu += amount;
    }

    if (currency === "cursed_energy") {
      senderBal = sender.jjk.cursedEnergy;
      if (senderBal < amount) return interaction.reply({ content: "❌ Not enough CE.", ephemeral: true });
      sender.jjk.cursedEnergy -= amount;
      receiver.jjk.cursedEnergy += amount;
    }

    await setPlayer(interaction.user.id, sender);
    await setPlayer(target.id, receiver);

    return interaction.reply({
      content: `✅ Sent **${amount}** to <@${target.id}>.`,
      ephemeral: false,
    });
  }

  /* ===================== ADMIN ADD ===================== */
  if (name === "adminadd") {
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
      content: `✅ Added **${amount}** ${currency} to <@${target.id}>.`,
      ephemeral: false,
    });
  }

  /* ===================== ADMIN REMOVE ===================== */
  if (name === "adminremove") {
    const allowed = interaction.member?.roles?.cache?.has("1259865441405501571");
    if (!allowed) return interaction.reply({ content: "⛔ No permission.", ephemeral: true });

    const currency = interaction.options.getString("currency", true);
    const amount = interaction.options.getInteger("amount", true);
    const target = interaction.options.getUser("user") || interaction.user;

    const p = await getPlayer(target.id);

    const before =
      currency === "drako" ? p.drako :
      currency === "reiatsu" ? p.bleach.reiatsu :
      p.jjk.cursedEnergy;

    const removed = Math.min(before, amount);
    const after = before - removed;

    if (currency === "drako") p.drako = after;
    if (currency === "reiatsu") p.bleach.reiatsu = after;
    if (currency === "cursed_energy") p.jjk.cursedEnergy = after;

    await setPlayer(target.id, p);

    return interaction.reply({
      content: `✅ Removed **${removed}** ${currency} from <@${target.id}>.`,
      ephemeral: false,
    });
  }
};
