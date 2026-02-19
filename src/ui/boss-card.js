const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const BOSS_BG_DIR = path.join(__dirname, "..", "..", "assets", "templates", "boss");
const BOSS_W = 1600;
const BOSS_H = 900;

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

function fitFont(ctx, text, maxW, size, min = 22, family = '"Orbitron", "Inter", "Segoe UI", sans-serif', weight = 700) {
  let s = size;
  while (s > min) {
    ctx.font = `${weight} ${s}px ${family}`;
    if (ctx.measureText(String(text)).width <= maxW) break;
    s -= 1;
  }
  return s;
}

function glowText(ctx, text, x, y, opts = {}) {
  const {
    size = 56,
    weight = 700,
    gradA = "#fb923c",
    gradB = "#f43f5e",
    stroke = "rgba(8,8,16,0.92)",
    glow = "rgba(251,146,60,0.7)",
    family = '"Orbitron", "Inter", "Segoe UI", sans-serif',
  } = opts;

  ctx.font = `${weight} ${size}px ${family}`;
  const w = Math.max(140, ctx.measureText(String(text)).width);
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, gradA);
  g.addColorStop(1, gradB);

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.strokeText(String(text), x, y);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = g;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 14;
  ctx.fillText(String(text), x, y);
  ctx.restore();
}

function particles(ctx, w, h, palette, count = 260) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 0.8 + Math.random() * 2.8;
    const a = 0.08 + Math.random() * 0.4;
    const c = palette[i % palette.length] || "255,255,255";
    ctx.save();
    ctx.fillStyle = `rgba(${c},${a.toFixed(3)})`;
    ctx.shadowColor = `rgba(${c},${Math.min(a + 0.2, 0.9).toFixed(3)})`;
    ctx.shadowBlur = 8 + Math.random() * 14;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawVignette(ctx, w, h, color = "0,0,0", strength = 0.5) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.62);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawScanlines(ctx, w, h, alpha = 0.05) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  ctx.restore();
}

