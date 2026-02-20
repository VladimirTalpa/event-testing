"use strict";

const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const BG_PATH = path.join(__dirname, "..", "..", "assets", "templates", "bg_clash.png");

function roundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.floor(Math.min(w, h) / 2)));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth) {
  const raw = String(text || "");
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let out = raw;
  while (out.length > 1 && ctx.measureText(`${out}...`).width > maxWidth) out = out.slice(0, -1);
  return `${out}...`;
}

function formatNum(n) {
  return Math.floor(Number(n || 0)).toLocaleString("en-US");
}

function currencyLabel(currency) {
  if (currency === "reiatsu") return "Reiatsu";
  if (currency === "cursed_energy") return "Cursed Energy";
  if (currency === "drako") return "Drako";
  return "Currency";
}

function drawParticles(ctx, w, h, count = 180) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 0.7 + Math.random() * 2.2;
    const a = 0.07 + Math.random() * 0.28;
    ctx.fillStyle = `rgba(255,176,92,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlassPanel(ctx, x, y, w, h, opts = {}) {
  const r = opts.radius || 20;
  const top = opts.top || "rgba(20,16,32,0.82)";
  const bottom = opts.bottom || "rgba(8,8,18,0.75)";
  const border = opts.border || "rgba(255,150,80,0.55)";
  roundedRectPath(ctx, x, y, w, h, r);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = opts.lineWidth || 1.4;
  ctx.stroke();
}

function drawNeonTitle(ctx, title, x, y, maxW) {
  ctx.font = '800 82px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const text = fitText(ctx, title, maxW);
  const tg = ctx.createLinearGradient(x, y - 70, x + maxW, y);
  tg.addColorStop(0, "#ffb259");
  tg.addColorStop(0.5, "#ffc98b");
  tg.addColorStop(1, "#ff58b9");
  ctx.fillStyle = tg;
  ctx.shadowColor = "rgba(255,130,75,0.42)";
  ctx.shadowBlur = 18;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

function drawTopRule(ctx, y, w) {
  const g = ctx.createLinearGradient(72, y, w - 72, y);
  g.addColorStop(0, "rgba(255,170,95,0)");
  g.addColorStop(0.5, "rgba(255,170,95,0.95)");
  g.addColorStop(1, "rgba(255,170,95,0)");
  ctx.strokeStyle = g;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, y);
  ctx.lineTo(w - 72, y);
  ctx.stroke();
}

function drawTag(ctx, text, x, y, w, colorA, colorB) {
  drawGlassPanel(ctx, x, y, w, 54, {
    radius: 14,
    top: "rgba(8,10,20,0.84)",
    bottom: "rgba(7,8,16,0.72)",
    border: "rgba(255,255,255,0.22)",
    lineWidth: 1,
  });
  ctx.font = '700 28px "Inter", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(x + 12, y + 16, x + w - 12, y + 36);
  tg.addColorStop(0, colorA);
  tg.addColorStop(1, colorB);
  ctx.fillStyle = tg;
  ctx.fillText(fitText(ctx, text, w - 24), x + 14, y + 36);
}

function drawVsBadge(ctx, x, y) {
  const size = 120;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x + size / 2, y + size / 2, 10, x + size / 2, y + size / 2, size / 2);
  g.addColorStop(0, "rgba(255,235,205,0.95)");
  g.addColorStop(1, "rgba(255,116,178,0.85)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.stroke();
  ctx.restore();

  ctx.font = '800 44px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#101224";
  ctx.fillText("VS", x + 26, y + 72);
}

async function drawBase(width = 1600, height = 900) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#120805");
  base.addColorStop(1, "#10050b");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  if (fs.existsSync(BG_PATH)) {
    try {
      const bg = await loadImage(BG_PATH);
      ctx.drawImage(bg, 0, 0, width, height);
    } catch {}
  }

  const overlay = ctx.createLinearGradient(0, 0, width, height);
  overlay.addColorStop(0, "rgba(10,6,10,0.56)");
  overlay.addColorStop(0.6, "rgba(9,6,12,0.72)");
  overlay.addColorStop(1, "rgba(6,5,10,0.82)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);

  drawParticles(ctx, width, height, 220);

  roundedRectPath(ctx, 18, 18, width - 36, height - 36, 28);
  ctx.strokeStyle = "rgba(255,164,88,0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();

  roundedRectPath(ctx, 30, 30, width - 60, height - 60, 24);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  return { canvas, ctx };
}

async function buildPvpChallengeImage({ challengerName, targetName, amount, currency, usesLeft }) {
  const { canvas, ctx } = await drawBase();
  const w = canvas.width;

  drawNeonTitle(ctx, "PVP CLASH", 78, 124, 860);
  drawTopRule(ctx, 152, w);

  drawGlassPanel(ctx, 72, 192, 632, 420, {
    border: "rgba(255,168,96,0.62)",
    top: "rgba(18,16,30,0.82)",
    bottom: "rgba(8,8,17,0.7)",
  });
  drawGlassPanel(ctx, 896, 192, 632, 420, {
    border: "rgba(255,116,186,0.62)",
    top: "rgba(20,12,26,0.82)",
    bottom: "rgba(8,8,17,0.7)",
  });
  drawVsBadge(ctx, 740, 344);

  ctx.font = '700 30px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffd9b8";
  ctx.fillText("Challenger", 102, 248);
  ctx.fillStyle = "#ffc9ef";
  ctx.fillText("Opponent", 926, 248);

  ctx.font = '800 62px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fitText(ctx, challengerName, 560), 102, 332);
  ctx.fillText(fitText(ctx, targetName, 560), 926, 332);

  drawTag(ctx, `Stake: ${formatNum(amount)} ${currencyLabel(currency)}`, 100, 380, 580, "#ffbf75", "#ff61c8");
  drawTag(ctx, `Daily Uses Left: ${usesLeft}`, 100, 448, 580, "#78edff", "#5fd8ff");
  drawTag(ctx, "Action Required: Opponent must click Accept or Decline", 100, 516, 580, "#ffcd8d", "#ff8ee0");

  drawGlassPanel(ctx, 896, 380, 632, 190, {
    border: "rgba(118,235,255,0.58)",
    top: "rgba(10,14,26,0.78)",
    bottom: "rgba(8,10,18,0.72)",
  });
  ctx.font = '700 31px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#daf6ff";
  ctx.fillText("Flow", 926, 424);
  ctx.font = '600 26px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#f3f8ff";
  ctx.fillText("1. Opponent reviews this challenge.", 926, 466);
  ctx.fillText("2. Opponent clicks a button below.", 926, 502);
  ctx.fillText("3. Winner is resolved instantly.", 926, 538);

  drawGlassPanel(ctx, 72, 660, w - 144, 158, {
    border: "rgba(130,228,255,0.5)",
    top: "rgba(12,15,28,0.74)",
    bottom: "rgba(8,10,18,0.72)",
  });
  ctx.font = '700 34px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#98f0ff";
  ctx.fillText("Awaiting Response", 100, 722);
  ctx.font = '600 27px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ecf7ff";
  ctx.fillText("Buttons are directly below this PNG. Accept to duel, or Decline to cancel.", 100, 770);

  return canvas.toBuffer("image/png");
}

async function buildPvpResultImage({ winnerName, loserName, amount, currency, winnerAfter, loserAfter }) {
  const { canvas, ctx } = await drawBase();
  const w = canvas.width;

  drawNeonTitle(ctx, "PVP RESULT", 78, 124, 860);
  drawTopRule(ctx, 152, w);

  drawGlassPanel(ctx, 72, 192, 930, 640, {
    border: "rgba(120,236,255,0.68)",
    top: "rgba(10,15,25,0.84)",
    bottom: "rgba(7,10,16,0.74)",
  });
  drawGlassPanel(ctx, 1036, 192, 492, 640, {
    border: "rgba(255,132,203,0.64)",
    top: "rgba(18,13,26,0.84)",
    bottom: "rgba(8,8,17,0.74)",
  });

  ctx.font = '700 36px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#9eefff";
  ctx.fillText("Winner", 108, 262);
  ctx.fillStyle = "#ffc4eb";
  ctx.fillText("Loser", 108, 420);

  ctx.font = '800 74px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fitText(ctx, winnerName, 860), 108, 338);
  ctx.fillText(fitText(ctx, loserName, 860), 108, 496);

  drawTag(ctx, `Reward: +${formatNum(amount)} ${currencyLabel(currency)}`, 108, 548, 860, "#9ef5ff", "#ff76d8");
  drawTag(ctx, `Winner Balance: ${formatNum(winnerAfter)}`, 108, 616, 860, "#7ef0ff", "#66beff");
  drawTag(ctx, `Loser Balance: ${formatNum(loserAfter)}`, 108, 684, 860, "#ffd2a0", "#ff7fcf");

  ctx.font = '700 36px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffb770";
  ctx.fillText("Summary", 1064, 260);

  drawGlassPanel(ctx, 1064, 290, 436, 176, {
    border: "rgba(255,187,112,0.55)",
    top: "rgba(16,14,25,0.82)",
    bottom: "rgba(9,9,16,0.72)",
  });
  ctx.font = '700 26px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#f8f3ff";
  ctx.fillText("Status: Completed", 1090, 340);
  ctx.fillText(`Transferred: ${formatNum(amount)} ${currencyLabel(currency)}`, 1090, 382);
  ctx.fillText("Mode: Instant 1v1", 1090, 424);

  drawGlassPanel(ctx, 1064, 490, 436, 316, {
    border: "rgba(126,232,255,0.55)",
    top: "rgba(10,14,24,0.82)",
    bottom: "rgba(8,10,17,0.72)",
  });
  ctx.font = '700 28px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#9defff";
  ctx.fillText("Result Notes", 1090, 536);
  ctx.font = '600 24px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#f2f7ff";
  ctx.fillText("Winner receives full stake.", 1090, 582);
  ctx.fillText("Loser pays the stake amount.", 1090, 620);
  ctx.fillText("Balances are updated instantly.", 1090, 658);

  return canvas.toBuffer("image/png");
}

module.exports = {
  buildPvpChallengeImage,
  buildPvpResultImage,
};

