// src/core/players.js
const path = require("path");
const { readJson, writeJson } = require("./storage");

const DB_PATH = path.join(process.cwd(), "data", "players.json");
let cache = readJson(DB_PATH, {});

function defaultPlayer(userId) {
  return {
    id: userId,
    ownedRoles: [],
    drako: 0,

    bleach: {
      reiatsu: 0,
      shards: 0,
      survivalBonus: 0,
      items: {
        zanpakuto_basic: false,
        hollow_mask_fragment: false,
        soul_reaper_cloak: false,
        reiatsu_amplifier: false,
        cosmetic_role: false
      }
    },

    jjk: {
      cursedEnergy: 0,
      materials: { cursedShards: 0, expeditionKeys: 0 },
      survivalBonus: 0,
      items: {
        black_flash_manual: false,
        domain_charm: false,
        cursed_tool: false,
        reverse_talisman: false,
        binding_vow_seal: false
      }
    }
  };
}

async function getPlayer(userId) {
  if (!cache[userId]) {
    cache[userId] = defaultPlayer(userId);
    writeJson(DB_PATH, cache);
  }
  return cache[userId];
}

async function setPlayer(userId, player) {
  cache[userId] = player;
  writeJson(DB_PATH, cache);
}

module.exports = { getPlayer, setPlayer };
