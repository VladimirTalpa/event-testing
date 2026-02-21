"use strict";

const { initRedis, getRedis } = require("./redis");

const REDIS_CHAOS_KEY = "events:chaos";
const REDIS_CHAOS_TEAMS_KEY = "events:chaos:teams";
const TEAM_IDS = ["vanguard", "eclipse", "titan"];

function utcDayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeChaos(raw = {}) {
  const daily = raw.daily && typeof raw.daily === "object" ? raw.daily : {};
  const team = TEAM_IDS.includes(String(raw.team || "")) ? String(raw.team) : "";
  return {
    team,
    games: Math.max(0, Math.floor(Number(raw.games || 0))),
    wins: Math.max(0, Math.floor(Number(raw.wins || 0))),
    losses: Math.max(0, Math.floor(Number(raw.losses || 0))),
    totalPoints: Math.max(0, Math.floor(Number(raw.totalPoints || 0))),
    highestPoints: Math.max(0, Math.floor(Number(raw.highestPoints || 0))),
    streak: Math.max(0, Math.floor(Number(raw.streak || 0))),
    bestStreak: Math.max(0, Math.floor(Number(raw.bestStreak || 0))),
    lastPlayAt: Math.max(0, Math.floor(Number(raw.lastPlayAt || 0))),
    daily: {
      day: typeof daily.day === "string" ? daily.day : "",
      used: Math.max(0, Math.floor(Number(daily.used || 0))),
    },
  };
}

function normalizeTeam(raw = {}, teamId = "") {
  return {
    teamId: TEAM_IDS.includes(String(teamId || raw.teamId || "")) ? String(teamId || raw.teamId) : "vanguard",
    totalPoints: Math.max(0, Math.floor(Number(raw.totalPoints || 0))),
    wins: Math.max(0, Math.floor(Number(raw.wins || 0))),
    clears: Math.max(0, Math.floor(Number(raw.clears || 0))),
    bestRun: Math.max(0, Math.floor(Number(raw.bestRun || 0))),
    members: Math.max(0, Math.floor(Number(raw.members || 0))),
    updatedAt: Math.max(0, Math.floor(Number(raw.updatedAt || 0))),
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

async function ensureTeamRow(teamId) {
  await initRedis();
  const redis = getRedis();
  const id = TEAM_IDS.includes(String(teamId || "")) ? String(teamId) : "vanguard";
  const raw = await redis.hGet(REDIS_CHAOS_TEAMS_KEY, id);
  if (!raw) {
    const fresh = normalizeTeam({}, id);
    await redis.hSet(REDIS_CHAOS_TEAMS_KEY, id, JSON.stringify(fresh));
    return fresh;
  }
  try {
    return normalizeTeam(JSON.parse(raw), id);
  } catch {
    const fresh = normalizeTeam({}, id);
    await redis.hSet(REDIS_CHAOS_TEAMS_KEY, id, JSON.stringify(fresh));
    return fresh;
  }
}

async function setTeamRow(teamId, row) {
  await initRedis();
  const redis = getRedis();
  const id = TEAM_IDS.includes(String(teamId || "")) ? String(teamId) : "vanguard";
  const normalized = normalizeTeam(row, id);
  await redis.hSet(REDIS_CHAOS_TEAMS_KEY, id, JSON.stringify(normalized));
  return normalized;
}

async function setChaosTeam(userId, teamId) {
  const id = TEAM_IDS.includes(String(teamId || "")) ? String(teamId) : "";
  if (!id) return { ok: false, error: "Invalid team." };
  const p = await getChaosProfile(userId);
  if (p.team) return { ok: false, error: "Team is locked and cannot be changed." };
  p.team = id;
  await setChaosProfile(userId, p);

  const row = await ensureTeamRow(id);
  row.members += 1;
  row.updatedAt = Date.now();
  await setTeamRow(id, row);
  return { ok: true, profile: p };
}

function getDailyUsesLeft(profile, limitPerDay) {
  const today = utcDayKey();
  const day = String(profile?.daily?.day || "");
  const used = Math.max(0, Math.floor(Number(profile?.daily?.used || 0)));
  const actualUsed = day === today ? used : 0;
  return Math.max(0, Math.floor(Number(limitPerDay || 0)) - actualUsed);
}

function consumeDailyUse(profile, limitPerDay) {
  const today = utcDayKey();
  if (!profile.daily || typeof profile.daily !== "object") profile.daily = { day: today, used: 0 };
  if (String(profile.daily.day || "") !== today) {
    profile.daily.day = today;
    profile.daily.used = 0;
  }
  const used = Math.max(0, Math.floor(Number(profile.daily.used || 0)));
  if (used >= Math.floor(Number(limitPerDay || 0))) return { ok: false, profile };
  profile.daily.used = used + 1;
  return { ok: true, profile };
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
  await setChaosProfile(userId, p);

  if (p.team) {
    const team = await ensureTeamRow(p.team);
    team.totalPoints += pts;
    if (won) team.wins += 1;
    if (won) team.clears += 1;
    if (pts > team.bestRun) team.bestRun = pts;
    team.updatedAt = Date.now();
    await setTeamRow(p.team, team);
  }
  return p;
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
        team: p.team || "",
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

async function getChaosTeamLeaderboard() {
  await initRedis();
  const redis = getRedis();
  const raw = await redis.hGetAll(REDIS_CHAOS_TEAMS_KEY);
  const out = [];
  for (const id of TEAM_IDS) {
    const json = raw?.[id];
    if (!json) {
      out.push(normalizeTeam({}, id));
      continue;
    }
    try {
      out.push(normalizeTeam(JSON.parse(json), id));
    } catch {
      out.push(normalizeTeam({}, id));
    }
  }
  out.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.clears !== a.clears) return b.clears - a.clears;
    return b.bestRun - a.bestRun;
  });
  return out;
}

function getTeamWinnerLine(rows) {
  const top = Array.isArray(rows) ? rows[0] : null;
  if (!top) return "No team winner yet.";
  if (!top.totalPoints) return "No team winner yet.";
  return `${top.teamId.toUpperCase()} is leading with ${top.totalPoints.toLocaleString("en-US")} points.`;
}

module.exports = {
  REDIS_CHAOS_KEY,
  REDIS_CHAOS_TEAMS_KEY,
  TEAM_IDS,
  normalizeChaos,
  getChaosProfile,
  setChaosProfile,
  setChaosTeam,
  getDailyUsesLeft,
  consumeDailyUse,
  recordChaosResult,
  getChaosLeaderboard,
  getChaosTeamLeaderboard,
  getTeamWinnerLine,
};

