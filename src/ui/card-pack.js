const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { RARITY_COLORS, cardStatsAtLevel, cardPower } = require("../data/cards");
const { registerCanvasFonts } = require("./fonts");

const CARD_LIBRARY_ROOT = path.join(__dirname, "..", "..", "assets", "cards", "library");
const TEMPLATE_DIR = path.join(__dirname, "..", "..", "assets", "templates");
const artPathCache = new Map();
const OPENING_TEMPLATE_MAP = {
  bleach: "bl_opening.png",
  jjk: "jjk_opening.png",
};

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
      bgA: "#0d101b",
      bgB: "#181327",
      accentA: "#ff4d7a",
      accentB: "#ff9bc6",
      surface: "rgba(14,18,30,0.74)",
      panelStroke: "rgba(255,255,255,0.2)",
      textMain: "rgba(245,247,255,0.97)",
      textMuted: "rgba(200,210,230,0.9)",
      glow: "rgba(255,94,148,0.62)",
    };
  }
  return {
    bgA: "#0f0f14",
    bgB: "#1b1620",
    accentA: "#ffad3b",
    accentB: "#ffe0a8",
    surface: "rgba(18,18,24,0.74)",
    panelStroke: "rgba(255,255,255,0.2)",
    textMain: "rgba(247,247,252,0.97)",
    textMuted: "rgba(220,222,235,0.9)",
    glow: "rgba(255,180,95,0.62)",
  };
}

function fitText(ctx, text, maxWidth) {
  const raw = String(text || "");
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let out = raw;
  while (out.length > 1 && ctx.measureText(`${out}...`).width > maxWidth) out = out.slice(0, -1);
  return `${out}...`;
}

function drawSoftGrid(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  const step = 48;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlassPanel(ctx, x, y, w, h, r, fill, stroke) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.1;
  ctx.stroke();
}

function drawBackground(ctx, w, h, theme) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bgA);
  bg.addColorStop(1, theme.bgB);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawSoftGrid(ctx, w, h);

  const glowA = ctx.createRadialGradient(w * 0.18, h * 0.18, 20, w * 0.18, h * 0.18, w * 0.5);
  glowA.addColorStop(0, "rgba(255,255,255,0.14)");
  glowA.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, w, h);

  const glowB = ctx.createRadialGradient(w * 0.82, h * 0.82, 20, w * 0.82, h * 0.82, w * 0.55);
  glowB.addColorStop(0, "rgba(255,255,255,0.08)");
  glowB.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 140; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 0.6 + Math.random() * 1.8;
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.12)" : "rgba(255,210,140,0.1)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCenteredTitle(ctx, w, theme, title, subtitle) {
  ctx.font = '900 60px "Orbitron", "Inter", "Segoe UI", sans-serif';
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
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(116, 120);
  ctx.lineTo(w - 116, 120);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = '700 26px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = theme.textMuted;
  const st = String(subtitle || "").trim();
  if (st) {
    const t = fitText(ctx, st, w - 140);
    const stw = ctx.measureText(t).width;
    ctx.fillText(t, (w - stw) / 2, 158);
  }
}

