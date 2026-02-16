const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { DRAKO_RATE_BLEACH, DRAKO_RATE_JJK } = require("../config");

const EMOJI = {
  reiatsu: "1473060860644561016",
  drako: "1473061778614255668",
  rate: "1473064972333486285",
  bossBonus: "1473063682979401829",
  itemSurvival: "1473063619049820191",
  dropLuck: "1473063569540251709",
  rewardMulti: "1473063773412659282",
};

const emojiCache = new Map();

function n(v) {
  return Number.isFinite(v) ? Math.floor(v).toLocaleString("en-US") : "0";
}

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

function computePower(input) {
  const value =
    input.currency / 10 +
    input.drako * 120 +
    input.survival * 55 +
    input.itemSurvival * 35 +
    input.dropLuck * 650 +
    input.rewardMult * 2000 +
    input.ownedRoles * 110;
  return Math.max(1, Math.floor(value));
}

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

function neonGradient(ctx, x, y, text) {
  const w = Math.max(120, ctx.measureText(String(text)).width);
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, "#22d3ee");
  g.addColorStop(1, "#e879f9");
  return g;
}

function drawParticles(ctx, width, height) {
  for (let i = 0; i < 340; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 0.5 + Math.random() * 2.3;
    const a = 0.05 + Math.random() * 0.25;
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

async function loadEmojiImage(id) {
  const key = String(id || "");
  if (!key) return null;
  if (emojiCache.has(key)) return emojiCache.get(key);
  const urls = [
    `https://cdn.discordapp.com/emojis/${key}.png?size=96&quality=lossless`,
    `https://cdn.discordapp.com/emojis/${key}.webp?size=96&quality=lossless`,
  ];
  for (const url of urls) {
    try {
      const img = await loadImage(url);
      emojiCache.set(key, img);
      return img;
    } catch {}
  }
  emojiCache.set(key, null);
  return null;
}

function drawGlassPanel(ctx, x, y, w, h, colors) {
  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, colors.panelA);
  bg.addColorStop(1, colors.panelB);
  rr(ctx, x, y, w, h, 16);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.save();
  rr(ctx, x, y, w, h, 16);
  ctx.clip();
  const shine = ctx.createLinearGradient(x, y, x, y + h * 0.5);
  shine.addColorStop(0, "rgba(255,255,255,0.16)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(x, y, w, h * 0.5);
  ctx.restore();

  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 1.4;
  rr(ctx, x, y, w, h, 16);
  ctx.stroke();
}

async function drawAvatar(ctx, avatarUrl, x, y, size, colors) {
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.strokeStyle = i % 2 === 0 ? colors.accentBlue : colors.accentPink;
    ctx.shadowColor = i % 2 === 0 ? colors.accentBlue : colors.accentPink;
    ctx.shadowBlur = 24 - i * 6;
    ctx.lineWidth = 3 - i * 0.4;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + 8 + i * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  try {
    const img = await loadImage(avatarUrl);
    ctx.drawImage(img, x, y, size, size);
  } catch {
    const f = ctx.createLinearGradient(x, y, x + size, y + size);
    f.addColorStop(0, "#111827");
    f.addColorStop(1, "#1f2937");
    ctx.fillStyle = f;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

async function drawStatCard(ctx, card, colors) {
  drawGlassPanel(ctx, card.x, card.y, card.w, card.h, colors);

  let tx = card.x + 20;
  if (card.emoji) {
    const img = await loadEmojiImage(card.emoji);
    if (img) {
      ctx.drawImage(img, card.x + 16, card.y + 13, 30, 30);
      tx = card.x + 54;
    }
  }

  ctx.fillStyle = "rgba(245,245,255,0.95)";
  ctx.font = '600 19px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(card.label, tx, card.y + 35);

  ctx.font = '700 45px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = neonGradient(ctx, card.x + 20, card.y + 88, card.value);
  ctx.fillText(card.value, card.x + 20, card.y + 89);
}

function drawEquipmentSlot(ctx, s, colors) {
  drawGlassPanel(ctx, s.x, s.y, s.w, s.h, colors);
  ctx.fillStyle = "rgba(245,245,255,0.98)";
  ctx.font = '600 39px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(s.name, s.x + 68, s.y + 57);

  ctx.fillStyle = s.owned ? "#22d3ee" : "#f472b6";
  ctx.font = '700 47px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText(s.owned ? "✓" : "✗", s.x + 18, s.y + 57);
}

async function buildInventoryImage(eventKey, player, user, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  const isBleach = eventKey === "bleach";
  const width = 1850;
  const height = 1220;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const colors = isBleach
    ? {
        bg1: "#050524",
        bg2: "#1a0b4f",
        bg3: "#2a0b5f",
        panelA: "rgba(15,23,42,0.7)",
        panelB: "rgba(30,41,59,0.52)",
        stroke: "rgba(167,139,250,0.7)",
        accentBlue: "rgba(34,211,238,0.95)",
        accentPink: "rgba(232,121,249,0.95)",
      }
    : {
        bg1: "#021524",
        bg2: "#063544",
        bg3: "#0a4e61",
        panelA: "rgba(15,23,42,0.7)",
        panelB: "rgba(30,41,59,0.52)",
        stroke: "rgba(94,234,212,0.7)",
        accentBlue: "rgba(34,211,238,0.95)",
        accentPink: "rgba(232,121,249,0.95)",
      };

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, colors.bg1);
  bg.addColorStop(0.5, colors.bg2);
  bg.addColorStop(1, colors.bg3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  drawParticles(ctx, width, height);

  rr(ctx, 32, 32, width - 64, height - 64, 30);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const inv = isBleach ? player.bleach.items : player.jjk.items;
  const mats = player.jjk.materials || { cursedShards: 0, expeditionKeys: 0 };
  const survival = isBleach ? player.bleach.survivalBonus : player.jjk.survivalBonus;
  const cap = isBleach ? bonusMaxBleach : bonusMaxJjk;
  const itemSurvival = isBleach ? calcBleachSurvivalBonus(inv) : calcJjkSurvivalBonus(inv);
  const dropLuck = isBleach ? calcBleachDropLuckMultiplier(inv) : calcJjkDropLuckMultiplier(inv);
  const rewardMult = isBleach ? calcBleachReiatsuMultiplier(inv) : calcJjkCEMultiplier(inv);
  const currency = isBleach ? player.bleach.reiatsu : player.jjk.cursedEnergy;
  const rate = isBleach ? DRAKO_RATE_BLEACH : DRAKO_RATE_JJK;
  const power = computePower({
    currency,
    drako: player.drako,
    survival,
    itemSurvival,
    dropLuck,
    rewardMult,
    ownedRoles: player.ownedRoles?.length || 0,
  });

  const avatarUrl = user?.displayAvatarURL?.({ extension: "png", size: 512 }) || "";
  await drawAvatar(ctx, avatarUrl, 78, 82, 260, colors);

  ctx.font = '800 86px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = neonGradient(ctx, 410, 164, isBleach ? "BLEACH INVENTORY" : "JJK INVENTORY");
  ctx.fillText(isBleach ? "BLEACH INVENTORY" : "JJK INVENTORY", 410, 164);

  ctx.font = '600 58px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = neonGradient(ctx, 410, 244, user?.username || "unknown");
  ctx.fillText(user?.username || "unknown", 410, 244);

  ctx.font = '700 52px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = neonGradient(ctx, 1360, 244, String(power));
  ctx.fillText(n(power), 1360, 244);

  ctx.save();
  ctx.strokeStyle = colors.accentBlue;
  ctx.shadowColor = colors.accentBlue;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(410, 196);
  ctx.lineTo(width - 104, 196);
  ctx.stroke();
  ctx.restore();

  const stats = [
    { x: 78, y: 316, w: 420, h: 128, label: isBleach ? "Reiatsu" : "Cursed Energy", value: n(currency), emoji: EMOJI.reiatsu },
    { x: 518, y: 316, w: 420, h: 128, label: "Drako Coin", value: n(player.drako), emoji: EMOJI.drako },
    { x: 958, y: 316, w: 420, h: 128, label: "Boss Bonus", value: `${n(survival)}% / ${cap}%`, emoji: EMOJI.bossBonus },
    { x: 1398, y: 316, w: 360, h: 128, label: "Exchange Rate", value: `${rate}->1Drako`, emoji: EMOJI.rate },
    { x: 78, y: 462, w: 420, h: 128, label: "Item Survival", value: `+${n(itemSurvival)}%`, emoji: EMOJI.itemSurvival },
    { x: 518, y: 462, w: 420, h: 128, label: "Drop Luck", value: `x${dropLuck.toFixed(2)}`, emoji: EMOJI.dropLuck },
    { x: 958, y: 462, w: 420, h: 128, label: "Reward Multi", value: `x${rewardMult.toFixed(2)}`, emoji: EMOJI.rewardMulti },
    { x: 1398, y: 462, w: 360, h: 128, label: "Wardrobe Roles", value: n(player.ownedRoles?.length || 0) },
  ];
  for (const s of stats) await drawStatCard(ctx, s, colors);

  drawGlassPanel(ctx, 78, 628, 1680, 500, colors);
  ctx.font = '700 74px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = neonGradient(ctx, 106, 703, "EQUIPMENT");
  ctx.fillText("EQUIPMENT", 106, 703);

  const slots = isBleach
    ? [
        { x: 106, y: 740, w: 394, h: 94, name: "Zanpakuto", owned: !!inv.zanpakuto_basic },
        { x: 522, y: 740, w: 394, h: 94, name: "Mask Fragment", owned: !!inv.hollow_mask_fragment },
        { x: 938, y: 740, w: 394, h: 94, name: "Soul Cloak", owned: !!inv.soul_reaper_cloak },
        { x: 1354, y: 740, w: 376, h: 94, name: "Aizen Role", owned: !!inv.cosmetic_role },
        { x: 106, y: 856, w: 394, h: 94, name: "Reiatsu Amplifier", owned: !!inv.reiatsu_amplifier },
        { x: 522, y: 856, w: 394, h: 94, name: "Locked Slot", owned: false },
        { x: 938, y: 856, w: 394, h: 94, name: "Locked Slot", owned: false },
      ]
    : [
        { x: 106, y: 740, w: 394, h: 94, name: "Black Flash Manual", owned: !!inv.black_flash_manual },
        { x: 522, y: 740, w: 394, h: 94, name: "Domain Charm", owned: !!inv.domain_charm },
        { x: 938, y: 740, w: 394, h: 94, name: "Cursed Tool", owned: !!inv.cursed_tool },
        { x: 1354, y: 740, w: 376, h: 94, name: "Binding Vow Seal", owned: !!inv.binding_vow_seal },
        { x: 106, y: 856, w: 394, h: 94, name: "Reverse Talisman", owned: !!inv.reverse_talisman },
        { x: 522, y: 856, w: 394, h: 94, name: `Shards: ${n(mats.cursedShards)}`, owned: (mats.cursedShards || 0) > 0 },
        { x: 938, y: 856, w: 394, h: 94, name: `Keys: ${n(mats.expeditionKeys)}`, owned: (mats.expeditionKeys || 0) > 0 },
      ];
  for (const s of slots) drawEquipmentSlot(ctx, s, colors);

  ctx.font = '600 46px "Inter", "Segoe UI", sans-serif';
  const footer = `Event Bot  •  Powered by ${user?.username || "unknown"}  •  Version 2.3`;
  ctx.fillStyle = neonGradient(ctx, 520, 1164, footer);
  ctx.fillText(footer, 520, 1164);

  return canvas.toBuffer("image/png");
}

module.exports = { buildInventoryImage };

