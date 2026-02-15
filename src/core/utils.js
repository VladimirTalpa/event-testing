function safeName(name) {
  if (!name) return "Unknown";
  return String(name).replace(/[`*_~|]/g, "");
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

module.exports = { safeName, clamp };