function drawEnergyStreaks(ctx, w, h, theme, count = 14) {
  for (let i = 0; i < count; i++) {
    const x1 = Math.random() * w * 0.88;
    const y1 = 40 + Math.random() * (h - 120);
    const x2 = x1 + 120 + Math.random() * 460;
    const y2 = y1 + (-36 + Math.random() * 72);
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, theme.line);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.2 + Math.random() * 1.8;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 10 + Math.random() * 14;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) * 0.5, y1 - 18 + Math.random() * 36, x2, y2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCornerFlares(ctx, w, h, theme) {
  const pts = [
    [44, 42],
    [w - 44, 42],
    [44, h - 42],
    [w - 44, h - 42],
  ];
  for (const [x, y] of pts) {
    const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
    g.addColorStop(0, theme.textB);
    g.addColorStop(0.35, theme.textA);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawChip(ctx, x, y, text, theme) {
  ctx.font = '700 26px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const tw = ctx.measureText(text).width;
  const cw = Math.ceil(tw + 44);
  rr(ctx, x, y, cw, 44, 10);
  const g = ctx.createLinearGradient(x, y, x + cw, y);
  g.addColorStop(0, "rgba(255,255,255,0.1)");
  g.addColorStop(1, "rgba(255,255,255,0.02)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  glowText(ctx, text, x + 20, y + 31, {
    size: 26,
    gradA: theme.textA,
    gradB: theme.textB,
    glow: theme.glow,
  });
}

function sanitizeDisplayText(input) {
  return String(input || "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/[|¦Â]+/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ellipsizeText(ctx, text, maxWidth) {
  const raw = sanitizeDisplayText(text);
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let out = raw;
  while (out.length > 0 && ctx.measureText(`${out}...`).width > maxWidth) out = out.slice(0, -1);
  return `${out}...`;
}

function drawDamageBars(ctx, x, y, w, rows, theme) {
  const max = Math.max(1, ...rows.map((r) => Math.floor(r.dmg || 0)));
  const total = Math.max(1, rows.reduce((acc, r) => acc + Math.max(0, Math.floor(r.dmg || 0)), 0));
  const rowH = 56;
  const rowGap = 12;

  function compactDmg(n) {
    const v = Math.max(0, Math.floor(n || 0));
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
    return String(v);
  }

  function fitName(base, maxWidth) {
    let out = String(base || "Unknown");
    ctx.font = '800 33px "Inter", "Segoe UI", sans-serif';
    if (ctx.measureText(out).width <= maxWidth) return out;
    while (out.length > 0 && ctx.measureText(`${out}...`).width > maxWidth) out = out.slice(0, -1);
    return `${out}...`;
  }

  rows.forEach((r, i) => {
    const yy = y + i * (rowH + rowGap);
    const dmg = Math.max(0, Math.floor(r.dmg || 0));
    const pctRaw = Math.max(0, Math.min(100, (dmg / total) * 100));
    const pctText = `${pctRaw.toFixed(1)}%`;
    const barMaxW = w - 10;
    const bw = Math.max(20, Math.floor((dmg / max) * barMaxW));

    rr(ctx, x, yy, w, rowH, 11);
    ctx.fillStyle = "rgba(8,8,12,0.54)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    const fx = x + 5;
    const fy = yy + 5;
    const fh = rowH - 10;
    rr(ctx, fx, fy, bw, fh, 9);
    const g = ctx.createLinearGradient(fx, fy, fx + barMaxW, fy);
    g.addColorStop(0, i === 0 ? theme.textB : theme.textA);
    g.addColorStop(0.7, i === 0 ? theme.textA : theme.bad);
    g.addColorStop(1, "rgba(255,52,52,0.95)");
    ctx.fillStyle = g;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = i === 0 ? 18 : 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Shine layer for a more premium bar finish.
    rr(ctx, fx + 1, fy + 1, Math.max(8, bw - 2), Math.floor(fh * 0.46), 7);
    const shine = ctx.createLinearGradient(fx, fy, fx, fy + fh * 0.46);
    shine.addColorStop(0, "rgba(255,255,255,0.36)");
    shine.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = shine;
    ctx.fill();

    const badgeW = 212;
    const badgeX = x + w - badgeW - 10;
    rr(ctx, badgeX, yy + 7, badgeW, rowH - 14, 9);
    ctx.fillStyle = "rgba(14,10,12,0.8)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const rank = `${i + 1}.`;
    const name = fitName(sanitizeDisplayText(String(r.name || "Unknown")), w - badgeW - 78);
    const nameX = x + 14;
    const nameY = yy + 36;

    ctx.lineWidth = 2.8;
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.font = '900 32px "Inter", "Segoe UI", sans-serif';
    ctx.strokeText(rank, nameX, nameY);
    ctx.fillStyle = "rgba(245,245,255,0.98)";
    ctx.fillText(rank, nameX, nameY);

    const rankW = ctx.measureText(rank).width;
    ctx.strokeText(name, nameX + rankW + 8, nameY);
    ctx.fillText(name, nameX + rankW + 8, nameY);

    const valueText = `${compactDmg(dmg)} DMG`;
    ctx.font = '900 28px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = i === 0 ? theme.textB : "rgba(245,245,255,0.98)";
    const valueW = ctx.measureText(valueText).width;
    ctx.fillText(valueText, badgeX + badgeW - valueW - 14, yy + 30);

    ctx.font = '700 20px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(220,225,255,0.94)";
    const pctW = ctx.measureText(pctText).width;
    ctx.fillText(pctText, badgeX + badgeW - pctW - 14, yy + 50);
  });
}

function drawDeadOverlay(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,40,40,0.85)";
  ctx.lineWidth = 18;
  ctx.shadowColor = "rgba(255,40,40,0.85)";
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.moveTo(80, 80);
  ctx.lineTo(w - 80, h - 80);
  ctx.moveTo(w - 80, 80);
  ctx.lineTo(80, h - 80);
  ctx.stroke();
  ctx.restore();

  rr(ctx, 328, 360, 944, 166, 14);
  ctx.fillStyle = "rgba(16,2,4,0.72)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,80,80,0.78)";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  glowText(ctx, "DEAFETED", 500, 432, {
    size: 74,
    gradA: "#ffb3b3",
    gradB: "#ff2d2d",
    glow: "rgba(255,30,30,0.9)",
  });
  glowText(ctx, "IT'S OVER FOR YOU", 430, 500, {
    size: 54,
    gradA: "#ffb3b3",
    gradB: "#ff2d2d",
    glow: "rgba(255,30,30,0.9)",
  });
}

function getTheme(defOrEvent) {
  const eventKey = typeof defOrEvent === "string" ? defOrEvent : String(defOrEvent?.event || "");
  const bossId = typeof defOrEvent === "string" ? "" : String(defOrEvent?.id || "").toLowerCase();

  if (bossId === "vasto") {
    return {
      bgA: "#060302",
      bgB: "#180902",
      bgC: "#351003",
      line: "rgba(255,148,62,0.88)",
      panelA: "rgba(24,10,4,0.86)",
      panelB: "rgba(46,18,7,0.62)",
      textA: "#ff9a2f",
      textB: "#ffd18b",
      glow: "rgba(255,137,41,0.75)",
      particles: ["255,152,64", "255,112,35", "255,220,170"],
      ok: "#ffb255",
      bad: "#b85a2c",
    };
  }
  if (bossId === "ulquiorra") {
    return {
      bgA: "#020909",
      bgB: "#062118",
      bgC: "#0b3b2d",
      line: "rgba(74,222,128,0.88)",
      panelA: "rgba(5,20,14,0.86)",
      panelB: "rgba(8,42,28,0.62)",
      textA: "#5eead4",
      textB: "#86efac",
      glow: "rgba(74,222,128,0.75)",
      particles: ["94,234,212", "74,222,128", "187,247,208"],
      ok: "#86efac",
      bad: "#2f7d57",
    };
  }
  if (bossId === "grimmjow") {
    return {
      bgA: "#020614",
      bgB: "#081f4b",
      bgC: "#0b3181",
      line: "rgba(96,165,250,0.88)",
      panelA: "rgba(8,20,44,0.86)",
      panelB: "rgba(12,42,88,0.62)",
      textA: "#60a5fa",
      textB: "#93c5fd",
      glow: "rgba(96,165,250,0.75)",
      particles: ["96,165,250", "59,130,246", "147,197,253"],
      ok: "#93c5fd",
      bad: "#274f88",
    };
  }
  if (bossId === "mahoraga") {
    return {
      bgA: "#08030f",
      bgB: "#1a0830",
      bgC: "#2e0f52",
      line: "rgba(167,139,250,0.88)",
      panelA: "rgba(20,10,35,0.86)",
      panelB: "rgba(36,16,62,0.62)",
      textA: "#c4b5fd",
      textB: "#e9d5ff",
      glow: "rgba(167,139,250,0.75)",
      particles: ["167,139,250", "196,181,253", "233,213,255"],
      ok: "#ddd6fe",
      bad: "#6b46a8",
    };
  }
  if (bossId === "specialgrade") {
    return {
      bgA: "#0f0205",
      bgB: "#30080f",
      bgC: "#52101c",
      line: "rgba(244,63,94,0.88)",
      panelA: "rgba(34,8,14,0.86)",
      panelB: "rgba(62,14,24,0.62)",
      textA: "#fb7185",
      textB: "#fecdd3",
      glow: "rgba(244,63,94,0.75)",
      particles: ["251,113,133", "244,63,94", "254,205,211"],
      ok: "#fda4af",
      bad: "#8b2940",
    };
  }
  if (eventKey === "bleach") {
    return {
      bgA: "#060302",
      bgB: "#180902",
      bgC: "#351003",
      line: "rgba(255,148,62,0.88)",
      panelA: "rgba(24,10,4,0.86)",
      panelB: "rgba(46,18,7,0.62)",
      textA: "#ff9a2f",
      textB: "#ffd18b",
      glow: "rgba(255,137,41,0.75)",
      particles: ["255,152,64", "255,112,35", "255,220,170"],
      ok: "#ffb255",
      bad: "#b85a2c",
    };
  }
  return {
    bgA: "#040303",
    bgB: "#170407",
    bgC: "#2c070c",
    line: "rgba(255,86,86,0.88)",
    panelA: "rgba(20,8,10,0.86)",
    panelB: "rgba(44,10,14,0.62)",
    textA: "#ff6262",
    textB: "#ff9b9b",
    glow: "rgba(255,76,76,0.75)",
    particles: ["255,98,98", "235,48,48", "190,22,34"],
    ok: "#ff7a7a",
    bad: "#9a3242",
  };
}

async function tryLoadImage(url) {
  if (!url) return null;
  try {
    return await loadImage(url);
  } catch {
    return null;
  }
}

async function loadBossBackground(def, kind) {
  const bossId = String(def?.id || "").toLowerCase();
  const eventKey = String(def?.event || "").toLowerCase();
  const phase = String(kind || "").toLowerCase();
  const phaseOrder = phase === "live" ? ["live", "result", "intro"] : [phase];
  const bossAliases = Array.from(new Set([
    bossId,
    bossId === "specialgrade" ? "sgrade" : "",
  ].filter(Boolean)));
  const files = [];
  for (const p of phaseOrder) {
    for (const alias of bossAliases) {
      files.push(
        `${alias}_${p}.png`,
        `${alias}_${p}.jpg`,
        `${alias}_${p}.jpeg`,
        `${alias}_${p}.webp`
      );
    }
    files.push(
      `${eventKey}_${p}.png`,
      `${eventKey}_${p}.jpg`,
      `${eventKey}_${p}.jpeg`,
      `${eventKey}_${p}.webp`,
      `${p}.png`,
      `${p}.jpg`,
      `${p}.jpeg`,
      `${p}.webp`
    );
  }
  files.push("default.png", "default.jpg", "default.jpeg", "default.webp");
  for (const file of files) {
    const full = path.join(BOSS_BG_DIR, file);
    if (!fs.existsSync(full)) continue;
    try {
      return await loadImage(full);
    } catch {}
  }
  return null;
}
function hpBar(ctx, x, y, w, h, pct, theme) {
  rr(ctx, x, y, w, h, 12);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const fw = Math.max(6, Math.floor((Math.max(0, Math.min(100, pct)) / 100) * (w - 4)));
  rr(ctx, x + 2, y + 2, fw, h - 4, 10);
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, theme.textA);
  g.addColorStop(1, theme.textB);
  ctx.fillStyle = g;
  ctx.fill();
}

