// src/core/state.js
const bossByChannel = new Map();
const mobByChannel = new Map();

// key = `${channelId}:${challengerId}:${targetId}`
const pvpById = new Map();

/**
 * uiCache:
 * messageId -> { type, userId, data }
 * type: "profile" | "store" | "forge" | "expeditions"
 */
const uiCache = new Map();

/**
 * expeditionRuntime:
 * userId -> { nextTickAt, messageId, channelId }
 * Used to resume timers after restarts (we rebuild from player data on boot in Part 2).
 */
const expeditionRuntime = new Map();

module.exports = { bossByChannel, mobByChannel, pvpById, uiCache, expeditionRuntime };
