const { createCanvas } = require("@napi-rs/canvas");
const { registerCanvasFonts } = require("./fonts");

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

function fitText(ctx, text, maxW) {
  const raw = String(text || "");
  if (ctx.measureText(raw).width <= maxW) return raw;
  let out = raw;
  while (out.length > 0 && ctx.measureText(`${out}...`).width > maxW) out = out.slice(0, -1);
  return `${out}...`;
}

function formatNum(n) {
  return Math.max(0, Math.floor(Number(n || 0))).toLocaleString("en-US");
}

function themeForEvent(eventKey) {
  if (eventKey === "jjk") {
    return {
      bgA: "#120205",
      bgB: "#2d0711",
      accentA: "#ff3e67",
      accentB: "#ff9fb6",
      barA: "#ff3e67",
      barB: "#ff9f5c",
      label: "CURSED ENERGY RANKING",
    };
  }
  return {
    bgA: "#120901",
    bgB: "#2d1303",
    accentA: "#ff9f39",
    accentB: "#ffd9ab",
    barA: "#ff9f39",
    barB: "#ffd06b",
    label: "REIATSU RANKING",
  };
}

function buildCurrencyLeaderboardImage(eventKey, rows, guildName = "SERVER") {
  registerCanvasFonts();
  const W = 1600;
  const H = 960;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const t = themeForEvent(eventKey === "jjk" ? "jjk" : "bleach");
  const topRows = Array.isArray(rows) ? rows.slice(0, 10) : [];
  const maxScore = Math.max(1, ...topRows.map((r) => Number(r.score || 0)));

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, t.bgA);
  bg.addColorStop(1, t.bgB);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 360; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 0.8 + Math.random() * 2.1;
    const a = 0.08 + Math.random() * 0.34;
    ctx.fillStyle = i % 2 ? `rgba(255,255,255,${a.toFixed(3)})` : `rgba(255,170,100,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  rr(ctx, 34, 30, W - 68, H - 60, 28);
  ctx.fillStyle = "rgba(8,8,12,0.4)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.font = '900 84px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(110, 0, W - 110, 0);
  tg.addColorStop(0, t.accentA);
  tg.addColorStop(1, t.accentB);
  ctx.fillStyle = tg;
  const title = "EVENT LEADERBOARD";
  const tw = ctx.measureText(title).width;
  ctx.fillText(title, Math.floor((W - tw) / 2), 118);

  ctx.font = '700 33px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "rgba(240,240,250,0.95)";
  const sub = `${String(guildName || "SERVER").toUpperCase()} • ${t.label}`;
  const sw = ctx.measureText(sub).width;
  ctx.fillText(sub, Math.floor((W - sw) / 2), 163);

  ctx.strokeStyle = t.accentA;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 182);
  ctx.lineTo(W - 110, 182);
  ctx.stroke();

  const startX = 120;
  const startY = 220;
  const rowH = 60;
  const rowGap = 14;
  const boxW = W - 240;

  if (!topRows.length) {
    ctx.font = '800 54px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(240,240,250,0.9)";
    const empty = "NO PLAYERS YET";
    const ew = ctx.measureText(empty).width;
    ctx.fillText(empty, Math.floor((W - ew) / 2), 500);
    return canvas.toBuffer("image/png");
  }

  for (let i = 0; i < topRows.length; i++) {
    const y = startY + i * (rowH + rowGap);
    const r = topRows[i];
    const score = Math.max(0, Math.floor(Number(r.score || 0)));
    const pct = Math.max(0.04, score / maxScore);
    const fillW = Math.max(70, Math.floor((boxW - 16) * pct));

    rr(ctx, startX, y, boxW, rowH, 14);
    ctx.fillStyle = "rgba(10,10,14,0.58)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    rr(ctx, startX + 8, y + 8, fillW, rowH - 16, 10);
    const g = ctx.createLinearGradient(startX, y, startX + boxW, y);
    g.addColorStop(0, i === 0 ? t.accentB : t.barA);
    g.addColorStop(1, i === 0 ? "#fff2c0" : t.barB);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.font = '900 30px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.98)";
    const rank = `#${i + 1}`;
    ctx.fillText(rank, startX + 18, y + 40);

    ctx.font = '800 31px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "rgba(245,245,255,0.98)";
    const name = fitText(ctx, String(r.name || "Unknown"), 860);
    ctx.fillText(name, startX + 110, y + 40);

    ctx.font = '900 33px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = i === 0 ? "#fff2c0" : "rgba(245,245,255,0.98)";
    const sv = formatNum(score);
    const svw = ctx.measureText(sv).width;
    ctx.fillText(sv, startX + boxW - svw - 16, y + 40);
  }

  return canvas.toBuffer("image/png");
}

module.exports = { buildCurrencyLeaderboardImage };

