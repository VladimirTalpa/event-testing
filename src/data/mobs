const { E_REIATSU, CLASH_RESPONSE_MS, CLASH_COOLDOWN_MS } = require("../config");
const { clashInviteEmbed, clashWinEmbed } = require("../embeds");
const { clashButtons } = require("../components");

function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function editMessageSafe(channel, messageId, payload) {
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return null;
  await msg.edit(payload).catch(() => {});
  return msg;
}

async function startClash(interaction, state, players) {
  const channel = interaction.channel;

  const opponent = interaction.options.getUser("user", true);
  const stake = interaction.options.getInteger("stake", true);

  if (opponent.bot) return interaction.reply({ content: "❌ You can't challenge a bot.", ephemeral: true });
  if (opponent.id === interaction.user.id) return interaction.reply({ content: "❌ You can't challenge yourself.", ephemeral: true });

  const now = Date.now();
  const last = state.lastClashByUser.get(interaction.user.id) || 0;
  const left = CLASH_COOLDOWN_MS - (now - last);
  if (left > 0) {
    const mins = Math.ceil(left / 60000);
    return interaction.reply({ content: `⏳ You can use Reiatsu Clash again in **${mins} min**.`, ephemeral: true });
  }

  if (state.clashByChannel.has(channel.id)) {
    return interaction.reply({ content: "⚠️ A clash is already active in this channel.", ephemeral: true });
  }

  const p1 = await players.get(interaction.user.id);
  const p2 = await players.get(opponent.id);

  if (p1.reiatsu < stake) return interaction.reply({ content: `❌ You need ${E_REIATSU} ${stake}.`, ephemeral: true });
  if (p2.reiatsu < stake) return interaction.reply({ content: `❌ Opponent needs ${E_REIATSU} ${stake}.`, ephemeral: true });

  const msg = await channel.send({
    embeds: [clashInviteEmbed(safeName(interaction.user.username), safeName(opponent.username), stake)],
    components: clashButtons(false),
  });

  state.clashByChannel.set(channel.id, {
    messageId: msg.id,
    challengerId: interaction.user.id,
    targetId: opponent.id,
    stake,
    resolved: false,
  });

  state.lastClashByUser.set(interaction.user.id, Date.now());
  await interaction.reply({ content: "✅ Challenge sent.", ephemeral: true });

  setTimeout(async () => {
    const still = state.clashByChannel.get(channel.id);
    if (!still || still.messageId !== msg.id || still.resolved) return;
    still.resolved = true;

    await editMessageSafe(channel, still.messageId, { components: clashButtons(true) });
    await channel.send("⌛ Clash expired (no response).").catch(() => {});
    state.clashByChannel.delete(channel.id);
  }, CLASH_RESPONSE_MS);
}

async function handleClashButton(interaction, state, players) {
  const channel = interaction.channel;
  const cid = interaction.customId;

  const clash = state.clashByChannel.get(channel.id);
  if (!clash || clash.resolved) return;

  if (interaction.user.id !== clash.targetId) {
    await interaction.followUp({ content: "❌ Only the challenged player can respond.", ephemeral: true }).catch(() => {});
    return;
  }

  if (cid === "clash_decline") {
    clash.resolved = true;
    await editMessageSafe(channel, clash.messageId, { components: clashButtons(true) });
    await channel.send("⚡ Clash declined.").catch(() => {});
    state.clashByChannel.delete(channel.id);
    return;
  }

  // accept
  clash.resolved = true;
  await editMessageSafe(channel, clash.messageId, { components: clashButtons(true) });
  await channel.send(`${E_REIATSU} 💥 Reiatsu pressure is rising…`).catch(() => {});
  await sleep(1500);

  const p1 = await players.get(clash.challengerId);
  const p2 = await players.get(clash.targetId);

  if (p1.reiatsu < clash.stake || p2.reiatsu < clash.stake) {
    await channel.send("⚠️ Clash cancelled (someone lacks Reiatsu now).").catch(() => {});
    state.clashByChannel.delete(channel.id);
    return;
  }

  const challengerMember = await channel.guild.members.fetch(clash.challengerId).catch(() => null);
  const targetMember = await channel.guild.members.fetch(clash.targetId).catch(() => null);
  const challengerName = safeName(challengerMember?.displayName || "Challenger");
  const targetName = safeName(targetMember?.displayName || "Opponent");

  const challengerWins = Math.random() < 0.5;

  if (challengerWins) {
    p1.reiatsu += clash.stake;
    p2.reiatsu -= clash.stake;
    await players.set(clash.challengerId, p1);
    await players.set(clash.targetId, p2);
    await channel.send({ embeds: [clashWinEmbed(challengerName, targetName, clash.stake)] }).catch(() => {});
  } else {
    p2.reiatsu += clash.stake;
    p1.reiatsu -= clash.stake;
    await players.set(clash.targetId, p2);
    await players.set(clash.challengerId, p1);
    await channel.send({ embeds: [clashWinEmbed(targetName, challengerName, clash.stake)] }).catch(() => {});
  }

  state.lastClashByUser.set(clash.challengerId, Date.now());
  state.clashByChannel.delete(channel.id);
}

module.exports = { startClash, handleClashButton };
