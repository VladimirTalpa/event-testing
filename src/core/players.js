// src/core/players.js
const { initRedis, getRedis } = require("./redis");
const { uid } = require("./utils");

const REDIS_PLAYERS_KEY = "rpg:players";
const REDIS_FALLBACK_KEYS = ["events:players", "players", "playerData", "users"];

function freshPlayer() {
  return {
    // currencies
    bleach: {
      reiatsu: 0,
      shards: 0,
    },
    jjk: {
      cursedEnergy: 0,
      shards: 0,
    },
    // expedition keys (global)
    keys: 0,

    // inventory
    cards: [], // array of card instances
    gears: [], // later
    ownedRoles: [], // kept from old system

    // daily systems
    expeditions: {
      dailyUsed: 0,
      lastReset: 0, // timestamp of last daily reset
      active: null, // { id, status, startedAt, startAt, nextTickAt, partyCardIds: [], log: [] }
    },
  };
}

/**
 * Card instance shape:
 * {
 *   id, charKey, anime, rarity, role,
 *   level, xp, stars, evolution, // evolution = charKey of evolved form or null
 *   base: {hp,atk,def},
 *   status: "idle" | "expedition" | "dead",
 *   gear: { weaponId: null, armorId: null }
 * }
 */

function normalizePlayer(raw = {}) {
  const p = freshPlayer();

  // ---- migrate old ownedRoles
  const ownedRoles = Array.isArray(raw.ownedRoles) ? raw.ownedRoles.filter(Boolean).map(String) : [];
  p.ownedRoles = [...new Set(ownedRoles)];

  // ---- migrate old economy (your previous bot)
  // old: raw.drako, raw.bleach.reiatsu, raw.jjk.cursedEnergy, raw.jjk.materials.cursedShards, expeditionKeys...
  // We keep only what matters for new RPG:
  if (raw.bleach && typeof raw.bleach === "object") {
    if (Number.isFinite(raw.bleach.reiatsu)) p.bleach.reiatsu = raw.bleach.reiatsu;
  }
  if (raw.jjk && typeof raw.jjk === "object") {
    if (Number.isFinite(raw.jjk.cursedEnergy)) p.jjk.cursedEnergy = raw.jjk.cursedEnergy;
  }

  // shards migration
  // from old: jjk.materials.cursedShards
  const jjkMat = raw?.jjk?.materials && typeof raw.jjk.materials === "object" ? raw.jjk.materials : {};
  if (Number.isFinite(jjkMat.cursedShards)) p.jjk.shards = Math.max(0, Math.floor(jjkMat.cursedShards));

  const expKeysOld = Number.isFinite(jjkMat.expeditionKeys) ? jjkMat.expeditionKeys : 0;
  if (Number.isFinite(expKeysOld)) p.keys = Math.max(0, Math.floor(expKeysOld));

  // allow direct new fields if already present
  if (raw.bleach && Number.isFinite(raw.bleach.shards)) p.bleach.shards = Math.max(0, Math.floor(raw.bleach.shards));
  if (raw.jjk && Number.isFinite(raw.jjk.shards)) p.jjk.shards = Math.max(0, Math.floor(raw.jjk.shards));
  if (Number.isFinite(raw.keys)) p.keys = Math.max(0, Math.floor(raw.keys));

  // cards
  if (Array.isArray(raw.cards)) {
    p.cards = raw.cards
      .filter((c) => c && typeof c === "object")
      .map((c) => ({
        id: String(c.id || uid()),
        charKey: String(c.charKey || "unknown"),
        anime: c.anime === "bleach" ? "bleach" : (c.anime === "jjk" ? "jjk" : "bleach"),
        rarity: String(c.rarity || "Common"),
        role: String(c.role || "DPS"),
        level: Number.isFinite(c.level) ? Math.max(1, Math.floor(c.level)) : 1,
        xp: Number.isFinite(c.xp) ? Math.max(0, Math.floor(c.xp)) : 0,
        stars: Number.isFinite(c.stars) ? Math.max(0, Math.floor(c.stars)) : 0,
        evolution: c.evolution ? String(c.evolution) : null,
        base: {
          hp: Number.isFinite(c.base?.hp) ? Math.max(1, Math.floor(c.base.hp)) : 1,
          atk: Number.isFinite(c.base?.atk) ? Math.max(1, Math.floor(c.base.atk)) : 1,
          def: Number.isFinite(c.base?.def) ? Math.max(0, Math.floor(c.base.def)) : 0,
        },
        status: c.status === "expedition" ? "expedition" : "idle",
        gear: {
          weaponId: c.gear?.weaponId ? String(c.gear.weaponId) : null,
          armorId: c.gear?.armorId ? String(c.gear.armorId) : null,
        },
      }));
  }

  // gears (later expanded)
  if (Array.isArray(raw.gears)) {
    p.gears = raw.gears
      .filter((g) => g && typeof g === "object")
      .map((g) => ({ ...g, id: String(g.id || uid()) }));
  }

  // expeditions
  if (raw.expeditions && typeof raw.expeditions === "object") {
    p.expeditions.dailyUsed = Number.isFinite(raw.expeditions.dailyUsed) ? raw.expeditions.dailyUsed : 0;
    p.expeditions.lastReset = Number.isFinite(raw.expeditions.lastReset) ? raw.expeditions.lastReset : 0;
    p.expeditions.active = raw.expeditions.active && typeof raw.expeditions.active === "object" ? raw.expeditions.active : null;
  }

  return p;
}

async function getPlayer(userId) {
  await initRedis();
  const redis = getRedis();

  let raw = await redis.hGet(REDIS_PLAYERS_KEY, userId);

  // migrate from older keys
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

module.exports = {
  getPlayer,
  setPlayer,
  normalizePlayer,
  REDIS_PLAYERS_KEY,
};