function drawOpeningAtmosphere(ctx, w, h, theme) {
  const v = ctx.createRadialGradient(w * 0.5, h * 0.56, 40, w * 0.5, h * 0.56, Math.max(w, h) * 0.72);
  v.addColorStop(0, "rgba(255,255,255,0.04)");
  v.addColorStop(0.5, "rgba(0,0,0,0.14)");
  v.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 12; i++) {
    const x1 = Math.random() * w;
    const y1 = 120 + Math.random() * (h - 200);
    const x2 = x1 + 180 + Math.random() * 440;
    const y2 = y1 + (-70 + Math.random() * 140);
    const lg = ctx.createLinearGradient(x1, y1, x2, y2);
    lg.addColorStop(0, "rgba(255,180,95,0)");
    lg.addColorStop(0.5, "rgba(255,220,165,0.32)");
    lg.addColorStop(1, "rgba(255,180,95,0)");
    ctx.save();
    ctx.strokeStyle = lg;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, y1 - 22 + Math.random() * 44, x2, y2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCardBack(ctx, x, y, w, h, theme) {
  rr(ctx, x - 6, y - 6, w + 12, h + 12, 30);
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fill();

  rr(ctx, x, y, w, h, 26);
  const cg = ctx.createLinearGradient(x, y, x + w, y + h);
  cg.addColorStop(0, "rgba(26,29,45,0.98)");
  cg.addColorStop(1, "rgba(10,12,20,0.98)");
  ctx.fillStyle = cg;
  ctx.fill();

  ctx.strokeStyle = theme.accentA;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 2.1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = '900 38px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(x + 30, 0, x + w - 30, 0);
  tg.addColorStop(0, theme.accentB);
  tg.addColorStop(1, theme.accentA);
  ctx.fillStyle = tg;
  const txt = "PREMIUM PACK";
  const tw = ctx.measureText(txt).width;
  ctx.fillText(txt, x + (w - tw) / 2, y + 90);

  rr(ctx, x + 26, y + 112, w - 52, h - 176, 20);
  const ig = ctx.createLinearGradient(x, y + 112, x, y + h - 64);
  ig.addColorStop(0, "rgba(255,255,255,0.09)");
  ig.addColorStop(1, "rgba(255,255,255,0.03)");
  ctx.fillStyle = ig;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();

  rr(ctx, x + 80, y + 186, w - 160, w - 160, 20);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = '900 46px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  const emblem = "CP";
  const ew = ctx.measureText(emblem).width;
  ctx.fillText(emblem, x + (w - ew) / 2, y + Math.floor(h / 2) + 28);

  ctx.font = '800 22px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(235,235,248,0.95)";
  const open = "UNSEALING";
  const ow = ctx.measureText(open).width;
  ctx.fillText(open, x + (w - ow) / 2, y + h - 44);
}

function drawOpeningPortal(ctx, x, y, w, h, theme) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  const aura = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.9);
  aura.addColorStop(0, "rgba(255,245,210,0.2)");
  aura.addColorStop(0.35, "rgba(255,180,90,0.16)");
  aura.addColorStop(1, "rgba(255,160,70,0)");
  ctx.fillStyle = aura;
  ctx.fillRect(x - 220, y - 210, w + 440, h + 420);

  for (let i = 0; i < 3; i++) {
    const r = Math.max(w, h) * (0.43 + i * 0.05);
    ctx.save();
    ctx.strokeStyle = i === 1 ? "rgba(255,220,170,0.92)" : "rgba(255,170,84,0.82)";
    ctx.lineWidth = i === 1 ? 2.4 : 1.5;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 18 + i * 6;
    ctx.setLineDash(i === 2 ? [16, 9] : []);
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * (0.1 + i * 0.02), Math.PI * (1.9 - i * 0.03));
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < 24; i++) {
    const px = x - 30 + Math.random() * (w + 60);
    const py = y - 40 + Math.random() * (h + 80);
    const pr = 0.8 + Math.random() * 2;
    const alpha = 0.18 + Math.random() * 0.46;
    ctx.save();
    ctx.fillStyle = `rgba(255,220,140,${alpha.toFixed(3)})`;
    ctx.shadowColor = "rgba(255,220,140,0.9)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const shine = ctx.createLinearGradient(0, y + 26, 0, y + 132);
  shine.addColorStop(0, "rgba(255,255,255,0.19)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  rr(ctx, x + 24, y + 18, w - 48, 116, 14);
  ctx.fill();
}

async function loadCardArt(eventKey, cardId) {
  const cacheKey = `${eventKey}:${cardId}`;
  if (artPathCache.has(cacheKey)) {
    const cached = artPathCache.get(cacheKey);
    if (!cached) return null;
    try { return await loadImage(cached); } catch {}
  }

  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const eventLibraryBase = path.join(CARD_LIBRARY_ROOT, ek);
  const repoRoot = path.join(__dirname, "..", "..");
  const exts = ["png", "jpg", "jpeg", "webp"];
  const bases = Array.from(new Set([
    eventLibraryBase,
    path.join(repoRoot, "assets", "cards", ek),
    path.join(repoRoot, "assets", "cards"),
    path.join(repoRoot, "assets", "templates", ek),
    path.join(repoRoot, "assets", "templates", "cards", ek),
    path.join(repoRoot, "assets", "templates"),
  ]));
  const aliases = Array.from(new Set([
    String(cardId || "").toLowerCase(),
    String(cardId || "").toLowerCase().replace(/^bl_/, ""),
    String(cardId || "").toLowerCase().replace(/^jjk_/, ""),
    String(cardId || "").toLowerCase().replace(/^nl_/, ""),
  ])).filter(Boolean);

  function allFilesRecursive(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    const stack = [dir];
    while (stack.length) {
      const cur = stack.pop();
      let ents = [];
      try { ents = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
      for (const ent of ents) {
        const p = path.join(cur, ent.name);
        if (ent.isDirectory()) stack.push(p);
        else out.push(p);
      }
    }
    return out;
  }

  for (const ext of exts) {
    for (const base of bases) {
      const p = path.join(base, `${cardId}.${ext}`);
      if (!fs.existsSync(p)) continue;
      try {
        artPathCache.set(cacheKey, p);
        return await loadImage(p);
      } catch {}
    }
  }

  // Fallback: recursive + alias-based filename match
  const all = bases.flatMap((b) => allFilesRecursive(b));
  for (const p of all) {
    const ext = path.extname(p).toLowerCase().replace(".", "");
    if (!exts.includes(ext)) continue;
    const name = path.basename(p, path.extname(p)).toLowerCase();
    if (aliases.includes(name) || aliases.some((a) => name.includes(a))) {
      try {
        artPathCache.set(cacheKey, p);
        return await loadImage(p);
      } catch {}
    }
  }

  artPathCache.set(cacheKey, null);
  console.warn(`[cards] art not found for ${cardId} in assets/cards/library/${ek}`);
  return null;
}

function drawStatBadge(ctx, x, y, w, h, label, value, color) {
  drawGlassPanel(ctx, x, y, w, h, 10, "rgba(6,8,14,0.62)", "rgba(255,255,255,0.2)");

  ctx.font = '700 16px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(225,225,238,0.92)";
  ctx.fillText(label, x + 12, y + 23);

  ctx.font = '900 24px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(String(Math.max(0, Number(value || 0))), x + 12, y + 51);
}

function drawInfoTile(ctx, x, y, w, h, title, value, valueColor = "rgba(245,245,255,0.96)") {
  drawGlassPanel(ctx, x, y, w, h, 12, "rgba(8,10,16,0.62)", "rgba(255,255,255,0.18)");

  ctx.font = '700 17px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(220,225,238,0.9)";
  ctx.fillText(title, x + 14, y + 24);

  ctx.font = '900 28px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = valueColor;
  const v = fitText(ctx, String(value || "-"), w - 26);
  ctx.fillText(v, x + 14, y + 58);
}

function isLegendaryOrMythic(rarity) {
  const r = String(rarity || "").toLowerCase();
  return r === "legendary" || r === "mythic";
}

function drawLegendaryMythicFX(ctx, W, H, cardX, cardY, cardW, cardH) {
  const cx = cardX + cardW / 2;
  const cy = cardY + cardH / 2;

  // Central golden aura
  const aura = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(cardW, cardH) * 0.95);
  aura.addColorStop(0, "rgba(255, 220, 110, 0.26)");
  aura.addColorStop(0.45, "rgba(255, 180, 70, 0.17)");
  aura.addColorStop(1, "rgba(255, 180, 70, 0)");
  ctx.fillStyle = aura;
  ctx.fillRect(cardX - 220, cardY - 180, cardW + 440, cardH + 360);

  // Energy arcs
  for (let i = 0; i < 8; i++) {
    const sx = cardX - 40 + Math.random() * (cardW + 80);
    const sy = cardY - 50 + Math.random() * (cardH + 100);
    const ex = cardX - 40 + Math.random() * (cardW + 80);
    const ey = cardY - 50 + Math.random() * (cardH + 100);
    const midX = (sx + ex) / 2 + (Math.random() - 0.5) * 120;
    const midY = (sy + ey) / 2 + (Math.random() - 0.5) * 100;
    const lg = ctx.createLinearGradient(sx, sy, ex, ey);
    lg.addColorStop(0, "rgba(255, 195, 88, 0)");
    lg.addColorStop(0.5, "rgba(255, 214, 130, 0.7)");
    lg.addColorStop(1, "rgba(255, 195, 88, 0)");
    ctx.save();
    ctx.strokeStyle = lg;
    ctx.lineWidth = 1.2 + Math.random() * 1.8;
    ctx.shadowColor = "rgba(255, 212, 124, 0.85)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(midX, midY, ex, ey);
    ctx.stroke();
    ctx.restore();
  }

  // Spark particles
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const inside =
      x >= cardX - 180 && x <= cardX + cardW + 180 &&
      y >= cardY - 140 && y <= cardY + cardH + 140;
    if (!inside && Math.random() < 0.75) continue;
    const r = 0.7 + Math.random() * 2.1;
    const a = 0.12 + Math.random() * 0.5;
    ctx.save();
    ctx.fillStyle = `rgba(255, 216, 125, ${a.toFixed(3)})`;
    ctx.shadowColor = "rgba(255, 220, 140, 0.92)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

async function buildPackOpeningImage({ eventKey = "bleach", username = "Player", packName = "Card Pack" } = {}) {
  const ek = eventKey === "jjk" ? "jjk" : "bleach";
  const templateFile = OPENING_TEMPLATE_MAP[ek];
  if (templateFile) {
    const templatePath = path.join(TEMPLATE_DIR, templateFile);
    if (fs.existsSync(templatePath)) {
      try {
        return fs.readFileSync(templatePath);
      } catch (err) {
        console.warn(`[cards] opening template read failed for ${ek}: ${err?.message || err}`);
      }
    }
  }

  registerCanvasFonts();
  const W = 1280;
  const H = 720;
  const SCALE = 2; // Render at HiDPI for crisper output
  const canvas = createCanvas(W * SCALE, H * SCALE);
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const theme = eventTheme(eventKey);

  drawBackground(ctx, W, H, theme);
  drawOpeningAtmosphere(ctx, W, H, theme);
  drawCenteredTitle(ctx, W, theme, "PACK OPENING", `Player: ${username}`);

  const cardH = 492;
  const cardW = 338;
  const cardX = Math.floor((W - cardW) / 2);
  const cardY = 170;
  drawOpeningPortal(ctx, cardX, cardY, cardW, cardH, theme);
  drawCardBack(ctx, cardX, cardY, cardW, cardH, theme);

  drawGlassPanel(ctx, Math.floor(W / 2) - 252, cardY + cardH + 14, 504, 44, 12, theme.surface, theme.panelStroke);

  const info = String(eventKey || "").toLowerCase() === "jjk" ? "JJK" : "BLEACH";
  ctx.font = '900 17px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = theme.accentB;
  const infoTxt = `${info} PACK`;
  ctx.fillText(infoTxt, Math.floor(W / 2) - 236, cardY + cardH + 43);

  ctx.font = '700 28px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = theme.textMain;
  const status = fitText(ctx, `Preparing ${packName}...`, W - 120);
  const sw = ctx.measureText(status).width;
  ctx.fillText(status, (W - sw) / 2, H - 30);


  return canvas.toBuffer("image/png");
}

async function buildCardRevealImage({ eventKey = "bleach", username = "Player", card = null, countOwned = 1, level = 1 } = {}) {
  registerCanvasFonts();
  const W = 1280;
  const H = 720;
  const SCALE = 2; // HiDPI render
  const canvas = createCanvas(W * SCALE, H * SCALE);
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const theme = eventTheme(eventKey);
  const rarity = String(card?.rarity || "Common");
  const rarityColor = RARITY_COLORS[rarity] || "#c8d0e0";
  const premiumTier = isLegendaryOrMythic(rarity);
  const lv = Math.max(1, Math.floor(Number(level || 1)));
  const stats = cardStatsAtLevel(card, lv);
  const power = cardPower(stats);

  drawBackground(ctx, W, H, theme);
  drawCenteredTitle(ctx, W, theme, "CARD REVEAL", "High Quality Render");

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
  const cardY = 144;

  if (premiumTier) {
    drawLegendaryMythicFX(ctx, W, H, cardX, cardY, cardW, cardH);
  }

  // Side glow for stronger premium reveal atmosphere
  const glow = ctx.createRadialGradient(W / 2, cardY + cardH * 0.5, 40, W / 2, cardY + cardH * 0.5, 360);
  glow.addColorStop(0, "rgba(255,255,255,0.16)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(W / 2 - 380, cardY - 40, 760, cardH + 120);

  drawGlassPanel(ctx, cardX - 18, cardY - 18, cardW + 36, cardH + 36, 28, theme.surface, theme.panelStroke);

  rr(ctx, cardX - 8, cardY - 8, cardW + 16, cardH + 16, 26);
  ctx.fillStyle = "rgba(0,0,0,0.33)";
  ctx.fill();

  rr(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.save();
  ctx.clip();
  if (art) {
    const isPixelArtCandidate = art.width <= 700 || art.height <= 700;
    // For pixel-art: draw into a small offscreen canvas then scale up with nearest-neighbor
    if (isPixelArtCandidate) {
      try {
        const tmp = createCanvas(art.width, art.height);
        const tctx = tmp.getContext("2d");
        tctx.imageSmoothingEnabled = false;
        tctx.drawImage(art, 0, 0, art.width, art.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, art.width, art.height, cardX, cardY, cardW, cardH);
        ctx.imageSmoothingEnabled = true;
      } catch (e) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(art, cardX, cardY, cardW, cardH);
        ctx.imageSmoothingEnabled = true;
      }
    } else {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(art, cardX, cardY, cardW, cardH);
    }
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

  ctx.strokeStyle = premiumTier ? "#ffd982" : rarityColor;
  ctx.shadowColor = premiumTier ? "rgba(255, 214, 120, 0.95)" : rarityColor;
  ctx.shadowBlur = premiumTier ? 34 : 24;
  ctx.lineWidth = premiumTier ? 3.2 : 2.8;
  rr(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const ribbonH = 56;
  drawGlassPanel(ctx, cardX + 16, cardY + 16, cardW - 32, ribbonH, 12, "rgba(0,0,0,0.5)", "rgba(255,255,255,0.22)");

  ctx.font = '900 30px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = premiumTier ? "#ffe6ab" : rarityColor;
  const name = fitText(ctx, String(card?.name || "Unknown Card"), cardW - 44 - 120);
  ctx.fillText(name, cardX + 28, cardY + 52);

  drawGlassPanel(
    ctx,
    cardX + cardW - 104,
    cardY + 24,
    72,
    36,
    10,
    "rgba(10,10,16,0.72)",
    premiumTier ? "#ffd982" : rarityColor
  );
  ctx.font = '900 21px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(245,245,255,0.96)";
  ctx.fillText(`Lv ${lv}`, cardX + cardW - 90, cardY + 49);

  const statsPanelH = 88;
  drawGlassPanel(
    ctx,
    cardX + 14,
    cardY + cardH - statsPanelH - 14,
    cardW - 28,
    statsPanelH,
    14,
    "rgba(0,0,0,0.56)",
    "rgba(255,255,255,0.24)"
  );

  const panelX = cardX + 24;
  const panelY = cardY + cardH - statsPanelH - 6;
  const gap = 8;
  const bw = Math.floor((cardW - 48 - gap * 3) / 4);
  drawStatBadge(ctx, panelX, panelY, bw, 66, "DMG", stats.dmg, "#ff9360");
  drawStatBadge(ctx, panelX + bw + gap, panelY, bw, 66, "DEF", stats.def, "#6bd1ff");
  drawStatBadge(ctx, panelX + (bw + gap) * 2, panelY, bw, 66, "HP", stats.hp, "#8fff9b");
  drawStatBadge(ctx, panelX + (bw + gap) * 3, panelY, bw, 66, "PWR", power, premiumTier ? "#ffd982" : rarityColor);

  // Clean side info tiles (keeps all data readable, no overlap)
  const leftX = 66;
  const rightX = W - 356;
  const tileW = 290;
  const topY = 164;
  const gapY = 16;
  drawInfoTile(ctx, leftX, topY, tileW, 74, "PLAYER", username, theme.accentB);
  drawInfoTile(ctx, leftX, topY + 74 + gapY, tileW, 74, "RARITY", rarity.toUpperCase(), premiumTier ? "#ffd982" : rarityColor);
  drawInfoTile(ctx, leftX, topY + (74 + gapY) * 2, tileW, 74, "LEVEL", `Lv ${lv}`, "#bce6ff");
  drawInfoTile(ctx, leftX, topY + (74 + gapY) * 3, tileW, 74, "OWNED", Math.max(1, Number(countOwned || 1)), "#ffe3a1");

  drawInfoTile(ctx, rightX, topY, tileW, 74, "POWER", power, premiumTier ? "#ffd982" : rarityColor);

  if (premiumTier) {
    // Premium badge
    rr(ctx, Math.floor(W / 2) - 116, 108, 232, 34, 10);
    ctx.fillStyle = "rgba(10,10,14,0.62)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 216, 125, 0.92)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.font = '800 20px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#ffe8b1";
    const ptxt = "PREMIUM PULL";
    const pw = ctx.measureText(ptxt).width;
    ctx.fillText(ptxt, Math.floor(W / 2) - pw / 2, 132);
  }
  drawInfoTile(ctx, rightX, topY + 74 + gapY, tileW, 74, "DMG", stats.dmg, "#ff9360");
  drawInfoTile(ctx, rightX, topY + (74 + gapY) * 2, tileW, 74, "DEF", stats.def, "#6bd1ff");
  drawInfoTile(ctx, rightX, topY + (74 + gapY) * 3, tileW, 74, "HP", stats.hp, "#8fff9b");

  drawGlassPanel(ctx, 36, H - 78, 280, 42, 11, "rgba(8,10,16,0.58)", "rgba(255,255,255,0.16)");
  ctx.font = '700 16px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = theme.textMuted;
  ctx.fillText("Render: HQ Card Reveal", 52, H - 51);

  return canvas.toBuffer("image/png");
}

module.exports = {
  buildPackOpeningImage,
  buildCardRevealImage,
};
