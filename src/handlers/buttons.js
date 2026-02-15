// src/handlers/buttons.js
const { handleProfileButton, handleStoreButton, handleForgeButton } = require("../ui/menus");

// ⚠️ твои старые кнопки (boss/mob/shop/pvp) остаются в этом же файле если хочешь,
// но чтобы не ломать — мы просто "пропускаем" дальше если не меню.

const oldHandleButtons = require("./buttons.old"); // <-- см. ниже

module.exports = async function handleButtons(interaction) {
  const id = interaction.customId;

  if (id.startsWith("profile:")) return handleProfileButton(interaction);
  if (id.startsWith("store:")) return handleStoreButton(interaction);
  if (id.startsWith("forge:")) return handleForgeButton(interaction);

  // всё остальное — в старый обработчик (boss/mob/shop/pvp)
  return oldHandleButtons(interaction);
};
