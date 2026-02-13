// src/config.js
module.exports = {
  TOKEN: process.env.TOKEN || "",
  CLIENT_ID: process.env.CLIENT_ID || "",
  GUILD_ID: process.env.GUILD_ID || "",

  // channels (optional lock)
  BLEACH_CHANNEL_ID: process.env.BLEACH_CHANNEL_ID || "",
  JJK_CHANNEL_ID: process.env.JJK_CHANNEL_ID || "",

  // boss settings
  ROUND_COOLDOWN_MS: 8000,
  MAX_HITS: 2,
  PING_BOSS_ROLE_ID: process.env.PING_BOSS_ROLE_ID || "",

  // UI
  COLOR: 0x2f3136,

  // emojis
  E_MEMBERS: "👥",
  E_BLEACH: "🩸",
  E_JJK: "🟣",
  E_REIATSU: "💠",
  E_CE: "🌀",
  E_DRAKO: "🪙",

  // drako (placeholder)
  DRAKO_RATE_BLEACH: 100,
  DRAKO_RATE_JJK: 100,

  // cards placeholder media
  DEFAULT_CARD_GIF: "https://cdn.discordapp.com/attachments/1468153576353431615/1471828355153268759/Your_paragraph_text.gif"
};
