const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { registerCanvasFonts } = require("./fonts");
const { RARITY_COLORS } = require("../data/cards");

const CARD_LIBRARY_ROOT = path.join(__dirname, "..", "..", "assets", "cards", "library");
const CARD_FUSION_ROOT = path.join(__dirname, "..", "..", "assets", "cards", "fusion");
const CLASH_BG_PATH = path.join(__dirname, "..", "..", "assets", "templates", "bg_clash.png");

function rr(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.floor(Math.min(w, h) / 2)));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fitCover(sw, sh, bw, bh) {
  const scale = Math.max(bw / Math.max(1, sw), bh / Math.max(1, sh));
  const w = Math.floor(sw * scale);
  const h = Math.floor(sh * scale);
  return { x: Math.floor((bw - w) / 2), y: Math.floor((bh - h) / 2), w, h };
}

function fitText(ctx, text, maxWidth) {
  const raw = String(text || "");
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let out = raw;
  while (out.length > 0 && ctx.measureText(`${out}...`).width > maxWidth) out = out.slice(0, -1);
  return `${out}...`;
}

async function loadCardArt(eventKey, card) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const id = String(card?.id || "").trim();
  if (!id) return null;
  const exts = ["png", "jpg", "jpeg", "webp"];
  const roots = [path.join(CARD_LIBRARY_ROOT, ek)];
  if (card?.isDuo) roots.push(path.join(CARD_FUSION_ROOT, ek));

  for (const root of roots) {
    for (const ext of exts) {
      const full = path.join(root, `${id}.${ext}`);
      if (!fs.existsSync(full)) continue;
      try {
        return await loadImage(full);
      } catch {}
    }
  }
  return null;
}

async function drawBackground(ctx, w, h) {
  if (fs.existsSync(CLASH_BG_PATH)) {
    try {
      const bg = await loadImage(CLASH_BG_PATH);
      const fit = fitCover(bg.width, bg.height, w, h);
      ctx.drawImage(bg, fit.x, fit.y, fit.w, fit.h);
      ctx.fillStyle = "rgba(0,0,0,0.34)";
      ctx.fillRect(0, 0, w, h);
      return;
    } catch {}
  }
  const fallback = ctx.createLinearGradient(0, 0, w, h);
  fallback.addColorStop(0, "#140700");
  fallback.addColorStop(1, "#2f1202");
  ctx.fillStyle = fallback;
  ctx.fillRect(0, 0, w, h);
}

function drawSword(ctx, cx, topY, h, eventKey) {
  const colorA = eventKey === "jjk" ? "#ff4f7d" : "#ff9c44";
  const colorB = eventKey === "jjk" ? "#ffd2df" : "#ffe1b5";
  const bladeW = 44;
  const bladeH = Math.floor(h * 0.68);

  ctx.save();
  ctx.shadowColor = colorA;
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.moveTo(cx, topY - 16);
  ctx.lineTo(cx - bladeW / 2, topY + 30);
  ctx.lineTo(cx - bladeW / 2 + 6, topY + bladeH);
  ctx.lineTo(cx + bladeW / 2 - 6, topY + bladeH);
  ctx.lineTo(cx + bladeW / 2, topY + 30);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - bladeW, topY, cx + bladeW, topY + bladeH);
  g.addColorStop(0, colorB);
  g.addColorStop(0.5, "#ffffff");
  g.addColorStop(1, colorA);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  rr(ctx, cx - 86, topY + bladeH - 8, 172, 20, 8);
  const guard = ctx.createLinearGradient(cx - 86, 0, cx + 86, 0);
  guard.addColorStop(0, colorA);
  guard.addColorStop(1, colorB);
  ctx.fillStyle = guard;
  ctx.fill();

  rr(ctx, cx - 12, topY + bladeH + 14, 24, Math.floor(h * 0.15), 8);
  ctx.fillStyle = "rgba(9,10,15,0.95)";
  ctx.fill();
}

