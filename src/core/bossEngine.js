const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const BOSSES = require("../data/bosses");
const { getUser, addCurrency, addShards, addTitle } = require("./db");

// messageId -> bossState
const bossByMessage = new Map();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeHpBar(current, max, size = 14) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, current / max));
  const filled = Math.round(pct * size);
  const empty = Math.max(0, size - filled);
  return `\`${"█".repeat(filled)}${"░".repeat(empty)}\``;
}

function getRoundMechanic(boss, roundIndex) {
  const list = Array.isArray(boss.mechanics) ? boss.mechanics : [];
  if (list.length === 0) return null;
  return list[Math.min(roundIndex, list.length - 1)];
}

function makeBossEmbed(boss, stateText) {
  const e = new EmbedBuilder()
    .setColor("#a855f7")
    .setTitle(`👹 ${boss.name}`)
    .setDescription(stateText);

  // Temporary visual for all bosses (you said: use this gif for now)
  if (boss.image) e.setImage(boss.image);

  return e;
}

function getBossStateForMessage(messageId) {
  return bossByMessage.get(messageId) || null;
}

function createBossState({ channelId, bossId, createdBy }) {
  const boss = BOSSES.find((b) => b.id === bossId);
  if (!boss) throw new Error("Unknown bossId");

  return {
    boss,
    channelId,
    createdBy,
    createdAt: Date.now(),

    currentRound: 1,
    maxRounds: boss.rounds ?? 4,

    bossHpMax: boss.hpMax ?? 100,
    bossHp: boss.hpMax ?? 100,

    // userId -> { alive, lastAction, joinedAt, r1/r2/r3 stamps }
    players: new Map(),

    finished: false,
    lastTickAt: 0,
  };
}

async function spawnBossMessage(interaction, bossId) {
  const state = createBossState({
    channelId: interaction.channelId,
    bossId,
    createdBy: interaction.user.id,
  });

  const mech = getRoundMechanic(state.boss, 0);
  const stateText = [
    `**Round:** ${state.currentRound}/${state.maxRounds}`,
    `**HP:** ${makeHpBar(state.bossHp, state.bossHpMax)}  (${state.bossHp}/${state.bossHpMax})`,
    `**Players:** 0 (alive: 0)`,
    mech ? `\n**Mechanic:** ${mech.prompt}` : "",
    "\nPress **Join**, then choose an action.",
  ].join("\n");

  // temporary buttons (will be re-rendered with the real messageId)
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`boss:join:${interaction.channelId}:TEMP`)
      .setLabel("Join")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`boss:act:TEMP:placeholder1`)
      .setLabel("—")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`boss:act:TEMP:placeholder2`)
      .setLabel("—")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  const msg = await interaction.reply({
    embeds: [makeBossEmbed(state.boss, stateText)],
    components: [row],
    fetchReply: true,
  });

  const messageId = msg.id;
  bossByMessage.set(messageId, state);
  await refreshBossMessage(interaction.client, messageId);
}

