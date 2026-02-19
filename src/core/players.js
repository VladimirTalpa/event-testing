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
  const cardClashDailyRaw = raw.cardClashDaily && typeof raw.cardClashDaily === "object" ? raw.cardClashDaily : {};
  const cardsRaw = raw.cards && typeof raw.cards === "object" ? raw.cards : {};
  const bleachCardsRaw = cardsRaw.bleach && typeof cardsRaw.bleach === "object" ? cardsRaw.bleach : {};
  const jjkCardsRaw = cardsRaw.jjk && typeof cardsRaw.jjk === "object" ? cardsRaw.jjk : {};
  const cardLevelsRaw = raw.cardLevels && typeof raw.cardLevels === "object" ? raw.cardLevels : {};
  const bleachCardLevelsRaw = cardLevelsRaw.bleach && typeof cardLevelsRaw.bleach === "object" ? cardLevelsRaw.bleach : {};
  const jjkCardLevelsRaw = cardLevelsRaw.jjk && typeof cardLevelsRaw.jjk === "object" ? cardLevelsRaw.jjk : {};
  const cardMasteryRaw = raw.cardMastery && typeof raw.cardMastery === "object" ? raw.cardMastery : {};
  const bleachCardMasteryRaw = cardMasteryRaw.bleach && typeof cardMasteryRaw.bleach === "object" ? cardMasteryRaw.bleach : {};
  const jjkCardMasteryRaw = cardMasteryRaw.jjk && typeof cardMasteryRaw.jjk === "object" ? cardMasteryRaw.jjk : {};
  const duoCardsRaw = raw.duoCards && typeof raw.duoCards === "object" ? raw.duoCards : {};
  const bleachDuoCardsRaw = duoCardsRaw.bleach && typeof duoCardsRaw.bleach === "object" ? duoCardsRaw.bleach : {};
  const jjkDuoCardsRaw = duoCardsRaw.jjk && typeof duoCardsRaw.jjk === "object" ? duoCardsRaw.jjk : {};
  const cursedShards =
    Number.isFinite(jjkMaterials.cursedShards) ? jjkMaterials.cursedShards :
    (Number.isFinite(jjk.cursedShards) ? jjk.cursedShards : 0);

  const expeditionKeys =
    Number.isFinite(jjkMaterials.expeditionKeys) ? jjkMaterials.expeditionKeys :
    (Number.isFinite(jjk.expeditionKeys) ? jjk.expeditionKeys : 0);

  return {
    drako: Number.isFinite(raw.drako) ? raw.drako : 0,
    clanId: String(raw.clanId || ""),
    clanJoinedAt: Math.max(0, Math.floor(Number(raw.clanJoinedAt || 0))),
    ownedRoles: [...new Set(ownedRoles)],
    cardClashDaily: {
      day: typeof cardClashDailyRaw.day === "string" ? cardClashDailyRaw.day : "",
      used: Math.max(0, Math.floor(Number(cardClashDailyRaw.used || 0))),
    },

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

    cards: {
      bleach: Object.fromEntries(
        Object.entries(bleachCardsRaw)
          .map(([k, v]) => [String(k), Math.max(0, Math.floor(Number(v || 0)))])
          .filter(([k, v]) => !!k && v > 0)
      ),
      jjk: Object.fromEntries(
        Object.entries(jjkCardsRaw)
          .map(([k, v]) => [String(k), Math.max(0, Math.floor(Number(v || 0)))])
          .filter(([k, v]) => !!k && v > 0)
      ),
    },

    cardLevels: {
      bleach: Object.fromEntries(
        Object.entries(bleachCardLevelsRaw)
          .map(([k, v]) => [String(k), Math.max(1, Math.floor(Number(v || 1)))])
          .filter(([k, v]) => !!k && v >= 1)
      ),
      jjk: Object.fromEntries(
        Object.entries(jjkCardLevelsRaw)
          .map(([k, v]) => [String(k), Math.max(1, Math.floor(Number(v || 1)))])
          .filter(([k, v]) => !!k && v >= 1)
      ),
    },
    cardMastery: {
      bleach: Object.fromEntries(
        Object.entries(bleachCardMasteryRaw)
          .map(([k, v]) => [String(k), Math.max(1, Math.min(3, Math.floor(Number(v || 1))))])
          .filter(([k, v]) => !!k && v >= 1)
      ),
      jjk: Object.fromEntries(
        Object.entries(jjkCardMasteryRaw)
          .map(([k, v]) => [String(k), Math.max(1, Math.min(3, Math.floor(Number(v || 1))))])
          .filter(([k, v]) => !!k && v >= 1)
      ),
    },
    duoCards: {
      bleach: Object.fromEntries(
        Object.entries(bleachDuoCardsRaw)
          .map(([k, v]) => [String(k), Math.max(0, Math.floor(Number(v || 0)))])
          .filter(([k, v]) => !!k && v > 0)
      ),
      jjk: Object.fromEntries(
        Object.entries(jjkDuoCardsRaw)
          .map(([k, v]) => [String(k), Math.max(0, Math.floor(Number(v || 0)))])
          .filter(([k, v]) => !!k && v > 0)
      ),
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
