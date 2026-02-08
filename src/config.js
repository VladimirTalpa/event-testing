module.exports = {
  // Channels where spawns are allowed
  BLEACH_CHANNEL_ID: "1469757595031179314",
  JJK_CHANNEL_ID: "1469757629390651686",

  // Roles that can admin spawn & adminadd (keep your IDs)
  EVENT_ROLE_IDS: ["1259865441405501571", "1287879457025163325"],

  // Ping roles
  PING_BOSS_ROLE_ID: "1467575062826586205",
  PING_MOB_ROLE_ID: "1467575020275368131",

  // Booster role for daily (Bleach only)
  BOOSTER_ROLE_ID: "1267266564961341501",

  // Theme
  COLOR: 0x7b2cff,
  MAX_HITS: 2,
  ROUND_COOLDOWN_MS: 10 * 1000,

  // Economy
  DRAKO_RATE_BLEACH: 47,
  DRAKO_RATE_JJK: 19,

  // Daily
  DAILY_COOLDOWN_MS: 24 * 60 * 60 * 1000,
  DAILY_NORMAL: 100,
  DAILY_BOOSTER: 200,

  // Event logo emojis (your new IDs)
  E_BLEACH: "<:event:1470018874408964119>",
  E_JJK: "<:event:1470018845245968434>",

  // Other emojis (keep if you want)
  E_REIATSU: "<:event:1469821285079978045>",
  E_CE: "<:event:1469821211872727040>",
  E_DRAKO: "<:event:1469812070542217389>",
  E_MEMBERS: "👥",

  // Robux drop settings
  DROP_ROBUX_CHANCE_REAL_BASE: 0.005,
  DROP_ROBUX_CHANCE_DISPLAY: 0.025,
  DROP_ROBUX_CHANCE_CAP: 0.01,
  ROBUX_CLAIM_TEXT: "To claim: contact **daez063**.",

  // Redis
  REDIS_PLAYERS_KEY: "events:players",
  REDIS_FALLBACK_KEYS: ["players", "playerData", "users"],
};
