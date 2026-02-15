const { bossByChannel, mobByChannel, pvpById } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName } = require("../core/utils");

const {
  MAX_HITS,
  BLEACH_BONUS_MAX,
  JJK_BONUS_MAX,
} = require("../config");

function safeSplitCustomId(customId) {
  if (typeof customId !== "string") return [];
  // Discord limit 100 chars for customId - но иногда у людей старые/битые
  return customId.split(":").map((x) => (x ?? "").trim());
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getMaxBonusForEvent(eventKey) {
  const bMax = typeof BLEACH_BONUS_MAX === "number" ? BLEACH_BONUS_MAX : 30;
  const jMax = typeof JJK_BONUS_MAX === "number" ? JJK_BONUS_MAX : 30;
  return eventKey === "bleach" ? bMax : jMax;
}

async function ensureParticipant(state, interaction) {
  const uid = interaction.user.id;
  if (state.participants.has(uid)) return;

  state.participants.set(uid, {
    userId: uid,
    displayName: interaction.member?.displayName || interaction.user.username,
    hits: 0,
    banked: 0,
    mobBonus: 0,
  });
}

function isEliminated(state, uid) {
  const st = state.participants.get(uid);
  if (!st) return true;
  const maxHits = state.def?.maxHits ?? MAX_HITS;
  return (st.hits ?? 0) >= maxHits;
}

module.exports = async function handleButtons(interaction) {
  if (!interaction.isButton()) return;

  const parts = safeSplitCustomId(interaction.customId);

  // ----------------------------------------
  // 1) Boss join/leave (простые customId)
  // ----------------------------------------
  if (parts[0] === "boss_join" || parts[0] === "boss_leave") {
    const state = bossByChannel.get(interaction.channelId);
    if (!state) {
      return interaction.reply({ content: "⚠️ No active boss here.", ephemeral: true });
    }
    if (!state.joining) {
      return interaction.reply({ content: "⏳ Join phase is over.", ephemeral: true });
    }

    if (parts[0] === "boss_join") {
      await ensureParticipant(state, interaction);
      bossByChannel.set(interaction.channelId, state);
      return interaction.reply({ content: "✅ You joined the boss fight.", ephemeral: true });
    }

    if (parts[0] === "boss_leave") {
      state.participants.delete(interaction.user.id);
      bossByChannel.set(interaction.channelId, state);
      return interaction.reply({ content: "✅ You left the boss fight.", ephemeral: true });
    }
  }

  // ----------------------------------------
  // 2) Mob join/leave
  // ----------------------------------------
  if (parts[0] === "mob_join" || parts[0] === "mob_leave") {
    const state = mobByChannel.get(interaction.channelId);
    if (!state) return interaction.reply({ content: "⚠️ No active mob here.", ephemeral: true });
    if (!state.joining) return interaction.reply({ content: "⏳ Join phase is over.", ephemeral: true });

    if (parts[0] === "mob_join") {
      await ensureParticipant(state, interaction);
      mobByChannel.set(interaction.channelId, state);
      return interaction.reply({ content: "✅ You joined the mob fight.", ephemeral: true });
    }

    if (parts[0] === "mob_leave") {
      state.participants.delete(interaction.user.id);
      mobByChannel.set(interaction.channelId, state);
      return interaction.reply({ content: "✅ You left the mob fight.", ephemeral: true });
    }
  }

  // ----------------------------------------
  // 3) Boss actions format:
  // boss_action:<bossId>:<roundIndex>:<token>:<mode>:<key>
  // ----------------------------------------
  if (parts[0] === "boss_action") {
    const state = bossByChannel.get(interaction.channelId);
    if (!state) return interaction.reply({ content: "⚠️ No active boss here.", ephemeral: true });

    const bossId = parts[1];
    const roundIndex = Number(parts[2]);
    const token = parts[3];
    const mode = parts[4];
    const key = parts[5];

    // Мягкая валидация: не крашимся вообще
    if (!bossId || Number.isNaN(roundIndex) || !token || !mode) {
      return interaction.reply({ content: "⚠️ This button is outdated/invalid.", ephemeral: true });
    }

    // Старое сообщение/кнопка — просто игнорируем
    if (!state.activeAction || state.activeAction.token !== token || state.activeAction.roundIndex !== roundIndex) {
      return interaction.reply({ content: "⏳ Too late — that round already ended.", ephemeral: true });
    }

    const uid = interaction.user.id;

    // Если не участник — нельзя
    if (!state.participants.has(uid)) {
      return interaction.reply({ content: "❌ You are not in this fight. Use Join first.", ephemeral: true });
    }

    // Если уже вылетел — нельзя
    if (isEliminated(state, uid)) {
      return interaction.reply({ content: "☠️ You are eliminated.", ephemeral: true });
    }

    // ---- MODE: press (любая 1 кнопка)
    if (mode === "press") {
      state.activeAction.pressed = state.activeAction.pressed || new Set();
      state.activeAction.pressed.add(uid);
      bossByChannel.set(interaction.channelId, state);
      return interaction.reply({ content: "✅ Registered.", ephemeral: true });
    }

    // ---- MODE: multi (многократный клик)
    if (mode === "multi") {
      state.activeAction.counts = state.activeAction.counts || new Map();
      const cur = state.activeAction.counts.get(uid) || 0;
      state.activeAction.counts.set(uid, cur + 1);
      bossByChannel.set(interaction.channelId, state);
      return interaction.reply({ content: `✅ ${cur + 1}`, ephemeral: true });
    }

    // ---- MODE: choice (A/B)
    if (mode === "choice") {
      if (!key) return interaction.reply({ content: "⚠️ Invalid choice.", ephemeral: true });
      state.activeAction.choice = state.activeAction.choice || new Map();
      state.activeAction.choice.set(uid, key);
      bossByChannel.set(interaction.channelId, state);
      return interaction.reply({ content: `✅ Picked: ${key}`, ephemeral: true });
    }

    // ---- MODE: tri (3 кнопки, собрать все)
    if (mode === "tri") {
      if (!key) return interaction.reply({ content: "⚠️ Invalid.", ephemeral: true });
      state.activeAction.pressed = state.activeAction.pressed || new Map();
      const set = state.activeAction.pressed.get(uid) || new Set();
      set.add(key);
      state.activeAction.pressed.set(uid, set);
      bossByChannel.set(interaction.channelId, state);
      return interaction.reply({ content: `✅ ${set.size}/3`, ephemeral: true });
    }

    // ---- MODE: quiz (final quiz)
    if (mode === "quiz") {
      if (!key) return interaction.reply({ content: "⚠️ Invalid.", ephemeral: true });
      state.activeAction.choice = state.activeAction.choice || new Map();
      state.activeAction.choice.set(uid, key);
      bossByChannel.set(interaction.channelId, state);
      return interaction.reply({ content: `✅ Picked: ${key}`, ephemeral: true });
    }

    // ---- MODE: combo (combo_defense)
    if (mode === "combo") {
      if (!key) return interaction.reply({ content: "⚠️ Invalid.", ephemeral: true });

      const seq = state.activeAction.comboSeq;
      if (!Array.isArray(seq) || seq.length < 4) {
        return interaction.reply({ content: "⚠️ Combo not ready.", ephemeral: true });
      }

      state.activeAction.comboProgress = state.activeAction.comboProgress || new Map();
      state.activeAction.comboFailed = state.activeAction.comboFailed || new Set();

      if (state.activeAction.comboFailed.has(uid)) {
        return interaction.reply({ content: "❌ You already failed the combo.", ephemeral: true });
      }

      const prog = state.activeAction.comboProgress.get(uid) || 0;
      const expected = seq[prog];

      if (key !== expected) {
        state.activeAction.comboFailed.add(uid);
        bossByChannel.set(interaction.channelId, state);
        return interaction.reply({ content: `❌ Wrong. Expected: ${expected}`, ephemeral: true });
      }

      const next = prog + 1;
      state.activeAction.comboProgress.set(uid, next);
      bossByChannel.set(interaction.channelId, state);

      if (next >= 4) return interaction.reply({ content: "✅ Combo completed!", ephemeral: true });
      return interaction.reply({ content: `✅ ${next}/4`, ephemeral: true });
    }

    return interaction.reply({ content: "⚠️ Unknown action type.", ephemeral: true });
  }

  // ----------------------------------------
  // 4) PVP buttons (если у тебя они есть)
  // customId: pvp:<key>:<action>
  // ----------------------------------------
  if (parts[0] === "pvp") {
    const key = parts[1];
    const action = parts[2];

    if (!key || !action) return interaction.reply({ content: "⚠️ Invalid button.", ephemeral: true });

    const st = pvpById.get(key);
    if (!st || st.done) return interaction.reply({ content: "⏳ This duel is no longer active.", ephemeral: true });

    // Тут не ломаемся: просто ставим done и отвечаем
    st.done = true;
    pvpById.set(key, st);
    return interaction.reply({ content: `✅ PVP action: ${action}`, ephemeral: true });
  }

  // ----------------------------------------
  // Fallback
  // ----------------------------------------
  return interaction.reply({ content: "⚠️ Unknown/expired button.", ephemeral: true });
};
