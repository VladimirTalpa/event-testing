"use strict";

const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const CLAN_LB_BG_PATH = path.join(__dirname, "..", "..", "assets", "templates", "bg_lb_clan.png");
const CLAN_BOSS_BG_PATH = path.join(__dirname, "..", "..", "assets", "templates", "bg_clan_boss.png");
const CLAN_INFO_BG_PATH = path.join(__dirname, "..", "..", "assets", "templates", "bg_clan_info.png");

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

function starField(ctx, w, h, count = 220, colors = ["255,255,255"]) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.8 + 0.2;
    const c = colors[i % colors.length];
    const a = Math.random() * 0.45 + 0.14;
    ctx.fillStyle = `rgba(${c},${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPanel(ctx, x, y, w, h, opts = {}) {
  const radius = Number(opts.radius || 16);
  const border = String(opts.border || "rgba(112,228,255,0.82)");
  const from = String(opts.from || "rgba(10,18,38,0.88)");
  const to = String(opts.to || "rgba(18,8,34,0.84)");

  roundedRect(ctx, x, y, w, h, radius);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.2;
  ctx.shadowColor = border;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
}

async function drawTemplateBackground(ctx, w, h, preferredPath) {
  const candidates = [preferredPath, CLAN_LB_BG_PATH].filter(Boolean);
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const img = await loadImage(p);
      ctx.drawImage(img, 0, 0, w, h);
      return true;
    } catch {}
  }
  return false;
}

function remainingLabel(endsAt) {
  const ts = Number(endsAt || 0);
  if (ts <= Date.now()) return "Ends soon";
  const sec = Math.max(1, Math.floor((ts - Date.now()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `Ends in ${h}h ${rm}m`;
  }
  return `Ends in ${m}m ${s}s`;
}

function clanIconPrefix(icon) {
  const s = String(icon || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return "CLAN ";
  return `${s} `;
}

function clanIconInline(icon) {
  const s = String(icon || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return "";
  if (s.length > 10) return "";
  return `${s} `;
}

function sanitizeClanDisplayName(name) {
  const raw = String(name || "");
  const base = raw
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/discord\.gg\/\S+/gi, " ")
    .replace(/discord\.com\/\S+/gi, " ")
    .replace(/[|`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = base.split(/\s+/).filter(Boolean).filter((t) => {
    const x = String(t || "").toLowerCase();
    if (!x) return false;
    if (x.includes("http")) return false;
    if (x.includes("discord")) return false;
    if (x.includes("channel")) return false;
    if (/^\d{10,}$/.test(x)) return false;
    return true;
  });
  const out = tokens.join(" ").trim();
  return out || "Unnamed Clan";
}

function paletteByEvent(eventKey) {
  const jjk = String(eventKey || "").toLowerCase() === "jjk";
  if (jjk) {
    return {
      bgA: "#200616",
      bgB: "#0f0a1e",
      accentA: "#ff5f88",
      accentB: "#ff7ee0",
      border: "rgba(255,125,203,0.82)",
    };
  }
  return {
    bgA: "#08172a",
    bgB: "#140b2a",
    accentA: "#53f5ff",
    accentB: "#8d7bff",
    border: "rgba(108,230,255,0.82)",
  };
}

