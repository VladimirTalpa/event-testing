require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");

/* ===================== CONFIG ===================== */

// Roles that can manually spawn events
const EVENT_ROLE_IDS = ["1259865441405501571", "1287879457025163325"];

// Channel (Bleach spawns only here) — ты можешь заменить на свой ID канала
// В прошлых сообщениях ты давал ссылки, но тут нужен чистый ID канала.
// Пример: https://discord.com/channels/GUILD/CHANNEL  -> берём CHANNEL
const BLEACH_CHANNEL_ID = "1469757595031179314";

// Join times
const VASTO_JOIN_MS = 2 * 60 * 1000; // 2 minutes
const ULQ_JOIN_MS = 3 * 60 * 1000;   // 3 minutes

// Base chances
const VASTO_SURVIVE_CHANCE = 0.30;
const ULQ_SURVIVE_CHANCE = 0.20;

// Rewards
const VASTO_WIN_REIATSU = 200;
const VASTO_HIT_REIATSU = 15;

const ULQ_WIN_REIATSU = 500;
const ULQ_HIT_REIATSU = 25;

// Drops
const VASTO_DROP_ROLE_ID = "1467426528584405103";
const VASTO_DROP_CHANCE = 0.025; // 2.5%

const ULQ_DROP_ROLE_ID = "1469573731301986367";
const ULQ_DROP_CHANCE = 0.03; // 3%

// Emojis (as requested)
const E_VASTO = "<:event:1469832084418727979>";
const E_ULQ = "<:event:1469831975446511648>";
const E_GRIMMJOW = "<:event:1469831949857325097>";
const E_REIATSU = "<:event:1469821285079978045>";
const E_CURSED = "<:event:1469821211872727040>";
const E_DRAKO = "<:event:1469812070542217389>";

// Visual
const COLOR_BLEACH = 0x7b2cff;

// Phase timings
const TEAM_BLOCK_WINDOW_MS = 5 * 1000;   // 5 seconds
const FINISHER_WINDOW_MS = 10 * 1000;    // 10 seconds
const QUICK_BLOCK_WINDOW_MS = 2 * 1000;  // 2 seconds
const QTE_WINDOW_MS = 5 * 1000;          // 5 seconds
const ROUND_GAP_MS = 1500;               // small pause between rounds

// Team requirements
const TEAM_BLOCK_REQUIRED = 4;
const ULQ_MIN_SUCCESS_FOR_ROUND6 = 3;

/* ===================== MEDIA (your gifs) ===================== */

// Vasto
const VASTO_SPAWN_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842057219674194/Your_paragraph_text_13.gif?ex=69892096&is=6987cf16&hm=c31783bb0a9a57c197a3faf8d9314fb2a1d4621d424c8961bfcb2c0f0c753ef3&=";

const VASTO_R1_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842005583462514/Your_paragraph_text_16.gif?ex=6989208a&is=6987cf0a&hm=f9a4c88976d44e3581b82d55c01fdefb03f1c7401697c8a663cf6aeeff68e8c3&=";

const VASTO_R2_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842043227341068/Your_paragraph_text_14.gif?ex=69892093&is=6987cf13&hm=117ea0c95417384a7b790f746a774d0778b9348257fd8ee7422ed8c4e908dd9a&=";

const VASTO_R3_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842024172884138/Your_paragraph_text_15.gif?ex=6989208e&is=6987cf0e&hm=ba70c2e8435df2b8aefb26205c5c0fc23386895da4837e5fcae10eb8fdd03d19&=";

const VASTO_R4_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842068024066068/Your_paragraph_text_12.gif?ex=69892099&is=6987cf19&hm=e1080c7bddf29f2e6edc23f9a083189bde2d417ea9ffb9d81e4b5dcd218227cc&=";

const VASTO_R5_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469841986705166347/Your_paragraph_text_18.gif?ex=69892085&is=6987cf05&hm=3b1a1520ace36d0ab11d4a443bed1f1321488192657b464da15ffb11d4f72700&=";

const VASTO_WIN_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469841996616040511/Your_paragraph_text_17.gif?ex=69892088&is=6987cf08&hm=c5adfce5d6fff70c659a87a43d9b1be1b56fdbd52031de45f6c15962306cf37f&=";

const VASTO_LOSE_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469842262208020632/Your_paragraph_text_19.gif?ex=698920c7&is=6987cf47&hm=243b0dea5d8bec6a78a4efc223fa07e8e3656c4c301ca7521395bc935ef73b7b&=";

// Ulquiorra
const ULQ_SPAWN_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843198812618782/Your_paragraph_text_25.gif?ex=698921a6&is=6987d026&hm=8ab0b38b1fafd210a7cbf589f54b37ce4c4e7117e5141a63d6d150e32f71096c&=";

