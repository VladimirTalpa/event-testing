const { initRedis, getRedis } = require("./redis");
const { getPlayer, setPlayer } = require("./players");
const { getCardById, cardStatsAtLevel, cardPower } = require("../data/cards");

const REDIS_CLANS_KEY = "events:clans";
const MAX_CLAN_MEMBERS = 30;
const CLAN_CREATE_COST_DRAKO = 1500;
const CLAN_BOSS_DURATION_MS = 30 * 60 * 1000;
const CLAN_BOSS_HIT_CD_MS = 8 * 1000;

function now() {
  return Date.now();
}

function normalizeWeekly(weekly = {}) {
  return {
    weekKey: String(weekly.weekKey || ""),
    totalDamage: Math.max(0, Math.floor(Number(weekly.totalDamage || 0))),
    bossClears: Math.max(0, Math.floor(Number(weekly.bossClears || 0))),
    activity: Math.max(0, Math.floor(Number(weekly.activity || 0))),
  };
}

function normalizeClan(raw = {}) {
  const members = Array.isArray(raw.members) ? raw.members.map(String).filter(Boolean) : [];
  const activeBossRaw = raw.activeBoss && typeof raw.activeBoss === "object" ? raw.activeBoss : null;
  const activeBoss = activeBossRaw
    ? {
        id: String(activeBossRaw.id || "clan_raid"),
        eventKey: activeBossRaw.eventKey === "jjk" ? "jjk" : "bleach",
        name: String(activeBossRaw.name || "Clan Boss"),
        hpMax: Math.max(1, Math.floor(Number(activeBossRaw.hpMax || 1))),
        hpCurrent: Math.max(0, Math.floor(Number(activeBossRaw.hpCurrent || activeBossRaw.hpMax || 0))),
        startedAt: Math.max(0, Math.floor(Number(activeBossRaw.startedAt || 0))),
        endsAt: Math.max(0, Math.floor(Number(activeBossRaw.endsAt || 0))),
        damageByUser: Object.fromEntries(
          Object.entries(activeBossRaw.damageByUser || {})
            .map(([k, v]) => [String(k), Math.max(0, Math.floor(Number(v || 0)))])
            .filter(([k]) => !!k)
        ),
        lastHitAtByUser: Object.fromEntries(
          Object.entries(activeBossRaw.lastHitAtByUser || {})
            .map(([k, v]) => [String(k), Math.max(0, Math.floor(Number(v || 0)))])
            .filter(([k]) => !!k)
        ),
      }
    : null;

  return {
    id: String(raw.id || ""),
    name: String(raw.name || "Unnamed Clan").trim().slice(0, 32),
    icon: String(raw.icon || "").trim().slice(0, 64),
    ownerId: String(raw.ownerId || ""),
    officers: Array.isArray(raw.officers) ? raw.officers.map(String).filter(Boolean) : [],
    members: [...new Set(members)],
    createdAt: Math.max(0, Math.floor(Number(raw.createdAt || 0))),
    weekly: normalizeWeekly(raw.weekly),
    activeBoss,
  };
}

function currentWeekKey(ts = now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const jan1 = new Date(Date.UTC(y, 0, 1));
  const days = Math.floor((d - jan1) / 86400000);
  const week = Math.floor(days / 7) + 1;
  return `${y}-W${String(week).padStart(2, "0")}`;
}

function ensureWeekly(clan) {
  const wk = currentWeekKey();
  if (!clan.weekly || clan.weekly.weekKey !== wk) {
    clan.weekly = { weekKey: wk, totalDamage: 0, bossClears: 0, activity: 0 };
  }
  return clan;
}

async function listClans() {
  await initRedis();
  const redis = getRedis();
  const all = await redis.hGetAll(REDIS_CLANS_KEY);
  const rows = [];
  for (const [id, json] of Object.entries(all || {})) {
    try {
      const c = normalizeClan(JSON.parse(json));
      if (!c.id) c.id = String(id);
      rows.push(ensureWeekly(c));
    } catch {}
  }
  return rows;
}

async function getClan(clanId) {
  await initRedis();
  const redis = getRedis();
  const raw = await redis.hGet(REDIS_CLANS_KEY, String(clanId));
  if (!raw) return null;
  try {
    const c = normalizeClan(JSON.parse(raw));
    return ensureWeekly(c);
  } catch {
    return null;
  }
}

async function setClan(clan) {
  await initRedis();
  const redis = getRedis();
  const c = ensureWeekly(normalizeClan(clan));
  await redis.hSet(REDIS_CLANS_KEY, c.id, JSON.stringify(c));
  return c;
}

function normalizeClanName(name) {
  return String(name || "").trim().toLowerCase();
}

async function findClanByName(name) {
  const target = normalizeClanName(name);
  if (!target) return null;
  const rows = await listClans();
  return rows.find((c) => normalizeClanName(c.name) === target) || null;
}

