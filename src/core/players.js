const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "data", "players.json");

function ensure() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}), "utf8");
}
ensure();

function readAll() {
  ensure();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeAll(data) {
  ensure();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function defaultPlayer(userId) {
  return {
    userId,
    drako: 0,
    bleach: { reiatsu: 0, lastDaily: 0 },
    jjk: { cursedEnergy: 0 },
    shards: { bleach: 0, jjk: 0 },
    packs: { basic: 0, legendary: 0 },

    cards: [], // instances
    gears: [], // gear items
    titles: [],

    expedition: {
      dailyCount: 0,
      dailyReset: 0,
      active: false,
      startingAt: 0,
      ticksDone: 0,
      totalTicks: 0,
      party: [],
      channelId: null,
      messageId: null,
      log: [],
    },
  };
}

async function getPlayer(userId) {
  const all = readAll();
  if (!all[userId]) {
    all[userId] = defaultPlayer(userId);
    writeAll(all);
  }

  // миграции (если старые поля отсутствуют)
  const p = all[userId];
  p.shards ||= { bleach: 0, jjk: 0 };
  p.packs ||= { basic: 0, legendary: 0 };
  p.cards ||= [];
  p.gears ||= [];
  p.titles ||= [];
  p.expedition ||= defaultPlayer(userId).expedition;

  return p;
}

async function setPlayer(userId, player) {
  const all = readAll();
  all[userId] = player;
  writeAll(all);
}

async function getTopPlayers(event, limit = 10) {
  const all = readAll();
  const rows = Object.values(all).map((p) => {
    const score = event === "bleach" ? (p.bleach?.reiatsu || 0) : (p.jjk?.cursedEnergy || 0);
    return { userId: p.userId, score };
  });
  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}

module.exports = { getPlayer, setPlayer, getTopPlayers };