async function buildBossIntroImage(def, opts = {}) {
  const w = BOSS_W;
  const h = BOSS_H;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const theme = getTheme(def);

  const customBg = await loadBossBackground(def, "intro");
  if (customBg) {
    ctx.drawImage(customBg, 0, 0, w, h);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, theme.bgA);
    bg.addColorStop(0.45, theme.bgB);
    bg.addColorStop(1, theme.bgC);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  particles(ctx, w, h, theme.particles, 420);
  drawEnergyStreaks(ctx, w, h, theme, 20);
  drawScanlines(ctx, w, h, 0.03);
  drawVignette(ctx, w, h, "2,2,8", 0.46);

  const art = await tryLoadImage(def?.spawnMedia);
  if (art) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.drawImage(art, w - 660, 40, 620, 820);
    const artGlow = ctx.createRadialGradient(w - 320, h * 0.5, 50, w - 320, h * 0.5, 320);
    artGlow.addColorStop(0, "rgba(255,255,255,0.18)");
    artGlow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = artGlow;
    ctx.fillRect(w - 700, 0, 700, h);
    ctx.restore();
  }

  rr(ctx, 34, 28, w - 68, h - 56, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, 48, 42, w - 96, h - 84, 22);
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  drawCornerFlares(ctx, w, h, theme);

  glowText(ctx, "RAID ANOMALY DETECTED", 92, 118, {
    size: 56,
    gradA: theme.textA,
    gradB: theme.textB,
    glow: theme.glow,
  });

  const bossName = String(def?.name || "UNKNOWN BOSS").toUpperCase();
  const bossSize = fitFont(ctx, bossName, 900, 120, 54);
  glowText(ctx, bossName, 88, 252, {
    size: bossSize,
    gradA: theme.textB,
    gradB: theme.textA,
    glow: theme.glow,
  });

  ctx.fillStyle = "rgba(245,245,250,0.95)";
  ctx.font = '600 44px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(`Difficulty: ${def?.difficulty || "Unknown"}`, 94, 324);

  const joinSec = Math.max(1, Math.floor((opts.joinMs || def?.joinMs || 0) / 1000));
  glowText(ctx, `JOIN WINDOW ${joinSec}s`, 92, 410, {
    size: 52,
    gradA: theme.textA,
    gradB: theme.textB,
    glow: theme.glow,
  });
  drawChip(ctx, 1090, 84, `DIFFICULTY ${String(def?.difficulty || "UNKNOWN").toUpperCase()}`, theme);

  rr(ctx, 88, 448, 910, 320, 18);
  const panel = ctx.createLinearGradient(88, 448, 998, 768);
  panel.addColorStop(0, theme.panelA);
  panel.addColorStop(1, theme.panelB);
  ctx.fillStyle = panel;
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const reward =
    def?.winRewardRange
      ? `${def.winRewardRange.min}-${def.winRewardRange.max}`
      : `${def?.winReward || 0}`;
  const lines = [
    `Event: ${String(def?.event || "").toUpperCase()}`,
    `Rounds: ${Array.isArray(def?.rounds) ? def.rounds.length : 0}`,
    `Win Reward: ${reward}`,
    `Per Success: +${def?.hitReward || 0} banked`,
    `Elimination: ${def?.maxHits || 2} hits`,
    "Prepare your defense and burst windows.",
  ];

  ctx.fillStyle = "rgba(245,245,255,0.95)";
  ctx.font = '600 36px "Inter", "Segoe UI", sans-serif';
  lines.forEach((line, i) => ctx.fillText(`- ${line}`, 116, 512 + i * 44));

  glowText(ctx, "BATTLE STARTING", 1110, 838, {
    size: 42,
    gradA: theme.textA,
    gradB: theme.textB,
    glow: theme.glow,
  });

  return canvas.toBuffer("image/png");
}

