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

async function drawBackground(ctx, w, h) {
  if (fs.existsSync(CLASH_BG_PATH)) {
    try {
      const bg = await loadImage(CLASH_BG_PATH);
      const fit = fitCover(bg.width, bg.height, w, h);
      ctx.drawImage(bg, fit.x, fit.y, fit.w, fit.h);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, w, h);
      return;
    } catch {}
  }
  const fallback = ctx.createLinearGradient(0, 0, w, h);
  fallback.addColorStop(0, "#0d0501");
  fallback.addColorStop(1, "#2f1002");
  ctx.fillStyle = fallback;
  ctx.fillRect(0, 0, w, h);
}

function theme(eventKey) {
  if (eventKey === "jjk") {
    return {
      a: "#ff5d89",
      b: "#ffd0de",
      soft: "rgba(255,93,137,0.46)",
      chip: "rgba(18,8,14,0.62)",
      text: "#f8f0f3",
    };
  }
  return {
    a: "#ffad58",
    b: "#ffe2bf",
    soft: "rgba(255,173,88,0.46)",
    chip: "rgba(20,10,4,0.62)",
    text: "#fff5ec",
  };
}

function drawHeader(ctx, w, eventTheme) {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, eventTheme.a);
  g.addColorStop(1, eventTheme.b);
  ctx.font = '900 82px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = g;
  const title = "CARD SLASH";
  const tw = ctx.measureText(title).width;
  ctx.fillText(title, Math.floor((w - tw) / 2), 102);

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 132);
  ctx.lineTo(w - 110, 132);
  ctx.stroke();

  ctx.font = '800 40px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  const mid = "VS";
  const mw = ctx.measureText(mid).width;
  ctx.fillText(mid, Math.floor((w - mw) / 2), 468);
}

function drawCardOnly(ctx, cardData, x, y, w, h, eventTheme, isWinner) {
  const rarity = RARITY_COLORS[cardData.card?.rarity] || "#d7deee";

  rr(ctx, x - 6, y - 6, w + 12, h + 12, 24);
  ctx.strokeStyle = isWinner ? eventTheme.b : eventTheme.a;
  ctx.lineWidth = isWinner ? 4 : 2;
  ctx.shadowColor = isWinner ? eventTheme.b : eventTheme.a;
  ctx.shadowBlur = isWinner ? 30 : 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  rr(ctx, x, y, w, h, 20);
  ctx.save();
  ctx.clip();
  if (cardData.art) {
    const fit = fitContain(cardData.art.width, cardData.art.height, w, h);
    ctx.drawImage(cardData.art, x + fit.x, y + fit.y, fit.w, fit.h);
  } else {
    const miss = ctx.createLinearGradient(x, y, x + w, y + h);
    miss.addColorStop(0, "rgba(255,255,255,0.18)");
    miss.addColorStop(1, "rgba(255,255,255,0.04)");
    ctx.fillStyle = miss;
    ctx.fillRect(x, y, w, h);
    ctx.font = '700 34px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(240,242,248,0.92)";
    ctx.fillText("NO CARD ART", x + 88, y + Math.floor(h / 2));
  }
  ctx.restore();

  const plateH = 142;
  rr(ctx, x, y + h - plateH, w, plateH, 16);
  ctx.fillStyle = "rgba(3,5,10,0.44)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.font = '900 34px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = rarity;
  ctx.fillText(fitText(ctx, cardData.card?.name || "Unknown Card", w - 30), x + 14, y + h - 92);

  ctx.font = '700 24px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = eventTheme.text;
  ctx.fillText(`Lv.${cardData.level} | PWR ${cardData.power}`, x + 14, y + h - 58);

  ctx.font = '700 20px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(238,243,250,0.96)";
  ctx.fillText(`DMG ${cardData.stats.dmg}   DEF ${cardData.stats.def}   HP ${cardData.stats.hp}`, x + 14, y + h - 28);
}

function drawUserName(ctx, label, x, y, maxWidth, align, eventTheme, isWinner) {
  ctx.font = '900 52px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const name = fitText(ctx, label, maxWidth);
  const width = ctx.measureText(name).width;
  const tx = align === "right" ? x - width : x;

  ctx.fillStyle = isWinner ? eventTheme.b : eventTheme.a;
  ctx.shadowColor = isWinner ? eventTheme.b : eventTheme.a;
  ctx.shadowBlur = isWinner ? 22 : 12;
  ctx.fillText(name, tx, y);
  ctx.shadowBlur = 0;
}

function drawWinnerBar(ctx, w, h, data, eventTheme) {
  const winner = data.winnerId === data.left.userId ? data.left.userName : data.right.userName;
  rr(ctx, 98, h - 122, w - 196, 88, 15);
  ctx.fillStyle = eventTheme.chip;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const t = `Winner ${winner}   |   Impact ${data.impact}   |   Uses Left ${data.usesLeft}/3`;
  ctx.font = '800 36px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = eventTheme.text;
  const line = fitText(ctx, t, w - 250);
  const tw = ctx.measureText(line).width;
  ctx.fillText(line, Math.floor((w - tw) / 2), h - 67);
}

function drawWinnerTag(ctx, x, y, eventTheme) {
  rr(ctx, x, y, 160, 50, 10);
  const g = ctx.createLinearGradient(x, y, x + 160, y);
  g.addColorStop(0, eventTheme.a);
  g.addColorStop(1, eventTheme.b);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.font = '900 28px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(10,12,16,0.92)";
  ctx.fillText("WINNER", x + 22, y + 34);
}

async function buildCardSlashImage(data) {
  registerCanvasFonts();
  const W = 1800;
  const H = 980;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const eventKey = data.eventKey === "jjk" ? "jjk" : "bleach";
  const eventTheme = theme(eventKey);

  await drawBackground(ctx, W, H);
  drawHeader(ctx, W, eventTheme);

  const left = { ...data.left, art: await loadCardArt(eventKey, data.left.card) };
  const right = { ...data.right, art: await loadCardArt(eventKey, data.right.card) };
  const leftWin = data.winnerId === left.userId;
  const rightWin = data.winnerId === right.userId;

  const cardW = 700;
  const cardH = 640;
  const leftX = 86;
  const rightX = W - cardW - 86;
  const cardY = 168;

  drawCardOnly(ctx, left, leftX, cardY, cardW, cardH, eventTheme, leftWin);
  drawCardOnly(ctx, right, rightX, cardY, cardW, cardH, eventTheme, rightWin);

  drawUserName(ctx, left.userName, 96, 870, 640, "left", eventTheme, leftWin);
  drawUserName(ctx, right.userName, W - 96, 870, 640, "right", eventTheme, rightWin);

  if (leftWin) drawWinnerTag(ctx, leftX + cardW - 176, cardY - 20, eventTheme);
  if (rightWin) drawWinnerTag(ctx, rightX + cardW - 176, cardY - 20, eventTheme);

  drawWinnerBar(ctx, W, H, data, eventTheme);
  return canvas.toBuffer("image/png");
}

module.exports = { buildCardSlashImage };