async function createClan({ ownerId, name, icon = "" }) {
  const owner = await getPlayer(ownerId);
  if (owner.clanId) return { ok: false, error: "You are already in a clan." };
  const clean = String(name || "").trim();
  if (clean.length < 3 || clean.length > 32) return { ok: false, error: "Clan name must be 3-32 chars." };
  if (owner.drako < CLAN_CREATE_COST_DRAKO) {
    return { ok: false, error: `Need ${CLAN_CREATE_COST_DRAKO} Drako to create a clan.` };
  }
  const exists = await findClanByName(clean);
  if (exists) return { ok: false, error: "Clan name already exists." };

  const id = `clan_${Math.random().toString(36).slice(2, 11)}${Date.now().toString(36).slice(-3)}`;
  const clan = normalizeClan({
    id,
    name: clean,
    icon,
    ownerId: String(ownerId),
    officers: [],
    members: [String(ownerId)],
    createdAt: now(),
    weekly: { weekKey: currentWeekKey(), totalDamage: 0, bossClears: 0, activity: 0 },
    activeBoss: null,
  });

  owner.drako -= CLAN_CREATE_COST_DRAKO;
  owner.clanId = clan.id;
  owner.clanJoinedAt = now();
  await setPlayer(ownerId, owner);
  await setClan(clan);
  return { ok: true, clan };
}

async function joinClan({ userId, clanName }) {
  const player = await getPlayer(userId);
  if (player.clanId) return { ok: false, error: "You are already in a clan." };
  const clan = await findClanByName(clanName);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (clan.members.length >= MAX_CLAN_MEMBERS) return { ok: false, error: "Clan is full." };
  if (!clan.members.includes(String(userId))) clan.members.push(String(userId));
  clan.weekly.activity += 1;
  await setClan(clan);
  player.clanId = clan.id;
  player.clanJoinedAt = now();
  await setPlayer(userId, player);
  return { ok: true, clan };
}

async function leaveClan({ userId }) {
  const player = await getPlayer(userId);
  if (!player.clanId) return { ok: false, error: "You are not in a clan." };
  const clan = await getClan(player.clanId);
  if (!clan) {
    player.clanId = "";
    player.clanJoinedAt = 0;
    await setPlayer(userId, player);
    return { ok: false, error: "Clan not found. Local membership cleared." };
  }
  if (clan.ownerId === String(userId) && clan.members.length > 1) {
    return { ok: false, error: "Owner cannot leave while clan has members. Transfer ownership first." };
  }
  clan.members = clan.members.filter((x) => String(x) !== String(userId));
  clan.officers = clan.officers.filter((x) => String(x) !== String(userId));
  if (!clan.members.length) {
    await initRedis();
    const redis = getRedis();
    await redis.hDel(REDIS_CLANS_KEY, clan.id);
  } else {
    if (clan.ownerId === String(userId)) clan.ownerId = clan.members[0];
    await setClan(clan);
  }
  player.clanId = "";
  player.clanJoinedAt = 0;
  await setPlayer(userId, player);
  return { ok: true };
}

function masteryMultiplier(stageNum) {
  if (stageNum >= 3) return 1.2;
  if (stageNum >= 2) return 1.1;
  return 1.0;
}

function strongestCardDamage(player, eventKey) {
  const cardsMap = eventKey === "jjk" ? (player.cards?.jjk || {}) : (player.cards?.bleach || {});
  const levels = eventKey === "jjk" ? (player.cardLevels?.jjk || {}) : (player.cardLevels?.bleach || {});
  const mastery = eventKey === "jjk" ? (player.cardMastery?.jjk || {}) : (player.cardMastery?.bleach || {});
  let best = 0;
  for (const [cardId, amtRaw] of Object.entries(cardsMap)) {
    if (Math.max(0, Number(amtRaw || 0)) <= 0) continue;
    const card = getCardById(eventKey, cardId);
    if (!card) continue;
    const lv = Math.max(1, Number(levels[cardId] || 1));
    const stats = cardStatsAtLevel(card, lv);
    const base = Math.max(1, cardPower(stats));
    const stage = Math.max(1, Number(mastery[cardId] || 1));
    const p = Math.floor(base * masteryMultiplier(stage));
    if (p > best) best = p;
  }
  return best;
}

