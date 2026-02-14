// src/ui/embeds.js
const { EmbedBuilder } = require("discord.js");
const { closeRow, row, navButton } = require("./components");

// твоя гифка (как внешний вид карточек пока нет дизайна)
const CARD_GIF =
  "https://media.discordapp.net/attachments/1468153576353431615/1471828355153268759/Your_paragraph_text.gif?ex=69905a79&is=698f08f9&hm=9d059092959a3446edcf38507f1a71b5577e85a97a8ee08292da323f238d513b&=&width=388&height=582";

const DEFAULT_COLOR = 0xdb2b2b;

/**
 * Безопасно достаём апгрейд, чтобы не было:
 * Cannot read properties of undefined (reading 'black_flash_manual')
 */
function getUpgradeLevel(upgrades, key) {
  if (!upgrades || typeof upgrades !== "object") return 0;
  const v = upgrades[key];
  if (typeof v !== "number") return 0;
  return v;
}

/**
 * JJK множитель (пример). Главное — не крашится, даже если upgrades undefined.
 * Ты можешь потом поменять формулу как хочешь.
 */
function calcJjkCEMultiplier(upgrades) {
  const blackFlashManual = getUpgradeLevel(upgrades, "black_flash_manual"); // <= фикс
  const base = 1.0;

  // пример: каждый уровень +3%
  const bonus = blackFlashManual * 0.03;

  return base + bonus;
}

/**
 * Embed карточки персонажа (пока общий дизайн = GIF)
 */
function cardEmbed({ name, anime, rarity, role, hp, atk, def, stars = 0, level = 1 }) {
  return new EmbedBuilder()
    .setColor(DEFAULT_COLOR)
    .setTitle(`${name} — ${rarity}`)
    .setDescription(
      [
        `**Anime:** ${anime}`,
        `**Role:** ${role}`,
        `**Level:** ${level}   **Stars:** ${"⭐".repeat(Math.min(10, stars)) || "—"}`,
        ``,
        `❤️ **HP:** ${hp}`,
        `⚔️ **ATK:** ${atk}`,
        `🛡️ **DEF:** ${def}`,
      ].join("\n")
    )
    .setImage(CARD_GIF)
    .setFooter({ text: "Card preview placeholder (GIF) — будет заменено твоим дизайном" });
}

/**
 * Embed спавна босса
 */
function bossSpawnEmbed(boss) {
  return new EmbedBuilder()
    .setColor(0xff3b3b)
    .setTitle(`👹 ${boss?.name || "Boss"}`)
    .setDescription(
      [
        `**Faction:** ${boss?.faction || "—"}`,
        `**Tier:** ${boss?.tier || "—"}`,
        ``,
        `**HP:** ${boss?.hpPercent ?? 100}%`,
        `**Round:** ${boss?.round ?? 1}/${boss?.rounds ?? 4}`,
      ].join("\n")
    );
}

/**
 * Кнопки для босса (ВАЖНО: это ФУНКЦИЯ, чтобы не было "bossButtons is not a function")
 */
function bossButtons({ disabled = false } = {}) {
  const block = navButton("boss_block", "Block", "Primary", "🛡️");
  const dodge = navButton("boss_dodge", "Dodge", "Secondary", "💨");
  const hit = navButton("boss_hit", "Attack", "Success", "⚔️");

  block.setDisabled(disabled);
  dodge.setDisabled(disabled);
  hit.setDisabled(disabled);

  // + обязательный Close
  return [
    row(block, dodge, hit),
    closeRow("Close"),
  ];
}

/**
 * Profile меню (пример норм вида + close)
 */
function profileEmbed(user, data) {
  const coins = data?.coins ?? 0;
  const bleach = data?.bleachCoins ?? 0;
  const jjk = data?.jjkCoins ?? 0;

  return new EmbedBuilder()
    .setColor(0x6a3efa)
    .setTitle(`🏆 Profile — ${user.username}`)
    .setDescription(
      [
        `💰 **Coins:** ${coins}`,
        `🩸 **Bleach Currency:** ${bleach}`,
        `🟣 **JJK Currency:** ${jjk}`,
        ``,
        `Use buttons to navigate sections.`,
      ].join("\n")
    );
}

function profileButtons() {
  return [
    row(
      navButton("profile_cards", "Cards", "Secondary", "🃏"),
      navButton("profile_gears", "Gears", "Secondary", "🛡️"),
      navButton("profile_titles", "Titles", "Secondary", "🏷️"),
      navButton("profile_lb", "Leaderboard", "Secondary", "📊")
    ),
    closeRow("Close"),
  ];
}

/**
 * Store меню (пример + close)
 */
function storeEmbed() {
  return new EmbedBuilder()
    .setColor(0xffc800)
    .setTitle(`📦 Store`)
    .setDescription(`Choose a section below.`);
}

function storeButtons() {
  return [
    row(
      navButton("store_event", "Event Shop", "Secondary", "🎟️"),
      navButton("store_packs", "Card Packs", "Secondary", "🎁"),
      navButton("store_gear", "Gear Shop", "Secondary", "⚙️")
    ),
    closeRow("Close"),
  ];
}

module.exports = {
  // utils
  calcJjkCEMultiplier,

  // cards
  cardEmbed,

  // boss
  bossSpawnEmbed,
  bossButtons,

  // profile / store ui
  profileEmbed,
  profileButtons,
  storeEmbed,
  storeButtons,

  // export gif in case you want to reuse
  CARD_GIF,
};
