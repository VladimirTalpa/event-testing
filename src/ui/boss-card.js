const { createCanvas, loadImage } = require("@napi-rs/canvas");

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

function getTheme(eventKey) {
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
  const w = 1600;
  const h = 900;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const theme = getTheme(def?.event);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bgA);
  bg.addColorStop(0.45, theme.bgB);
  bg.addColorStop(1, theme.bgC);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  particles(ctx, w, h, theme.particles, 420);

  const art = await tryLoadImage(def?.spawnMedia);
  if (art) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.drawImage(art, w - 660, 40, 620, 820);
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
  ctx.font = '700 52px "Orbitron", "Inter", "Segoe UI", sans-serif';
  glowText(ctx, `JOIN WINDOW ${joinSec}s`, 92, 410, {
    size: 52,
    gradA: theme.textA,
    gradB: theme.textB,
    glow: theme.glow,
  });

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
  lines.forEach((line, i) => ctx.fillText(`• ${line}`, 116, 512 + i * 44));

  glowText(ctx, "BATTLE STARTING", 1110, 838, {
    size: 42,
    gradA: theme.textA,
    gradB: theme.textB,
    glow: theme.glow,
  });

  return canvas.toBuffer("image/png");
}

async function buildBossResultImage(def, opts = {}) {
  const w = 1600;
  const h = 900;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const theme = getTheme(def?.event);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bgA);
  bg.addColorStop(0.45, theme.bgB);
  bg.addColorStop(1, theme.bgC);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  particles(ctx, w, h, theme.particles, 360);

  rr(ctx, 34, 28, w - 68, h - 56, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, 48, 42, w - 96, h - 84, 22);
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const statusText = opts.victory ? "RAID CLEAR" : "RAID FAILED";
  glowText(ctx, statusText, 88, 118, {
    size: 74,
    gradA: opts.victory ? theme.textB : theme.textA,
    gradB: opts.victory ? theme.textA : theme.bad,
    glow: theme.glow,
  });

  const bossName = String(def?.name || "UNKNOWN").toUpperCase();
  const bossSize = fitFont(ctx, bossName, 920, 100, 48);
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
  ctx.fillText(`Boss HP: ${hpLeft}/${hpTotal} (${pct}%)`, 90, 280);
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

  const top = Array.isArray(opts.topDamage) ? opts.topDamage.slice(0, 7) : [];
  ctx.fillStyle = "rgba(245,245,255,0.98)";
  ctx.font = '700 42px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText("Top Damage", 118, 428);

  ctx.font = '600 31px "Inter", "Segoe UI", sans-serif';
  if (!top.length) {
    ctx.fillText("No registered damage.", 120, 492);
  } else {
    top.forEach((r, i) => {
      const color = i === 0 ? theme.ok : "rgba(245,245,255,0.95)";
      ctx.fillStyle = color;
      ctx.fillText(`${i + 1}. ${String(r.name || "Unknown")} - ${Math.floor(r.dmg || 0)}`, 120, 492 + i * 52);
    });
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
  ctx.font = '600 33px "Inter", "Segoe UI", sans-serif';
  stats.forEach((s, i) => ctx.fillText(s, 1160, 500 + i * 56));

  return canvas.toBuffer("image/png");
}

module.exports = {
  buildBossIntroImage,
  buildBossResultImage,
};

