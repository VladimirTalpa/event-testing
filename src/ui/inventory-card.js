const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { DRAKO_RATE_BLEACH, DRAKO_RATE_JJK } = require("../config");

function calcBleachSurvivalBonus(items) {
  let bonus = 0;
  if (items.zanpakuto_basic) bonus += 4;
  if (items.hollow_mask_fragment) bonus += 7;
  if (items.soul_reaper_cloak) bonus += 9;
  if (items.reiatsu_amplifier) bonus += 2;
  return bonus;
}

function calcBleachReiatsuMultiplier(items) {
  return items.reiatsu_amplifier ? 1.25 : 1.0;
}

function calcBleachDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.zanpakuto_basic) mult += 0.05;
  if (items.hollow_mask_fragment) mult += 0.1;
  if (items.soul_reaper_cloak) mult += 0.06;
  return mult;
}

function calcJjkSurvivalBonus(items) {
  let bonus = 0;
  if (items.black_flash_manual) bonus += 2;
  if (items.domain_charm) bonus += 8;
  if (items.cursed_tool) bonus += 10;
  if (items.binding_vow_seal) bonus += 15;
  return bonus;
}

function calcJjkCEMultiplier(items) {
  let mult = 1.0;
  if (items.black_flash_manual) mult *= 1.2;
  if (items.binding_vow_seal) mult *= 0.9;
  return mult;
}

function calcJjkDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.cursed_tool) mult += 0.08;
  return mult;
}

function num(v) {
  return Number.isFinite(v) ? Math.floor(v).toLocaleString("en-US") : "0";
}

function statusText(v) {
  return v ? "ON" : "OFF";
}

function rr(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.floor(Math.min(w, h) / 2));
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

function fillGlassPanel(ctx, x, y, w, h, theme) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, theme.panelA);
  g.addColorStop(1, theme.panelB);
  rr(ctx, x, y, w, h, 18);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  rr(ctx, x, y, w, h, 18);
  ctx.clip();
  const shine = ctx.createLinearGradient(x, y, x, y + h * 0.45);
  shine.addColorStop(0, "rgba(255,255,255,0.22)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(x, y, w, h * 0.45);
  ctx.restore();

  ctx.strokeStyle = theme.stroke;
  ctx.lineWidth = 1.4;
  rr(ctx, x, y, w, h, 18);
  ctx.stroke();
}

