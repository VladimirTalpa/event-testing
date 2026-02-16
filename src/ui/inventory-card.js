const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { DRAKO_RATE_BLEACH, DRAKO_RATE_JJK } = require("../config");

const ROOT = path.join(__dirname, "..", "..");
const ASSETS_DIR = path.join(ROOT, "assets");
const TEMPLATE_DIR = path.join(ASSETS_DIR, "templates");
const LAYOUT_FILE = path.join(ASSETS_DIR, "layouts", "inventory-layout.json");

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
  if (Number.isFinite(input.power)) return Math.floor(input.power);
  const value = (
    input.currency / 10 +
    input.drako * 120 +
    input.survival * 55 +
    input.itemSurvival * 35 +
    input.dropLuck * 650 +
    input.rewardMult * 2000 +
    input.ownedRoles * 110
  );
  return Math.max(1, Math.floor(value));
}

function defaultLayout() {
  return {
    width: 1800,
    height: 1180,
    templates: {
      bleach: "inventory_bleach.png",
      jjk: "inventory_jjk.png",
    },
    fonts: {
      title: '800 84px "Orbitron", "Inter", "Segoe UI", sans-serif',
      subtitle: '600 54px "Inter", "Segoe UI", sans-serif',
      statValue: '700 44px "Orbitron", "Inter", "Segoe UI", sans-serif',
      statLabel: '600 17px "Inter", "Segoe UI", sans-serif',
      item: '600 40px "Inter", "Segoe UI", sans-serif',
      footer: '600 45px "Inter", "Segoe UI", sans-serif',
    },
    colors: {
      fallbackBg: "#0b1020",
      textMain: "#ffffff",
      textSub: "rgba(255,255,255,0.95)",
      textLabel: "rgba(245,245,255,0.95)",
    },
    points: {
      avatar: { x: 86, y: 86, size: 260 },
      title: { x: 430, y: 168 },
      player: { x: 432, y: 246 },
      combatPower: { x: 1260, y: 246 },
      footer: { x: 500, y: 1130 },
    },
    stats: [
      { key: "currency", label: "Reiatsu", x: 86, y: 320 },
      { key: "drako", label: "Drako Coin", x: 524, y: 320 },
      { key: "boss_bonus", label: "Boss Bonus", x: 962, y: 320 },
      { key: "rate", label: "Exchange Rate", x: 1400, y: 320 },
      { key: "item_survival", label: "Item Survival", x: 86, y: 468 },
      { key: "drop_luck", label: "Drop Luck", x: 524, y: 468 },
      { key: "reward_multi", label: "Reward Multi", x: 962, y: 468 },
      { key: "wardrobe", label: "Wardrobe Roles", x: 1400, y: 468 },
    ],
    statBox: { w: 414, h: 126, lastW: 314, valueDx: 16, valueDy: 87, labelDx: 16, labelDy: 33 },
    equipment: {
      title: { x: 112, y: 704 },
      slots: [
        { x: 112, y: 736, w: 388, h: 92, key: "slot1", label: "Zanpakuto" },
        { x: 524, y: 736, w: 388, h: 92, key: "slot2", label: "Mask Fragment" },
        { x: 936, y: 736, w: 388, h: 92, key: "slot3", label: "Soul Cloak" },
        { x: 1348, y: 736, w: 340, h: 92, key: "slot4", label: "Aizen Role" },
        { x: 112, y: 852, w: 388, h: 92, key: "slot5", label: "Reiatsu Amplifier" },
        { x: 524, y: 852, w: 388, h: 92, key: "slot6", label: "Locked Slot" },
        { x: 936, y: 852, w: 388, h: 92, key: "slot7", label: "Locked Slot" },
      ],
    },
  };
}

function loadLayout() {
  const base = defaultLayout();
  try {
    if (!fs.existsSync(LAYOUT_FILE)) return base;
    const raw = fs.readFileSync(LAYOUT_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...base,
      ...parsed,
      templates: { ...base.templates, ...(parsed.templates || {}) },
      fonts: { ...base.fonts, ...(parsed.fonts || {}) },
      colors: { ...base.colors, ...(parsed.colors || {}) },
      points: { ...base.points, ...(parsed.points || {}) },
      statBox: { ...base.statBox, ...(parsed.statBox || {}) },
      equipment: {
        ...base.equipment,
        ...(parsed.equipment || {}),
        title: { ...base.equipment.title, ...((parsed.equipment || {}).title || {}) },
      },
      stats: Array.isArray(parsed.stats) && parsed.stats.length ? parsed.stats : base.stats,
    };
  } catch (e) {
    console.warn("[inventory-card] failed to parse layout:", e?.message || e);
    return base;
  }
}

async function drawTemplateBackground(ctx, layout, eventKey) {
  const fileName = eventKey === "bleach" ? layout.templates.bleach : layout.templates.jjk;
  const full = path.join(TEMPLATE_DIR, fileName);
  if (!fs.existsSync(full)) {
    console.warn(`[inventory-card] template missing: ${full}`);
    return false;
  }
  try {
    const img = await loadImage(full);
    ctx.drawImage(img, 0, 0, layout.width, layout.height);
    console.log(`[inventory-card] template loaded: ${full}`);
    return true;
  } catch (e) {
    console.warn("[inventory-card] template load failed:", e?.message || e);
    return false;
  }
}

