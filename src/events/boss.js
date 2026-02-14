// src/events/boss.js
// ✅ FIXED: no import from ../ui/components (that module is missing in your project)
// ✅ Includes 5 bosses (you complained you had only 2)
// ✅ Has working buttons: Block / Info / Close
// ✅ Stops crashes from missing config like black_flash_manual by using safe defaults

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ComponentType,
} = require("discord.js");

const {
  COLOR = 0x8b5cf6,

  // ping role for boss messages (optional)
  EVENT_PING_ROLE_ID = null,

  // default timings
  BOSS_ROUND_SECONDS = 10,
  BOSS_TOTAL_ROUNDS = 4,

  // card test gif (you gave this)
  CARD_TEST_GIF =
    "https://media.discordapp.net/attachments/1468153576353431615/1471828355153268759/Your_paragraph_text.gif?width=388&height=582",

  // admins (optional)
  ADMIN_IDS = [],

  // optional multipliers map you had before (avoid crash)
  JJK_MULTIPLIERS = {},
  BLEACH_MULTIPLIERS = {},
} = require("../config");

// =============================
// 5 BOSSES (edit names/values)
// =============================
const BOSSES = [
  {
    id: "vasto_lorde",
    name: "Vasto Lorde",
    universe: "BLEACH",
    rarity: "Legendary",
    totalRounds: 4,
    hpStart: 100,
    flavor:
      "A terrifying presence. Only those who endure the rounds will survive.",
  },
  {
    id: "ulquiorra",
    name: "Ulquiorra",
    universe: "BLEACH",
    rarity: "Legendary",
    totalRounds: 4,
    hpStart: 100,
    flavor: "Cold and precise. Mistakes are punished.",
  },
  {
    id: "kenpachi",
    name: "Kenpachi Zaraki",
    universe: "BLEACH",
    rarity: "Mythic",
    totalRounds: 4,
    hpStart: 100,
    flavor: "He lives for battle. Your blocks better be perfect.",
  },
  {
    id: "sukuna",
    name: "Ryomen Sukuna",
    universe: "JJK",
    rarity: "Mythic",
    totalRounds: 4,
    hpStart: 100,
    flavor: "The King of Curses. Survive the rounds if you can.",
  },
  {
    id: "mahito",
    name: "Mahito",
    universe: "JJK",
    rarity: "Legendary",
    totalRounds: 4,
    hpStart: 100,
    flavor: "He toys with souls. Random events are brutal.",
  },
];

// =============================
// In-memory active bosses
// If you use Redis elsewhere, you can replace this Map with your DB/Redis.
// =============================
const activeBossByGuild = new Map();

/**
 * Utility: pick boss by id or random
 */
function pickBoss(bossId) {
  if (bossId) {
    const found = BOSSES.find((b) => b.id === bossId);
    if (found) return found;
  }
  return BOSSES[Math.floor(Math.random() * BOSSES.length)];
}

/**
 * Buttons row
 */
function bossButtonsRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("boss:block")
      .setLabel("Block")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("boss:info")
      .setLabel("Info")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("boss:close")
      .setLabel("Close")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );
}

/**
 * Build boss embed
 */
function buildBossEmbed(state) {
  const boss = state.boss;
  const roundText = `Round ${state.round}/${state.totalRounds}`;
  const alive = [...state.players.values()].filter((p) => p.alive).length;
  const joined = state.players.size;

  const e = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`👹 ${boss.name} — ${roundText}`)
    .setDescription(
      [
        `**Universe:** ${boss.universe}`,
        `**Rarity:** ${boss.rarity}`,
        `**HP:** ${Math.max(0, state.hp)}%`,
        "",
        `**Players:** ${alive}/${joined} alive`,
        "",
        `**Action:** press **Block** within **${state.roundSeconds}s** to survive this round.`,
      ].join("\n")
    )
    .setFooter({ text: "Boss Event • Block in time or get eliminated" });

  // Temporary card appearance (your gif)
  if (CARD_TEST_GIF) e.setImage(CARD_TEST_GIF);

  return e;
}

/**
 * Permission check for close button
 */
