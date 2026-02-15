const { mobByChannel, bossByChannel } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { sleep, safeName } = require("../core/utils");

const {
  MAX_HITS,
  E_REIATSU,
  E_CE,
  BLEACH_BONUS_MAX,
  JJK_BONUS_MAX,
} = require("../config");

const { mobButtons } = require("../ui/components");
const { mobSpawnEmbed, mobResultEmbed } = require("../ui/embeds"); // если нет — сделай как у тебя. ниже есть fallback.

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMaxBonusForEvent(eventKey) {
  const bMax = typeof BLEACH_BONUS_MAX === "number" ? BLEACH_BONUS_MAX : 30;
  const jMax = typeof JJK_BONUS_MAX === "number" ? JJK_BONUS_MAX : 30;
  return eventKey === "bleach" ? bMax : jMax;
}

function currencyEmoji(eventKey) {
  return eventKey === "bleach" ? E_REIATSU : E_CE;
}

function fallbackEmbed(title, description) {
  return {
    title,
    description,
    color: 0x2b2d31,
  };
}

async function safeEdit(message, payload) {
  try { await message.edit(payload); } catch {}
}

async function spawnMob(channel, eventKey, opts = {}) {
  const withPing = Boolean(opts.withPing); // по умолчанию false
  const joinMs = typeof opts.joinMs === "number" ? opts.joinMs : 20_000;

  // Не мешаем боссу/другому мобу
  if (bossByChannel.has(channel.id)) {
    await channel.send("⚠️ A boss is active in this channel. Mob spawn cancelled.").catch(() => {});
    return;
  }
  if (mobByChannel.has(channel.id)) {
    await channel.send("⚠️ A mob is already active in this channel.").catch(() => {});
    return;
  }

  if (withPing && opts.pingRoleId) {
    await channel.send(`<@&${opts.pingRoleId}>`).catch(() => {});
  }

  const def = {
    event: eventKey,
    joinMs,
    // моб дает бонус и валюту
    rewardMin: eventKey === "bleach" ? 30 : 30,
    rewardMax: eventKey === "bleach" ? 75 : 75,
    bonusMin: 1,
    bonusMax: 4, // сколько % бонуса к шансу выжить на боссе
  };

  const state = {
    def,
    joining: true,
    participants: new Map(),
    messageId: null,
  };

  const embed = (typeof mobSpawnEmbed === "function")
    ? mobSpawnEmbed(eventKey, 0)
    : fallbackEmbed("Mob Encounter", `Event: **${eventKey}**\nPress **Join** to participate.`);

  const msg = await channel.send({ embeds: [embed], components: mobButtons(false) }).catch(() => null);
  if (!msg) return;

  state.messageId = msg.id;
  mobByChannel.set(channel.id, state);

  await sleep(joinMs);

  state.joining = false;
  mobByChannel.set(channel.id, state);
  await safeEdit(msg, { components: mobButtons(true) });

  if (state.participants.size === 0) {
    await channel.send("⏳ Mob join ended. No one joined.").catch(() => {});
    mobByChannel.delete(channel.id);
    return;
  }

  // РЕЗУЛЬТАТ: всем участникам выдаём немного валюты + mobBonus (капится)
  const maxBonus = getMaxBonusForEvent(eventKey);
  const emoji = currencyEmoji(eventKey);

  const results = [];

  for (const [uid, st] of state.participants.entries()) {
    const p = await getPlayer(uid);

    const addCurrency = randInt(def.rewardMin, def.rewardMax);
    const addBonus = randInt(def.bonusMin, def.bonusMax);

    if (eventKey === "bleach") p.bleach.reiatsu += addCurrency;
    else p.jjk.cursedEnergy += addCurrency;

    // mobBonus хранится в player как процентный бонус к шансам боссов
    // Если у тебя структура другая — скажи, я подстрою.
    const curBonus = Number(p[eventKey]?.mobBonus ?? 0);
    const nextBonus = Math.min(maxBonus, curBonus + addBonus);
    p[eventKey] = p[eventKey] || {};
    p[eventKey].mobBonus = nextBonus;

    await setPlayer(uid, p);

    results.push({
      uid,
      name: safeName(st.displayName),
      addCurrency,
      addBonus,
      totalBonus: nextBonus,
    });
  }

  const lines = results
    .slice(0, 25)
    .map((r) => `• <@${r.uid}>: ${emoji} **+${r.addCurrency}** • Bonus **+${r.addBonus}%** (total **${r.totalBonus}%**)`);

  const resEmbed = (typeof mobResultEmbed === "function")
    ? mobResultEmbed(eventKey, results)
    : fallbackEmbed(
        "✅ Mob cleared!",
        `Participants: **${results.length}**\n\n` +
          lines.join("\n") +
          (results.length > 25 ? `\n… and ${results.length - 25} more` : "")
      );

  await channel.send({ embeds: [resEmbed] }).catch(() => {});
  mobByChannel.delete(channel.id);
}

module.exports = { spawnMob };
