function safeName(str) {
  if (!str) return "Unknown";
  return String(str).replace(/[`*_~|]/g, "");
}

function clampInt(n, min, max) {
  const x = Math.floor(Number(n || 0));
  return Math.max(min, Math.min(max, x));
}

module.exports = { safeName, clampInt };