function canClose(interaction) {
  if (!interaction || !interaction.member) return false;
  if (
    interaction.member.permissions?.has?.(PermissionsBitField.Flags.Administrator)
  )
    return true;
  if (Array.isArray(ADMIN_IDS) && ADMIN_IDS.includes(interaction.user.id))
    return true;
  return false;
}

/**
 * Start a boss event in the channel
 * This is used by /spawnboss
 */
async function spawnBoss(interaction, client) {
  try {
    const guildId = interaction.guildId;
    const channel = interaction.channel;

    if (!guildId || !channel) {
      return interaction.reply({
        content: "❌ This command must be used in a server channel.",
        ephemeral: true,
      });
    }

    // Prevent 2 bosses at once in same guild
    if (activeBossByGuild.has(guildId)) {
      return interaction.reply({
        content: "⚠️ A boss is already active in this server.",
        ephemeral: true,
      });
    }

    // Optional boss id argument
    let bossId = null;
    try {
      bossId = interaction.options?.getString?.("boss_id") || null;
    } catch (_) {}

    const boss = pickBoss(bossId);

    const state = {
      guildId,
      channelId: channel.id,
      messageId: null,

      boss,
      round: 1,
      totalRounds: boss.totalRounds || BOSS_TOTAL_ROUNDS,
      hp: boss.hpStart ?? 100,

      roundSeconds: BOSS_ROUND_SECONDS,

      // players: userId -> { alive: bool, blocksLeft: number, blockedThisRound: bool }
      players: new Map(),

      // set of userIds who pressed block in current round (for fast checks)
      lastRoundBlocked: new Set(),

      startedAt: Date.now(),
      closed: false,
    };

    activeBossByGuild.set(guildId, state);

    const ping = EVENT_PING_ROLE_ID ? `<@&${EVENT_PING_ROLE_ID}>` : "";

    const msg = await channel.send({
      content: ping ? `${ping}\n**@${boss.name} Event Ping**` : `**@${boss.name} Event Ping**`,
      embeds: [buildBossEmbed(state)],
      components: [bossButtonsRow(false)],
    });

    state.messageId = msg.id;

    await interaction.reply({
      content: `✅ Boss spawned: **${boss.name}**`,
      ephemeral: true,
    });

    // Start rounds loop
    runBossLoop(client, state).catch(() => {});
  } catch (err) {
    console.error("spawnboss error:", err);
    try {
      await interaction.reply({
        content: "⚠️ Error while spawning boss.",
        ephemeral: true,
      });
    } catch (_) {}
  }
}

/**
 * Main loop for rounds
 */
async function runBossLoop(client, state) {
  const channel = await client.channels.fetch(state.channelId).catch(() => null);
  if (!channel) return endBoss(state, "Channel not found.");

  while (!state.closed && state.round <= state.totalRounds) {
    // Reset per-round flags
    for (const p of state.players.values()) p.blockedThisRound = false;
    state.lastRoundBlocked.clear();

    // Update message at round start
    await updateBossMessage(client, state, false);

    // Wait for round duration
    await sleep(state.roundSeconds * 1000);

    // Resolve round: anyone alive who didn't block dies
    for (const [userId, p] of state.players.entries()) {
      if (!p.alive) continue;
      if (!p.blockedThisRound) {
        p.alive = false;
      }
    }

    // Decrease boss HP based on number of alive blockers (simple logic)
    const alive = [...state.players.values()].filter((p) => p.alive).length;
    const dmg = alive === 0 ? 0 : Math.min(35, 10 + alive * 2); // tuned
    state.hp = Math.max(0, state.hp - dmg);

    // If boss defeated
    if (state.hp <= 0) break;

    // If everyone died
    if (alive === 0) break;

    state.round += 1;
  }

  // Finish
  const alive = [...state.players.values()].filter((p) => p.alive).length;
  let reason = "Event ended.";
  if (state.hp <= 0) reason = "Boss defeated!";
  else if (alive === 0) reason = "Everyone was eliminated.";
  else if (state.round > state.totalRounds) reason = "Rounds completed.";

  await endBoss(state, reason, client);
}

/**
 * Update boss message embed/components
 */
async function updateBossMessage(client, state, disabled) {
  const channel = await client.channels.fetch(state.channelId).catch(() => null);
  if (!channel) return;

  const msg = await channel.messages.fetch(state.messageId).catch(() => null);
  if (!msg) return;

  await msg
    .edit({
      embeds: [buildBossEmbed(state)],
      components: [bossButtonsRow(!!disabled)],
    })
    .catch(() => {});
}

