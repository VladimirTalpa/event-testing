const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { DRAKO_RATE_BLEACH, DRAKO_RATE_JJK } = require("../config");

const E = {
  reiatsu: "1473060860644561016",
  drako: "1473061778614255668",
  rate: "1473064972333486285",
  bossBonus: "1473063682979401829",
  itemSurvival: "1473063619049820191",
  dropLuck: "1473063569540251709",
  rewardMulti: "1473063773412659282",
};

const emojiCache = new Map();

async function loadCustomEmojiImage(emojiId) {
  const id = String(emojiId || "").trim();
  if (!id) return null;
  if (emojiCache.has(id)) return emojiCache.get(id);

  const urls = [
    `https://cdn.discordapp.com/emojis/${id}.png?size=96&quality=lossless`,
    `https://cdn.discordapp.com/emojis/${id}.webp?size=96&quality=lossless`,
  ];

  for (const url of urls) {
    try {
      const img = await loadImage(url);
      emojiCache.set(id, img);
      return img;
    } catch {}
  }

  emojiCache.set(id, null);
  return null;
}

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

function drawStars(ctx, w, h) {
  for (let i = 0; i < 250; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 0.6 + Math.random() * 2.2;
    ctx.fillStyle = `rgba(255,255,255,${(0.06 + Math.random() * 0.28).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlass(ctx, x, y, w, h, theme, rad = 18) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, theme.panelA);
  grad.addColorStop(1, theme.panelB);

  rr(ctx, x, y, w, h, rad);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.save();
  rr(ctx, x, y, w, h, rad);
  ctx.clip();
  const shine = ctx.createLinearGradient(x, y, x, y + h * 0.45);
  shine.addColorStop(0, "rgba(255,255,255,0.18)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(x, y, w, h * 0.45);
  ctx.restore();

  ctx.strokeStyle = theme.stroke;
  ctx.lineWidth = 1.4;
  rr(ctx, x, y, w, h, rad);
  ctx.stroke();
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
    g.addColorStop(0, "#111827");
    g.addColorStop(1, "#1f2937");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.strokeStyle = i === 1 ? theme.accent2 : theme.accent;
    ctx.shadowColor = i === 1 ? theme.accent2 : theme.accent;
    ctx.shadowBlur = 26 - i * 6;
    ctx.lineWidth = 3 - i * 0.4;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + 8 + i * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

async function statCard(ctx, data, theme) {
  const { x, y, w, h, title, value, emojiId } = data;
  drawGlass(ctx, x, y, w, h, theme, 16);

  let textStart = x + 16;
  if (emojiId) {
    const icon = await loadCustomEmojiImage(emojiId);
    if (icon) {
      ctx.drawImage(icon, x + 14, y + 14, 26, 26);
      textStart = x + 48;
    }
  }

  ctx.fillStyle = "rgba(245,245,255,0.95)";
  ctx.font = '600 17px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(String(title).toUpperCase(), textStart, y + 33);

  ctx.fillStyle = "#ffffff";
  ctx.font = '700 44px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText(String(value), x + 16, y + 87);
}

function itemBadge(ctx, x, y, text, tone) {
  const colors = tone === "on"
    ? { bg: "rgba(6,95,70,0.4)", fg: "#6ee7b7", st: "rgba(110,231,183,0.7)" }
    : tone === "rare"
      ? { bg: "rgba(12,74,110,0.45)", fg: "#7dd3fc", st: "rgba(125,211,252,0.7)" }
      : { bg: "rgba(88,28,135,0.45)", fg: "#d8b4fe", st: "rgba(216,180,254,0.7)" };

  rr(ctx, x, y, 132, 38, 10);
  ctx.fillStyle = colors.bg;
  ctx.fill();
  ctx.strokeStyle = colors.st;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = colors.fg;
  ctx.font = '700 20px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText(text, x + 18, y + 26);
}

function itemSlot(ctx, x, y, w, h, name, owned, variant, theme) {
  drawGlass(ctx, x, y, w, h, theme, 14);
  ctx.fillStyle = "#f3f4f6";
  ctx.font = '600 43px "Inter", "Segoe UI Symbol", sans-serif';
  ctx.fillText(owned ? "▣" : "◻", x + 18, y + 52);

  ctx.fillStyle = "rgba(245,245,255,0.98)";
  ctx.font = '600 40px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(name, x + 70, y + 52);

  if (owned) itemBadge(ctx, x + w - 154, y + 18, "OWNED", "on");
  else if (variant === "rare") itemBadge(ctx, x + w - 154, y + 18, "RARE", "rare");
  else itemBadge(ctx, x + w - 154, y + 18, "LOCKED", "locked");
}

function computePower(input) {
  const {
    currency,
    drako,
    survival,
    itemSurvival,
    dropLuck,
    rewardMult,
    ownedRoles,
  } = input;

  const power = (
    currency / 10 +
    drako * 120 +
    survival * 55 +
    itemSurvival * 35 +
    dropLuck * 650 +
    rewardMult * 2000 +
    ownedRoles * 110
  );

  return Math.max(1, Math.floor(power));
}

async function buildInventoryImage(eventKey, player, user, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  const isBleach = eventKey === "bleach";
  const width = 1800;
  const height = 1180;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const theme = isBleach
    ? {
        bg1: "#050524",
        bg2: "#1b0c5b",
        bg3: "#2d0f6f",
        accent: "rgba(96,165,250,0.95)",
        accent2: "rgba(251,113,133,0.9)",
        panelA: "rgba(15,23,42,0.72)",
        panelB: "rgba(30,41,59,0.54)",
        stroke: "rgba(167,139,250,0.75)",
      }
    : {
        bg1: "#031322",
        bg2: "#043042",
        bg3: "#0b5062",
        accent: "rgba(45,212,191,0.95)",
        accent2: "rgba(251,191,36,0.9)",
        panelA: "rgba(15,23,42,0.72)",
        panelB: "rgba(30,41,59,0.54)",
        stroke: "rgba(94,234,212,0.75)",
      };

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, theme.bg1);
  bg.addColorStop(0.5, theme.bg2);
  bg.addColorStop(1, theme.bg3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const nebula = ctx.createRadialGradient(width * 0.88, 160, 40, width * 0.88, 160, 700);
  nebula.addColorStop(0, "rgba(255,255,255,0.16)");
  nebula.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, width, height);

  drawStars(ctx, width, height);

  rr(ctx, 36, 36, width - 72, height - 72, 30);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  const username = String(user?.username || "Unknown");
  const avatarUrl = user?.displayAvatarURL?.({ extension: "png", size: 512 }) || "";
  await drawAvatar(ctx, avatarUrl, 86, 86, 260, theme);

  ctx.fillStyle = "#ffffff";
  ctx.font = '800 86px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText(isBleach ? "BLEACH INVENTORY" : "JJK INVENTORY", 430, 168);

  drawGlass(ctx, 1270, 90, 360, 74, theme, 14);
  ctx.fillStyle = "#fde68a";
  ctx.font = '700 46px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText("[LIMITED EVENT]", 1300, 141);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = '600 58px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(`Player: ${username}`, 432, 246);

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

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = '600 53px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(`Combat Power: ${n(power)}`, 1260, 246);

  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 24;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(430, 194);
  ctx.lineTo(width - 120, 194);
  ctx.stroke();
  ctx.restore();

  const cards = [
    { x: 86, y: 320, w: 414, h: 126, title: "Reiatsu", value: n(currency), emojiId: E.reiatsu },
    { x: 524, y: 320, w: 414, h: 126, title: "Drako Coin", value: n(player.drako), emojiId: E.drako },
    { x: 962, y: 320, w: 414, h: 126, title: "Boss Bonus", value: `${n(survival)}% / ${cap}%`, emojiId: E.bossBonus },
    { x: 1400, y: 320, w: 314, h: 126, title: "Exchange Rate", value: `${rate}->1Drako`, emojiId: E.rate },
    { x: 86, y: 468, w: 414, h: 126, title: "Item Survival", value: `+${n(itemSurvival)}%`, emojiId: E.itemSurvival },
    { x: 524, y: 468, w: 414, h: 126, title: "Drop Luck", value: `x${dropLuck.toFixed(2)}`, emojiId: E.dropLuck },
    { x: 962, y: 468, w: 414, h: 126, title: "Reward Multi", value: `x${rewardMult.toFixed(2)}`, emojiId: E.rewardMulti },
    { x: 1400, y: 468, w: 314, h: 126, title: "Wardrobe Roles", value: n(player.ownedRoles?.length || 0) },
  ];
  for (const card of cards) await statCard(ctx, card, theme);

  drawGlass(ctx, 86, 632, 1628, 420, theme, 20);
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 72px "Orbitron", "Inter", "Segoe UI", sans-serif';
  ctx.fillText("Equipment", 112, 704);

  if (isBleach) {
    const slots = [
      { x: 112, y: 736, w: 388, h: 92, name: "Zanpakuto", own: inv.zanpakuto_basic, v: "rare" },
      { x: 524, y: 736, w: 388, h: 92, name: "Mask Fragment", own: inv.hollow_mask_fragment, v: "rare" },
      { x: 936, y: 736, w: 388, h: 92, name: "Soul Cloak", own: inv.soul_reaper_cloak, v: "rare" },
      { x: 1348, y: 736, w: 340, h: 92, name: "Aizen Role", own: inv.cosmetic_role, v: "locked" },
      { x: 112, y: 852, w: 388, h: 92, name: "Reiatsu Amplifier", own: inv.reiatsu_amplifier, v: "locked" },
      { x: 524, y: 852, w: 388, h: 92, name: "Locked Slot", own: false, v: "locked" },
      { x: 936, y: 852, w: 388, h: 92, name: "Locked Slot", own: false, v: "locked" },
    ];
    for (const s of slots) itemSlot(ctx, s.x, s.y, s.w, s.h, s.name, s.own, s.v, theme);
  } else {
    const slots = [
      { x: 112, y: 736, w: 388, h: 92, name: "Black Flash Manual", own: inv.black_flash_manual, v: "rare" },
      { x: 524, y: 736, w: 388, h: 92, name: "Domain Charm", own: inv.domain_charm, v: "rare" },
      { x: 936, y: 736, w: 388, h: 92, name: "Cursed Tool", own: inv.cursed_tool, v: "rare" },
      { x: 1348, y: 736, w: 340, h: 92, name: "Binding Vow Seal", own: inv.binding_vow_seal, v: "locked" },
      { x: 112, y: 852, w: 388, h: 92, name: "Reverse Talisman", own: inv.reverse_talisman, v: "locked" },
      { x: 524, y: 852, w: 388, h: 92, name: `Shards: ${n(mats.cursedShards)}`, own: mats.cursedShards > 0, v: "rare" },
      { x: 936, y: 852, w: 388, h: 92, name: `Keys: ${n(mats.expeditionKeys)}`, own: mats.expeditionKeys > 0, v: "rare" },
    ];
    for (const s of slots) itemSlot(ctx, s.x, s.y, s.w, s.h, s.name, s.own, s.v, theme);
  }

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = '600 45px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(`Event Bot  •  Powered by ${username}  •  Version 2.3`, 500, 1130);

  return canvas.toBuffer("image/png");
}

module.exports = { buildInventoryImage };

