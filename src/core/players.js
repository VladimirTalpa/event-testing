// src/core/players.js
const { initRedis, getRedis } = require("./redis");

const REDIS_PLAYERS_KEY = "events:players";
const REDIS_FALLBACK_KEYS = ["players", "playerData", "users"];

function normalizePlayer(raw = {}) {
  const ownedRoles = Array.isArray(raw.ownedRoles)
    ? raw.ownedRoles.filter(Boolean).map(String)
    : [];

  const bleach = raw.bleach && typeof raw.bleach === "object" ? raw.bleach : {};
  const jjk = raw.jjk && typeof raw.jjk === "object" ? raw.jjk : {};

  const bleachItems = bleach.items && typeof bleach.items === "object" ? bleach.items : {};
  const jjkItems = jjk.items && typeof jjk.items === "object" ? jjk.items : {};

  const jjkMaterials = jjk.materials && typeof jjk.materials === "object" ? jjk.materials : {};

  return {
    drako: Number.isFinite(raw.drako) ? raw.drako : 0,
    ownedRoles: [...new Set(ownedRoles)],

    bleach: {
      reiatsu: Number.isFinite(bleach.reiatsu)
        ? bleach.reiatsu
        : (Number.isFinite(raw.reiatsu) ? raw.reiatsu : 0),
      survivalBonus: Number.isFinite(bleach.survivalBonus)
        ? bleach.survivalBonus
        : (Number.isFinite(raw.survivalBonus) ? raw.survivalBonus : 0),
      lastDaily: Number.isFinite(bleach.lastDaily)
        ? bleach.lastDaily
        : (Number.isFinite(raw.lastDaily) ? raw.lastDaily : 0),
      items: {
        zanpakuto_basic: !!bleachItems.zanpakuto_basic,
        hollow_mask_fragment: !!bleachItems.hollow_mask_fragment,
        soul_reaper_cloak: !!bleachItems.soul_reaper_cloak,
        reiatsu_amplifier: !!bleachItems.reiatsu_amplifier,
        cosmetic_role: !!bleachItems.cosmetic_role,
      },
    },

    jjk: {
      cursedEnergy: Number.isFinite(jjk.cursedEnergy) ? jjk.cursedEnergy : 0,
      survivalBonus: Number.isFinite(jjk.survivalBonus) ? jjk.survivalBonus : 0,

      // crafting materials (future use)
      materials: {
        cursed_shard: Number.isFinite(jjkMaterials.cursed_shard) ? jjkMaterials.cursed_shard : 0,
      },

      items: {
        black_flash_manual: !!jjkItems.black_flash_manual,
        domain_charm: !!jjkItems.domain_charm,
        cursed_tool: !!jjkItems.cursed_tool,
        reverse_talisman: !!jjkItems.reverse_talisman,
        binding_vow_seal: !!jjkItems.binding_vow_seal,
      },
    },
  };
}

async function getPlayer(userId) {
  await initRedis();
  const redis = getRedis();

  let raw = await redis.hGet(REDIS_PLAYERS_KEY, userId);

  if (!raw) {
    for (const k of REDIS_FALLBACK_KEYS) {
      const oldRaw = await redis.hGet(k, userId);
      if (oldRaw) {
        raw = oldRaw;
        try {
          const migrated = normalizePlayer(JSON.parse(oldRaw));
          await redis.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(migrated));
        } catch {}
        break;
      }
    }
  }

  if (!raw) {
    const fresh = normalizePlayer({});
    await redis.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(fresh));
    return fresh;
  }

  try {
    return normalizePlayer(JSON.parse(raw));
  } catch {
    const fresh = normalizePlayer({});
    await redis.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(fresh));
    return fresh;
  }
}

async function setPlayer(userId, obj) {
  await initRedis();
  const redis = getRedis();
  const p = normalizePlayer(obj);
  await redis.hSet(REDIS_PLAYERS_KEY, userId, JSON.stringify(p));
  return p;
}

async function getTopPlayers(eventKey, limit = 10) {
  await initRedis();
  const redis = getRedis();
  const all = await redis.hGetAll(REDIS_PLAYERS_KEY);

  const rows = Object.entries(all).map(([userId, json]) => {
    let p = {};
    try { p = normalizePlayer(JSON.parse(json)); } catch {}

    let score = 0;
    if (eventKey === "bleach") score = p.bleach?.reiatsu || 0;
    if (eventKey === "jjk") score = p.jjk?.cursedEnergy || 0;

    return { userId, score };
  });

  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}

module.exports = {
  normalizePlayer,
  getPlayer,
  setPlayer,
  getTopPlayers,
  REDIS_PLAYERS_KEY,
};