function resolveValueMap(eventKey, player, bonusMaxBleach, bonusMaxJjk) {
  const isBleach = eventKey === "bleach";
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
    power: player.power,
    currency,
    drako: player.drako,
    survival,
    itemSurvival,
    dropLuck,
    rewardMult,
    ownedRoles: player.ownedRoles?.length || 0,
  });

  const map = {
    currency: n(currency),
    drako: n(player.drako),
    boss_bonus: `${n(survival)}% / ${cap}%`,
    rate: `${rate}->1Drako`,
    item_survival: `+${n(itemSurvival)}%`,
    drop_luck: `x${dropLuck.toFixed(2)}`,
    reward_multi: `x${rewardMult.toFixed(2)}`,
    wardrobe: n(player.ownedRoles?.length || 0),
    power: n(power),
    shards: n(mats.cursedShards),
    keys: n(mats.expeditionKeys),
  };

  const slots = isBleach
    ? [
        { name: "Zanpakuto", own: !!inv.zanpakuto_basic },
        { name: "Mask Fragment", own: !!inv.hollow_mask_fragment },
        { name: "Soul Cloak", own: !!inv.soul_reaper_cloak },
        { name: "Aizen Role", own: !!inv.cosmetic_role },
        { name: "Reiatsu Amplifier", own: !!inv.reiatsu_amplifier },
        { name: "Locked Slot", own: false },
        { name: "Locked Slot", own: false },
      ]
    : [
        { name: "Black Flash Manual", own: !!inv.black_flash_manual },
        { name: "Domain Charm", own: !!inv.domain_charm },
        { name: "Cursed Tool", own: !!inv.cursed_tool },
        { name: "Binding Vow Seal", own: !!inv.binding_vow_seal },
        { name: "Reverse Talisman", own: !!inv.reverse_talisman },
        { name: `Shards: ${n(mats.cursedShards)}`, own: (mats.cursedShards || 0) > 0 },
        { name: `Keys: ${n(mats.expeditionKeys)}`, own: (mats.expeditionKeys || 0) > 0 },
      ];

  return { map, slots, isBleach };
}

async function drawAvatar(ctx, avatarUrl, p) {
  const x = Number.isFinite(p?.x) ? p.x : 86;
  const y = Number.isFinite(p?.y) ? p.y : 86;
  const size = Number.isFinite(p?.size) ? p.size : 260;

  // Outer neon ring so avatar is always visible on bright templates
  ctx.save();
  ctx.strokeStyle = "rgba(147, 197, 253, 0.95)";
  ctx.shadowColor = "rgba(99, 102, 241, 0.95)";
  ctx.shadowBlur = 24;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner ring
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.shadowColor = "rgba(255,255,255,0.6)";
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  try {
    const img = await loadImage(avatarUrl);
    ctx.drawImage(img, x, y, size, size);
  } catch {}
  ctx.restore();
}

async function buildInventoryImage(eventKey, player, user, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  const layout = loadLayout();
  const canvas = createCanvas(layout.width, layout.height);
  const ctx = canvas.getContext("2d");

  const hasTemplate = await drawTemplateBackground(ctx, layout, eventKey);
  if (!hasTemplate) {
    ctx.fillStyle = layout.colors.fallbackBg;
    ctx.fillRect(0, 0, layout.width, layout.height);
  }

  const username = String(user?.username || "Unknown");
  const avatarUrl = user?.displayAvatarURL?.({ extension: "png", size: 512 }) || "";
  await drawAvatar(ctx, avatarUrl, layout.points.avatar);

  const isBleachTitle = eventKey === "bleach" ? "BLEACH INVENTORY" : "JJK INVENTORY";
  const data = resolveValueMap(eventKey, player, bonusMaxBleach, bonusMaxJjk);

  ctx.fillStyle = layout.colors.textMain;
  ctx.font = layout.fonts.title;
  ctx.fillText(isBleachTitle, layout.points.title.x, layout.points.title.y);

  ctx.fillStyle = layout.colors.textSub;
  ctx.font = layout.fonts.subtitle;
  ctx.fillText(`Player: ${username}`, layout.points.player.x, layout.points.player.y);
  ctx.fillText(`Combat Power: ${data.map.power}`, layout.points.combatPower.x, layout.points.combatPower.y);

  for (let i = 0; i < layout.stats.length; i++) {
    const stat = layout.stats[i];
    const isLast = i === layout.stats.length - 1;
    const boxW = isLast ? layout.statBox.lastW : layout.statBox.w;
    const label = stat.label || stat.key;
    const value = data.map[stat.key] ?? "-";

    ctx.fillStyle = layout.colors.textLabel;
    ctx.font = layout.fonts.statLabel;
    ctx.fillText(String(label), stat.x + layout.statBox.labelDx, stat.y + layout.statBox.labelDy);

    ctx.fillStyle = layout.colors.textMain;
    ctx.font = layout.fonts.statValue;
    const text = String(value);
    const maxW = boxW - 24;
    let draw = text;
    while (ctx.measureText(draw).width > maxW && draw.length > 1) draw = draw.slice(0, -1);
    ctx.fillText(draw, stat.x + layout.statBox.valueDx, stat.y + layout.statBox.valueDy);
  }

  if (layout.equipment?.title) {
    ctx.fillStyle = layout.colors.textMain;
    ctx.font = layout.fonts.title;
    ctx.fillText("Equipment", layout.equipment.title.x, layout.equipment.title.y);
  }

  const slots = layout.equipment?.slots || [];
  for (let i = 0; i < Math.min(slots.length, data.slots.length); i++) {
    const s = slots[i];
    const src = data.slots[i];
    ctx.fillStyle = layout.colors.textMain;
    ctx.font = layout.fonts.item;
    const line = `${src.name}`;
    ctx.fillText(line, s.x + 22, s.y + 56);
  }

  ctx.fillStyle = layout.colors.textSub;
  ctx.font = layout.fonts.footer;
  ctx.fillText(`Event Bot  •  Powered by ${username}  •  Version 2.3`, layout.points.footer.x, layout.points.footer.y);

  return canvas.toBuffer("image/png");
}

module.exports = { buildInventoryImage };
