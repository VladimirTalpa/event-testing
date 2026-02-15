// src/core/utils.js
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function safeName(name) {
  return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { clamp, safeName, sleep };