const ULQ_R1_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843217058103556/Your_paragraph_text_26.gif?ex=698921ab&is=6987d02b&hm=4499f79869465416007ef21580b08fdd8c6a8f597521ec484e22c023d3867586&=";

const ULQ_R2_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843235986866196/Your_paragraph_text_27.gif?ex=698921af&is=6987d02f&hm=d73e433123104264fb7797e32267d4af89dc7887fb2efdea42a41e578fc85bf4&=";

const ULQ_R3_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843247999353004/Your_paragraph_text_28.gif?ex=698921b2&is=6987d032&hm=03afda58f47e27975d3b6f5ee7a4af654e3bcc9ff89c8fc7488f3e905509dcbf&=";

const ULQ_R4_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843261139980308/Your_paragraph_text_29.gif?ex=698921b5&is=6987d035&hm=63d6429d4d618c3682ef4665c3b494200ccb031d4f450c38539ee8cde319a1ac&=";

const ULQ_R5_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843274737914123/Your_paragraph_text_30.gif?ex=698921b9&is=6987d039&hm=6274a0db6b1866c2d134fd4b9f200b68e968e97fd2ceb9ca7312c7a8cae804af&=";

const ULQ_R6_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843288277127219/Your_paragraph_text_31.gif?ex=698921bc&is=6987d03c&hm=88e3096454d50f1268761b18320c8d12a23d80cc49ff7c93240e3d7f553e4d6e&=";

const ULQ_WIN_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843303930527929/Your_paragraph_text_32.gif?ex=698921c0&is=6987d040&hm=2ad405fd31cd5be31faebe491f651ff5a1bb88a9816eebf0b6aa823808592df8&=";

const ULQ_LOSE_GIF =
  "https://media.discordapp.net/attachments/1405973335979851877/1469843317087797279/Your_paragraph_text_33.gif?ex=698921c3&is=6987d043&hm=a9a78cb6e341b7d27c4d94b4f1c29c248811d77b206ad4ea7b6f7571fceabd2f&=";

/* ===================== DATA (simple json) ===================== */
/* Если у тебя уже есть Redis/DB версия — скажи, и я перепишу под Redis.
   Сейчас делаю стабильный вариант, который у тебя уже точно работал. */

const DATA_DIR = path.join(__dirname, "..", "data");
const PLAYERS_FILE = path.join(DATA_DIR, "players.json");

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PLAYERS_FILE)) fs.writeFileSync(PLAYERS_FILE, "{}", "utf8");
}
function loadPlayers() {
  ensureData();
  return JSON.parse(fs.readFileSync(PLAYERS_FILE, "utf8"));
}
function savePlayers(db) {
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(db, null, 2), "utf8");
}
function normalizePlayer(raw = {}) {
  return {
    reiatsu: Number.isFinite(raw.reiatsu) ? raw.reiatsu : 0,
  };
}
function getPlayer(db, userId) {
  if (!db[userId]) db[userId] = normalizePlayer({});
  else db[userId] = normalizePlayer(db[userId]);
  return db[userId];
}