async function refreshBossMessage(client, messageId) {
  const state = bossByMessage.get(messageId);
  if (!state) return;

  const channel = await client.channels.fetch(state.channelId).catch(() => null);
  if (!channel) return;

  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return;

  const alive = Array.from(state.players.values()).filter((p) => p.alive);
  const aliveCount = alive.length;

  const hpBar = makeHpBar(state.bossHp, state.bossHpMax);
  const mech = getRoundMechanic(state.boss, state.currentRound - 1);
  const mechLine = mech ? `\n**Mechanic:** ${mech.prompt}` : "";

  const stateText = [
    `**Round:** ${state.currentRound}/${state.maxRounds}`,
    `**HP:** ${hpBar}  (${state.bossHp}/${state.bossHpMax})`,
    `**Players:** ${state.players.size} (alive: ${aliveCount})`,
    state.finished ? "\n✅ **Boss defeated!**" : `${mechLine}\n\nChoose your action:`,
  ].join("\n");

  const joinBtn = new ButtonBuilder()
    .setCustomId(`boss:join:${state.channelId}:${messageId}`)
    .setLabel("Join")
    .setStyle(ButtonStyle.Success)
    .setDisabled(state.finished);

  const options = (mech?.options || [
    { key: "dodge", label: "Dodge", emoji: "🌀" },
    { key: "guard", label: "Guard", emoji: "🛡️" },
    { key: "counter", label: "Counter", emoji: "🎯" },
  ]).slice(0, 4);

  const actionButtons = options.map((o) =>
    new ButtonBuilder()
      .setCustomId(`boss:act:${messageId}:${o.key}`)
      .setLabel(`${o.emoji ? o.emoji + " " : ""}${o.label}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(state.finished)
  );

  const row = new ActionRowBuilder().addComponents(joinBtn, ...actionButtons);

  await msg.edit({
    embeds: [makeBossEmbed(state.boss, stateText)],
    components: [row],
  });
}

async function handleBossJoin(interaction, channelId, messageId) {
  const state = bossByMessage.get(messageId);
  if (!state || state.channelId !== channelId) {
    return interaction.reply({ content: "This boss is no longer active.", ephemeral: true });
  }
  if (state.finished) {
    return interaction.reply({ content: "Boss already defeated.", ephemeral: true });
  }

  const existing = state.players.get(interaction.user.id);
  if (!existing) {
    state.players.set(interaction.user.id, {
      alive: true,
      lastAction: null,
      joinedAt: Date.now(),
    });
  } else {
    existing.alive = true;
  }

  await interaction.reply({ content: "✅ Joined the boss fight!", ephemeral: true });
  await refreshBossMessage(interaction.client, messageId);
}

function chance(p) {
  return Math.random() < p;
}

async function handleBossAct(interaction, messageId, action) {
  const state = bossByMessage.get(messageId);
  if (!state) {
    return interaction.reply({ content: "This boss is no longer active.", ephemeral: true });
  }
  if (state.finished) {
    return interaction.reply({ content: "Boss already defeated.", ephemeral: true });
  }

  const player = state.players.get(interaction.user.id);
  if (!player) {
    return interaction.reply({ content: "Press **Join** first.", ephemeral: true });
  }
  if (!player.alive) {
    return interaction.reply({ content: "You are **dead** in this fight.", ephemeral: true });
  }

  const mech = getRoundMechanic(state.boss, state.currentRound - 1);
  const isCorrect = mech?.correct ? action === mech.correct : true;

  // Base survive chances: correct >> wrong
  let surviveChance = isCorrect ? 0.82 : 0.42;

  // Tiny flavor adjustments
  if (isCorrect && (action === "allin" || action === "burst")) surviveChance -= 0.05;
  if (isCorrect && (action === "guard" || action === "block")) surviveChance += 0.04;

  const survived = chance(surviveChance);

  player.lastAction = action;
  if (!survived) player.alive = false;

  // Progress / damage
  const progress = survived ? (isCorrect ? 3 : 1) : 0;
  state.bossHp = Math.max(0, state.bossHp - progress);

  state.lastTickAt = Date.now();

  if (state.bossHp <= 0) {
    await finishBoss(interaction.client, messageId);
    return interaction.reply({
      content: survived
        ? isCorrect
          ? "✅ Perfect! The boss is defeated."
          : "✅ Survived — boss defeated."
        : "💀 You fell — but the boss is defeated.",
      ephemeral: true,
    });
  }

  // Advance round when at least half of alive players have acted this round
  const stampKey = `r${state.currentRound}`;
  player[stampKey] = true;

  const alivePlayers = Array.from(state.players.values()).filter((p) => p.alive);
  const acted = alivePlayers.filter((p) => p[stampKey]).length;
  const needed = Math.max(1, Math.ceil(alivePlayers.length * 0.5));

  if (acted >= needed) {
    // Team push
    const teamProgress = Math.max(2, Math.round(alivePlayers.length * 1.2));
    state.bossHp = Math.max(0, state.bossHp - teamProgress);

    state.currentRound += 1;

    if (state.currentRound > state.maxRounds) {
      if (state.bossHp <= 0) {
        await finishBoss(interaction.client, messageId);
      } else {
        state.finished = true; // boss escaped
      }
    }
  }

  await interaction.reply({
    content: survived
      ? isCorrect
        ? "✅ Correct move — you survived!"
        : "⚠️ Wrong move — barely survived!"
      : "💀 Wrong timing — you died.",
    ephemeral: true,
  });

  await refreshBossMessage(interaction.client, messageId);
}

async function finishBoss(client, messageId) {
  const state = bossByMessage.get(messageId);
  if (!state || state.finished) return;
  state.finished = true;

  const bossRewards = state.boss.rewards || {};

  // Reward everyone who participated; dead get less.
  for (const [userId, p] of state.players.entries()) {
    getUser(userId);

    const mul = p.alive ? 1 : 0.55;
    const c = Math.round(
      randInt(bossRewards.currencyMin ?? 80, bossRewards.currencyMax ?? 160) * mul
    );
    const s = Math.round(
      randInt(bossRewards.shardMin ?? 5, bossRewards.shardMax ?? 12) * mul
    );

    addCurrency(userId, c);
    addShards(userId, s);

    if (
      bossRewards.titleId &&
      Math.random() < (bossRewards.titleChance ?? 0.1) * (p.alive ? 1 : 0.6)
    ) {
      addTitle(userId, bossRewards.titleId);
    }
  }

  await refreshBossMessage(client, messageId);

  setTimeout(() => {
    bossByMessage.delete(messageId);
  }, 5 * 60 * 1000);
}

module.exports = {
  // Backward-compatible name used by src/commands/spawnboss.js
  spawnBoss: async (client, interaction, bossId) => spawnBossMessage(interaction, bossId),

  spawnBossMessage,
  refreshBossMessage,
  handleBossJoin,
  handleBossAct,
  getBossStateForMessage,
};
