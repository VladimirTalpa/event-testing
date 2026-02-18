const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { RARITY_COLORS, cardStatsAtLevel, cardPower } = require("../data/cards");
const { registerCanvasFonts } = require("./fonts");

const CARDS_ROOT = path.join(__dirname, "..", "..", "assets", "cards");
const TEMPLATES_ROOT = path.join(__dirname, "..", "..", "assets", "templates");

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
      bgA: "#120204",
      bgB: "#2a050c",
      accentA: "#ff3f68",
      accentB: "#ff8fb0",
      glow: "rgba(255,80,120,0.72)",
    };
  }
  return {
    bgA: "#130900",
    bgB: "#2f1202",
    accentA: "#ff9d33",
    accentB: "#ffd39a",
    glow: "rgba(255,160,70,0.72)",
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

  for (let i = 0; i < 160; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 0.7 + Math.random() * 2.2;
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.14)" : "rgba(255,170,90,0.12)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCenteredTitle(ctx, w, theme, title, subtitle) {
  ctx.font = '900 64px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const g = ctx.createLinearGradient(w * 0.25, 0, w * 0.75, 0);
  g.addColorStop(0, theme.accentA);
  g.addColorStop(1, theme.accentB);
  ctx.fillStyle = g;
  const t = fitText(ctx, title, w - 120);
  const tw = ctx.measureText(t).width;
  ctx.fillText(t, (w - tw) / 2, 98);

  ctx.strokeStyle = theme.accentA;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(88, 122);
  ctx.lineTo(w - 88, 122);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = '700 30px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(240,240,250,0.95)";
  const st = fitText(ctx, subtitle, w - 140);
  const stw = ctx.measureText(st).width;
  ctx.fillText(st, (w - stw) / 2, 162);
}

function drawCardBack(ctx, x, y, w, h, theme) {
  rr(ctx, x - 6, y - 6, w + 12, h + 12, 30);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();

  rr(ctx, x, y, w, h, 26);
  const cg = ctx.createLinearGradient(x, y, x + w, y + h);
  cg.addColorStop(0, "rgba(20,22,36,0.98)");
  cg.addColorStop(1, "rgba(8,10,16,0.96)");
  ctx.fillStyle = cg;
  ctx.fill();

  ctx.strokeStyle = theme.accentA;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 22;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = '900 44px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(x + 30, 0, x + w - 30, 0);
  tg.addColorStop(0, theme.accentB);
  tg.addColorStop(1, theme.accentA);
  ctx.fillStyle = tg;
  const txt = "CARD PACK";
  const tw = ctx.measureText(txt).width;
  ctx.fillText(txt, x + (w - tw) / 2, y + 98);

  rr(ctx, x + 34, y + 126, w - 68, h - 180, 16);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();

  ctx.font = '800 24px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(235,235,248,0.92)";
  const open = "OPENING";
  const ow = ctx.measureText(open).width;
  ctx.fillText(open, x + (w - ow) / 2, y + h - 54);
}

async function loadCardArt(eventKey, cardId) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const eventBase = path.join(CARDS_ROOT, ek);
  const genericBase = CARDS_ROOT;
  const exts = ["png", "jpg", "jpeg", "webp"];
  const bases = [eventBase, genericBase, TEMPLATES_ROOT];
  for (const ext of exts) {
    for (const base of bases) {
      const p = path.join(base, `${cardId}.${ext}`);
      if (!fs.existsSync(p)) continue;
      try {
        return await loadImage(p);
      } catch {}
    }
  }
  return null;
}

function drawStatBadge(ctx, x, y, w, h, label, value, color) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = "rgba(6,8,14,0.64)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.font = '700 16px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(225,225,238,0.92)";
  ctx.fillText(label, x + 12, y + 23);

  ctx.font = '900 24px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(String(Math.max(0, Number(value || 0))), x + 12, y + 51);
}

