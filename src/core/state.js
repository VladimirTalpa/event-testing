// src/core/state.js
const bossByChannel = new Map();
const mobByChannel = new Map();

/**
 * leaderboardCache:
 * messageId -> { eventKey, entries, pageSize }
 * entries: [{ name, score }]
 */
const leaderboardCache = new Map();

module.exports = { bossByChannel, mobByChannel, leaderboardCache };
