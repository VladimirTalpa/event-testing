require("dotenv").config();

const parseCsvIds = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

module.exports = {
  // colors / ui
  COLOR: 0x9b59b6,
  MAX_HITS: 2,

  // emojis (можешь поменять)
  E_MEMBERS: "👥",
  E_BLEACH: "🩸",
  E_JJK: "🟣",
  E_REIATSU: "💠",
  E_CE: "🌀",
  E_DRAKO: "🐉",

  // rates
  DRAKO_RATE_BLEACH: 100,
  DRAKO_RATE_JJK: 120,

  // daily
  DAILY_COOLDOWN_MS: 24 * 60 * 60 * 1000,
  DAILY_NORMAL: 50,
  DAILY_BOOSTER: 80,

  // mob boss bonus caps
  BLEACH_BONUS_MAX: 30,
  JJK_BONUS_MAX: 30,

  // roles
  EVENT_ROLE_IDS: parseCsvIds(process.env.EVENT_ROLE_IDS),
  BOOSTER_ROLE_ID: process.env.BOOSTER_ROLE_ID || "",

  // channels
  BLEACH_CHANNEL_ID: process.env.BLEACH_CHANNEL_ID || "",
  JJK_CHANNEL_ID: process.env.JJK_CHANNEL_ID || "",
};