/* ===================== HELPERS ===================== */

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }
function hasEventRole(member) {
  if (!member?.roles?.cache) return false;
  return EVENT_ROLE_IDS.some((id) => member.roles.cache.has(id));
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

function fightersListText(participants) {
  const arr = [...participants.values()].map((p) => safeName(p.displayName));
  if (!arr.length) return "`No fighters yet`";
  return arr.join(", ").slice(0, 1000);
}

/* ===================== BOSSES DEFINITION ===================== */

const BOSSES = {
  vasto: {
    key: "vasto",
    title: `${E_VASTO} Vasto Lorde`,
    difficulty: "Hard",
    joinMs: VASTO_JOIN_MS,
    surviveChance: VASTO_SURVIVE_CHANCE,
    winReiatsu: VASTO_WIN_REIATSU,
    hitReiatsu: VASTO_HIT_REIATSU,
    dropRoleId: VASTO_DROP_ROLE_ID,
    dropChance: VASTO_DROP_CHANCE,
    spawnGif: VASTO_SPAWN_GIF,
    winGif: VASTO_WIN_GIF,
    loseGif: VASTO_LOSE_GIF,
    phases: [
      {
        type: "pressure",
        name: "Round 1 — Reiatsu wave",
        desc: "Vasto Lorde releases a powerful Reiatsu wave. Endure the pressure.",
        gif: VASTO_R1_GIF,
      },
      {
        type: "pressure",
        name: "Round 2 — Rage pressure",
        desc: "Vasto Lorde enters rage. The pressure grows stronger.",
        gif: VASTO_R2_GIF,
      },
      {
        type: "team_block",
        name: "Round 3 — Coordinated block",
        desc: `Cooperate to block the attack! Need **${TEAM_BLOCK_REQUIRED}** fighters to press **Block** within **${TEAM_BLOCK_WINDOW_MS / 1000}s**.`,
        gif: VASTO_R3_GIF,
        required: TEAM_BLOCK_REQUIRED,
        windowMs: TEAM_BLOCK_WINDOW_MS,
      },
      {
        type: "pressure",
        name: "Round 4 — Counterattack",
        desc: "Vasto Lorde is weakened. Counterattack him!",
        gif: VASTO_R4_GIF,
      },
      {
        type: "finisher",
        name: "Round 5 — Finish him",
        desc: `Vasto Lorde took massive damage. Press **Finisher** within **${FINISHER_WINDOW_MS / 1000}s** or you get hit.`,
        gif: VASTO_R5_GIF,
        windowMs: FINISHER_WINDOW_MS,
      },
    ],
  },

  ulquiorra: {
    key: "ulquiorra",
    title: `${E_ULQ} Ulquiorra`,
    difficulty: "Extreme",
    joinMs: ULQ_JOIN_MS,
    surviveChance: ULQ_SURVIVE_CHANCE,
    winReiatsu: ULQ_WIN_REIATSU,
    hitReiatsu: ULQ_HIT_REIATSU,
    dropRoleId: ULQ_DROP_ROLE_ID,
    dropChance: ULQ_DROP_CHANCE,
    spawnGif: ULQ_SPAWN_GIF,
    winGif: ULQ_WIN_GIF,
    loseGif: ULQ_LOSE_GIF,
    phases: [
      {
        type: "team_block",
        name: "Round 1 — Barrage block",
        desc: `Block together! Need **${TEAM_BLOCK_REQUIRED}** fighters to press **Block** within **${TEAM_BLOCK_WINDOW_MS / 1000}s**.`,
        gif: ULQ_R1_GIF,
        required: TEAM_BLOCK_REQUIRED,
        windowMs: TEAM_BLOCK_WINDOW_MS,
      },
      {
        type: "qte_combo",
        name: "Round 2 — Combo Defense",
        desc: `Press the sequence in order within **${QTE_WINDOW_MS / 1000}s**. Wrong press = hit.`,
        gif: ULQ_R2_GIF,
        windowMs: QTE_WINDOW_MS,
      },
      {
        type: "pressure",
        name: "Round 3 — Transformation pressure",
        desc: "Ulquiorra transformed. Endure the insane pressure.",
        gif: ULQ_R3_GIF,
      },
      {
        type: "pressure",
        name: "Round 4 — Stronger pressure",
        desc: "Ulquiorra increases Reiatsu pressure. Breathing is harder.",
        gif: ULQ_R4_GIF,
      },
      {
        type: "quick_block",
        name: "Round 5 — Quick block (2s)",
        desc: `Press **Block** within **${QUICK_BLOCK_WINDOW_MS / 1000}s** or get hit. Successful block also counts as a counterattack.`,
        gif: ULQ_R5_GIF,
        windowMs: QUICK_BLOCK_WINDOW_MS,
      },
      {
        type: "min_success",
        name: "Round 6 — Final assault (need 3)",
        desc: `At least **${ULQ_MIN_SUCCESS_FOR_ROUND6}** fighters must succeed this round — otherwise everyone loses.`,
        gif: ULQ_R6_GIF,
        minSuccess: ULQ_MIN_SUCCESS_FOR_ROUND6,
      },
    ],
  },
};

/* ===================== EMBEDS ===================== */

function spawnEmbed(bossDef, channelName, fightersCount, fightersText) {
  return new EmbedBuilder()
    .setColor(COLOR_BLEACH)
    .setTitle(`${bossDef.title} appeared in chat!`)
    .setDescription(
      [
        `Difficulty: **${bossDef.difficulty}**`,
        `⏳ Join time: **${Math.round(bossDef.joinMs / 60000)} minutes**`,
        "",
        `Click **🗡 Join Battle** to participate.`,
      ].join("\n")
    )
    .addFields(
      { name: "👥 Fighters", value: fightersText, inline: false },
      { name: "Joined", value: `\`${fightersCount}\``, inline: true },
      { name: `${E_REIATSU} Rewards`, value: `Win: \`${bossDef.winReiatsu}\` • Hit bank: \`+${bossDef.hitReiatsu}\``, inline: true },
      { name: "📌 Channel", value: `\`#${channelName}\``, inline: true }
    )
    .setImage(bossDef.spawnGif);
}

function phaseEmbed(bossDef, phase, aliveCount, extraDesc = "") {
  return new EmbedBuilder()
    .setColor(COLOR_BLEACH)
    .setTitle(`${bossDef.title} — ${phase.name}`)
    .setDescription([phase.desc, extraDesc].filter(Boolean).join("\n"))
    .addFields({ name: "Alive fighters", value: `\`${aliveCount}\``, inline: true })
    .setImage(phase.gif || bossDef.spawnGif);
}

function winEmbed(bossDef, survivorsCount) {
  const dropText =
    bossDef.key === "vasto"
      ? `Role drop: \`2.5%\``
      : `Role drop: \`3%\``;

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`${bossDef.title} defeated!`)
    .setDescription(`✅ Rewards granted to survivors.`)
    .addFields(
      { name: "Survivors", value: `\`${survivorsCount}\``, inline: true },
      { name: "Drops", value: dropText, inline: true }
    )
    .setImage(bossDef.winGif);
}

