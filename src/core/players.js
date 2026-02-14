const { get, set } = require("./redis");

const KEY = (id) => `player:${id}`;

function defaultPlayer() {
  return {
    drako: 0,
    bleach: {
      reiatsu: 0,
      bonus: 0,
      kills: 0,
      lastDaily: 0
    },
    jjk: {
      cursedEnergy: 0,
      bonus: 0,
      kills: 0
    },
    inventory: {
      bleach: [],
      jjk: []
    },
    titles: {
      ownedRoleIds: [],
      equippedRoleId: null
    }
  };
}

async function getPlayer(userId) {
  const raw = await get(KEY(userId));
  if (!raw) return defaultPlayer();
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultPlayer(), ...parsed };
  } catch {
    return defaultPlayer();
  }
}

async function setPlayer(userId, data) {
  return await set(KEY(userId), JSON.stringify(data));
}

/**
 * eventKey: "bleach" or "jjk"
 * returns array [{userId, score}]
 */
async function getTopPlayers(eventKey, limit = 10) {
  // 🔥 IMPORTANT: in-memory mode can't scan keys easily;
  // so we store a simple leaderboard index per save in part2/3.
  // Here we fallback to empty list if not implemented yet.
  const raw = await get(`lb:${eventKey}`);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return arr.slice(0, limit);
  } catch {
    return [];
  }
}

async function setLeaderboard(eventKey, list) {
  // list: [{userId, score}]
  await set(`lb:${eventKey}`, JSON.stringify(list));
}

module.exports = {
  getPlayer,
  setPlayer,
  defaultPlayer,
  getTopPlayers,
  setLeaderboard
};
