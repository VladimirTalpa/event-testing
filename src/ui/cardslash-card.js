const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { registerCanvasFonts } = require("./fonts");
const { RARITY_COLORS } = require("../data/cards");

const CARD_LIBRARY_ROOT = path.join(__dirname, "..", "..", "assets", "cards", "library");
const CARD_FUSION_ROOT = path.join(__dirname, "..", "..", "assets", "cards", "fusion");

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

function fitContain(sw, sh, bw, bh) {
  const scale = Math.min(bw / Math.max(1, sw), bh / Math.max(1, sh));
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

function drawSword(ctx, cx, topY, height, eventKey) {
  const bladeW = 52;
  const bladeH = Math.floor(height * 0.72);
  const guardW = 180;
  const guardH = 22;
  const gripH = Math.floor(height * 0.16);
  const pommelR = 17;
  const colorA = eventKey === "jjk" ? "#ff4f7d" : "#ff9c44";
  const colorB = eventKey === "jjk" ? "#ffd0dd" : "#ffe0b3";

  const bladeY = topY;
  ctx.save();
  ctx.shadowColor = colorA;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(cx, bladeY - 18);
  ctx.lineTo(cx - bladeW / 2, bladeY + 30);
  ctx.lineTo(cx - bladeW / 2 + 8, bladeY + bladeH);
  ctx.lineTo(cx + bladeW / 2 - 8, bladeY + bladeH);
  ctx.lineTo(cx + bladeW / 2, bladeY + 30);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - bladeW / 2, bladeY, cx + bladeW / 2, bladeY + bladeH);
  g.addColorStop(0, colorB);
  g.addColorStop(0.48, "#ffffff");
  g.addColorStop(1, colorA);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  ctx.save();
  rr(ctx, cx - guardW / 2, bladeY + bladeH - 6, guardW, guardH, 8);
  const gg = ctx.createLinearGradient(cx - guardW / 2, 0, cx + guardW / 2, 0);
  gg.addColorStop(0, colorA);
  gg.addColorStop(1, colorB);
  ctx.fillStyle = gg;
  ctx.fill();
  ctx.restore();

  rr(ctx, cx - 16, bladeY + bladeH + 12, 32, gripH, 9);
  ctx.fillStyle = "#1a0f14";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, bladeY + bladeH + 14 + gripH + pommelR, pommelR, 0, Math.PI * 2);
  ctx.fillStyle = colorA;
  ctx.fill();
}

function drawCardPanel(ctx, panel, side, eventKey) {
  const themeA = eventKey === "jjk" ? "#ff4f7d" : "#ff9a43";
  const themeB = eventKey === "jjk" ? "#ffbfd0" : "#ffd8a2";
  const rarityColor = RARITY_COLORS[panel.card?.rarity] || "#c8d0e0";

  rr(ctx, panel.x, panel.y, panel.w, panel.h, 20);
  ctx.fillStyle = "rgba(5,8,16,0.72)";
  ctx.fill();
  ctx.strokeStyle = side === "left" ? themeA : themeB;
  ctx.lineWidth = 2;
  ctx.stroke();

  rr(ctx, panel.x + 16, panel.y + 16, panel.w - 32, panel.h - 166, 14);
  ctx.save();
  ctx.clip();
  if (panel.art) {
    const fit = fitContain(panel.art.width, panel.art.height, panel.w - 32, panel.h - 166);
    ctx.drawImage(panel.art, panel.x + 16 + fit.x, panel.y + 16 + fit.y, fit.w, fit.h);
  } else {
    const pg = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y + panel.h);
    pg.addColorStop(0, "rgba(255,255,255,0.08)");
    pg.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = pg;
    ctx.fillRect(panel.x + 16, panel.y + 16, panel.w - 32, panel.h - 166);
    ctx.font = '700 34px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(230,235,245,0.9)";
    ctx.fillText("NO CARD ART", panel.x + 68, panel.y + panel.h / 2 - 10);
  }
  ctx.restore();

  rr(ctx, panel.x + 16, panel.y + panel.h - 134, panel.w - 32, 118, 12);
  ctx.fillStyle = "rgba(8,10,16,0.84)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '900 34px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = rarityColor;
  const name = fitText(ctx, panel.card?.name || "Unknown", panel.w - 64);
  ctx.fillText(name, panel.x + 26, panel.y + panel.h - 92);

  ctx.font = '700 24px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(235,240,248,0.94)";
  ctx.fillText(`Lv.${panel.level}  |  PWR ${panel.power}`, panel.x + 26, panel.y + panel.h - 58);

  ctx.font = '700 21px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(225,232,245,0.92)";
  ctx.fillText(`DMG ${panel.stats.dmg}  DEF ${panel.stats.def}  HP ${panel.stats.hp}`, panel.x + 26, panel.y + panel.h - 30);
}

async function buildCardSlashImage(data) {
  registerCanvasFonts();
  const W = 1800;
  const H = 980;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const eventKey = data.eventKey === "jjk" ? "jjk" : "bleach";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  if (eventKey === "jjk") {
    bg.addColorStop(0, "#15030a");
    bg.addColorStop(0.5, "#29070f");
    bg.addColorStop(1, "#470916");
  } else {
    bg.addColorStop(0, "#1a0a00");
    bg.addColorStop(0.5, "#341003");
    bg.addColorStop(1, "#551804");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 260; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 0.8 + Math.random() * 2.6;
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.11)" : "rgba(255,170,120,0.1)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const topG = ctx.createLinearGradient(180, 0, W - 180, 0);
  topG.addColorStop(0, eventKey === "jjk" ? "#ff4f7d" : "#ff9a43");
  topG.addColorStop(1, eventKey === "jjk" ? "#ffc0d2" : "#ffe0ad");
  ctx.font = '900 88px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = topG;
  const title = "CARD SLASH";
  const tw = ctx.measureText(title).width;
  ctx.fillText(title, (W - tw) / 2, 108);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 136);
  ctx.lineTo(W - 120, 136);
  ctx.stroke();

  const leftPanel = {
    x: 90,
    y: 170,
    w: 700,
    h: 650,
    ...data.left,
  };
  const rightPanel = {
    x: W - 790,
    y: 170,
    w: 700,
    h: 650,
    ...data.right,
  };

  leftPanel.art = await loadCardArt(eventKey, leftPanel.card);
  rightPanel.art = await loadCardArt(eventKey, rightPanel.card);

  drawCardPanel(ctx, leftPanel, "left", eventKey);
  drawCardPanel(ctx, rightPanel, "right", eventKey);
  drawSword(ctx, W / 2, 250, 430, eventKey);

  const winnerName = data.winnerId === data.left.userId ? data.left.userName : data.right.userName;
  rr(ctx, 120, 846, W - 240, 98, 16);
  ctx.fillStyle = "rgba(7,8,14,0.82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '900 42px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = eventKey === "jjk" ? "#ff9fbd" : "#ffc57e";
  const leftName = fitText(ctx, data.left.userName, 520);
  const rightName = fitText(ctx, data.right.userName, 520);
  ctx.fillText(leftName, 150, 907);
  const rw = ctx.measureText(rightName).width;
  ctx.fillText(rightName, W - 150 - rw, 907);

  ctx.font = '800 33px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,250,0.96)";
  const centerText = `Winner: ${winnerName}  |  Impact ${data.impact}  |  Uses Left ${data.usesLeft}/3`;
  const ctw = ctx.measureText(centerText).width;
  ctx.fillText(centerText, (W - ctw) / 2, 906);

  return canvas.toBuffer("image/png");
}

module.exports = { buildCardSlashImage };
