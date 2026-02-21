"use strict";

const { createCanvas } = require("@napi-rs/canvas");

function roundedRect(ctx, x, y, w, h, r) {
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

function fitText(ctx, text, maxW) {
  const s = String(text || "");
  if (ctx.measureText(s).width <= maxW) return s;
  let out = s;
  while (out.length > 0 && ctx.measureText(`${out}...`).width > maxW) out = out.slice(0, -1);
  return `${out}...`;
}

function wrapLines(ctx, text, maxW, maxLines = 6) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let curr = "";
  for (const w of words) {
    const t = curr ? `${curr} ${w}` : w;
    if (ctx.measureText(t).width > maxW && curr) {
      lines.push(curr);
      curr = w;
      if (lines.length >= maxLines) break;
    } else {
      curr = t;
    }
  }
  if (curr && lines.length < maxLines) lines.push(curr);
  return lines;
}

function starField(ctx, w, h, count = 220) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.7 + 0.2;
    const a = Math.random() * 0.45 + 0.12;
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function baseCanvas(title, subtitle, accentA = "#41f6ff", accentB = "#ff67d8") {
  const W = 1500;
  const H = 840;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#090c23");
  bg.addColorStop(0.55, "#180c30");
  bg.addColorStop(1, "#0c0b1b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  starField(ctx, W, H, 260);

  roundedRect(ctx, 24, 24, W - 48, H - 48, 20);
  ctx.strokeStyle = "rgba(132,220,255,0.75)";
  ctx.lineWidth = 2;
  ctx.stroke();

  roundedRect(ctx, 48, 48, W - 96, 130, 16);
  const hg = ctx.createLinearGradient(48, 48, W - 48, 178);
  hg.addColorStop(0, "rgba(11,20,43,0.95)");
  hg.addColorStop(1, "rgba(26,8,38,0.9)");
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = "rgba(123,223,255,0.65)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.font = '800 72px "Orbitron", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(80, 80, 900, 80);
  tg.addColorStop(0, accentA);
  tg.addColorStop(1, accentB);
  ctx.fillStyle = tg;
  ctx.fillText(fitText(ctx, title, W - 200), 72, 122);

  ctx.font = '600 34px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#d8ecff";
  ctx.fillText(fitText(ctx, subtitle, W - 200), 74, 165);

  return { canvas, ctx, W, H };
}

function drawPanel(ctx, x, y, w, h, border = "rgba(114,226,255,0.7)") {
  roundedRect(ctx, x, y, w, h, 16);
  const pg = ctx.createLinearGradient(x, y, x + w, y + h);
  pg.addColorStop(0, "rgba(8,14,34,0.86)");
  pg.addColorStop(1, "rgba(20,7,34,0.82)");
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawList(ctx, title, lines, x, y, w, h, color = "#dff5ff") {
  drawPanel(ctx, x, y, w, h);
  ctx.font = '700 40px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillStyle = "#90e6ff";
  ctx.fillText(title, x + 20, y + 50);
  ctx.font = '600 27px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = color;
  let ty = y + 92;
  for (const raw of lines) {
    const line = fitText(ctx, String(raw || "-"), w - 40);
    ctx.fillText(line, x + 20, ty);
    ty += 38;
    if (ty > y + h - 18) break;
  }
}

function toBuffer(canvas) {
  return canvas.toBuffer("image/png");
}

async function buildChaosHelpImage({ dailyLimit, cooldownSec, teams = [] }) {
  const { canvas, ctx } = baseCanvas("CHAOS RIFT // BRIEFING", "Permanent team war with rogue-like runs");
  const teamLines = teams.map((t) => `${String(t.label || "TEAM")} (${String(t.id || "-").toUpperCase()}): ${String(t.flavor || "")}`);
  const ruleLines = [
    `Daily runs: ${dailyLimit}`,
    `Cooldown per run: ${cooldownSec}s`,
    "5 rooms per run, random outcomes",
    "Choose team once. Team is permanent",
    "Top team gains bonus payout",
    "Use /chaos team, /chaos play, /chaos profile, /chaos leaderboard",
  ];
  drawList(ctx, "Rules", ruleLines, 60, 210, 660, 590);
  drawList(ctx, "Factions", teamLines, 760, 210, 680, 590, "#ffd8f5");
  return toBuffer(canvas);
}

async function buildChaosProfileImage(input) {
  const {
    username,
    teamLabel,
    teamCode,
    games,
    wins,
    losses,
    winRate,
    totalPoints,
    highestPoints,
    bestStreak,
    dailyLeft,
    dailyLimit,
    resetText,
  } = input;
  const { canvas, ctx } = baseCanvas("CHAOS PROFILE", `Player: ${username}`);

  drawPanel(ctx, 60, 210, 640, 280);
  ctx.font = '700 36px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#86e6ff";
  ctx.fillText("Identity", 82, 258);
  ctx.font = '600 31px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#e6f6ff";
  ctx.fillText(`Team: ${teamLabel} (${teamCode})`, 82, 304);
  ctx.fillText(`Games: ${games} | Wins: ${wins} | Losses: ${losses}`, 82, 346);
  ctx.fillText(`Win Rate: ${winRate}% | Best Streak: ${bestStreak}`, 82, 388);
  ctx.fillText(`Total Points: ${totalPoints}`, 82, 430);
  ctx.fillText(`Highest Run: ${highestPoints}`, 82, 472);

  drawPanel(ctx, 740, 210, 700, 280, "rgba(255,125,222,0.72)");
  ctx.font = '700 36px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ff9ce8";
  ctx.fillText("Daily Limit", 762, 258);
  ctx.font = '800 66px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${dailyLeft}/${dailyLimit}`, 764, 346);
  ctx.font = '600 29px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#d8ecff";
  const resetLines = wrapLines(ctx, `Reset: ${resetText}`, 650, 2);
  let y = 392;
  for (const line of resetLines) {
    ctx.fillText(line, 764, y);
    y += 36;
  }

  drawList(ctx, "Tips", [
    "Play all daily runs for team points",
    "Clear runs grant stronger rewards",
    "Team rank gives bonus payout",
    "Use leaderboard to track winner",
  ], 60, 530, 1380, 270);

  return toBuffer(canvas);
}

async function buildChaosLeaderboardImage({ playerRows = [], teamRows = [], winnerLine = "" }) {
  const { canvas, ctx } = baseCanvas("CHAOS LEADERBOARD", "Top players and faction war ranking");
  drawList(ctx, "Top Players", playerRows, 60, 210, 890, 590);
  drawList(ctx, "Team War", teamRows, 980, 210, 460, 590, "#ffd5f4");

  roundedRect(ctx, 60, 720, 1380, 78, 14);
  ctx.fillStyle = "rgba(8,10,26,0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(113,226,255,0.66)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.font = '700 31px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#f0f8ff";
  ctx.fillText(fitText(ctx, winnerLine || "No winner yet.", 1340), 80, 771);
  return toBuffer(canvas);
}

async function buildChaosRunImage(input) {
  const {
    username,
    teamLabel,
    badge,
    status,
    hp,
    points,
    teamRank,
    steps = [],
    rewards = [],
    eventLabel,
  } = input;

  const accentA = eventLabel === "JJK" ? "#ff6f8a" : "#4bf1ff";
  const accentB = eventLabel === "JJK" ? "#ff3fdf" : "#ad78ff";
  const { canvas, ctx } = baseCanvas("CHAOS RUN RESULT", `Player: ${username} | Event: ${eventLabel}`, accentA, accentB);

  drawPanel(ctx, 60, 210, 650, 240);
  ctx.font = '700 35px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#8ee8ff";
  ctx.fillText("Run Snapshot", 82, 258);
  ctx.font = '600 30px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#e7f7ff";
  ctx.fillText(`Team: ${teamLabel} | Badge: ${badge}`, 82, 302);
  ctx.fillText(`Status: ${status}`, 82, 342);
  ctx.fillText(`HP Left: ${hp}/3`, 82, 382);
  ctx.fillText(`Points: ${points} | Team Rank: #${teamRank || "-"}`, 82, 422);

  drawList(ctx, "Run Log", steps, 740, 210, 700, 410);
  drawList(ctx, "Rewards", rewards, 60, 470, 1380, 330, "#ffffff");

  return toBuffer(canvas);
}

async function buildChaosTeamLockImage({ username, teamLabel, teamCode, badge, flavor }) {
  const { canvas, ctx } = baseCanvas("CHAOS TEAM LOCKED", `Player: ${username}`);
  drawPanel(ctx, 80, 230, 1340, 520, "rgba(255,136,236,0.74)");

  ctx.font = '800 72px "Orbitron", "Segoe UI", sans-serif';
  const g = ctx.createLinearGradient(120, 290, 980, 290);
  g.addColorStop(0, "#5af3ff");
  g.addColorStop(1, "#ff6ddf");
  ctx.fillStyle = g;
  ctx.fillText(fitText(ctx, teamLabel, 1180), 120, 320);

  ctx.font = '700 38px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`Code: ${teamCode.toUpperCase()} | Badge: ${badge}`, 124, 380);

  ctx.font = '600 31px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#d8edff";
  const lines = wrapLines(ctx, flavor || "", 1220, 3);
  let y = 434;
  for (const line of lines) {
    ctx.fillText(line, 124, y);
    y += 38;
  }

  ctx.font = '700 35px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffb3ef";
  ctx.fillText("This choice is permanent. Team cannot be changed.", 124, 650);

  return toBuffer(canvas);
}

module.exports = {
  buildChaosHelpImage,
  buildChaosProfileImage,
  buildChaosLeaderboardImage,
  buildChaosRunImage,
  buildChaosTeamLockImage,
};