function loseEmbed(bossDef) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`${bossDef.title} — Defeat`)
    .setDescription("❌ Everyone lost.")
    .setImage(bossDef.loseGif);
}

/* ===================== COMPONENTS ===================== */

function joinButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("boss_join")
        .setLabel("Join Battle")
        .setEmoji("🗡")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled)
    ),
  ];
}

function teamBlockButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("boss_block")
        .setLabel("Block")
        .setEmoji("🛡")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled)
    ),
  ];
}

function finisherButtons(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("boss_finish")
        .setLabel("Finisher")
        .setEmoji("⚔️")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled)
    ),
  ];
}

function qteButtons(disabled = false) {
  // кнопки: red -> green -> blue -> yellow
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("qte_red").setLabel("Red").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId("qte_green").setLabel("Green").setStyle(ButtonStyle.Success).setDisabled(disabled),
      new ButtonBuilder().setCustomId("qte_blue").setLabel("Blue").setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId("qte_yellow").setLabel("Yellow").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
    ),
  ];
}

/* ===================== RUNTIME STATE ===================== */

const bossByChannel = new Map();
/*
boss state:
{
  key: "vasto|ulquiorra",
  joining: true/false,
  messageId,
  participants: Map<uid, { displayName, hits, hitBank }>,
  alive: Set<uid>,
  // phase interactive state:
  activePhase: { type, ... } or null
  phaseMsgId: string|null
  blockPressers: Set<uid> for block phases
  finisherPressers: Set<uid> for finisher
  qte: { seq: ["qte_red",...], step: Map<uid, number>, failed: Set<uid>, deadline, msgId }
}
*/

function ensureBleachChannel(interactionOrChannel) {
  const ch = interactionOrChannel?.channel || interactionOrChannel;
  if (!ch?.id) return true;
  return ch.id === BLEACH_CHANNEL_ID;
}

/* ===================== CORE LOGIC ===================== */

function rollSurvive(chance) {
  return Math.random() < chance;
}

function applyHit(state, uid) {
  const p = state.participants.get(uid);
  if (!p) return { eliminated: true };
  p.hits += 1;
  const eliminated = p.hits >= 2;
  return { eliminated };
}

function giveHitBank(state, uid, amount) {
  const p = state.participants.get(uid);
  if (!p) return;
  p.hitBank += amount;
}

async function spawnBoss(channel, bossKey) {
  if (!channel?.isTextBased?.()) return;
  if (bossByChannel.has(channel.id)) {
    await channel.send("⚠️ A boss is already active in this channel.").catch(() => {});
    return;
  }

  const bossDef = BOSSES[bossKey];
  if (!bossDef) {
    await channel.send("❌ Unknown boss.").catch(() => {});
    return;
  }

  const state = {
    key: bossKey,
    joining: true,
    messageId: null,
    participants: new Map(),
    alive: new Set(),
    activePhase: null,
    phaseMsgId: null,
    blockPressers: new Set(),
    finisherPressers: new Set(),
    qte: null,
  };

  const msg = await channel.send({
    embeds: [spawnEmbed(bossDef, channel.name, 0, "`No fighters yet`")],
    components: joinButtons(false),
  }).catch(() => null);

  if (!msg) return;

  state.messageId = msg.id;
  bossByChannel.set(channel.id, state);

  setTimeout(() => {
    const still = bossByChannel.get(channel.id);
    if (!still || still.messageId !== state.messageId) return;
    runBossScenario(channel, still).catch(() => {});
  }, bossDef.joinMs);
}

