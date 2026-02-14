// src/core/db.js
// Lightweight JSON storage (no external DB). Safe for small servers.
// Data file: src/data/db.json

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function ensureFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, bosses: {}, mobs: {} }, null, 2), 'utf8');
  }
}

function read() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    // Corrupted file fallback
    const fresh = { users: {}, bosses: {}, mobs: {} };
    fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2), 'utf8');
    return fresh;
  }
}

function write(db) {
  ensureFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function getUser(db, userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      wallet: {
        reiatsu: 0,
        cursed_energy: 0,
        drako: 0,
        bleach_shards: 0,
        cursed_shards: 0,
      },
      cards: [],
      gears: [],
      titles: {
        ownedRoleIds: [],
        equippedRoleId: null,
      },
      cooldowns: {
        daily_bleach: 0,
        daily_jjk: 0,
      },
      stats: {
        mobs_bleach_kills: 0,
        mobs_jjk_kills: 0,
      },
    };
  }
  return db.users[userId];
}

function mutate(mutator) {
  const db = read();
  const result = mutator(db);
  write(db);
  return result;
}

module.exports = {
  DB_PATH,
  read,
  write,
  getUser,
  mutate,
};