async function buildClanBossHudImage(input = {}) {
  const W = 1600;
  const H = 900;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const pal = paletteByEvent(input.eventKey);
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, pal.bgA);
  bg.addColorStop(0.56, "#101435");
  bg.addColorStop(1, pal.bgB);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  await drawTemplateBackground(ctx, W, H, CLAN_BOSS_BG_PATH);

  const overlay = ctx.createLinearGradient(0, 0, W, H);
  overlay.addColorStop(0, "rgba(8,10,24,0.56)");
  overlay.addColorStop(1, "rgba(8,6,20,0.74)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  starField(ctx, W, H, 280, ["255,255,255", "162,238,255", "255,165,236"]);

  roundedRect(ctx, 24, 24, W - 48, H - 48, 22);
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  drawPanel(ctx, 52, 56, W - 104, 214, {
    border: pal.border,
    from: "rgba(9,16,36,0.9)",
    to: "rgba(24,9,38,0.84)",
    radius: 18,
  });
  drawPanel(ctx, 52, 292, 1010, 556, {
    border: "rgba(112,228,255,0.72)",
    from: "rgba(7,14,32,0.88)",
    to: "rgba(18,8,34,0.82)",
  });
  drawPanel(ctx, 1082, 292, 466, 556, {
    border: "rgba(255,136,228,0.72)",
    from: "rgba(12,10,28,0.88)",
    to: "rgba(26,8,30,0.82)",
  });

  const clanName = String(input.clanName || "Unknown Clan");
  const bossName = String(input.bossName || "Clan Boss");
  const eventKey = String(input.eventKey || "bleach").toUpperCase();
  const hpMax = Math.max(1, Math.floor(Number(input.hpMax || 1)));
  const hpCurrent = Math.max(0, Math.floor(Number(input.hpCurrent || 0)));
  const pct = Math.max(0, Math.min(100, Math.round((hpCurrent / hpMax) * 100)));
  const topDamage = Array.isArray(input.topDamage) ? input.topDamage : [];
  const endsAt = Number(input.endsAt || 0);

  ctx.font = '800 66px "Orbitron", "Segoe UI", sans-serif';
  const titleG = ctx.createLinearGradient(74, 70, 900, 70);
  titleG.addColorStop(0, pal.accentA);
  titleG.addColorStop(1, pal.accentB);
  ctx.fillStyle = titleG;
  ctx.fillText("CLAN BOSS LIVE", 78, 126);

  ctx.font = '600 36px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#e8f4ff";
  ctx.fillText(fitText(ctx, `${clanName} vs ${bossName} (${eventKey})`, W - 220), 78, 176);

  const barX = 80;
  const barY = 208;
  const barW = W - 160;
  const barH = 36;

  roundedRect(ctx, barX, barY, barW, barH, 16);
  ctx.fillStyle = "rgba(6,10,22,0.95)";
  ctx.fill();
  roundedRect(ctx, barX + 3, barY + 3, Math.max(10, Math.floor((barW - 6) * (pct / 100))), barH - 6, 13);
  const hpGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  hpGrad.addColorStop(0, pal.accentA);
  hpGrad.addColorStop(0.5, "#7ea5ff");
  hpGrad.addColorStop(1, pal.accentB);
  ctx.fillStyle = hpGrad;
  ctx.fill();
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = 1.2;
  roundedRect(ctx, barX, barY, barW, barH, 16);
  ctx.stroke();

  ctx.font = '700 34px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`HP ${hpCurrent.toLocaleString("en-US")} / ${hpMax.toLocaleString("en-US")} (${pct}%)`, 82, 258);
  ctx.fillStyle = "#a9e9ff";
  ctx.fillText(remainingLabel(endsAt), W - 390, 258);

  ctx.font = '700 40px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillStyle = "#96e8ff";
  ctx.fillText("Top Damage", 86, 345);
  ctx.fillStyle = "#ff97e8";
  ctx.fillText("Raid Stats", 1110, 345);

  const rows = topDamage.slice(0, 10);
  const max = Math.max(1, ...rows.map((r) => Math.max(0, Number(r.dmg || 0))));

  let y = 388;
  ctx.font = '700 27px "Inter", "Segoe UI", sans-serif';
  for (let i = 0; i < rows.length; i++) {
    const dmg = Math.max(0, Math.floor(Number(rows[i].dmg || 0)));
    const ratio = dmg / max;
    const rowW = Math.floor(850 * Math.max(0.08, ratio));
    const name = fitText(ctx, String(rows[i].name || "Unknown"), 500);

    roundedRect(ctx, 86, y, 900, 42, 11);
    ctx.fillStyle = "rgba(8,11,28,0.86)";
    ctx.fill();

    roundedRect(ctx, 88, y + 2, Math.max(16, rowW), 38, 10);
    const rg = ctx.createLinearGradient(88, y, 88 + rowW, y);
    rg.addColorStop(0, pal.accentA);
    rg.addColorStop(1, pal.accentB);
    ctx.fillStyle = rg;
    ctx.fill();

    ctx.fillStyle = "#091425";
    ctx.fillText(`${i + 1}. ${name}`, 102, y + 29);

    roundedRect(ctx, 810, y + 6, 164, 30, 9);
    ctx.fillStyle = "rgba(5,8,22,0.78)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${dmg.toLocaleString("en-US")}`, 826, y + 29);

    y += 50;
    if (y > 815) break;
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

  let ty = 398;
  ctx.font = '700 34px "Inter", "Segoe UI", sans-serif';
  for (const line of info) {
    roundedRect(ctx, 1108, ty - 32, 414, 48, 10);
    ctx.fillStyle = "rgba(7,10,28,0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,141,230,0.42)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#f2f8ff";
    ctx.fillText(line, 1122, ty);
    ty += 72;
  }

  return canvas.toBuffer("image/png");
}

async function buildClanLeaderboardImage(rows = []) {
  const W = 1600;
  const H = 950;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#080d26");
  bg.addColorStop(0.5, "#130e30");
  bg.addColorStop(1, "#0c091f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  await drawTemplateBackground(ctx, W, H, CLAN_LB_BG_PATH);

  const overlay = ctx.createLinearGradient(0, 0, W, H);
  overlay.addColorStop(0, "rgba(8,10,24,0.56)");
  overlay.addColorStop(1, "rgba(12,8,24,0.72)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  starField(ctx, W, H, 280, ["255,255,255", "164,235,255", "255,150,234"]);

  roundedRect(ctx, 24, 24, W - 48, H - 48, 22);
  ctx.strokeStyle = "rgba(113,226,255,0.82)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawPanel(ctx, 52, 52, W - 104, 132, {
    border: "rgba(113,226,255,0.82)",
    from: "rgba(8,18,36,0.9)",
    to: "rgba(20,9,34,0.84)",
  });
  drawPanel(ctx, 52, 204, W - 104, H - 256, {
    border: "rgba(132,220,255,0.72)",
    from: "rgba(8,14,32,0.88)",
    to: "rgba(18,8,34,0.82)",
  });

  ctx.font = '800 64px "Orbitron", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(72, 72, 900, 72);
  tg.addColorStop(0, "#58f6ff");
  tg.addColorStop(1, "#ff76e3");
  ctx.fillStyle = tg;
  ctx.fillText("WEEKLY CLAN RANKING", 76, 138);

  ctx.font = '700 26px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#abe9ff";
  ctx.fillText("Clan", 90, 252);
  ctx.fillText("Score", 700, 252);
  ctx.fillText("Damage", 880, 252);
  ctx.fillText("Clears", 1080, 252);
  ctx.fillText("Activity", 1220, 252);
  ctx.fillText("Members", 1370, 252);

  const sorted = Array.isArray(rows) ? rows.slice(0, 10) : [];
  let y = 276;
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const top = i < 3;

    drawPanel(ctx, 78, y, W - 156, 62, {
      border: top ? "rgba(255,209,121,0.95)" : "rgba(124,220,255,0.62)",
      from: top ? "rgba(36,24,8,0.74)" : "rgba(8,11,28,0.82)",
      to: "rgba(16,8,28,0.78)",
      radius: 12,
    });

    ctx.font = '700 28px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = top ? "#ffd788" : "#e6f5ff";
    const rawName = String(r.name || "Clan");
    const safeName = sanitizeClanDisplayName(rawName);
    const clanLabel = `#${i + 1} ${clanIconInline(r.icon)}${fitText(ctx, safeName, 510)}`;
    ctx.save();
    ctx.beginPath();
    ctx.rect(90, y + 3, 586, 56);
    ctx.clip();
    ctx.fillText(clanLabel, 94, y + 41);
    ctx.restore();

    ctx.fillStyle = "#9be8ff";
    ctx.fillText(`${Math.floor(Number(r.score || 0)).toLocaleString("en-US")}`, 700, y + 41);
    ctx.fillStyle = "#9ddcff";
    ctx.fillText(`${Math.floor(Number(r.damage || 0)).toLocaleString("en-US")}`, 880, y + 41);
    ctx.fillStyle = "#ffabea";
    ctx.fillText(`${Math.floor(Number(r.clears || 0))}`, 1080, y + 41);
    ctx.fillStyle = "#ffd9a0";
    ctx.fillText(`${Math.floor(Number(r.activity || 0))}`, 1220, y + 41);
    ctx.fillStyle = "#f0f8ff";
    ctx.fillText(`${Math.floor(Number(r.members || 0))}`, 1370, y + 41);

    y += 70;
    if (y > H - 80) break;
  }

  return canvas.toBuffer("image/png");
}