async function updateSpawnMessage(channel, state) {
  const bossDef = BOSSES[state.key];
  const fightersText = fightersListText(state.participants);
  await channel.messages.fetch(state.messageId).then(async (m) => {
    await m.edit({
      embeds: [spawnEmbed(bossDef, channel.name, state.participants.size, fightersText)],
      components: joinButtons(!state.joining),
    }).catch(() => {});
  }).catch(() => {});
}

async function runBossScenario(channel, state) {
  const bossDef = BOSSES[state.key];
  state.joining = false;
  await updateSpawnMessage(channel, state);

  state.alive = new Set(state.participants.keys());

  if (state.alive.size === 0) {
    await channel.send(`💨 ${bossDef.title} vanished… nobody joined.`).catch(() => {});
    bossByChannel.delete(channel.id);
    return;
  }

  await channel.send(`⚔️ ${bossDef.title} battle begins!`).catch(() => {});
  await sleep(800);

  for (let i = 0; i < bossDef.phases.length; i++) {
    if (state.alive.size === 0) break;

    const phase = bossDef.phases[i];
    state.activePhase = phase;

    // run phase by type
    if (phase.type === "pressure") {
      await runPressurePhase(channel, state, bossDef, phase);
    } else if (phase.type === "team_block") {
      await runTeamBlockPhase(channel, state, bossDef, phase);
    } else if (phase.type === "finisher") {
      await runFinisherPhase(channel, state, bossDef, phase);
    } else if (phase.type === "qte_combo") {
      await runQtePhase(channel, state, bossDef, phase);
    } else if (phase.type === "quick_block") {
      await runQuickBlockPhase(channel, state, bossDef, phase);
    } else if (phase.type === "min_success") {
      const ok = await runMinSuccessPhase(channel, state, bossDef, phase);
      if (!ok) {
        // wipe condition
        state.alive.clear();
        break;
      }
    }

    await sleep(ROUND_GAP_MS);
  }

  // Finish: if anyone alive => win
  if (state.alive.size > 0) {
    await grantVictory(channel, state, bossDef);
  } else {
    await channel.send({ embeds: [loseEmbed(bossDef)] }).catch(() => {});
  }

  bossByChannel.delete(channel.id);
}

async function runPressurePhase(channel, state, bossDef, phase) {
  const aliveArr = [...state.alive];

  const msg = await channel.send({
    embeds: [phaseEmbed(bossDef, phase, aliveArr.length)],
  }).catch(() => null);
  state.phaseMsgId = msg?.id || null;

  const lines = [];

  for (const uid of aliveArr) {
    const p = state.participants.get(uid);
    const name = safeName(p?.displayName);
    const survived = rollSurvive(bossDef.surviveChance);

    if (survived) {
      // counts as successful hit -> bank it
      giveHitBank(state, uid, bossDef.hitReiatsu);
      lines.push(`✅ **${name}** endured the pressure and counterattacked! (+${E_REIATSU} ${bossDef.hitReiat
su} bank)`);
    } else {
      const { eliminated } = applyHit(state, uid);
      lines.push(`💥 **${name}** got hit! (${state.participants.get(uid)?.hits}/2)`);
      if (eliminated) {
        state.alive.delete(uid);
        lines.push(`☠️ **${name}** was eliminated.`);
      }
    }
    await sleep(350);
  }

  await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
}

async function runTeamBlockPhase(channel, state, bossDef, phase) {
  const aliveArr = [...state.alive];
  state.blockPressers = new Set();

  const msg = await channel.send({
    embeds: [
      phaseEmbed(
        bossDef,
        phase,
        aliveArr.length,
        `🛡 Press **Block** now! Need **${phase.required}** fighters within **${phase.windowMs / 1000}s**.`
      ),
    ],
    components: teamBlockButtons(false),
  }).catch(() => null);

  state.phaseMsgId = msg?.id || null;

  // wait window
  await sleep(phase.windowMs);

  // disable buttons
  if (state.phaseMsgId) {
    await channel.messages.fetch(state.phaseMsgId).then((m) => m.edit({ components: teamBlockButtons(true) }).catch(() => {})).catch(() => {});
  }

  const blockers = state.blockPressers;
  const okTeam = blockers.size >= phase.required;

  const lines = [];
  lines.push(`🛡 Blockers: **${blockers.size}/${phase.required}**`);

  if (!okTeam) {
    // team failed => everyone gets hit
    lines.push(`❌ Not enough blockers. The attack hits everyone!`);
    for (const uid of aliveArr) {
      const p = state.participants.get(uid);
      const name = safeName(p?.displayName);
      const { eliminated } = applyHit(state, uid);
      lines.push(`💥 **${name}** got hit! (${state.participants.get(uid)?.hits}/2)`);
      if (eliminated) {
        state.alive.delete(uid);
        lines.push(`☠️ **${name}** was eliminated.`);
      }
    }
    await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
    return;
  }

  // team succeeded:
  // - those who pressed: survive + hit-bank (they "counterattacked")
  // - those who didn't: get hit
  lines.push(`✅ The team blocked the barrage!`);

  for (const uid of aliveArr) {
    const p = state.participants.get(uid);
    const name = safeName(p?.displayName);

    if (blockers.has(uid)) {
      giveHitBank(state, uid, bossDef.hitReiatsu);
      lines.push(`✅ **${name}** blocked and counterattacked! (+${E_REIATSU} ${bossDef.hitReiatsu} bank)`);
    } else {
      const { eliminated } = applyHit(state, uid);
      lines.push(`💥 **${name}** failed to block and got hit! (${state.participants.get(uid)?.hits}/2)`);
      if (eliminated) {
        state.alive.delete(uid);
        lines.push(`☠️ **${name}** was eliminated.`);
      }
    }
  }

  await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
}

