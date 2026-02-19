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

function starField(ctx, w, h, count = 220) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.8 + 0.2;
    const a = Math.random() * 0.45 + 0.15;
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPanel(ctx, x, y, w, h) {
  roundedRect(ctx, x, y, w, h, 18);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, "rgba(14,16,36,0.86)");
  g.addColorStop(1, "rgba(20,10,40,0.82)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(95,192,255,0.86)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

async function buildClanBossHudImage(input = {}) {
  const W = 1600;
  const H = 900;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#070a1b");
  bg.addColorStop(0.55, "#121235");
  bg.addColorStop(1, "#180a2b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  starField(ctx, W, H, 280);

  roundedRect(ctx, 24, 24, W - 48, H - 48, 22);
  ctx.strokeStyle = "rgba(74,243,255,0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawPanel(ctx, 52, 56, W - 104, 200);
  drawPanel(ctx, 52, 282, 1020, 566);
  drawPanel(ctx, 1098, 282, 450, 566);

  const clanName = String(input.clanName || "Unknown Clan");
  const bossName = String(input.bossName || "Clan Boss");
  const eventKey = String(input.eventKey || "bleach").toUpperCase();
  const hpMax = Math.max(1, Math.floor(Number(input.hpMax || 1)));
  const hpCurrent = Math.max(0, Math.floor(Number(input.hpCurrent || 0)));
  const pct = Math.max(0, Math.min(100, Math.round((hpCurrent / hpMax) * 100)));
  const topDamage = Array.isArray(input.topDamage) ? input.topDamage : [];
  const endsAt = Number(input.endsAt || 0);

  ctx.font = '800 66px "Orbitron", "Segoe UI", sans-serif';
  const titleGrad = ctx.createLinearGradient(70, 72, 750, 72);
  titleGrad.addColorStop(0, "#55f4ff");
  titleGrad.addColorStop(1, "#ff73f4");
  ctx.fillStyle = titleGrad;
  ctx.fillText("CLAN BOSS LIVE HUD", 76, 128);

  ctx.font = '600 40px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#dce6ff";
  ctx.fillText(fitText(ctx, `${clanName}  |  ${bossName} (${eventKey})`, W - 220), 78, 186);

  const bx = 80;
  const by = 208;
  const bw = W - 160;
  const bh = 24;
  roundedRect(ctx, bx, by, bw, bh, 12);
  ctx.fillStyle = "rgba(6,8,20,0.92)";
  ctx.fill();
  roundedRect(ctx, bx + 2, by + 2, Math.max(8, Math.floor((bw - 4) * (pct / 100))), bh - 4, 10);
  const hpGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
  hpGrad.addColorStop(0, "#34f1ff");
  hpGrad.addColorStop(0.5, "#6da8ff");
  hpGrad.addColorStop(1, "#ff49ba");
  ctx.fillStyle = hpGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(130,236,255,0.86)";
  ctx.lineWidth = 1;
  roundedRect(ctx, bx, by, bw, bh, 12);
  ctx.stroke();

  ctx.font = '700 34px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#f6fbff";
  const hpLabel = `HP ${hpCurrent.toLocaleString("en-US")} / ${hpMax.toLocaleString("en-US")} (${pct}%)`;
  ctx.fillText(hpLabel, 80, 250);

  ctx.font = '600 30px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#91deff";
  const endLabel = endsAt > 0 ? `Ends <t:${Math.floor(endsAt / 1000)}:R>` : "Ends soon";
  ctx.fillText(endLabel, W - 420, 250);

  ctx.font = '700 42px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillStyle = "#8bdcff";
  ctx.fillText("Top Damage", 86, 338);
  ctx.fillStyle = "#ff87ed";
  ctx.fillText("Raid Info", 1126, 338);

  const rows = topDamage.slice(0, 10);
  const max = Math.max(1, ...rows.map((r) => Math.max(0, Number(r.dmg || 0))));
  let y = 392;
  for (let i = 0; i < rows.length; i++) {
    const name = fitText(ctx, String(rows[i].name || "Unknown"), 520);
    const dmg = Math.max(0, Math.floor(Number(rows[i].dmg || 0)));
    const ratio = dmg / max;
    const rw = Math.floor(850 * Math.max(0.08, ratio));
    roundedRect(ctx, 86, y, 860, 44, 12);
    ctx.fillStyle = "rgba(10,12,30,0.86)";
    ctx.fill();
    roundedRect(ctx, 88, y + 2, Math.max(10, rw), 40, 10);
    const rg = ctx.createLinearGradient(88, y, 88 + rw, y);
    rg.addColorStop(0, "#39efff");
    rg.addColorStop(1, "#ff5dcb");
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.font = '700 30px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#0a1024";
    ctx.fillText(`${i + 1}. ${name}`, 102, y + 31);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${dmg.toLocaleString("en-US")}`, 760, y + 31);
    y += 50;
    if (y > 820) break;
  }

  const joined = Math.max(0, Number(input.joined || rows.length));
  const alive = Math.max(0, Number(input.alive || 0));
  const totalDamage = Math.max(0, Number(input.totalDamage || rows.reduce((a, b) => a + Number(b.dmg || 0), 0)));
  const clears = Math.max(0, Number(input.weeklyClears || 0));

  const info = [
    `Joined: ${joined}`,
    `Alive: ${alive}`,
    `Total Damage: ${Math.floor(totalDamage).toLocaleString("en-US")}`,
    `Weekly Clears: ${clears}`,
  ];
  let ty = 402;
  ctx.font = '700 34px "Inter", "Segoe UI", sans-serif';
  for (const line of info) {
    ctx.fillStyle = "#e8f4ff";
    ctx.fillText(line, 1128, ty);
    ty += 66;
  }

  return canvas.toBuffer("image/png");
}

async function buildClanLeaderboardImage(rows = []) {
  const W = 1600;
  const H = 950;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b091f");
  bg.addColorStop(0.6, "#1b0f33");
  bg.addColorStop(1, "#120722");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  starField(ctx, W, H, 300);

  roundedRect(ctx, 24, 24, W - 48, H - 48, 22);
  ctx.strokeStyle = "rgba(151,222,255,0.74)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '800 66px "Orbitron", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(64, 52, 760, 52);
  tg.addColorStop(0, "#58f5ff");
  tg.addColorStop(1, "#ff6fdd");
  ctx.fillStyle = tg;
  ctx.fillText("WEEKLY CLAN LEADERBOARD", 70, 118);

  drawPanel(ctx, 54, 150, W - 108, H - 210);
  const sorted = Array.isArray(rows) ? rows.slice(0, 10) : [];
  let y = 210;
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    roundedRect(ctx, 78, y, W - 156, 64, 14);
    ctx.fillStyle = "rgba(8,10,24,0.88)";
    ctx.fill();
    ctx.strokeStyle = i < 3 ? "rgba(255,197,97,0.92)" : "rgba(122,209,255,0.62)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.font = '700 30px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = i < 3 ? "#ffd47a" : "#dcf2ff";
    const left = `#${i + 1} ${r.icon ? `${r.icon} ` : ""}${fitText(ctx, String(r.name || "Clan"), 420)}`;
    ctx.fillText(left, 96, y + 42);
    ctx.fillStyle = "#9de5ff";
    ctx.fillText(`Score ${Math.floor(Number(r.score || 0)).toLocaleString("en-US")}`, 630, y + 42);
    ctx.fillStyle = "#ff92ea";
    ctx.fillText(`DMG ${Math.floor(Number(r.damage || 0)).toLocaleString("en-US")} | Clears ${Math.floor(Number(r.clears || 0))} | Act ${Math.floor(Number(r.activity || 0))} | Members ${Math.floor(Number(r.members || 0))}`, 910, y + 42);
    y += 74;
    if (y > H - 100) break;
  }

  return canvas.toBuffer("image/png");
}

async function buildClanInfoImage(input = {}) {
  const W = 1600;
  const H = 950;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#090d24");
  bg.addColorStop(0.5, "#14153a");
  bg.addColorStop(1, "#1f0a35");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  starField(ctx, W, H, 320);

  roundedRect(ctx, 20, 20, W - 40, H - 40, 24);
  ctx.strokeStyle = "rgba(121,226,255,0.78)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawPanel(ctx, 56, 56, W - 112, 188);
  drawPanel(ctx, 56, 268, 1030, 632);
  drawPanel(ctx, 1112, 268, 432, 632);

  const clanName = String(input.name || "Unknown Clan");
  const icon = String(input.icon || "");
  const ownerName = String(input.ownerName || "Unknown");
  const createdText = String(input.createdText || "-");

  const title = `${icon ? `${icon} ` : ""}${clanName}`;
  ctx.font = '800 74px "Orbitron", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(84, 78, 760, 78);
  tg.addColorStop(0, "#53f7ff");
  tg.addColorStop(1, "#ff6fe0");
  ctx.fillStyle = tg;
  ctx.fillText(fitText(ctx, title, 1220), 82, 142);

  ctx.font = '600 34px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#d8ecff";
  ctx.fillText(`Owner: ${ownerName}`, 84, 196);
  ctx.fillStyle = "#8de4ff";
  ctx.fillText(`Created: ${createdText}`, 560, 196);

  const members = Array.isArray(input.members) ? input.members : [];
  const officers = Array.isArray(input.officers) ? input.officers : [];
  const weekly = input.weekly || {};
  const activeBoss = input.activeBoss || null;

  ctx.font = '700 42px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillStyle = "#86e4ff";
  ctx.fillText("Members", 84, 324);
  ctx.fillStyle = "#ff89ea";
  ctx.fillText("Clan Status", 1142, 324);

  const memberLines = members.slice(0, 15);
  let my = 374;
  for (let i = 0; i < memberLines.length; i++) {
    const m = String(memberLines[i] || "");
    roundedRect(ctx, 84, my - 30, 978, 42, 10);
    ctx.fillStyle = "rgba(7,9,24,0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(116,215,255,0.42)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '600 27px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#eaf7ff";
    ctx.fillText(fitText(ctx, `${i + 1}. ${m}`, 940), 96, my);
    my += 46;
    if (my > 875) break;
  }

  const infoLines = [
    `Members: ${Math.max(0, Number(input.memberCount || members.length))}/${Math.max(1, Number(input.maxMembers || 30))}`,
    `Officers: ${Math.max(0, Number(input.officerCount || officers.length))}`,
    `Requests: ${Math.max(0, Number(input.requestCount || 0))}`,
    `Invites: ${Math.max(0, Number(input.inviteCount || 0))}`,
    `Weekly DMG: ${Math.floor(Number(weekly.totalDamage || 0)).toLocaleString("en-US")}`,
    `Weekly Clears: ${Math.floor(Number(weekly.bossClears || 0))}`,
    `Weekly Activity: ${Math.floor(Number(weekly.activity || 0))}`,
    `Boss: ${activeBoss ? `${activeBoss.name} (${Math.floor(Number(activeBoss.hpCurrent || 0)).toLocaleString("en-US")}/${Math.floor(Number(activeBoss.hpMax || 1)).toLocaleString("en-US")})` : "No active clan boss"}`,
  ];

  let iy = 382;
  ctx.font = '700 28px "Inter", "Segoe UI", sans-serif';
  for (const line of infoLines) {
    roundedRect(ctx, 1132, iy - 30, 392, 44, 10);
    ctx.fillStyle = "rgba(8,10,26,0.86)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,129,233,0.48)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#f4fbff";
    ctx.fillText(fitText(ctx, line, 372), 1144, iy);
    iy += 54;
  }

  if (officers.length) {
    ctx.font = '700 26px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#95e6ff";
    ctx.fillText("Officer List", 1140, 836);
    const offText = fitText(ctx, officers.join(", "), 370);
    ctx.font = '600 23px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#dff3ff";
    ctx.fillText(offText, 1140, 872);
  }

  return canvas.toBuffer("image/png");
}

module.exports = {
  buildClanBossHudImage,
  buildClanLeaderboardImage,
  buildClanInfoImage,
};