async function buildClanInfoImage(input = {}) {
  const W = 1600;
  const H = 950;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#081126");
  bg.addColorStop(0.52, "#171038");
  bg.addColorStop(1, "#100822");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  await drawTemplateBackground(ctx, W, H, CLAN_INFO_BG_PATH);

  const overlay = ctx.createLinearGradient(0, 0, W, H);
  overlay.addColorStop(0, "rgba(8,10,24,0.54)");
  overlay.addColorStop(1, "rgba(10,8,20,0.72)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  starField(ctx, W, H, 300, ["255,255,255", "160,236,255", "255,162,236"]);

  roundedRect(ctx, 20, 20, W - 40, H - 40, 24);
  ctx.strokeStyle = "rgba(116,226,255,0.78)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawPanel(ctx, 56, 56, W - 112, 186, {
    border: "rgba(114,226,255,0.84)",
    from: "rgba(8,18,36,0.9)",
    to: "rgba(20,9,34,0.84)",
  });
  drawPanel(ctx, 56, 266, 1020, 634, {
    border: "rgba(114,226,255,0.66)",
    from: "rgba(8,14,32,0.88)",
    to: "rgba(18,8,34,0.82)",
  });
  drawPanel(ctx, 1102, 266, 442, 634, {
    border: "rgba(255,137,229,0.66)",
    from: "rgba(12,10,30,0.88)",
    to: "rgba(24,8,30,0.82)",
  });

  const clanName = String(input.name || "Unknown Clan");
  const icon = String(input.icon || "");
  const ownerName = String(input.ownerName || "Unknown");
  const createdText = String(input.createdText || "-");

  const title = `${clanIconPrefix(icon)}${clanName}`;
  ctx.font = '800 72px "Orbitron", "Segoe UI", sans-serif';
  const tg = ctx.createLinearGradient(82, 72, 900, 72);
  tg.addColorStop(0, "#55f5ff");
  tg.addColorStop(1, "#ff75e2");
  ctx.fillStyle = tg;
  ctx.fillText(fitText(ctx, title, 1200), 80, 140);

  ctx.font = '600 34px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#e2f4ff";
  ctx.fillText(`Owner: ${fitText(ctx, ownerName, 420)}`, 84, 194);
  ctx.fillStyle = "#9fe7ff";
  ctx.fillText(`Created: ${createdText}`, 540, 194);

  const members = Array.isArray(input.members) ? input.members : [];
  const officers = Array.isArray(input.officers) ? input.officers : [];
  const weekly = input.weekly || {};
  const activeBoss = input.activeBoss || null;

  ctx.font = '700 40px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillStyle = "#91e6ff";
  ctx.fillText("Members", 82, 322);
  ctx.fillStyle = "#ff99eb";
  ctx.fillText("Status", 1120, 322);

  let my = 366;
  ctx.font = '600 27px "Inter", "Segoe UI", sans-serif';
  for (let i = 0; i < members.slice(0, 15).length; i++) {
    const line = `${i + 1}. ${String(members[i] || "")}`;
    drawPanel(ctx, 80, my - 30, 986, 42, {
      border: "rgba(112,220,255,0.42)",
      from: "rgba(7,9,24,0.86)",
      to: "rgba(14,8,24,0.8)",
      radius: 10,
    });
    ctx.fillStyle = "#eef8ff";
    ctx.fillText(fitText(ctx, line, 950), 92, my);
    my += 46;
    if (my > 876) break;
  }

  const infoLines = [
    `Members: ${Math.max(0, Number(input.memberCount || members.length))}/${Math.max(1, Number(input.maxMembers || 30))}`,
    `Officers: ${Math.max(0, Number(input.officerCount || officers.length))}`,
    `Requests: ${Math.max(0, Number(input.requestCount || 0))}`,
    `Invites: ${Math.max(0, Number(input.inviteCount || 0))}`,
    `Weekly Damage: ${Math.floor(Number(weekly.totalDamage || 0)).toLocaleString("en-US")}`,
    `Weekly Clears: ${Math.floor(Number(weekly.bossClears || 0))}`,
    `Weekly Activity: ${Math.floor(Number(weekly.activity || 0))}`,
    `Boss: ${activeBoss ? `${activeBoss.name} ${Math.floor(Number(activeBoss.hpCurrent || 0)).toLocaleString("en-US")}/${Math.floor(Number(activeBoss.hpMax || 1)).toLocaleString("en-US")}` : "No active clan boss"}`,
  ];

  let iy = 372;
  ctx.font = '700 27px "Inter", "Segoe UI", sans-serif';
  for (const line of infoLines) {
    drawPanel(ctx, 1122, iy - 30, 404, 44, {
      border: "rgba(255,140,228,0.46)",
      from: "rgba(8,10,26,0.86)",
      to: "rgba(20,8,26,0.8)",
      radius: 10,
    });
    ctx.fillStyle = "#f2f9ff";
    ctx.fillText(fitText(ctx, line, 382), 1136, iy);
    iy += 52;
  }

  if (officers.length) {
    ctx.font = '700 26px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#8fe4ff";
    ctx.fillText("Officer List", 1128, 834);
    ctx.font = '600 22px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#e2f5ff";
    ctx.fillText(fitText(ctx, officers.join(", "), 388), 1128, 870);
  }

  return canvas.toBuffer("image/png");
}

module.exports = {
  buildClanBossHudImage,
  buildClanLeaderboardImage,
  buildClanInfoImage,
};
