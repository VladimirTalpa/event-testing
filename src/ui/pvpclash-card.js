"use strict";

const { createCanvas, loadImage } = require("@napi-rs/canvas");
const path = require("path");
const fs = require("fs");

const BG_PATH = path.join(__dirname, "..", "..", "assets", "templates", "bg_clash.png");

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
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

function drawStarField(ctx, w, h, count = 100) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 0.8 + Math.random() * 2.2;
    const a = 0.08 + Math.random() * 0.35;
    ctx.fillStyle = `rgba(255,180,110,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fitText(ctx, text, maxWidth) {
  const base = String(text || "");
  if (ctx.measureText(base).width <= maxWidth) return base;
  let out = base;
  while (out.length > 1 && ctx.measureText(`${out}...`).width > maxWidth) out = out.slice(0, -1);
  return `${out}...`;
}

function currencyLabel(currency) {
  if (currency === "reiatsu") return "Reiatsu";
  if (currency === "cursed_energy") return "Cursed Energy";
  if (currency === "drako") return "Drako";
  return "Currency";
}

async function drawBase(w = 1400, h = 760) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#120703";
  ctx.fillRect(0, 0, w, h);

  if (fs.existsSync(BG_PATH)) {
    try {
      const bg = await loadImage(BG_PATH);
      ctx.drawImage(bg, 0, 0, w, h);
    } catch {}
  }

  const overlay = ctx.createLinearGradient(0, 0, w, h);
  overlay.addColorStop(0, "rgba(12,4,3,0.72)");
  overlay.addColorStop(1, "rgba(5,2,2,0.82)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, w, h);
  drawStarField(ctx, w, h, 110);

  roundedRect(ctx, 18, 18, w - 36, h - 36, 24);
  ctx.strokeStyle = "rgba(255,170,90,0.82)";
  ctx.lineWidth = 2;
  ctx.stroke();

  return { canvas, ctx };
}

async function buildPvpChallengeImage({ challengerName, targetName, amount, currency, usesLeft }) {
  const { canvas, ctx } = await drawBase();
  const w = canvas.width;

  ctx.font = '700 82px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const titleGrad = ctx.createLinearGradient(120, 60, 980, 60);
  titleGrad.addColorStop(0, "#ffb35a");
  titleGrad.addColorStop(1, "#ff4f8d");
  ctx.fillStyle = titleGrad;
  ctx.fillText("PVP CLASH CHALLENGE", 120, 120);

  ctx.strokeStyle = "rgba(255,165,80,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, 145);
  ctx.lineTo(w - 90, 145);
  ctx.stroke();

  roundedRect(ctx, 90, 190, w - 180, 420, 18);
  ctx.fillStyle = "rgba(20,10,10,0.68)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,140,75,0.7)";
  ctx.stroke();

  ctx.font = '700 42px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffd4af";
  ctx.fillText("Challenger", 130, 260);
  ctx.fillText("Opponent", w - 430, 260);

  ctx.font = '700 56px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fitText(ctx, challengerName, 520), 130, 330);
  ctx.fillText(fitText(ctx, targetName, 520), w - 430, 330);

  ctx.font = '700 50px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const stake = `${amount} ${currencyLabel(currency)}`;
  ctx.fillStyle = "#ff9f57";
  ctx.fillText("Stake", 130, 430);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fitText(ctx, stake, 920), 130, 492);

  ctx.font = '700 36px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffc57e";
  ctx.fillText(`Daily Uses Left: ${usesLeft}`, 130, 560);

  ctx.font = '600 34px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffd8be";
  ctx.fillText("Target must press Accept or Decline below.", 130, 650);

  return canvas.toBuffer("image/png");
}

async function buildPvpResultImage({ winnerName, loserName, amount, currency, winnerAfter, loserAfter }) {
  const { canvas, ctx } = await drawBase();
  const w = canvas.width;

  ctx.font = '700 86px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const titleGrad = ctx.createLinearGradient(120, 60, 940, 60);
  titleGrad.addColorStop(0, "#72ffe1");
  titleGrad.addColorStop(1, "#5ac0ff");
  ctx.fillStyle = titleGrad;
  ctx.fillText("PVP CLASH RESULT", 120, 122);

  ctx.strokeStyle = "rgba(120,220,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, 147);
  ctx.lineTo(w - 90, 147);
  ctx.stroke();

  roundedRect(ctx, 90, 188, w - 180, 450, 18);
  ctx.fillStyle = "rgba(8,18,22,0.62)";
  ctx.fill();
  ctx.strokeStyle = "rgba(95,210,255,0.72)";
  ctx.stroke();

  ctx.font = '700 44px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#c9f9ff";
  ctx.fillText("Winner", 130, 270);
  ctx.fillText("Loser", 130, 390);

  ctx.font = '700 62px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fitText(ctx, winnerName, w - 260), 130, 336);
  ctx.fillText(fitText(ctx, loserName, w - 260), 130, 456);

  ctx.font = '700 44px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#92f0ff";
  ctx.fillText(`Won: +${amount} ${currencyLabel(currency)}`, 130, 540);

  ctx.font = '700 34px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#e9f8ff";
  ctx.fillText(`Winner Balance: ${winnerAfter}`, 130, 604);
  ctx.fillText(`Loser Balance: ${loserAfter}`, 130, 648);

  return canvas.toBuffer("image/png");
}

module.exports = {
  buildPvpChallengeImage,
  buildPvpResultImage,
};

