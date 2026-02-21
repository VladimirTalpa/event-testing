const { initRedis, getRedis } = require("./redis");
const { getPlayer, setPlayer } = require("./players");
const { getCardById, cardStatsAtLevel, cardPower, getFusionRecipesForEvent, getDuoCardFromRecipe } = require("../data/cards");

const REDIS_CLANS_KEY = "events:clans";
const MAX_CLAN_MEMBERS = 30;
const CLAN_CREATE_COST_DRAKO = 1500;
const CLAN_BOSS_DURATION_MS = 30 * 60 * 1000;
const CLAN_BOSS_HIT_CD_MS = 8 * 1000;
const REQUEST_EXPIRE_MS = 24 * 60 * 60 * 1000;

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

function normalizeTicketArray(v) {
  const arr = Array.isArray(v) ? v : [];
  return arr
    .map((x) => ({
      userId: String(x?.userId || ""),
      at: Math.max(0, Math.floor(Number(x?.at || 0))),
      by: String(x?.by || ""),
    }))
    .filter((x) => !!x.userId);
}

function cleanupTickets(clan) {
  const cutoff = now() - REQUEST_EXPIRE_MS;
  clan.joinRequests = (clan.joinRequests || []).filter((x) => x.at >= cutoff);
  clan.invites = (clan.invites || []).filter((x) => x.at >= cutoff);
  return clan;
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

  return cleanupTickets({
    id: String(raw.id || ""),
    name: String(raw.name || "Unnamed Clan").trim().slice(0, 32),
    icon: String(raw.icon || "").trim().slice(0, 512),
    ownerId: String(raw.ownerId || ""),
    officers: Array.isArray(raw.officers) ? raw.officers.map(String).filter(Boolean) : [],
    members: [...new Set(members)],
    joinRequests: normalizeTicketArray(raw.joinRequests),
    invites: normalizeTicketArray(raw.invites),
    createdAt: Math.max(0, Math.floor(Number(raw.createdAt || 0))),
    weekly: normalizeWeekly(raw.weekly),
    activeBoss,
  });
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
  return cleanupTickets(clan);
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
  const raw = String(name || "").toLowerCase().normalize("NFKC");
  try {
    return raw
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .replace(/\s+/g, " ");
  } catch {
    return raw
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }
}

function normalizeClanSlug(name) {
  return normalizeClanName(name).replace(/\s+/g, "");
}

