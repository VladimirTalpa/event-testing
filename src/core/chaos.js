"use strict";

const { initRedis, getRedis } = require("./redis");

const REDIS_CHAOS_KEY = "events:chaos";

function normalizeChaos(raw = {}) {
  return {
    games: Math.max(0, Math.floor(Number(raw.games || 0))),
    wins: Math.max(0, Math.floor(Number(raw.wins || 0))),
    losses: Math.max(0, Math.floor(Number(raw.losses || 0))),
    totalPoints: Math.max(0, Math.floor(Number(raw.totalPoints || 0))),
    highestPoints: Math.max(0, Math.floor(Number(raw.highestPoints || 0))),
    streak: Math.max(0, Math.floor(Number(raw.streak || 0))),
    bestStreak: Math.max(0, Math.floor(Number(raw.bestStreak || 0))),
    lastPlayAt: Math.max(0, Math.floor(Number(raw.lastPlayAt || 0))),
  };
}

async function getChaosProfile(userId) {
  await initRedis();
  const redis = getRedis();
  const raw = await redis.hGet(REDIS_CHAOS_KEY, String(userId));
  if (!raw) {
    const fresh = normalizeChaos({});
    await redis.hSet(REDIS_CHAOS_KEY, String(userId), JSON.stringify(fresh));
    return fresh;
  }
  try {
    return normalizeChaos(JSON.parse(raw));
  } catch {
    const fresh = normalizeChaos({});
    await redis.hSet(REDIS_CHAOS_KEY, String(userId), JSON.stringify(fresh));
    return fresh;
  }
}

async function setChaosProfile(userId, profile) {
  await initRedis();
  const redis = getRedis();
  const normalized = normalizeChaos(profile);
  await redis.hSet(REDIS_CHAOS_KEY, String(userId), JSON.stringify(normalized));
  return normalized;
}

async function recordChaosResult(userId, { points, won, at }) {
  const p = await getChaosProfile(userId);
  const pts = Math.max(0, Math.floor(Number(points || 0)));
  p.games += 1;
  if (won) {
    p.wins += 1;
    p.streak += 1;
    if (p.streak > p.bestStreak) p.bestStreak = p.streak;
  } else {
    p.losses += 1;
    p.streak = 0;
  }
  p.totalPoints += pts;
  if (pts > p.highestPoints) p.highestPoints = pts;
  p.lastPlayAt = Math.max(0, Math.floor(Number(at || Date.now())));
  return setChaosProfile(userId, p);
}

async function getChaosLeaderboard(limit = 10) {
  await initRedis();
  const redis = getRedis();
  const all = await redis.hGetAll(REDIS_CHAOS_KEY);
  const rows = [];
  for (const [userId, json] of Object.entries(all || {})) {
    try {
      const p = normalizeChaos(JSON.parse(json));
      rows.push({
        userId: String(userId),
        totalPoints: p.totalPoints,
        wins: p.wins,
        games: p.games,
        bestStreak: p.bestStreak,
      });
    } catch {}
  }
  rows.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.bestStreak - a.bestStreak;
  });
  return rows.slice(0, Math.max(1, Math.floor(Number(limit || 10))));
}

module.exports = {
  REDIS_CHAOS_KEY,
  normalizeChaos,
  getChaosProfile,
  setChaosProfile,
  recordChaosResult,
  getChaosLeaderboard,
};

