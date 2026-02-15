// In-memory state for active events in channels
const bossByChannel = new Map(); // channelId -> bossState
const mobByChannel = new Map();  // channelId -> mobState
const pvpById = new Map();       // key -> pvpState

module.exports = { bossByChannel, mobByChannel, pvpById };
