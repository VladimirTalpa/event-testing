// src/config.js
module.exports = {
  TOKEN: process.env.TOKEN,

  // Redis (если нет — будет память)
  REDIS_URL: process.env.REDIS_URL || "",

  // UI
  COLOR: 0x9b59ff,

  // твоя гифка карточки (как внешний вид всех карточек)
  CARD_GIF_URL:
    "https://media.discordapp.net/attachments/1468153576353431615/1471828355153268759/Your_paragraph_text.gif?ex=69905a79&is=698f08f9&hm=9d059092959a3446edcf38507f1a71b5577e85a97a8ee08292da323f238d513b&=&width=388&height=582",
};
