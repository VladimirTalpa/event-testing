// Runtime in-memory states (NOT persistent)
const activeBossByChannel = new Map(); // channelId -> bossState
const activeMobByChannel = new Map();  // channelId -> mobState
const pvpById = new Map();             // key -> pvpState

module.exports = {
  activeBossByChannel,
  activeMobByChannel,
  pvpById
};
