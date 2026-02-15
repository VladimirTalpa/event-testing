const { bossByChannel } = require("../core/state");
const { BOSSES } = require("../data/bosses");
const { getPlayer, setPlayer } = require("../core/players");
const { clamp, safeName } = require("../core/utils");

const {
  bossSpawnEmbed,
  bossRoundEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
} = require("../ui/embeds");

const {
  bossButtons,
  singleActionRow,
  dualChoiceRow,
  comboDefenseRows,
} = require("../ui/components");

const { BLEACH_BONUS_MAX, JJK_BONUS_MAX } = require("../config");

function cap(eventKey) {
  return eventKey === "bleach" ? BLEACH_BONUS_MAX : JJK_BONUS_MAX;
}

// create random combo
function randomCombo() {
  const colors = ["red", "blue", "green", "yellow"];
  const seq = [];
  while (seq.length < 4) {
    seq.push(colors[Math.floor(Math.random() * colors.length)]);
  }
  return seq;
}

function fightersTextFromMap(map) {
  const arr = [...map.values()].map((x) => safeName(x.displayName));
  return arr.length ? arr.join(", ").slice(0, 1000) : "`No fighters yet`";
}

async function spawnBoss(channel, bossId, withPing = false) {
  const def = BOSSES[bossId];
  if (!def) return;

  const state = {
    def,
    joining: true,
    messageId: null,
    participants: new Map(), // uid -> { hits, displayName, banked }
    activeAction: null,      // { token, roundIndex, mode, pressed/set, ... }
  };

  bossByChannel.set(channel.id, state);

  const msg = await channel.send({
    content: withPing ? "@here" : null,
    embeds: [bossSpawnEmbed(def, channel.name, 0, "`No fighters yet`")],
    components: bossButtons(false),
  });

  state.messageId = msg.id;
  bossByChannel.set(channel.id, state);

  // close join
  setTimeout(async () => {
    const st = bossByChannel.get(channel.id);
    if (!st || st.messageId !== msg.id) return;
    st.joining = false;
    bossByChannel.set(channel.id, st);

    // disable join
    await msg.edit({
      embeds: [bossSpawnEmbed(def, channel.name, st.participants.size, fightersTextFromMap(st.participants))],
      components: bossButtons(true),
    }).catch(() => {});

    // start rounds
    await runRounds(channel);
  }, def.joinMs);
}

async function runRounds(channel) {
  const st = bossByChannel.get(channel.id);
  if (!st) return;

  const def = st.def;

  for (let i = 0; i < def.rounds.length; i++) {
    const round = def.rounds[i];

    // alive
    const maxHits = def.maxHits ?? 2;
    const alive = [...st.participants.entries()].filter(([, p]) => p.hits < maxHits);
    if (alive.length === 0) break;

    const token = Math.random().toString(16).slice(2, 10);
    st.activeAction = { token, roundIndex: i, mode: round.mode };

    // per-mode storage
    if (round.mode === "press") st.activeAction.pressed = new Set();
    if (round.mode === "choice") st.activeAction.choice = new Map();
    if (round.mode === "multi_press") st.activeAction.counts = new Map();
    if (round.mode === "combo") {
      st.activeAction.comboSeq = randomCombo();
      st.activeAction.comboProgress = new Map();
      st.activeAction.comboFailed = new Set();
    }

    bossByChannel.set(channel.id, st);

    const message = await channel.messages.fetch(st.messageId).catch(() => null);
    if (!message) return;

    // send round message (edit main boss message)
    let components = [];
    if (round.mode === "press") {
      components = singleActionRow(`boss_action:${def.id}:${i}:${token}:press:ok`, round.label || "Block", round.emoji || "🛡️");
    } else if (round.mode === "choice") {
      components = dualChoiceRow(
        `boss_action:${def.id}:${i}:${token}:choice:left`,
        "Left",
        "⬅️",
        `boss_action:${def.id}:${i}:${token}:choice:right`,
        "Right",
        "➡️"
      );
    } else if (round.mode === "multi_press") {
      components = singleActionRow(`boss_action:${def.id}:${i}:${token}:multi:hit`, round.label || "Parry", round.emoji || "⚔️");
    } else if (round.mode === "combo") {
      components = comboDefenseRows(token, def.id, i);
    }

    await message.edit({
      embeds: [bossRoundEmbed(def, i, alive.length)],
      components,
    }).catch(() => {});

    // wait duration
    await new Promise((r) => setTimeout(r, round.durationMs || 8000));

    // resolve round
    const st2 = bossByChannel.get(channel.id);
    if (!st2 || !st2.activeAction || st2.activeAction.token !== token) return;

    const act = st2.activeAction;

    for (const [uid, pState] of st2.participants.entries()) {
      if (pState.hits >= maxHits) continue; // already dead

      let success = false;

      if (round.mode === "press") {
        success = act.pressed.has(uid);
      } else if (round.mode === "choice") {
        const chosen = act.choice.get(uid);
        const safe = round.safe || "left";
        success = chosen === safe;
      } else if (round.mode === "multi_press") {
        const need = round.need || 3;
        const c = act.counts.get(uid) || 0;
        success = c >= need;
      } else if (round.mode === "combo") {
        const prog = act.comboProgress.get(uid) || 0;
        success = prog >= 4 && !act.comboFailed.has(uid);
      }

      if (!success) {
        pState.hits += 1;
      } else {
        pState.banked = (pState.banked || 0) + (def.hitReward || 0);
      }
      st2.participants.set(uid, pState);
    }

    st2.activeAction = null;
    bossByChannel.set(channel.id, st2);
  }

  // finish
  await finalizeBoss(channel);
}

async function finalizeBoss(channel) {
  const st = bossByChannel.get(channel.id);
  if (!st) return;

  const def = st.def;
  const maxHits = def.maxHits ?? 2;

  const survivors = [...st.participants.entries()].filter(([, p]) => p.hits < maxHits);
  const survivorsCount = survivors.length;

  const message = await channel.messages.fetch(st.messageId).catch(() => null);

  if (survivorsCount === 0) {
    if (message) await message.edit({ embeds: [bossDefeatEmbed(def)], components: [] }).catch(() => {});
    bossByChannel.delete(channel.id);
    return;
  }

  // rewards
  for (const [uid, pState] of survivors) {
    const pl = await getPlayer(uid);
    const win = def.winRewardRange
      ? (def.winRewardRange.min + Math.floor(Math.random() * (def.winRewardRange.max - def.winRewardRange.min + 1)))
      : (def.winReward || 0);

    const banked = pState.banked || 0;
    const total = win + banked;

    // add currency + reset bonus cap clamp (optional)
    if (def.event === "bleach") {
      pl.bleach.reiatsu += total;
      pl.bleach.survivalBonus = clamp(pl.bleach.survivalBonus, 0, cap("bleach"));
    } else {
      pl.jjk.cursedEnergy += total;
      pl.jjk.survivalBonus = clamp(pl.jjk.survivalBonus, 0, cap("jjk"));
    }

    await setPlayer(uid, pl);
  }

  if (message) {
    await message.edit({
      embeds: [bossVictoryEmbed(def, survivorsCount)],
      components: [],
    }).catch(() => {});
  }

  bossByChannel.delete(channel.id);
}

module.exports = { spawnBoss };