async function buildBossResultImage(def, opts = {}) {
  const w = BOSS_W;
  const h = BOSS_H;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const theme = getTheme(def);

  const customBg = await loadBossBackground(def, "result");
  if (customBg) {
    ctx.drawImage(customBg, 0, 0, w, h);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, theme.bgA);
    bg.addColorStop(0.45, theme.bgB);
    bg.addColorStop(1, theme.bgC);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  particles(ctx, w, h, theme.particles, 360);
  drawEnergyStreaks(ctx, w, h, theme, 16);
  drawScanlines(ctx, w, h, 0.03);
  drawVignette(ctx, w, h, "2,2,8", 0.44);

  rr(ctx, 34, 28, w - 68, h - 56, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, 48, 42, w - 96, h - 84, 22);
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  drawCornerFlares(ctx, w, h, theme);

  const statusText = opts.victory ? "RAID CLEAR" : "RAID FAILED";
  glowText(ctx, statusText, 88, 118, {
    size: 68,
    gradA: opts.victory ? theme.textB : theme.textA,
    gradB: opts.victory ? theme.textA : theme.bad,
    glow: theme.glow,
  });

  const bossName = String(def?.name || "UNKNOWN").toUpperCase();
  const bossSize = fitFont(ctx, bossName, 920, 94, 46);
  glowText(ctx, bossName, 88, 222, {
    size: bossSize,
    gradA: theme.textA,
    gradB: theme.textB,
    glow: theme.glow,
  });

  const hpLeft = Math.max(0, Math.floor(opts.hpLeft || 0));
  const hpTotal = Math.max(1, Math.floor(opts.hpTotal || 1));
  const pct = Math.max(0, Math.min(100, Math.round((hpLeft / hpTotal) * 100)));
  ctx.fillStyle = "rgba(245,245,255,0.95)";
  ctx.font = '600 34px "Inter", "Segoe UI", sans-serif';
  const hpLineResult = ellipsizeText(ctx, `Boss HP: ${hpLeft}/${hpTotal} (${pct}%)`, 940);
  ctx.fillText(hpLineResult, 90, 280);
  hpBar(ctx, 90, 304, 970, 36, pct, theme);

  rr(ctx, 88, 366, 970, 468, 18);
  const panel = ctx.createLinearGradient(88, 366, 1058, 834);
  panel.addColorStop(0, theme.panelA);
  panel.addColorStop(1, theme.panelB);
  ctx.fillStyle = panel;
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const top = Array.isArray(opts.topDamage) ? opts.topDamage.slice(0, 5) : [];
  ctx.fillStyle = "rgba(245,245,255,0.98)";
  ctx.font = '700 40px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText("Top Damage", 118, 428);

  if (!top.length) {
    ctx.font = '600 31px "Inter", "Segoe UI", sans-serif';
    ctx.fillText("No registered damage.", 120, 492);
  } else {
    drawDamageBars(ctx, 118, 454, 910, top, theme);
  }

  const survivors = Math.max(0, Number(opts.survivors || 0));
  const joined = Math.max(survivors, Number(opts.joined || 0));
  rr(ctx, 1120, 366, 430, 468, 18);
  const rightPanel = ctx.createLinearGradient(1120, 366, 1550, 834);
  rightPanel.addColorStop(0, theme.panelA);
  rightPanel.addColorStop(1, theme.panelB);
  ctx.fillStyle = rightPanel;
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  glowText(ctx, "Raid Stats", 1160, 430, {
    size: 44,
    gradA: theme.textA,
    gradB: theme.textB,
    glow: theme.glow,
  });

  const stats = [
    `Joined: ${joined}`,
    `Survivors: ${survivors}`,
    `Eliminated: ${Math.max(0, joined - survivors)}`,
    `Rounds: ${Array.isArray(def?.rounds) ? def.rounds.length : 0}`,
    `Result: ${opts.victory ? "Victory" : "Defeat"}`,
  ];
  ctx.fillStyle = "rgba(245,245,255,0.96)";
  ctx.font = '600 31px "Inter", "Segoe UI", sans-serif';
  stats.forEach((s, i) => {
    const line = ellipsizeText(ctx, s, 360);
    ctx.fillText(line, 1160, 500 + i * 56);
  });

  if (opts.deadOverlay) drawDeadOverlay(ctx, w, h);

  return canvas.toBuffer("image/png");
}

