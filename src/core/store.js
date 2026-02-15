const state = new Map();

function getPlayer(userId) {
  if (!state.has(userId)) {
    state.set(userId, {
      drako: 0,
      bleach: { reiatsu: 0 },
      jjk: { cursedEnergy: 0 },
      titles: []
    });
  }
  return state.get(userId);
}

function addCurrency(userId, key, amount) {
  const p = getPlayer(userId);
  if (key === "drako") p.drako += amount;
  if (key === "reiatsu") p.bleach.reiatsu += amount;
  if (key === "ce") p.jjk.cursedEnergy += amount;
  return p;
}

module.exports = { getPlayer, addCurrency };
