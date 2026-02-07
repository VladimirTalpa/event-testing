
const cfg = require("../config");
const { clashByChannel, lastClashByUser } = require("../state");
const { safeName, sleep, editMessageSafe } = require("../utils");
const { clashButtons } = require("../components");
const embeds = require("../embeds");
const { getPlayer, setPlayer } = require("../players");

async function startClash({ interaction, channel, opponent, stake }) {
  const now = Date.now();
  const last = lastClashByUser.get(interaction.user.id) || 0;
  const left = cfg.CLASH_COOLDOWN_MS - (now - last);
  if (left > 0) {
    const mins = Math.ceil(left / 60000);
    return interaction.reply({ content: `⏳ You can use Reiatsu Clash again in **${mins} min**.`, ephemeral: true });
  }

  if (clashByChannel.has(channel.id)) {
    return interaction.reply({ content: "⚠️ A clash is already active in this channel.", ephemeral: true });
  }

  const p1 = await getPlayer(interaction.user.id);
  const p2 = await getPlayer(opponent.id);

  if (p1.reiatsu < stake) return interaction.reply({ content: `❌ You need ${cfg.E_REIATSU} ${stake}.`, ephemeral: true });
  if (p2.reiatsu < stake) return interaction.reply({ content: `❌ Opponent needs ${cfg.E_REIATSU} ${stake}.`, ephemeral: true });

  const msg = await channel.send({
    embeds: [embeds.clashInviteEmbed(safeName(interaction.user.username), safeName(opponent.username), stake)],
    components: clashButtons(false),
  });

  clashByChannel.set(channel.id, {
    messageId: msg.id,
    challengerId: interaction.user.id,
    targetId: opponent.id,
    stake,
    resolved: false,
  });

  lastClashByUser.set(interaction.user.id, Date.now());
  await interaction.reply({ content: "✅ Challenge sent.", ephemeral: true });

  setTimeout(async () => {
    const still = clashByChannel.get(channel.id);
    if (!still || still.messageId !== msg.id || still.resolved) return;
    still.resolved = true;

    await editMessageSafe(channel, still.messageId, { components: clashButtons(true) });
    await channel.send("⌛ Clash expired (no response).").catch(() => {});
    clashByChannel.delete(channel.id);
  }, cfg.CLASH_RESPONSE_MS);
}

async function handleClashButton({ interaction, channel, customId }) {
  const clash = clashByChannel.get(channel.id);
  if (!clash || clash.resolved) return;

  if (interaction.user.id !== clash.targetId) {
    await interaction.followUp({ content: "❌ Only the challenged player can respond.", ephemeral: true }).catch(() => {});
    return;
  }

  if (customId === "clash_decline") {
    clash.resolved = true;
    await editMessageSafe(channel, clash.messageId, { components: clashButtons(true) });
    await channel.send("⚡ Clash declined.").catch(() => {});
    clashByChannel.delete(channel.id);
    return;
  }

  clash.resolved = true;
  await editMessageSafe(channel, clash.messageId, { components: clashButtons(true) });
  await channel.send(`${cfg.E_REIATSU} 💥 Reiatsu pressure is rising…`).catch(() => {});
  await sleep(1500);

  const p1 = await getPlayer(clash.challengerId);
  const p2 = await getPlayer(clash.targetId);

  if (p1.reiatsu < clash.stake || p2.reiatsu < clash.stake) {
    await channel.send("⚠️ Clash cancelled (someone lacks Reiatsu now).").catch(() => {});
    clashByChannel.delete(channel.id);
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
    await setPlayer(clash.challengerId, p1);
    await setPlayer(clash.targetId, p2);
    await channel.send({ embeds: [embeds.clashWinEmbed(challengerName, targetName, clash.stake)] }).catch(() => {});
  } else {
    p2.reiatsu += clash.stake;
    p1.reiatsu -= clash.stake;
    await setPlayer(clash.targetId, p2);
    await setPlayer(clash.challengerId, p1);
    await channel.send({ embeds: [embeds.clashWinEmbed(targetName, challengerName, clash.stake)] }).catch(() => {});
  }

  lastClashByUser.set(clash.challengerId, Date.now());
  clashByChannel.delete(channel.id);
}

module.exports = { startClash, handleClashButton };
