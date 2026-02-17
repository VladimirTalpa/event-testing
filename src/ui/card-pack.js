const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { RARITY_COLORS, cardStatsAtLevel } = require("../data/cards");
const { registerCanvasFonts } = require("./fonts");

const CARDS_ROOT = path.join(__dirname, "..", "..", "assets", "cards");

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

function eventTheme(eventKey) {
  if (eventKey === "jjk") {
    return {
      bgA: "#150305",
      bgB: "#2a060c",
      accentA: "#ff395d",
      accentB: "#ff8aa0",
      glow: "rgba(255, 70, 100, 0.72)",
    };
  }
  return {
    bgA: "#1a0d00",
    bgB: "#3a1702",
    accentA: "#ff9d33",
    accentB: "#ffd39a",
    glow: "rgba(255, 160, 60, 0.72)",
  };
}

function fitText(ctx, text, maxWidth) {
  const raw = String(text || "");
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let out = raw;
  while (out.length > 1 && ctx.measureText(`${out}...`).width > maxWidth) out = out.slice(0, -1);
  return `${out}...`;
}

function drawBackground(ctx, w, h, theme) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bgA);
  bg.addColorStop(1, theme.bgB);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 130; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 0.6 + Math.random() * 2.4;
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.16)" : "rgba(255,150,90,0.13)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHeader(ctx, w, theme, title, sub) {
  ctx.font = '800 62px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const grad = ctx.createLinearGradient(80, 0, 760, 0);
  grad.addColorStop(0, theme.accentA);
  grad.addColorStop(1, theme.accentB);
  ctx.fillStyle = grad;
  ctx.fillText(title, 84, 108);

  ctx.strokeStyle = theme.accentA;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(84, 132);
  ctx.lineTo(w - 84, 132);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = '700 34px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.96)";
  ctx.fillText(sub, 86, 176);
}

function drawPack(ctx, w, h, theme, label) {
  const x = Math.floor(w / 2 - 170);
  const y = Math.floor(h / 2 - 90);
  const pw = 340;
  const ph = 420;

  rr(ctx, x - 8, y - 8, pw + 16, ph + 16, 26);
  ctx.fillStyle = "rgba(5,5,8,0.4)";
  ctx.fill();

  rr(ctx, x, y, pw, ph, 22);
  const pg = ctx.createLinearGradient(x, y, x + pw, y + ph);
  pg.addColorStop(0, "rgba(20,20,28,0.95)");
  pg.addColorStop(1, "rgba(8,8,12,0.92)");
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.strokeStyle = theme.accentA;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '800 40px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = theme.accentB;
  const t = fitText(ctx, label, pw - 44);
  ctx.fillText(t, x + 22, y + 76);

  ctx.font = '700 24px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(230,230,245,0.9)";
  ctx.fillText("OPENING...", x + 22, y + 118);

  for (let i = 0; i < 4; i++) {
    rr(ctx, x + 26, y + 152 + i * 54, pw - 52, 36, 12);
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.11)";
    ctx.fill();
  }
}

async function loadCardArt(eventKey, cardId) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const base = path.join(CARDS_ROOT, ek);
  const exts = ["png", "jpg", "jpeg", "webp"];
  for (const ext of exts) {
    const p = path.join(base, `${cardId}.${ext}`);
    if (!fs.existsSync(p)) continue;
    try {
      return await loadImage(p);
    } catch {}
  }
  return null;
}

function drawStatBox(ctx, x, y, w, h, label, value, color) {
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.font = '700 22px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(230,230,245,0.88)";
  ctx.fillText(label, x + 16, y + 30);

  ctx.font = '900 36px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(String(Math.max(0, Number(value || 0))), x + 16, y + 72);
}

async function buildPackOpeningImage({ eventKey = "bleach", username = "Player", packName = "Card Pack" } = {}) {
  registerCanvasFonts();
  const W = 1280;
  const H = 720;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const theme = eventTheme(eventKey);

  drawBackground(ctx, W, H, theme);
  drawHeader(ctx, W, theme, "CARD OPENING", `Player: ${username}`);
  drawPack(ctx, W, H, theme, packName);

  ctx.font = '700 28px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.96)";
  ctx.fillText("Summoning your card...", 86, H - 72);

  return canvas.toBuffer("image/png");
}

