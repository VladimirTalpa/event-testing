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
const packSessions = new Map(); 
// userId -> { packType, anime, queue:[cardId...], index, messageId, channelId, createdAt }

module.exports = { bossByChannel, mobByChannel, leaderboardCache, pvpById, packSessions };
