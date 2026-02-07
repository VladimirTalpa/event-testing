const { getRedis } = require("./redis");

const PLAYERS_KEY = "bleach:players";

function normalizePlayer(raw = {}) {
  const reiatsu = Number.isFinite(raw.reiatsu)
    ? raw.reiatsu
    : (Number.isFinite(raw.reatsu) ? raw.reatsu : 0);

  const items = raw.items && typeof raw.items === "object" ? raw.items : {};

  return {
    reiatsu,
    survivalBonus: Number.isFinite(raw.survivalBonus) ? raw.survivalBonus : 0,
    lastDaily: Number.isFinite(raw.lastDaily) ? raw.lastDaily : 0,
    items: {
      zanpakuto_basic: !!items.zanpakuto_basic,
      hollow_mask_fragment: !!items.hollow_mask_fragment,
      soul_reaper_cloak: !!items.soul_reaper_cloak,
      reiatsu_amplifier: !!items.reiatsu_amplifier,
      cosmetic_role: !!items.cosmetic_role,
    },
  };
}

async function getPlayer(userId) {
  const r = await getRedis();
  const raw = await r.hGet(PLAYERS_KEY, userId);
  if (!raw) {
    const fresh = normalizePlayer({});
    await r.hSet(PLAYERS_KEY, userId, JSON.stringify(fresh));
    return fresh;
  }
  try {
    return normalizePlayer(JSON.parse(raw));
  } catch {
    const fresh = normalizePlayer({});
    await r.hSet(PLAYERS_KEY, userId, JSON.stringify(fresh));
    return fresh;
  }
}

async function setPlayer(userId, obj) {
  const r = await getRedis();
  const p = normalizePlayer(obj);
  await r.hSet(PLAYERS_KEY, userId, JSON.stringify(p));
  return p;
}

async function getTopPlayers(limit = 10) {
  const r = await getRedis();
  const all = await r.hGetAll(PLAYERS_KEY);
  const rows = Object.entries(all).map(([userId, json]) => {
    let p = {};
    try { p = normalizePlayer(JSON.parse(json)); } catch {}
    return { userId, reiatsu: p.reiatsu || 0 };
  });
  rows.sort((a, b) => b.reiatsu - a.reiatsu);
  return rows.slice(0, limit);
}

module.exports = { normalizePlayer, getPlayer, setPlayer, getTopPlayers };