async function buildBossLiveImage(def, opts = {}) {
  const w = BOSS_W;
  const h = BOSS_H;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const theme = getTheme(def);

  const customBg = await loadBossBackground(def, "live");
  if (customBg) {
    ctx.drawImage(customBg, 0, 0, w, h);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, theme.bgA);
    bg.addColorStop(0.45, theme.bgB);
    bg.addColorStop(1, theme.bgC);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  particles(ctx, w, h, theme.particles, 320);
  drawEnergyStreaks(ctx, w, h, theme, 12);
  drawScanlines(ctx, w, h, 0.028);
  drawVignette(ctx, w, h, "2,2,8", 0.42);

  rr(ctx, 34, 28, w - 68, h - 56, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, 48, 42, w - 96, h - 84, 22);
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  drawCornerFlares(ctx, w, h, theme);

  const phase = String(opts.phase || "LIVE");
  glowText(ctx, `${String(def?.name || "BOSS").toUpperCase()} - LIVE`, 88, 120, {
    size: 52,
    gradA: theme.textA,
    gradB: theme.textB,
    glow: theme.glow,
  });
  glowText(ctx, phase.toUpperCase(), 88, 198, {
    size: 60,
    gradA: theme.textB,
    gradB: theme.textA,
    glow: theme.glow,
  });

  const hpLeft = Math.max(0, Math.floor(opts.hpLeft || 0));
  const hpTotal = Math.max(1, Math.floor(opts.hpTotal || 1));
  const pct = Math.max(0, Math.min(100, Math.round((hpLeft / hpTotal) * 100)));
  ctx.fillStyle = "rgba(245,245,255,0.95)";
  ctx.font = '600 34px "Inter", "Segoe UI", sans-serif';
  const hpLineLive = ellipsizeText(ctx, `Boss HP: ${hpLeft}/${hpTotal} (${pct}%)`, 940);
  ctx.fillText(hpLineLive, 90, 258);
  hpBar(ctx, 90, 282, 970, 34, pct, theme);

  rr(ctx, 88, 342, 970, 492, 18);
  const left = ctx.createLinearGradient(88, 342, 1058, 834);
  left.addColorStop(0, theme.panelA);
  left.addColorStop(1, theme.panelB);
  ctx.fillStyle = left;
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const top = Array.isArray(opts.topDamage) ? opts.topDamage.slice(0, 5) : [];
  ctx.fillStyle = "rgba(245,245,255,0.98)";
  ctx.font = '700 38px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText("Top Damage", 118, 404);
  if (!top.length) {
    ctx.font = '600 30px "Inter", "Segoe UI", sans-serif';
    ctx.fillText("No registered damage.", 120, 466);
  } else {
    drawDamageBars(ctx, 118, 430, 910, top, theme);
  }

  const noteA = String(opts.noteA || "").trim();
  const noteB = String(opts.noteB || "").trim();
  const noteC = String(opts.noteC || "").trim();
  const notes = [noteA, noteB, noteC].filter(Boolean);
  if (notes.length) {
    rr(ctx, 1120, 342, 430, 492, 18);
    const right = ctx.createLinearGradient(1120, 342, 1550, 834);
    right.addColorStop(0, theme.panelA);
    right.addColorStop(1, theme.panelB);
    ctx.fillStyle = right;
    ctx.fill();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    glowText(ctx, "RAID FLOW", 1160, 396, {
      size: 34,
      gradA: theme.textA,
      gradB: theme.textB,
      glow: theme.glow,
    });
    ctx.fillStyle = "rgba(245,245,255,0.95)";
    ctx.font = '700 24px "Inter", "Segoe UI", sans-serif';
    notes.forEach((n, i) => {
      const yy = 448 + i * 62;
      rr(ctx, 1148, yy - 30, 372, 48, 10);
      ctx.fillStyle = "rgba(0,0,0,0.34)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(245,245,255,0.95)";
      const clean = ellipsizeText(ctx, n, 346);
      ctx.fillText(clean, 1162, yy + 3);
    });
  }

  return canvas.toBuffer("image/png");
}