function drawUserPanel(ctx, panel, isLeft, eventKey) {
  const accent = eventKey === "jjk" ? "#ff5d89" : "#ffb25f";
  const accentSoft = eventKey === "jjk" ? "#ffbfd0" : "#ffe2bb";
  const x = panel.x;
  const y = panel.y;
  const w = panel.w;
  const h = panel.h;

  rr(ctx, x, y, w, h, 18);
  ctx.fillStyle = "rgba(8,10,16,0.44)";
  ctx.fill();
  ctx.strokeStyle = isLeft ? accent : accentSoft;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (panel.art) {
    rr(ctx, x + 18, y + 18, w - 36, h - 178, 14);
    ctx.save();
    ctx.clip();
    const fit = fitCover(panel.art.width, panel.art.height, w - 36, h - 178);
    ctx.drawImage(panel.art, x + 18 + fit.x, y + 18 + fit.y, fit.w, fit.h);
    ctx.restore();
  } else {
    rr(ctx, x + 18, y + 18, w - 36, h - 178, 14);
    const miss = ctx.createLinearGradient(x, y, x + w, y + h);
    miss.addColorStop(0, "rgba(255,255,255,0.12)");
    miss.addColorStop(1, "rgba(255,255,255,0.03)");
    ctx.fillStyle = miss;
    ctx.fill();
    ctx.font = '700 30px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(235,235,245,0.92)";
    ctx.fillText("NO CARD ART", x + 70, y + h / 2 - 20);
  }

  rr(ctx, x + 18, y + h - 144, w - 36, 126, 12);
  ctx.fillStyle = "rgba(4,6,12,0.74)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const rarityColor = RARITY_COLORS[panel.card?.rarity] || "#d7deee";
  ctx.font = '900 30px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = rarityColor;
  const cardName = fitText(ctx, panel.card?.name || "Unknown Card", w - 66);
  ctx.fillText(cardName, x + 28, y + h - 98);

  ctx.font = '700 23px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(236,240,248,0.96)";
  ctx.fillText(`Lv.${panel.level} | PWR ${panel.power}`, x + 28, y + h - 66);

  ctx.font = '700 19px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(220,228,244,0.96)";
  const stats = `DMG ${panel.stats.dmg}   DEF ${panel.stats.def}   HP ${panel.stats.hp}`;
  ctx.fillText(stats, x + 28, y + h - 36);
}

function drawHeader(ctx, w, eventKey) {
  const a = eventKey === "jjk" ? "#ff5d89" : "#ff9a43";
  const b = eventKey === "jjk" ? "#ffc4d5" : "#ffe3bf";
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.font = '900 84px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = g;
  const title = "CARD SLASH";
  const tw = ctx.measureText(title).width;
  ctx.fillText(title, (w - tw) / 2, 100);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 130);
  ctx.lineTo(w - 110, 130);
  ctx.stroke();
}

function drawFooter(ctx, w, h, data, eventKey) {
  const a = eventKey === "jjk" ? "#ff7099" : "#ffad55";
  const b = eventKey === "jjk" ? "#ffd0df" : "#ffe4bf";
  const winnerName = data.winnerId === data.left.userId ? data.left.userName : data.right.userName;

  rr(ctx, 104, h - 124, w - 208, 90, 16);
  ctx.fillStyle = "rgba(4,6,12,0.78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '800 34px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const g = ctx.createLinearGradient(140, 0, w - 140, 0);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  const line = `Winner: ${winnerName}   |   Impact ${data.impact}   |   Uses Left ${data.usesLeft}/3`;
  const text = fitText(ctx, line, w - 280);
  const tw = ctx.measureText(text).width;
  ctx.fillText(text, (w - tw) / 2, h - 70);

  ctx.font = '900 38px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,246,252,0.95)";
  const leftName = fitText(ctx, data.left.userName, 460);
  const rightName = fitText(ctx, data.right.userName, 460);
  ctx.fillText(leftName, 120, h - 170);
  const rw = ctx.measureText(rightName).width;
  ctx.fillText(rightName, w - 120 - rw, h - 170);
}

async function buildCardSlashImage(data) {
  registerCanvasFonts();
  const W = 1800;
  const H = 980;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const eventKey = data.eventKey === "jjk" ? "jjk" : "bleach";

  await drawBackground(ctx, W, H);
  drawHeader(ctx, W, eventKey);

  const left = {
    x: 84,
    y: 158,
    w: 700,
    h: 660,
    ...data.left,
  };
  const right = {
    x: W - 784,
    y: 158,
    w: 700,
    h: 660,
    ...data.right,
  };

  left.art = await loadCardArt(eventKey, left.card);
  right.art = await loadCardArt(eventKey, right.card);

  drawUserPanel(ctx, left, true, eventKey);
  drawUserPanel(ctx, right, false, eventKey);
  drawSword(ctx, W / 2, 246, 430, eventKey);
  drawFooter(ctx, W, H, data, eventKey);

  return canvas.toBuffer("image/png");
}

module.exports = { buildCardSlashImage };