function randomQteSequence() {
  // You asked: red -> green -> blue -> yellow style; but also said random allowed.
  // We'll do random using those 4, length 4.
  const pool = ["qte_red", "qte_green", "qte_blue", "qte_yellow"];
  const seq = [];
  while (seq.length < 4) {
    seq.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return seq;
}

function qteLabel(cid) {
  if (cid === "qte_red") return "🟥";
  if (cid === "qte_green") return "🟩";
  if (cid === "qte_blue") return "🟦";
  if (cid === "qte_yellow") return "🟨";
  return "⬛";
}

async function runQtePhase(channel, state, bossDef, phase) {
  const aliveArr = [...state.alive];

  const seq = randomQteSequence();
  const seqText = seq.map(qteLabel).join(" → ");

  // per-player step
  const step = new Map();
  const failed = new Set();

  state.qte = {
    seq,
    step,
    failed,
    deadline: Date.now() + (phase.windowMs || QTE_WINDOW_MS),
    msgId: null,
  };

  const msg = await channel.send({
    embeds: [
      phaseEmbed(
        bossDef,
        phase,
        aliveArr.length,
        `🎮 **Combo Defense**\nPress in order: **${seqText}**\n⏳ Time: **${(phase.windowMs || QTE_WINDOW_MS) / 1000}s**\n❌ Wrong press = hit`
      ),
    ],
    components: qteButtons(false),
  }).catch(() => null);

  state.qte.msgId = msg?.id || null;

  await sleep(phase.windowMs || QTE_WINDOW_MS);

  // disable
  if (state.qte.msgId) {
    await channel.messages.fetch(state.qte.msgId).then((m) => m.edit({ components: qteButtons(true) }).catch(() => {})).catch(() => {});
  }

  // resolve: anyone who didn't complete gets hit (or already failed)
  const lines = [];
  for (const uid of aliveArr) {
    const p = state.participants.get(uid);
    const name = safeName(p?.displayName);

    const s = step.get(uid) || 0;
    const completed = s >= seq.length;
    const isFailed = failed.has(uid);

    if (completed && !isFailed) {
      giveHitBank(state, uid, bossDef.hitReiatsu);
      lines.push(`✅ **${name}** completed the combo and counterattacked! (+${E_REIATSU} ${bossDef.hitReiatsu} bank)`);
    } else {
      const { eliminated } = applyHit(state, uid);
      lines.push(`💥 **${name}** failed the combo and got hit! (${state.participants.get(uid)?.hits}/2)`);
      if (eliminated) {
        state.alive.delete(uid);
        lines.push(`☠️ **${name}** was eliminated.`);
      }
    }
  }

  state.qte = null;
  await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
}

async function runQuickBlockPhase(channel, state, bossDef, phase) {
  const aliveArr = [...state.alive];
  state.blockPressers = new Set();

  const msg = await channel.send({
    embeds: [
      phaseEmbed(
        bossDef,
        phase,
        aliveArr.length,
        `🛡 Quick block! Press within **${(phase.windowMs || QUICK_BLOCK_WINDOW_MS) / 1000}s**.`
      ),
    ],
    components: teamBlockButtons(false),
  }).catch(() => null);

  state.phaseMsgId = msg?.id || null;

  await sleep(phase.windowMs || QUICK_BLOCK_WINDOW_MS);

  // disable buttons
  if (state.phaseMsgId) {
    await channel.messages.fetch(state.phaseMsgId).then((m) => m.edit({ components: teamBlockButtons(true) }).catch(() => {})).catch(() => {});
  }

  const blockers = state.blockPressers;
  const lines = [];

  for (const uid of aliveArr) {
    const p = state.participants.get(uid);
    const name = safeName(p?.displayName);

    if (blockers.has(uid)) {
      giveHitBank(state, uid, bossDef.hitReiatsu);
      lines.push(`✅ **${name}** blocked in time and counterattacked! (+${E_REIATSU} ${bossDef.hitReiatsu} bank)`);
    } else {
      const { eliminated } = applyHit(state, uid);
      lines.push(`💥 **${name}** failed to block and got hit! (${state.participants.get(uid)?.hits}/2)`);
      if (eliminated) {
        state.alive.delete(uid);
        lines.push(`☠️ **${name}** was eliminated.`);
      }
    }
  }

  await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
}

async function runFinisherPhase(channel, state, bossDef, phase) {
  const aliveArr = [...state.alive];
  state.finisherPressers = new Set();

  const msg = await channel.send({
    embeds: [
      phaseEmbed(
        bossDef,
        phase,
        aliveArr.length,
        `⚔️ **Finisher**! Press within **${(phase.windowMs || FINISHER_WINDOW_MS) / 1000}s** or you get hit.`
      ),
    ],
    components: finisherButtons(false),
  }).catch(() => null);

  state.phaseMsgId = msg?.id || null;

  await sleep(phase.windowMs || FINISHER_WINDOW_MS);

  // disable
  if (state.phaseMsgId) {
    await channel.messages.fetch(state.phaseMsgId).then((m) => m.edit({ components: finisherButtons(true) }).catch(() => {})).catch(() => {});
  }

  const finishers = state.finisherPressers;
  const lines = [];

  for (const uid of aliveArr) {
    const p = state.participants.get(uid);
    const name = safeName(p?.displayName);

    if (finishers.has(uid)) {
      // successful finisher counts as hit bank too
      giveHitBank(state, uid, bossDef.hitReiatsu);
      lines.push(`✅ **${name}** landed the finisher! (+${E_REIATSU} ${bossDef.hitReiatsu} bank)`);
    } else {
      const { eliminated } = applyHit(state, uid);
      lines.push(`💥 **${name}** missed the finisher and got hit! (${state.participants.get(uid)?.hits}/2)`);
      if (eliminated) {
        state.alive.delete(uid);
        lines.push(`☠️ **${name}** was eliminated.`);
      }
    }
  }

  await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
}

async function runMinSuccessPhase(channel, state, bossDef, phase) {
  const aliveArr = [...state.alive];

  const msg = await channel.send({
    embeds: [
      phaseEmbed(
        bossDef,
        phase,
        aliveArr.length,
        `⚠️ Need at least **${phase.minSuccess}** successes, or everyone loses.`
      ),
    ],
  }).catch(() => null);

  state.phaseMsgId = msg?.id || null;

  const success = [];
  const fail = [];

  for (const uid of aliveArr) {
    const p = state.participants.get(uid);
    const ok = rollSurvive(bossDef.surviveChance);
    (ok ? success : fail).push(uid);
  }

  const lines = [];
  lines.push(`✅ Success: **${success.length}** • ❌ Fail: **${fail.length}**`);

  if (success.length < phase.minSuccess) {
    lines.push(`💀 Not enough successes. **Everyone loses.**`);
    await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
    return false; // wipe
  }

  // those who succeeded get hit-bank; those who failed get hit
  for (const uid of success) {
    giveHitBank(state, uid, bossDef.hitReiatsu);
  }

  for (const uid of fail) {
    const p = state.participants.get(uid);
    const name = safeName(p?.displayName);
    const { eliminated } = applyHit(state, uid);
    lines.push(`💥 **${name}** got hit! (${state.participants.get(uid)?.hits}/2)`);
    if (eliminated) {
      state.alive.delete(uid);
      lines.push(`☠️ **${name}** was eliminated.`);
    }
  }

  await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
  return true;
}

async function grantVictory(channel, state, bossDef) {
  const survivors = [...state.alive];

  const db = loadPlayers();
  const lines = [];

  for (const uid of survivors) {
    const pState = state.participants.get(uid);
    const hitBank = pState?.hitBank || 0;

    const player = getPlayer(db, uid);
    // grant: win reward + banked hits
    player.reiatsu += bossDef.winReiatsu + hitBank;

    lines.push(
      `• <@${uid}> +${E_REIATSU} ${bossDef.winReiatsu} (Win) +${E_REIATSU} ${hitBank} (Hit bank)`
    );

    // role drop
    if (Math.random() < bossDef.dropChance) {
      const res = await tryGiveRole(channel.guild, uid, bossDef.dropRoleId);
      lines.push(
        res.ok
          ? `🎭 <@${uid}> obtained the boss role!`
          : `⚠️ <@${uid}> won role but bot couldn't assign: ${res.reason}`
      );
    }
  }

  savePlayers(db);

  await channel.send({ embeds: [winEmbed(bossDef, survivors.length)] }).catch(() => {});
  await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
}

/* ===================== CLIENT ===================== */

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log("Bleach channel locked to:", BLEACH_CHANNEL_ID);
});

