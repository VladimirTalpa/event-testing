const { createCanvas, loadImage } = require("@napi-rs/canvas");

const {
  DRAKO_RATE_BLEACH,
  DRAKO_RATE_JJK,
} = require("../config");

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

function drawRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.floor(Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function boolShiny(v) {
  return v ? "✨ ON" : "❌ OFF";
}

function num(v) {
  return Number.isFinite(v) ? Math.floor(v).toLocaleString("en-US") : "0";
}

async function drawAvatar(ctx, avatarUrl, x, y, size, ringColor) {
  ctx.save();
  drawRoundRect(ctx, x, y, size, size, Math.floor(size / 2));
  ctx.clip();

  try {
    const img = await loadImage(avatarUrl);
    ctx.drawImage(img, x, y, size, size);
  } catch {
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, "#1f2937");
    g.addColorStop(1, "#0f172a");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = ringColor;
  ctx.shadowColor = ringColor;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function panel(ctx, x, y, w, h, title, value, theme) {
  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, theme.panelA);
  bg.addColorStop(1, theme.panelB);
  drawRoundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.strokeStyle = theme.stroke;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  ctx.fillStyle = "#dbeafe";
  ctx.font = '600 20px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(title, x + 16, y + 30);
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 32px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText(value, x + 16, y + 68);
}

async function buildInventoryImage(eventKey, player, user, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  const isBleach = eventKey === "bleach";
  const width = 1400;
  const height = 900;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const theme = isBleach
    ? {
        bgA: "#180f2e",
        bgB: "#32174d",
        accent: "#8b5cf6",
        accent2: "#22d3ee",
        ring: "#a78bfa",
        panelA: "rgba(30, 41, 59, 0.92)",
        panelB: "rgba(51, 65, 85, 0.92)",
        stroke: "rgba(167, 139, 250, 0.8)",
      }
    : {
        bgA: "#091a1f",
        bgB: "#12343b",
        accent: "#14b8a6",
        accent2: "#f59e0b",
        ring: "#2dd4bf",
        panelA: "rgba(17, 24, 39, 0.92)",
        panelB: "rgba(31, 41, 55, 0.92)",
        stroke: "rgba(45, 212, 191, 0.8)",
      };

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, theme.bgA);
  bg.addColorStop(1, theme.bgB);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 1 + Math.random() * 2.5;
    ctx.fillStyle = `rgba(255,255,255,${(0.08 + Math.random() * 0.25).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRoundRect(ctx, 24, 24, width - 48, height - 48, 24);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const username = String(user?.username || "Unknown");
  const avatarUrl = user?.displayAvatarURL?.({ extension: "png", size: 256 }) || "";
  await drawAvatar(ctx, avatarUrl, 70, 70, 190, theme.ring);

  ctx.fillStyle = "#ffffff";
  ctx.font = '800 52px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText(isBleach ? "BLEACH INVENTORY" : "JJK INVENTORY", 290, 128);
  ctx.font = '600 28px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#d1d5db";
  ctx.fillText(`Player: ${username}`, 290, 174);

  const inv = isBleach ? player.bleach.items : player.jjk.items;
  const mats = player.jjk.materials || { cursedShards: 0, expeditionKeys: 0 };
  const survival = isBleach ? player.bleach.survivalBonus : player.jjk.survivalBonus;
  const cap = isBleach ? bonusMaxBleach : bonusMaxJjk;
  const itemSurvival = isBleach ? calcBleachSurvivalBonus(inv) : calcJjkSurvivalBonus(inv);
  const dropLuck = isBleach ? calcBleachDropLuckMultiplier(inv) : calcJjkDropLuckMultiplier(inv);
  const rewardMult = isBleach ? calcBleachReiatsuMultiplier(inv) : calcJjkCEMultiplier(inv);
  const currency = isBleach ? player.bleach.reiatsu : player.jjk.cursedEnergy;
  const rate = isBleach ? DRAKO_RATE_BLEACH : DRAKO_RATE_JJK;

  panel(ctx, 70, 300, 300, 95, isBleach ? "⚡ Reiatsu" : "🧿 Cursed Energy", num(currency), theme);
  panel(ctx, 390, 300, 260, 95, "💰 Drako Coin", num(player.drako), theme);
  panel(ctx, 670, 300, 260, 95, "🛡 Boss Bonus", `${num(survival)}% / ${cap}%`, theme);
  panel(ctx, 950, 300, 360, 95, "🔁 Exchange Rate", `${rate} -> 1 Drako`, theme);

  panel(ctx, 70, 415, 300, 95, "📈 Item Survival", `+${num(itemSurvival)}%`, theme);
  panel(ctx, 390, 415, 260, 95, "🍀 Drop Luck", `x${dropLuck.toFixed(2)}`, theme);
  panel(ctx, 670, 415, 260, 95, "💸 Reward Multi", `x${rewardMult.toFixed(2)}`, theme);
  panel(ctx, 950, 415, 360, 95, "👗 Wardrobe Roles", num(player.ownedRoles?.length || 0), theme);

  drawRoundRect(ctx, 70, 540, 1240, 300, 20);
  ctx.fillStyle = "rgba(2,6,23,0.72)";
  ctx.fill();
  ctx.strokeStyle = theme.stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = '700 32px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText("✨ Equipment & Materials", 96, 590);

  const leftItems = isBleach
    ? [
        `🗡 Zanpakuto: ${boolShiny(inv.zanpakuto_basic)}`,
        `🎭 Mask Fragment: ${boolShiny(inv.hollow_mask_fragment)}`,
        `🧥 Soul Cloak: ${boolShiny(inv.soul_reaper_cloak)}`,
        `🔋 Reiatsu Amplifier: ${boolShiny(inv.reiatsu_amplifier)}`,
        `👑 Aizen Role: ${boolShiny(inv.cosmetic_role)}`,
      ]
    : [
        `⚡ Black Flash Manual: ${boolShiny(inv.black_flash_manual)}`,
        `🏯 Domain Charm: ${boolShiny(inv.domain_charm)}`,
        `🔪 Cursed Tool: ${boolShiny(inv.cursed_tool)}`,
        `💚 Reverse Talisman: ${boolShiny(inv.reverse_talisman)}`,
        `📜 Binding Vow Seal: ${boolShiny(inv.binding_vow_seal)}`,
      ];

  ctx.font = '600 27px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#e5e7eb";
  leftItems.forEach((line, i) => {
    ctx.fillText(line, 96, 645 + i * 42);
  });

  if (!isBleach) {
    const right = [
      `🧩 Cursed Shards: ${num(mats.cursedShards)}`,
      `🗝 Expedition Keys: ${num(mats.expeditionKeys)}`,
      "🌟 Tip: Farm bosses for shards and key drops.",
    ];
    ctx.fillStyle = "#c4b5fd";
    right.forEach((line, i) => ctx.fillText(line, 760, 645 + i * 42));
  } else {
    ctx.fillStyle = "#67e8f9";
    ctx.fillText("🌟 Tip: Mob kills raise your boss survival bonus.", 760, 645);
    ctx.fillText("🌟 Bleach build focus: survival + drop luck stack.", 760, 687);
  }

  return canvas.toBuffer("image/png");
}

module.exports = { buildInventoryImage };
