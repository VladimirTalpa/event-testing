// src/core/utils.js
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function safeName(s) {
  if (!s) return "Unknown";
  return String(s).replace(/[`*_~|]/g, "");
}
module.exports = { sleep, clamp, safeName };