async function startClanBoss({ userId, eventKey }) {
  const p = await getPlayer(userId);
  if (!p.clanId) return { ok: false, error: "Join a clan first." };
  const clan = await getClan(p.clanId);
  if (!clan) return { ok: false, error: "Clan not found." };
  const isLeader = clan.ownerId === String(userId);
  const isOfficer = clan.officers.includes(String(userId));
  if (!isLeader && !isOfficer) return { ok: false, error: "Only owner/officers can start clan boss." };
  if (clan.activeBoss && clan.activeBoss.hpCurrent > 0 && clan.activeBoss.endsAt > now()) {
    return { ok: false, error: "A clan boss is already active." };
  }
  const hpMax = eventKey === "jjk" ? 180000 : 170000;
  clan.activeBoss = {
    id: `clanboss_${eventKey}_${Date.now().toString(36)}`,
    eventKey: eventKey === "jjk" ? "jjk" : "bleach",
    name: eventKey === "jjk" ? "Cursed Sovereign" : "Hollow Emperor",
    hpMax,
    hpCurrent: hpMax,
    startedAt: now(),
    endsAt: now() + CLAN_BOSS_DURATION_MS,
    damageByUser: {},
    lastHitAtByUser: {},
  };
  clan.weekly.activity += 1;
  await setClan(clan);
  return { ok: true, clan };
}

async function hitClanBoss({ userId, cardEventKey }) {
  const player = await getPlayer(userId);
  if (!player.clanId) return { ok: false, error: "Join a clan first." };
  const clan = await getClan(player.clanId);
  if (!clan || !clan.activeBoss) return { ok: false, error: "No active clan boss." };
  const boss = clan.activeBoss;
  if (boss.endsAt <= now() || boss.hpCurrent <= 0) return { ok: false, error: "Clan boss is no longer active." };
  if (!clan.members.includes(String(userId))) return { ok: false, error: "You are not a member of this clan." };
  const effectiveEvent = boss.eventKey;
  const chosenEvent = cardEventKey === "jjk" ? "jjk" : "bleach";
  if (chosenEvent !== effectiveEvent) return { ok: false, error: `This boss only accepts ${effectiveEvent.toUpperCase()} cards.` };

  const lastHit = Math.max(0, Number(boss.lastHitAtByUser[userId] || 0));
  const waitMs = CLAN_BOSS_HIT_CD_MS - (now() - lastHit);
  if (waitMs > 0) return { ok: false, error: `Cooldown active (${Math.ceil(waitMs / 1000)}s).` };

  const base = strongestCardDamage(player, chosenEvent);
  if (base <= 0) return { ok: false, error: "No valid card found for this event." };
  const dmg = Math.max(1, Math.floor(base * (0.88 + Math.random() * 0.34)));
  boss.lastHitAtByUser[userId] = now();
  boss.damageByUser[userId] = Math.max(0, Number(boss.damageByUser[userId] || 0)) + dmg;
  boss.hpCurrent = Math.max(0, boss.hpCurrent - dmg);
  clan.weekly.totalDamage += dmg;
  clan.weekly.activity += 1;

  let cleared = false;
  let rewardRows = [];
  if (boss.hpCurrent <= 0) {
    cleared = true;
    clan.weekly.bossClears += 1;
    const totalDamage = Math.max(1, Object.values(boss.damageByUser).reduce((a, b) => a + Number(b || 0), 0));
    const basePool = chosenEvent === "jjk" ? 8000 : 7000;
    const drakoPool = 500;
    for (const uid of clan.members) {
      const part = Math.max(0, Number(boss.damageByUser[uid] || 0));
      const share = part / totalDamage;
      const eventReward = Math.floor(basePool * share) + (part > 0 ? 120 : 0);
      const drakoReward = Math.floor(drakoPool * share) + (part > 0 ? 20 : 0);
      const pp = await getPlayer(uid);
      if (chosenEvent === "jjk") pp.jjk.cursedEnergy += eventReward;
      else pp.bleach.reiatsu += eventReward;
      pp.drako += drakoReward;
      await setPlayer(uid, pp);
      rewardRows.push({ userId: uid, damage: part, eventReward, drakoReward });
    }
    clan.activeBoss = null;
  }

  await setClan(clan);
  return { ok: true, clan, dmg, cleared, rewardRows };
}

async function getClanWeeklyLeaderboard(limit = 10) {
  const clans = await listClans();
  for (const c of clans) ensureWeekly(c);
  const rows = clans
    .map((c) => {
      const w = c.weekly || {};
      const score = Math.floor((w.totalDamage || 0) + (w.activity || 0) * 220 + (w.bossClears || 0) * 10000);
      return {
        id: c.id,
        name: c.name,
        icon: c.icon || "",
        members: c.members.length,
        damage: w.totalDamage || 0,
        activity: w.activity || 0,
        clears: w.bossClears || 0,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
  return rows.slice(0, Math.max(1, Math.floor(Number(limit || 10))));
}

module.exports = {
  MAX_CLAN_MEMBERS,
  CLAN_CREATE_COST_DRAKO,
  getClan,
  listClans,
  findClanByName,
  createClan,
  joinClan,
  leaveClan,
  startClanBoss,
  hitClanBoss,
  getClanWeeklyLeaderboard,
};