async function buildBossRewardImage(def, opts = {}) {
  const w = BOSS_W;
  const h = BOSS_H;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const theme = getTheme(def);

  const customBg = await loadBossBackground(def, "reward");
  if (customBg) {
    ctx.drawImage(customBg, 0, 0, w, h);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, theme.bgA);
    bg.addColorStop(0.45, theme.bgB);
    bg.addColorStop(1, theme.bgC);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  particles(ctx, w, h, theme.particles, 300);
  drawEnergyStreaks(ctx, w, h, theme, 12);
  drawScanlines(ctx, w, h, 0.026);
  drawVignette(ctx, w, h, "2,2,8", 0.4);

  rr(ctx, 34, 28, w - 68, h - 56, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, 48, 42, w - 96, h - 84, 22);
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  drawCornerFlares(ctx, w, h, theme);

  glowText(ctx, `${String(def?.name || "BOSS").toUpperCase()} REWARDS`, 88, 120, {
    size: 68,
    gradA: theme.textB,
    gradB: theme.textA,
    glow: theme.glow,
  });

  const rewardRows = Array.isArray(opts.rows) ? opts.rows.slice(0, 10) : [];
  rr(ctx, 88, 170, 1420, 690, 18);
  const panel = ctx.createLinearGradient(88, 170, 1508, 860);
  panel.addColorStop(0, theme.panelA);
  panel.addColorStop(1, theme.panelB);
  ctx.fillStyle = panel;
  ctx.fill();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "rgba(245,245,255,0.98)";
  ctx.font = '700 34px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText("Receive Summary", 118, 226);

  if (!rewardRows.length) {
    ctx.font = '600 30px "Inter", "Segoe UI", sans-serif';
    ctx.fillText("No rewards recorded.", 122, 286);
  } else {
    rewardRows.forEach((r, i) => {
      const y = 286 + i * 58;
      rr(ctx, 112, y - 34, 1370, 46, 9);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = i === 0 ? theme.ok : "rgba(245,245,255,0.96)";
      ctx.font = '600 28px "Inter", "Segoe UI", sans-serif';
      const rawLine = `${i + 1}. ${sanitizeDisplayText(String(r.name || "Unknown"))}  ${sanitizeDisplayText(String(r.text || ""))}`;
      const line = ellipsizeText(ctx, rawLine, 1340);
      ctx.fillText(line, 126, y);
    });
  }

  return canvas.toBuffer("image/png");
}

module.exports = {
  buildBossIntroImage,
  buildBossResultImage,
  buildBossLiveImage,
  buildBossRewardImage,
};

