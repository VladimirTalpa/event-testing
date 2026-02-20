function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function safeName(name) {
  return String(name || "Unknown")
    .replace(/@/g, "")
    .replace(/[|¦]+/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48) || "Unknown";
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

module.exports = { clamp, safeName, sleep };