async function buildCardRevealImage({ eventKey = "bleach", username = "Player", card = null, countOwned = 1, level = 1 } = {}) {
  registerCanvasFonts();
  const W = 1280;
  const H = 720;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const theme = eventTheme(eventKey);
  const rarity = String(card?.rarity || "Common");
  const rarityColor = RARITY_COLORS[rarity] || "#c8d0e0";
  const cardLevel = Math.max(1, Math.floor(Number(level || 1)));
  const stats = cardStatsAtLevel(card, cardLevel);

  drawBackground(ctx, W, H, theme);
  drawHeader(ctx, W, theme, "CARD PULLED", `Player: ${username}`);

  const cardX = 280;
  const cardY = 170;
  const cardW = 720;
  const cardH = 490;

  rr(ctx, cardX - 10, cardY - 10, cardW + 20, cardH + 20, 30);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fill();

  rr(ctx, cardX, cardY, cardW, cardH, 26);
  const cg = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cg.addColorStop(0, "rgba(17,20,30,0.97)");
  cg.addColorStop(1, "rgba(7,8,14,0.96)");
  ctx.fillStyle = cg;
  ctx.fill();

  ctx.strokeStyle = rarityColor;
  ctx.shadowColor = rarityColor;
  ctx.shadowBlur = 24;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const artX = cardX + 34;
  const artY = cardY + 34;
  const artW = 270;
  const artH = 350;
  rr(ctx, artX, artY, artW, artH, 16);
  ctx.save();
  ctx.clip();

  const art = await loadCardArt(eventKey, card?.id);
  if (art) {
    ctx.drawImage(art, artX, artY, artW, artH);
  } else {
    const pg = ctx.createLinearGradient(artX, artY, artX + artW, artY + artH);
    pg.addColorStop(0, "rgba(255,255,255,0.14)");
    pg.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = pg;
    ctx.fillRect(artX, artY, artW, artH);
    ctx.font = '700 26px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(240,240,255,0.92)";
    ctx.fillText("No Card Art", artX + 62, artY + 188);
  }
  ctx.restore();
  rr(ctx, artX, artY, artW, artH, 16);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const tx = cardX + 330;
  const tw = cardW - (tx - cardX) - 30;

  ctx.font = '900 50px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = rarityColor;
  const rarityText = fitText(ctx, rarity.toUpperCase(), tw);
  ctx.fillText(rarityText, tx, cardY + 82);

  ctx.font = '800 46px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.98)";
  const cardName = fitText(ctx, String(card?.name || "Unknown Card"), tw);
  ctx.fillText(cardName, tx, cardY + 148);

  ctx.font = '700 28px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(225,225,240,0.95)";
  ctx.fillText(`Owned: ${Math.max(1, Number(countOwned || 1))}`, tx, cardY + 194);
  ctx.fillText(`Level: ${cardLevel}`, tx + 220, cardY + 194);

  drawStatBox(ctx, tx, cardY + 224, Math.floor((tw - 16) / 3), 92, "DMG", stats.dmg, "#ff9360");
  drawStatBox(ctx, tx + Math.floor((tw - 16) / 3) + 8, cardY + 224, Math.floor((tw - 16) / 3), 92, "DEF", stats.def, "#6bd1ff");
  drawStatBox(ctx, tx + (Math.floor((tw - 16) / 3) + 8) * 2, cardY + 224, Math.floor((tw - 16) / 3), 92, "HP", stats.hp, "#8fff9b");

  rr(ctx, tx, cardY + 336, tw, 92, 14);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.font = '700 26px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(240,240,255,0.94)";
  ctx.fillText("Card added to your collection", tx + 24, cardY + 392);

  return canvas.toBuffer("image/png");
}

module.exports = {
  buildPackOpeningImage,
  buildCardRevealImage,
};
