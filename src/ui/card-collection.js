const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { CARD_POOL, RARITY_COLORS, cardStatsAtLevel, cardPower } = require("../data/cards");
const { registerCanvasFonts } = require("./fonts");

const CARD_LIBRARY_ROOT = path.join(__dirname, "..", "..", "assets", "cards", "library");

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

function fitText(ctx, text, maxWidth) {
  const raw = String(text || "");
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let out = raw;
  while (out.length > 1 && ctx.measureText(`${out}...`).width > maxWidth) out = out.slice(0, -1);
  return `${out}...`;
}

function fitContain(srcW, srcH, boxW, boxH) {
  const sw = Math.max(1, Number(srcW || 1));
  const sh = Math.max(1, Number(srcH || 1));
  const bw = Math.max(1, Number(boxW || 1));
  const bh = Math.max(1, Number(boxH || 1));
  const scale = Math.min(bw / sw, bh / sh);
  const w = Math.floor(sw * scale);
  const h = Math.floor(sh * scale);
  const x = Math.floor((bw - w) / 2);
  const y = Math.floor((bh - h) / 2);
  return { x, y, w, h };
}

async function loadCardArt(eventKey, cardId) {
  const base = path.join(CARD_LIBRARY_ROOT, eventKey === "jjk" ? "jjk" : "bleach");
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

async function buildCardCollectionImage({ eventKey = "bleach", username = "Player", ownedRows = [] } = {}) {
  registerCanvasFonts();

  const cols = 4;
  const cardW = 250;
  const cardH = 370;
  const gap = 18;
  const pad = 28;
  const rows = Math.max(1, Math.ceil(Math.max(1, ownedRows.length) / cols));
  const W = pad * 2 + cols * cardW + (cols - 1) * gap;
  const H = 120 + pad * 2 + rows * cardH + (rows - 1) * gap;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, eventKey === "jjk" ? "#120205" : "#1a0d00");
  bg.addColorStop(1, eventKey === "jjk" ? "#300911" : "#3a1702");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 140; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 0.6 + Math.random() * 2.1;
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.12)" : "rgba(255,180,100,0.1)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = '900 48px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#f3e9d2";
  const title = `${eventKey.toUpperCase()} CARD COLLECTION`;
  ctx.fillText(title, pad, 64);
  ctx.font = '700 24px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(235,235,245,0.95)";
  ctx.fillText(`Player: ${username}`, pad, 96);

  if (!ownedRows.length) {
    ctx.font = '800 40px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(245,245,255,0.92)";
    ctx.fillText("NO CARDS YET", pad, 200);
    return canvas.toBuffer("image/png");
  }

  for (let i = 0; i < ownedRows.length; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = pad + c * (cardW + gap);
    const y = 120 + pad + r * (cardH + gap);
    const row = ownedRows[i];
    const rarityColor = RARITY_COLORS[row.card.rarity] || "#c8d0e0";

    rr(ctx, x - 4, y - 4, cardW + 8, cardH + 8, 14);
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.fill();
    rr(ctx, x, y, cardW, cardH, 12);
    ctx.fillStyle = "rgba(8,8,12,0.95)";
    ctx.fill();
    ctx.strokeStyle = rarityColor;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    const art = await loadCardArt(eventKey, row.card.id);
    const artX = x + 8;
    const artY = y + 8;
    const artW = cardW - 16;
    const artH = cardH - 74;
    rr(ctx, artX, artY, artW, artH, 10);
    ctx.save();
    ctx.clip();
    if (art) {
      const fit = fitContain(art.width, art.height, artW, artH);
      ctx.drawImage(art, artX + fit.x, artY + fit.y, fit.w, fit.h);
    } else {
      const p = ctx.createLinearGradient(artX, artY, artX + artW, artY + artH);
      p.addColorStop(0, "rgba(255,255,255,0.12)");
      p.addColorStop(1, "rgba(255,255,255,0.04)");
      ctx.fillStyle = p;
      ctx.fillRect(artX, artY, artW, artH);
      ctx.font = '700 24px "Orbitron", "Inter", "Segoe UI", sans-serif';
      ctx.fillStyle = "rgba(230,230,240,0.9)";
      ctx.fillText("NO ART", artX + 64, artY + artH / 2);
    }
    ctx.restore();

    rr(ctx, x + 8, y + cardH - 58, cardW - 16, 50, 10);
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '800 20px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = rarityColor;
    const nm = fitText(ctx, row.card.name, cardW - 20);
    ctx.fillText(nm, x + 12, y + cardH - 35);

    ctx.font = '700 16px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(235,235,245,0.95)";
    ctx.fillText(`Lv ${row.level} • x${row.amount}`, x + 12, y + cardH - 13);
    ctx.fillText(`PWR ${row.power}`, x + cardW - 98, y + cardH - 13);
  }

  return canvas.toBuffer("image/png");
}

module.exports = { buildCardCollectionImage };
