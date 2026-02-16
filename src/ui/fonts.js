const fs = require("fs");
const path = require("path");
const { GlobalFonts } = require("@napi-rs/canvas");

let registered = false;

function tryRegisterFont(filePath, family) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[fonts] missing: ${filePath}`);
    return false;
  }
  try {
    GlobalFonts.registerFromPath(filePath, family);
    console.log(`[fonts] loaded: ${family}`);
    return true;
  } catch (e) {
    console.warn(`[fonts] failed ${family}:`, e?.message || e);
    return false;
  }
}

function registerCanvasFonts() {
  if (registered) return;
  const root = path.join(__dirname, "..", "..");
  const fontDir = path.join(root, "assets", "fonts");

  tryRegisterFont(path.join(fontDir, "Inter-Regular.ttf"), "Inter");
  tryRegisterFont(path.join(fontDir, "Orbitron-Bold.ttf"), "Orbitron");

  registered = true;
}

module.exports = { registerCanvasFonts };

