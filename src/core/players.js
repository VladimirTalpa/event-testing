const { initRedis, getRedis } = require("./redis");

const REDIS_PLAYERS_KEY = "events:players";
const REDIS_FALLBACK_KEYS = ["players", "playerData", "users"];

function normalizeGear(raw = {}) {
  return {
    id: String(raw.id || ""),
    type: raw.type === "weapon" ? "weapon" : "armor",
    rarity: raw.rarity || "Common",
    bonusAtk: Number.isFinite(raw.bonusAtk) ? raw.bonusAtk : 0,
    bonusHp: Number.isFinite(raw.bonusHp) ? raw.bonusHp : 0,
    equippedTo: raw.equippedTo ? String(raw.equippedTo) : null, // cardInstanceId
  };
}

function normalizeCardInstance(raw = {}) {
  return {
    instanceId: String(raw.instanceId || ""),
    cardId: String(raw.cardId || ""),
    level: Number.isFinite(raw.level) ? raw.level : 1,
    xp: Number.isFinite(raw.xp) ? raw.xp : 0,
    stars: Number.isFinite(raw.stars) ? raw.stars : 0, // +1 star each 10 lv
    dead: !!raw.dead,
    status: raw.status || "idle", // idle / expedition / dead
    weaponGearId: raw.weaponGearId ? String(raw.weaponGearId) : null,
    armorGearId: raw.armorGearId ? String(raw.armorGearId) : null,
  };
}

function normalizeExpedition(raw = {}) {
  return {
    active: !!raw.active,
    startedAt: Number.isFinite(raw.startedAt) ? raw.startedAt : 0,
    startAt: Number.isFinite(raw.startAt) ? raw.startAt : 0, // starts after 1 hour
    channelId: raw.channelId ? String(raw.channelId) : null,
    messageId: raw.messageId ? String(raw.messageId) : null,
    ticksDone: Number.isFinite(raw.ticksDone) ? raw.ticksDone : 0,
    party: Array.isArray(raw.party) ? raw.party.map(String).slice(0, 3) : [], // cardInstanceIds
    log: Array.isArray(raw.log) ? raw.log.slice(0, 20) : [],
  };
}

function normalizePlayer(raw = {}) {
  const ownedRoles = Array.isArray(raw.ownedRoles)
    ? raw.ownedRoles.filter(Boolean).map(String)
    : [];

  const bleach = raw.bleach && typeof raw.bleach === "object" ? raw.bleach : {};
  const jjk = raw.jjk && typeof raw.jjk === "object" ? raw.jjk : {};

  const bleachItems = bleach.items && typeof bleach.items === "object" ? bleach.items : {};
  const jjkItems = jjk.items && typeof jjk.items === "object" ? jjk.items : {};

  const jjkMaterials = jjk.materials && typeof jjk.materials === "object" ? jjk.materials : {};
  const cursedShards =
    Number.isFinite(jjkMaterials.cursedShards) ? jjkMaterials.cursedShards :
    (Number.isFinite(jjk.cursedShards) ? jjk.cursedShards : 0);

  const expeditionKeys =
    Number.isFinite(jjkMaterials.expeditionKeys) ? jjkMaterials.expeditionKeys :
    (Number.isFinite(jjk.expeditionKeys) ? jjk.expeditionKeys : 0);

  // NEW shards (separate from jjk materials)
  const shards = raw.shards && typeof raw.shards === "object" ? raw.shards : {};
  const bleachShards = Number.isFinite(shards.bleach) ? shards.bleach : 0;
  const jjkShards2 = Number.isFinite(shards.jjk) ? shards.jjk : cursedShards; // keep compatibility

  // NEW cards
  const cards = Array.isArray(raw.cards) ? raw.cards.map(normalizeCardInstance) : [];
  const gears = Array.isArray(raw.gears) ? raw.gears.map(normalizeGear) : [];

  // pack inventory (counts)
  const packs = raw.packs && typeof raw.packs === "object" ? raw.packs : {};
  const basicPacks = Number.isFinite(packs.basic) ? packs.basic : 0;
  const legendaryPacks = Number.isFinite(packs.legendary) ? packs.legendary : 0;

  const titles = Array.isArray(raw.titles) ? raw.titles.map(String) : [];
  const equippedTitle = raw.equippedTitle ? String(raw.equippedTitle) : null;

  const expedition = normalizeExpedition(raw.expedition || {});

  const daily = raw.daily && typeof raw.daily === "object" ? raw.daily : {};
  const dailyExpeditionsUsed = Number.isFinite(daily.expeditionsUsed) ? daily.expeditionsUsed : 0;
  const dailyResetAt = Number.isFinite(daily.resetAt) ? daily.resetAt : 0;

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
      materials: {
        cursedShards: Math.max(0, Math.floor(cursedShards)),
        expeditionKeys: Math.max(0, Math.floor(expeditionKeys)),
      },
      items: {
        black_flash_manual: !!jjkItems.black_flash_manual,
        domain_charm: !!jjkItems.domain_charm,
        cursed_tool: !!jjkItems.cursed_tool,
        reverse_talisman: !!jjkItems.reverse_talisman,
        binding_vow_seal: !!jjkItems.binding_vow_seal,
      },
    },

    // NEW
    shards: {
      bleach: Math.max(0, Math.floor(bleachShards)),
      jjk: Math.max(0, Math.floor(jjkShards2)),
    },

    packs: {
      basic: Math.max(0, Math.floor(basicPacks)),
      legendary: Math.max(0, Math.floor(legendaryPacks)),
    },

    cards,
    gears,

    titles,
    equippedTitle,

    expedition,

    daily: {
      expeditionsUsed: Math.max(0, Math.floor(dailyExpeditionsUsed)),
      resetAt: Math.max(0, Math.floor(dailyResetAt)),
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
