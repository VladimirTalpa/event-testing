// src/core/state.js
const bossByChannel = new Map();
const mobByChannel = new Map();
const pvpById = new Map(); // key = `${channelId}:${challengerId}:${targetId}`
/**
 * leaderboardCache:
 * messageId -> { eventKey, entries, pageSize }
 * entries: [{ name, score }]
 */
const leaderboardCache = new Map();

module.exports = { bossByChannel, mobByChannel, leaderboardCache, pvpById };