function cleanClanNameForDisplay(name) {
  const s = String(name || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/discord\.gg\/\S+/gi, "")
    .replace(/discord\.com\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return s || "Unnamed Clan";
}

async function findClanByName(name) {
  const target = normalizeClanName(name);
  const targetSlug = normalizeClanSlug(name);
  if (!target) return null;
  const rows = await listClans();
  const exact = rows.find((c) => {
    const n = normalizeClanName(c.name);
    const s = normalizeClanSlug(c.name);
    return n === target || s === targetSlug;
  });
  if (exact) return exact;

  const starts = rows.find((c) => {
    const n = normalizeClanName(c.name);
    const s = normalizeClanSlug(c.name);
    return n.startsWith(target) || s.startsWith(targetSlug);
  });
  if (starts) return starts;

  const contains = rows.find((c) => {
    const n = normalizeClanName(c.name);
    const s = normalizeClanSlug(c.name);
    return n.includes(target) || s.includes(targetSlug);
  });
  return contains || null;
}

async function createClan({ ownerId, name, icon = "" }) {
  const owner = await getPlayer(ownerId);
  if (owner.clanId) return { ok: false, error: "You are already in a clan." };
  const clean = String(name || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/discord\.gg\/\S+/gi, "")
    .replace(/discord\.com\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
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
    joinRequests: [],
    invites: [],
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

function canManageClan(clan, userId) {
  return clan.ownerId === String(userId) || clan.officers.includes(String(userId));
}

function pushUniqueTicket(list, item) {
  const next = Array.isArray(list) ? list.filter((x) => String(x.userId) !== String(item.userId)) : [];
  next.push(item);
  return next;
}

async function requestJoinClan({ userId, clanName }) {
  const player = await getPlayer(userId);
  if (player.clanId) return { ok: false, error: "You are already in a clan." };
  const clan = await findClanByName(clanName);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (clan.members.length >= MAX_CLAN_MEMBERS) return { ok: false, error: "Clan is full." };
  if (clan.invites.some((x) => x.userId === String(userId))) {
    return { ok: false, error: "You already have an invite. Use /clan accept." };
  }
  clan.joinRequests = pushUniqueTicket(clan.joinRequests, { userId: String(userId), at: now(), by: String(userId) });
  clan.weekly.activity += 1;
  await setClan(clan);
  return { ok: true, clan };
}

async function inviteToClan({ managerId, targetUserId }) {
  const manager = await getPlayer(managerId);
  if (!manager.clanId) return { ok: false, error: "You are not in a clan." };
  const target = await getPlayer(targetUserId);
  if (target.clanId) return { ok: false, error: "Target user is already in a clan." };
  const clan = await getClan(manager.clanId);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (!canManageClan(clan, managerId)) return { ok: false, error: "Only owner/officers can invite." };
  if (clan.members.length >= MAX_CLAN_MEMBERS) return { ok: false, error: "Clan is full." };

  clan.invites = pushUniqueTicket(clan.invites, { userId: String(targetUserId), at: now(), by: String(managerId) });
  clan.weekly.activity += 1;
  await setClan(clan);
  return { ok: true, clan };
}

async function acceptInvite({ userId, clanName }) {
  const player = await getPlayer(userId);
  if (player.clanId) return { ok: false, error: "You are already in a clan." };
  const clan = await findClanByName(clanName);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (clan.members.length >= MAX_CLAN_MEMBERS) return { ok: false, error: "Clan is full." };
  if (!clan.invites.some((x) => x.userId === String(userId))) return { ok: false, error: "No invite found for you." };

  clan.invites = clan.invites.filter((x) => x.userId !== String(userId));
  clan.joinRequests = clan.joinRequests.filter((x) => x.userId !== String(userId));
  if (!clan.members.includes(String(userId))) clan.members.push(String(userId));
  clan.weekly.activity += 1;
  await setClan(clan);

  player.clanId = clan.id;
  player.clanJoinedAt = now();
  await setPlayer(userId, player);
  return { ok: true, clan };
}

async function approveJoinRequest({ managerId, userId }) {
  const manager = await getPlayer(managerId);
  if (!manager.clanId) return { ok: false, error: "You are not in a clan." };
  const clan = await getClan(manager.clanId);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (!canManageClan(clan, managerId)) return { ok: false, error: "Only owner/officers can approve requests." };
  if (clan.members.length >= MAX_CLAN_MEMBERS) return { ok: false, error: "Clan is full." };
  if (!clan.joinRequests.some((x) => x.userId === String(userId))) return { ok: false, error: "No join request from that user." };

  const target = await getPlayer(userId);
  if (target.clanId) {
    clan.joinRequests = clan.joinRequests.filter((x) => x.userId !== String(userId));
    await setClan(clan);
    return { ok: false, error: "User is already in another clan. Request removed." };
  }

  clan.joinRequests = clan.joinRequests.filter((x) => x.userId !== String(userId));
  clan.invites = clan.invites.filter((x) => x.userId !== String(userId));
  if (!clan.members.includes(String(userId))) clan.members.push(String(userId));
  clan.weekly.activity += 1;
  await setClan(clan);

  target.clanId = clan.id;
  target.clanJoinedAt = now();
  await setPlayer(userId, target);
  return { ok: true, clan };
}

async function denyJoinRequest({ managerId, userId }) {
  const manager = await getPlayer(managerId);
  if (!manager.clanId) return { ok: false, error: "You are not in a clan." };
  const clan = await getClan(manager.clanId);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (!canManageClan(clan, managerId)) return { ok: false, error: "Only owner/officers can deny requests." };
  const before = clan.joinRequests.length;
  clan.joinRequests = clan.joinRequests.filter((x) => x.userId !== String(userId));
  if (clan.joinRequests.length === before) return { ok: false, error: "No request from that user." };
  clan.weekly.activity += 1;
  await setClan(clan);
  return { ok: true, clan };
}

async function promoteOfficer({ ownerId, targetUserId }) {
  const owner = await getPlayer(ownerId);
  if (!owner.clanId) return { ok: false, error: "You are not in a clan." };
  const clan = await getClan(owner.clanId);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (clan.ownerId !== String(ownerId)) return { ok: false, error: "Only owner can promote officers." };
  if (!clan.members.includes(String(targetUserId))) return { ok: false, error: "Target is not in your clan." };
  if (clan.ownerId === String(targetUserId)) return { ok: false, error: "Owner is already highest role." };
  if (!clan.officers.includes(String(targetUserId))) clan.officers.push(String(targetUserId));
  clan.weekly.activity += 1;
  await setClan(clan);
  return { ok: true, clan };
}

async function demoteOfficer({ ownerId, targetUserId }) {
  const owner = await getPlayer(ownerId);
  if (!owner.clanId) return { ok: false, error: "You are not in a clan." };
  const clan = await getClan(owner.clanId);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (clan.ownerId !== String(ownerId)) return { ok: false, error: "Only owner can demote officers." };
  const before = clan.officers.length;
  clan.officers = clan.officers.filter((x) => x !== String(targetUserId));
  if (clan.officers.length === before) return { ok: false, error: "Target is not an officer." };
  clan.weekly.activity += 1;
  await setClan(clan);
  return { ok: true, clan };
}

async function transferOwnership({ ownerId, targetUserId }) {
  const owner = await getPlayer(ownerId);
  if (!owner.clanId) return { ok: false, error: "You are not in a clan." };
  const clan = await getClan(owner.clanId);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (clan.ownerId !== String(ownerId)) return { ok: false, error: "Only owner can transfer ownership." };
  if (!clan.members.includes(String(targetUserId))) return { ok: false, error: "Target must be in clan." };
  if (String(targetUserId) === String(ownerId)) return { ok: false, error: "Target is already owner." };
  clan.ownerId = String(targetUserId);
  clan.officers = clan.officers.filter((x) => x !== String(targetUserId));
  if (!clan.officers.includes(String(ownerId))) clan.officers.push(String(ownerId));
  clan.weekly.activity += 1;
  await setClan(clan);
  return { ok: true, clan };
}

async function kickMember({ managerId, targetUserId }) {
  const manager = await getPlayer(managerId);
  if (!manager.clanId) return { ok: false, error: "You are not in a clan." };
  const clan = await getClan(manager.clanId);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (!canManageClan(clan, managerId)) return { ok: false, error: "Only owner/officers can kick members." };
  if (clan.ownerId === String(targetUserId)) return { ok: false, error: "You cannot kick the owner." };
  if (!clan.members.includes(String(targetUserId))) return { ok: false, error: "Target is not in clan." };

  clan.members = clan.members.filter((x) => x !== String(targetUserId));
  clan.officers = clan.officers.filter((x) => x !== String(targetUserId));
  clan.joinRequests = clan.joinRequests.filter((x) => x.userId !== String(targetUserId));
  clan.invites = clan.invites.filter((x) => x.userId !== String(targetUserId));
  clan.weekly.activity += 1;
  await setClan(clan);

  const target = await getPlayer(targetUserId);
  if (target.clanId === clan.id) {
    target.clanId = "";
    target.clanJoinedAt = 0;
    await setPlayer(targetUserId, target);
  }
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
  clan.joinRequests = clan.joinRequests.filter((x) => x.userId !== String(userId));
  clan.invites = clan.invites.filter((x) => x.userId !== String(userId));
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
  const duoMap = eventKey === "jjk" ? (player.duoCards?.jjk || {}) : (player.duoCards?.bleach || {});
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

  for (const recipe of getFusionRecipesForEvent(eventKey)) {
    const amount = Math.max(0, Number(duoMap[recipe.duoId] || 0));
    if (amount <= 0) continue;
    const duo = getDuoCardFromRecipe(eventKey, recipe);
    if (!duo) continue;
    const lv = Math.max(1, Number(levels[recipe.duoId] || 1));
    const stats = cardStatsAtLevel(duo, lv);
    const p = Math.floor(cardPower(stats) * 0.97);
    if (p > best) best = p;
  }
  return best;
}

async function startClanBoss({ userId, eventKey }) {
  const p = await getPlayer(userId);
  if (!p.clanId) return { ok: false, error: "Join a clan first." };
  const clan = await getClan(p.clanId);
  if (!clan) return { ok: false, error: "Clan not found." };
  if (!canManageClan(clan, userId)) return { ok: false, error: "Only owner/officers can start clan boss." };
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
        name: cleanClanNameForDisplay(c.name),
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
  canManageClan,
  createClan,
  requestJoinClan,
  inviteToClan,
  acceptInvite,
  approveJoinRequest,
  denyJoinRequest,
  promoteOfficer,
  demoteOfficer,
  transferOwnership,
  kickMember,
  leaveClan,
  startClanBoss,
  hitClanBoss,
  getClanWeeklyLeaderboard,
};