function drawNoiseStars(ctx, width, height, tint) {
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 0.6 + Math.random() * 2.2;
    ctx.fillStyle = `rgba(${tint}, ${(0.08 + Math.random() * 0.3).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

async function drawAvatar(ctx, avatarUrl, x, y, size, theme) {
  ctx.save();
  rr(ctx, x, y, size, size, size / 2);
  ctx.clip();

  try {
    const img = await loadImage(avatarUrl);
    ctx.drawImage(img, x, y, size, size);
  } catch {
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, "#172554");
    g.addColorStop(1, "#0f172a");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.strokeStyle = i === 1 ? theme.accent2 : theme.accent;
    ctx.shadowColor = i === 1 ? theme.accent2 : theme.accent;
    ctx.shadowBlur = 24 - i * 5;
    ctx.lineWidth = 3 - i * 0.5;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + 7 + i * 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function statCard(ctx, x, y, w, h, title, value, theme) {
  fillGlassPanel(ctx, x, y, w, h, theme);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = '600 17px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(title.toUpperCase(), x + 16, y + 28);

  ctx.fillStyle = "#ffffff";
  ctx.font = '700 37px "Orbitron", "Inter", "Segoe UI", sans-serif';
  const safe = String(value || "-");
  ctx.fillText(safe, x + 16, y + 74);
}

function equipmentLine(ctx, x, y, label, on, theme) {
  ctx.fillStyle = "#e5e7eb";
  ctx.font = '600 30px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(label, x, y);

  const chipW = 104;
  const chipH = 34;
  const chipX = x + 420;
  const chipY = y - 25;

  rr(ctx, chipX, chipY, chipW, chipH, 10);
  ctx.fillStyle = on ? "rgba(34,197,94,0.26)" : "rgba(244,63,94,0.22)";
  ctx.fill();
  ctx.strokeStyle = on ? "rgba(134,239,172,0.8)" : "rgba(251,113,133,0.8)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = on ? "#86efac" : "#fda4af";
  ctx.font = '700 18px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText(statusText(on), chipX + 22, chipY + 23);
}

async function buildInventoryImage(eventKey, player, user, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  const isBleach = eventKey === "bleach";
  const width = 1560;
  const height = 960;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const theme = isBleach
    ? {
        bgA: "#180020",
        bgB: "#35004b",
        bgC: "#19003d",
        accent: "rgba(192,38,211,0.95)",
        accent2: "rgba(6,182,212,0.95)",
        panelA: "rgba(30,41,59,0.74)",
        panelB: "rgba(51,65,85,0.58)",
        stroke: "rgba(216,180,254,0.65)",
      }
    : {
        bgA: "#03161d",
        bgB: "#063943",
        bgC: "#07232a",
        accent: "rgba(20,184,166,0.95)",
        accent2: "rgba(251,191,36,0.9)",
        panelA: "rgba(17,24,39,0.74)",
        panelB: "rgba(31,41,55,0.58)",
        stroke: "rgba(153,246,228,0.65)",
      };

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, theme.bgA);
  bg.addColorStop(0.55, theme.bgB);
  bg.addColorStop(1, theme.bgC);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const radial = ctx.createRadialGradient(width * 0.84, 120, 40, width * 0.84, 120, 600);
  radial.addColorStop(0, "rgba(255,255,255,0.16)");
  radial.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  drawNoiseStars(ctx, width, height, isBleach ? "255,220,255" : "220,255,245");

  rr(ctx, 28, 28, width - 56, height - 56, 26);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const username = String(user?.username || "Unknown");
  const avatarUrl = user?.displayAvatarURL?.({ extension: "png", size: 512 }) || "";
  await drawAvatar(ctx, avatarUrl, 74, 78, 190, theme);

  ctx.fillStyle = "#ffffff";
  ctx.font = '800 66px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText(isBleach ? "BLEACH INVENTORY" : "JJK INVENTORY", 292, 134);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = '600 38px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(`Player: ${username}`, 295, 186);

  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(294, 216);
  ctx.lineTo(width - 86, 216);
  ctx.stroke();
  ctx.restore();

  const inv = isBleach ? player.bleach.items : player.jjk.items;
  const mats = player.jjk.materials || { cursedShards: 0, expeditionKeys: 0 };
  const survival = isBleach ? player.bleach.survivalBonus : player.jjk.survivalBonus;
  const cap = isBleach ? bonusMaxBleach : bonusMaxJjk;
  const itemSurvival = isBleach ? calcBleachSurvivalBonus(inv) : calcJjkSurvivalBonus(inv);
  const dropLuck = isBleach ? calcBleachDropLuckMultiplier(inv) : calcJjkDropLuckMultiplier(inv);
  const rewardMult = isBleach ? calcBleachReiatsuMultiplier(inv) : calcJjkCEMultiplier(inv);
  const currency = isBleach ? player.bleach.reiatsu : player.jjk.cursedEnergy;
  const rate = isBleach ? DRAKO_RATE_BLEACH : DRAKO_RATE_JJK;

  const cards = [
    { x: 74, y: 276, w: 348, h: 104, t: isBleach ? "Reiatsu" : "Cursed Energy", v: num(currency) },
    { x: 438, y: 276, w: 300, h: 104, t: "Drako Coin", v: num(player.drako) },
    { x: 754, y: 276, w: 300, h: 104, t: "Boss Bonus", v: `${num(survival)}% / ${cap}%` },
    { x: 1070, y: 276, w: 414, h: 104, t: "Exchange Rate", v: `${rate} -> 1 Drako` },
    { x: 74, y: 398, w: 348, h: 104, t: "Item Survival", v: `+${num(itemSurvival)}%` },
    { x: 438, y: 398, w: 300, h: 104, t: "Drop Luck", v: `x${dropLuck.toFixed(2)}` },
    { x: 754, y: 398, w: 300, h: 104, t: "Reward Multi", v: `x${rewardMult.toFixed(2)}` },
    { x: 1070, y: 398, w: 414, h: 104, t: "Wardrobe Roles", v: num(player.ownedRoles?.length || 0) },
  ];
  cards.forEach((c) => statCard(ctx, c.x, c.y, c.w, c.h, c.t, c.v, theme));

  fillGlassPanel(ctx, 74, 528, 1410, 352, theme);
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 50px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText("Equipment & Materials", 102, 592);

  const leftItems = isBleach
    ? [
        ["Zanpakuto", inv.zanpakuto_basic],
        ["Mask Fragment", inv.hollow_mask_fragment],
        ["Soul Cloak", inv.soul_reaper_cloak],
        ["Reiatsu Amplifier", inv.reiatsu_amplifier],
        ["Aizen Role", inv.cosmetic_role],
      ]
    : [
        ["Black Flash Manual", inv.black_flash_manual],
        ["Domain Charm", inv.domain_charm],
        ["Cursed Tool", inv.cursed_tool],
        ["Reverse Talisman", inv.reverse_talisman],
        ["Binding Vow Seal", inv.binding_vow_seal],
      ];

  leftItems.forEach((item, i) => {
    equipmentLine(ctx, 104, 652 + i * 54, item[0], !!item[1], theme);
  });

  const rightX = 860;
  ctx.fillStyle = theme.accent2;
  ctx.font = '700 30px "Inter", "Segoe UI", sans-serif';
  if (isBleach) {
    ctx.fillText("Build Tips", rightX, 652);
    ctx.font = '600 28px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#c4f1ff";
    ctx.fillText("1. Grind mobs to raise permanent boss bonus.", rightX, 708);
    ctx.fillText("2. Prioritize survival + drop luck stacking.", rightX, 752);
    ctx.fillText("3. Convert only when exchange timing is optimal.", rightX, 796);
  } else {
    ctx.fillText("Materials", rightX, 652);
    ctx.font = '600 33px "Orbitron", "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Cursed Shards: ${num(mats.cursedShards)}`, rightX, 710);
    ctx.fillText(`Expedition Keys: ${num(mats.expeditionKeys)}`, rightX, 760);
    ctx.font = '600 26px "Inter", "Segoe UI", sans-serif';
    ctx.fillStyle = "#cffafe";
    ctx.fillText("Farm bosses for high shard and key returns.", rightX, 816);
  }

  return canvas.toBuffer("image/png");
}

module.exports = { buildInventoryImage };