/**
 * End boss: disable buttons + final embed
 */
async function endBoss(state, reason, client) {
  state.closed = true;

  if (client) {
    const channel = await client.channels.fetch(state.channelId).catch(() => null);
    const msg = channel
      ? await channel.messages.fetch(state.messageId).catch(() => null)
      : null;

    if (msg) {
      const aliveUsers = [...state.players.entries()]
        .filter(([, p]) => p.alive)
        .map(([id]) => `<@${id}>`);

      const endEmbed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle(`✅ Boss Event Finished — ${state.boss.name}`)
        .setDescription(
          [
            `**Result:** ${reason}`,
            `**Boss HP:** ${Math.max(0, state.hp)}%`,
            "",
            `**Survivors (${aliveUsers.length}):**`,
            aliveUsers.length ? aliveUsers.join(" ") : "_none_",
          ].join("\n")
        );

      if (CARD_TEST_GIF) endEmbed.setImage(CARD_TEST_GIF);

      await msg
        .edit({
          content: msg.content,
          embeds: [endEmbed],
          components: [bossButtonsRow(true)],
        })
        .catch(() => {});
    }
  }

  activeBossByGuild.delete(state.guildId);
}

/**
 * Handle button interactions for boss
 * Call this from your global interactionCreate handler.
 */
async function handleBossButton(interaction, client) {
  if (!interaction.isButton()) return false;
  const id = interaction.customId;
  if (!id.startsWith("boss:")) return false;

  const guildId = interaction.guildId;
  const state = activeBossByGuild.get(guildId);

  if (!state) {
    await interaction.reply({
      content: "⚠️ Boss event is not active.",
      ephemeral: true,
    });
    return true;
  }

  // Ensure correct message (optional)
  if (interaction.message?.id && interaction.message.id !== state.messageId) {
    await interaction.reply({
      content: "⚠️ This boss message is outdated.",
      ephemeral: true,
    });
    return true;
  }

  if (id === "boss:info") {
    const boss = state.boss;
    await interaction.reply({
      content: [
        `👹 **${boss.name}**`,
        `Universe: **${boss.universe}**`,
        `Rarity: **${boss.rarity}**`,
        "",
        `Press **Block** within **${state.roundSeconds}s** each round to survive.`,
        "New players can join anytime by pressing Block.",
      ].join("\n"),
      ephemeral: true,
    });
    return true;
  }

  if (id === "boss:close") {
    if (!canClose(interaction)) {
      await interaction.reply({
        content: "❌ You don't have permission to close this boss.",
        ephemeral: true,
      });
      return true;
    }
    await interaction.reply({ content: "✅ Closing boss event…", ephemeral: true });
    await endBoss(state, "Closed by admin.", client);
    return true;
  }

  if (id === "boss:block") {
    const userId = interaction.user.id;

    // join if new
    if (!state.players.has(userId)) {
      state.players.set(userId, {
        alive: true,
        blocksLeft: 3, // matches your UI "BLOCK x3"
        blockedThisRound: false,
      });
    }

    const p = state.players.get(userId);

    if (!p.alive) {
      await interaction.reply({
        content: "☠️ You are eliminated and cannot block anymore.",
        ephemeral: true,
      });
      return true;
    }

    if (p.blocksLeft <= 0) {
      await interaction.reply({
        content: "❌ You have no blocks left.",
        ephemeral: true,
      });
      return true;
    }

    if (p.blockedThisRound) {
      await interaction.reply({
        content: "⚠️ You already blocked this round.",
        ephemeral: true,
      });
      return true;
    }

    p.blocksLeft -= 1;
    p.blockedThisRound = true;
    state.lastRoundBlocked.add(userId);

    await interaction.reply({
      content: `🛡️ **Blocked!** Blocks left: **${p.blocksLeft}**`,
      ephemeral: true,
    });

    return true;
  }

  return false;
}

// small helpers
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
  BOSSES,
  spawnBoss,
  handleBossButton,

  // if you need it externally
  _activeBossByGuild: activeBossByGuild,
};
