// src/core/utils.js
const crypto = require("crypto");

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function uid() { return crypto.randomUUID(); }

module.exports = { clamp, safeName, sleep, uid };