async function buildPackOpeningImage({ eventKey = "bleach", username = "Player", packName = "Card Pack" } = {}) {
  registerCanvasFonts();
  const W = 1280;
  const H = 720;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const theme = eventTheme(eventKey);

  drawBackground(ctx, W, H, theme);
  drawCenteredTitle(ctx, W, theme, "CARD OPENING", `Player: ${username}`);

  const cardH = 470;
  const cardW = 320;
  const cardX = Math.floor((W - cardW) / 2);
  const cardY = 186;
  drawCardBack(ctx, cardX, cardY, cardW, cardH, theme);

  ctx.font = '700 26px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.96)";
  const status = fitText(ctx, `Preparing ${packName}...`, W - 120);
  const sw = ctx.measureText(status).width;
  ctx.fillText(status, (W - sw) / 2, H - 44);

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
  const lv = Math.max(1, Math.floor(Number(level || 1)));
  const stats = cardStatsAtLevel(card, lv);
  const power = cardPower(stats);

  drawBackground(ctx, W, H, theme);
  drawCenteredTitle(ctx, W, theme, "CARD REVEAL", `Player: ${username}`);

  const art = await loadCardArt(eventKey, card?.id);

  const fallbackRatio = 0.58;
  const ratio = art && art.width > 0 && art.height > 0 ? art.width / art.height : fallbackRatio;
  const maxH = 560;
  const maxW = 470;
  let cardH = maxH;
  let cardW = Math.round(cardH * ratio);
  if (cardW > maxW) {
    cardW = maxW;
    cardH = Math.round(cardW / Math.max(0.01, ratio));
  }

  const cardX = Math.floor((W - cardW) / 2);
  const cardY = 142;

  rr(ctx, cardX - 8, cardY - 8, cardW + 16, cardH + 16, 26);
  ctx.fillStyle = "rgba(0,0,0,0.33)";
  ctx.fill();

  rr(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.save();
  ctx.clip();
  if (art) {
    ctx.drawImage(art, cardX, cardY, cardW, cardH);
  } else {
    const gg = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    gg.addColorStop(0, "rgba(20,22,36,0.98)");
    gg.addColorStop(1, "rgba(8,10,16,0.96)");
    ctx.fillStyle = gg;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.font = '800 34px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(240,240,250,0.9)";
    const nt = "NO CARD ART";
    const ntw = ctx.measureText(nt).width;
    ctx.fillText(nt, cardX + (cardW - ntw) / 2, cardY + Math.floor(cardH / 2));
  }
  ctx.restore();

  ctx.strokeStyle = rarityColor;
  ctx.shadowColor = rarityColor;
  ctx.shadowBlur = 24;
  ctx.lineWidth = 2.8;
  rr(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const ribbonH = 56;
  rr(ctx, cardX + 16, cardY + 16, cardW - 32, ribbonH, 12);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '900 30px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = rarityColor;
  const name = fitText(ctx, String(card?.name || "Unknown Card"), cardW - 44 - 120);
  ctx.fillText(name, cardX + 28, cardY + 52);

  rr(ctx, cardX + cardW - 104, cardY + 24, 72, 36, 10);
  ctx.fillStyle = "rgba(10,10,16,0.72)";
  ctx.fill();
  ctx.strokeStyle = rarityColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.font = '900 21px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.96)";
  ctx.fillText(`Lv ${lv}`, cardX + cardW - 90, cardY + 49);

  const statsPanelH = 88;
  rr(ctx, cardX + 14, cardY + cardH - statsPanelH - 14, cardW - 28, statsPanelH, 14);
  ctx.fillStyle = "rgba(0,0,0,0.56)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const panelX = cardX + 24;
  const panelY = cardY + cardH - statsPanelH - 6;
  const gap = 8;
  const bw = Math.floor((cardW - 48 - gap * 3) / 4);
  drawStatBadge(ctx, panelX, panelY, bw, 66, "DMG", stats.dmg, "#ff9360");
  drawStatBadge(ctx, panelX + bw + gap, panelY, bw, 66, "DEF", stats.def, "#6bd1ff");
  drawStatBadge(ctx, panelX + (bw + gap) * 2, panelY, bw, 66, "HP", stats.hp, "#8fff9b");
  drawStatBadge(ctx, panelX + (bw + gap) * 3, panelY, bw, 66, "PWR", power, rarityColor);

  ctx.font = '700 22px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.96)";
  const meta = `Rarity: ${rarity}  |  Owned: ${Math.max(1, Number(countOwned || 1))}`;
  const metaText = fitText(ctx, meta, W - 120);
  const mw = ctx.measureText(metaText).width;
  ctx.fillText(metaText, (W - mw) / 2, H - 24);

  return canvas.toBuffer("image/png");
}

module.exports = {
  buildPackOpeningImage,
  buildCardRevealImage,
};
