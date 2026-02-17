const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const TEMPLATE_DIR = path.join(__dirname, "..", "..", "assets", "templates");
const emojiCache = new Map();

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

function extractEmojiId(v) {
  const s = String(v || "");
  const m = s.match(/\d{17,20}/);
  return m ? m[0] : null;
}

async function loadEmojiImage(emojiId) {
  const id = String(emojiId || "");
  if (!id) return null;
  if (emojiCache.has(id)) return emojiCache.get(id);
  const urls = [
    `https://cdn.discordapp.com/emojis/${id}.png?size=128&quality=lossless`,
    `https://cdn.discordapp.com/emojis/${id}.webp?size=128&quality=lossless`,
  ];
  for (const url of urls) {
    try {
      const img = await loadImage(url);
      emojiCache.set(id, img);
      return img;
    } catch {}
  }
  emojiCache.set(id, null);
  return null;
}

async function loadExchangeTemplate(eventKey) {
  const key = String(eventKey || "").toLowerCase();
  const files = [
    `exchange_${key}.png`,
    `exchange_${key}.jpg`,
    `exchange_${key}.jpeg`,
    `exchange_${key}.webp`,
    "exchange_template.png",
    "exchange_template.jpg",
    "exchange_template.jpeg",
    "exchange_template.webp",
  ];
  for (const f of files) {
    const p = path.join(TEMPLATE_DIR, f);
    if (!fs.existsSync(p)) continue;
    try {
      return await loadImage(p);
    } catch {}
  }
  return null;
}

function formatN(v) {
  return Math.max(0, Number(v || 0)).toLocaleString("en-US");
}

function drawBg(ctx, w, h, isBleach) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  if (isBleach) {
    g.addColorStop(0, "#120600");
    g.addColorStop(0.5, "#291103");
    g.addColorStop(1, "#4a1904");
  } else {
    g.addColorStop(0, "#060002");
    g.addColorStop(0.5, "#1a0408");
    g.addColorStop(1, "#320811");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawFrame(ctx, w, h, isBleach) {
  const line = isBleach ? "rgba(255,162,77,0.84)" : "rgba(255,92,124,0.84)";
  rr(ctx, 24, 24, w - 48, h - 48, 22);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, 38, 38, w - 76, h - 76, 18);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

async function buildExchangeImage(opts = {}) {
  const eventKey = String(opts.eventKey || "bleach").toLowerCase();
  const isBleach = eventKey === "bleach";
  const W = 1480;
  const H = 840;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const tpl = await loadExchangeTemplate(eventKey);
  if (tpl) {
    ctx.drawImage(tpl, 0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(0, 0, W, H);
  } else {
    drawBg(ctx, W, H, isBleach);
  }
  drawFrame(ctx, W, H, isBleach);

  const cA = isBleach ? "#ffb86b" : "#ff90b0";
  const cB = isBleach ? "#ff7b2c" : "#ff3d79";
  const line = isBleach ? "rgba(255,151,64,0.9)" : "rgba(255,78,122,0.9)";

  ctx.font = '800 78px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(80, 0, 760, 0);
  tg.addColorStop(0, cA);
  tg.addColorStop(1, cB);
  ctx.fillStyle = tg;
  ctx.fillText("EXCHANGE", 84, 122);

  ctx.strokeStyle = line;
  ctx.shadowColor = line;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(84, 146);
  ctx.lineTo(W - 84, 146);
  ctx.stroke();
  ctx.shadowBlur = 0;

  rr(ctx, 84, 176, 320, 88, 14);
  ctx.fillStyle = "rgba(10,10,14,0.45)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.stroke();
  ctx.font = '700 42px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.95)";
  ctx.fillText(isBleach ? "Bleach" : "JJK", 108, 233);

  rr(ctx, 84, 288, W - 168, 348, 18);
  ctx.fillStyle = "rgba(12,10,14,0.45)";
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const fromEmoji = await loadEmojiImage(extractEmojiId(opts.currencyEmoji));
  const drakoEmoji = await loadEmojiImage(extractEmojiId(opts.drakoEmoji));
  const iconSize = 116;
  const centerY = 442;

  if (fromEmoji) ctx.drawImage(fromEmoji, 176, centerY - 58, iconSize, iconSize);
  if (drakoEmoji) ctx.drawImage(drakoEmoji, W - 292, centerY - 58, iconSize, iconSize);

  ctx.font = '800 66px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.98)";
  ctx.fillText(formatN(opts.cost), 314, centerY + 24);
  const gotText = formatN(opts.drakoWanted);
  const tw = ctx.measureText(gotText).width;
  ctx.fillText(gotText, W - 332 - tw, centerY + 24);

  const arrowX1 = 560;
  const arrowX2 = W - 560;
  ctx.strokeStyle = line;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.shadowColor = line;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(arrowX1, centerY);
  ctx.lineTo(arrowX2, centerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(arrowX2 - 30, centerY - 18);
  ctx.lineTo(arrowX2, centerY);
  ctx.lineTo(arrowX2 - 30, centerY + 18);
  ctx.stroke();
  ctx.shadowBlur = 0;

  rr(ctx, 84, 664, W - 168, 106, 14);
  ctx.fillStyle = "rgba(8,8,12,0.52)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.stroke();
  ctx.font = '600 36px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.98)";
  const rateText = `Rate: ${opts.rate} -> 1 Drako`;
  const nowText = `Now: ${formatN(opts.afterCurrency)} | ${formatN(opts.afterDrako)} Drako`;
  ctx.fillText(rateText, 114, 716);
  ctx.fillText(nowText, 114, 758);

  return canvas.toBuffer("image/png");
}

module.exports = { buildExchangeImage };