/* ===================== INTERACTIONS ===================== */

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) {
        return interaction.reply({ content: "❌ Use commands in a text channel.", ephemeral: true });
      }

      // lock bleach boss spawning to bleach channel
      if (!ensureBleachChannel(interaction)) {
        return interaction.reply({ content: "⛔ Bleach bosses can only spawn in the Bleach event channel.", ephemeral: true });
      }

      if (interaction.commandName === "spawnboss") {
        if (!hasEventRole(interaction.member)) {
          return interaction.reply({ content: "⛔ You don’t have the required role.", ephemeral: true });
        }
        const boss = interaction.options.getString("boss", true);
        if (!BOSSES[boss]) {
          return interaction.reply({ content: "❌ Unknown boss option.", ephemeral: true });
        }
        await interaction.reply({ content: `✅ Spawning **${boss}**...`, ephemeral: true });
        await spawnBoss(channel, boss);
        return;
      }

      if (interaction.commandName === "reatsu") {
        const target = interaction.options.getUser("user") || interaction.user;
        const db = loadPlayers();
        const p = getPlayer(db, target.id);
        savePlayers(db);
        return interaction.reply({ content: `${E_REIATSU} **${safeName(target.username)}** has **${p.reiatsu} Reiatsu**.`, ephemeral: false });
      }
    }

    // Buttons
    if (interaction.isButton()) {
      try { await interaction.deferUpdate(); } catch {}

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) return;

      const state = bossByChannel.get(channel.id);
      if (!state) return;

      const uid = interaction.user.id;
      const cid = interaction.customId;

      // Join
      if (cid === "boss_join") {
        if (!state.joining) {
          await interaction.followUp({ content: "❌ Join time is over.", ephemeral: true }).catch(() => {});
          return;
        }
        if (state.participants.has(uid)) {
          await interaction.followUp({ content: "⚠️ You already joined.", ephemeral: true }).catch(() => {});
          return;
        }

        state.participants.set(uid, {
          displayName: interaction.member?.displayName || interaction.user.username,
          hits: 0,
          hitBank: 0,
        });

        await updateSpawnMessage(channel, state);
        await interaction.followUp({ content: "✅ Joined the boss fight.", ephemeral: true }).catch(() => {});
        return;
      }

      // Only participants & alive can interact in phases
      if (!state.participants.has(uid) || !state.alive.has(uid)) {
        await interaction.followUp({ content: "❌ You are not an alive participant in this fight.", ephemeral: true }).catch(() => {});
        return;
      }

      // Block (team / quick)
      if (cid === "boss_block") {
        state.blockPressers.add(uid);
        await interaction.followUp({ content: "🛡 Block registered!", ephemeral: true }).catch(() => {});
        return;
      }

      // Finisher
      if (cid === "boss_finish") {
        state.finisherPressers.add(uid);
        await interaction.followUp({ content: "⚔️ Finisher registered!", ephemeral: true }).catch(() => {});
        return;
      }

      // QTE buttons
      if (cid.startsWith("qte_")) {
        const qte = state.qte;
        if (!qte) {
          await interaction.followUp({ content: "❌ No active combo right now.", ephemeral: true }).catch(() => {});
          return;
        }
        if (Date.now() > qte.deadline) {
          await interaction.followUp({ content: "⏳ Too late!", ephemeral: true }).catch(() => {});
          return;
        }
        if (qte.failed.has(uid)) {
          await interaction.followUp({ content: "❌ You already failed this combo.", ephemeral: true }).catch(() => {});
          return;
        }

        const currentStep = qte.step.get(uid) || 0;
        const expected = qte.seq[currentStep];

        if (cid !== expected) {
          qte.failed.add(uid); // wrong press => fail
          await interaction.followUp({ content: "💥 Wrong button — you will take a hit.", ephemeral: true }).catch(() => {});
          return;
        }

        qte.step.set(uid, currentStep + 1);

        const done = (currentStep + 1) >= qte.seq.length;
        await interaction.followUp({ content: done ? "✅ Combo completed!" : `✅ Step ${currentStep + 1}/${qte.seq.length}`, ephemeral: true }).catch(() => {});
        return;
      }
    }
  } catch (e) {
    console.error("Interaction error:", e);
  }
});

client.login(process.env.DISCORD_TOKEN);
