// src/handlers/selects.js
const { getPlayer } = require("../core/players");
const { closeRow, profileTabsSelect, storeTabsSelect, packSelect } = require("../ui/components");

const {
  profileHomeEmbed,
  profileCurrencyEmbed,
  profileCardsEmbed,
  profileGearsEmbed,
  profileTitlesEmbed,
  profileLeaderboardEmbed,

  storeHomeEmbed,
  storeEventShopEmbed,
  storePacksEmbed,
  storeGearShopEmbed,

  packOpeningEmbed,
  cardRevealEmbed,
} = require("../ui/embeds");

const { getCardsSummaryText, getTitlesText } = require("../core/profile_helpers");
const { E_REIATSU, E_CE, E_DRAKO } = require("../config");

async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has("ManageRoles")) return { ok: false, reason: "Missing Manage Roles permission." };
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role add." };
  }
}
async function tryRemoveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has("ManageRoles")) return { ok: false, reason: "Missing Manage Roles permission." };
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.remove(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role remove." };
  }
}

function walletFromPlayer(p) {
  return {
    reiatsu: p?.bleach?.reiatsu ?? 0,
    cursed_energy: p?.jjk?.cursedEnergy ?? 0,
    drako: p?.drako ?? 0,
  };
}

module.exports = async function handleSelects(interaction) {
  // PROFILE tabs
  if (interaction.customId === "ui:profile:tabs") {
    const tab = interaction.values?.[0];
    const p = await getPlayer(interaction.user.id);

    if (tab === "currency") {
      return interaction.update({
        embeds: [profileCurrencyEmbed(interaction.user, walletFromPlayer(p))],
        components: [profileTabsSelect(), closeRow()],
      });
    }

    if (tab === "cards") {
      return interaction.update({
        embeds: [profileCardsEmbed(interaction.user, getCardsSummaryText(p))],
        components: [profileTabsSelect(), closeRow()],
      });
    }

    if (tab === "gears") {
      // пока заглушка нормальная
      return interaction.update({
        embeds: [profileGearsEmbed(interaction.user, "Gear system подключим в следующем шаге (Weapon/Armor).")],
        components: [profileTabsSelect(), closeRow()],
      });
    }

    if (tab === "titles") {
      const text = getTitlesText(interaction.guild, p);

      // меню выбора ролей для надеть/снять
      const roles = (p.ownedRoles || []).map((rid) => interaction.guild.roles.cache.get(rid)).filter(Boolean);
      const options = roles.slice(0, 25).map((r) => {
        const has = interaction.member?.roles?.cache?.has(r.id);
        return {
          label: r.name.slice(0, 100),
          value: r.id,
          description: has ? "Equipped (select to remove)" : "Not equipped (select to wear)",
        };
      });

      const { menu } = require("../ui/components");
      const menuRow = options.length
        ? [menu("ui:titles:select", "Equip/Unequip a title…", options)]
        : [];

      return interaction.update({
        embeds: [profileTitlesEmbed(interaction.user, text)],
        components: [profileTabsSelect(), ...menuRow, closeRow()],
      });
    }

    if (tab === "leaderboard") {
      return interaction.update({
        embeds: [profileLeaderboardEmbed("Events", "Use `/leaderboard` command to view top players.")],
        components: [profileTabsSelect(), closeRow()],
      });
    }

    return interaction.update({
      embeds: [profileHomeEmbed(interaction.user)],
      components: [profileTabsSelect(), closeRow()],
    });
  }

  // STORE tabs
  if (interaction.customId === "ui:store:tabs") {
    const tab = interaction.values?.[0];

    if (tab === "event_shop") {
      return interaction.update({
        embeds: [storeEventShopEmbed("Use `/shop` for now (event items).\n(Встроим сюда позже полностью.)")],
        components: [storeTabsSelect(), closeRow()],
      });
    }

    if (tab === "packs") {
      return interaction.update({
        embeds: [storePacksEmbed("Choose a pack below to open.")],
        components: [storeTabsSelect(), packSelect(), closeRow()],
      });
    }

    if (tab === "gear_shop") {
      return interaction.update({
        embeds: [storeGearShopEmbed("Gear Shop будет после списка предметов/цен.")],
        components: [storeTabsSelect(), closeRow()],
      });
    }

    return interaction.update({
      embeds: [storeHomeEmbed(interaction.user)],
      components: [storeTabsSelect(), closeRow()],
    });
  }

  // PACK select (демо-открытие)
  if (interaction.customId === "ui:store:packs") {
    const pack = interaction.values?.[0] || "basic";

    // демо: пока 1 карта
    const demoCard = {
      name: pack === "legendary" ? "Ichigo Kurosaki" : "Ganju Shiba",
      anime: pack === "legendary" ? "bleach" : "bleach",
      rarity: pack === "legendary" ? "Legendary" : "Common",
      role: pack === "legendary" ? "DPS" : "Support",
      level: 1,
      stars: 0,
      hp: pack === "legendary" ? 190 : 90,
      atk: pack === "legendary" ? 60 : 20,
      def: pack === "legendary" ? 28 : 18,
      passive: pack === "legendary" ? "Powerful carry for expeditions." : "Slight luck boost for materials.",
    };

    await interaction.update({
      embeds: [packOpeningEmbed(pack === "legendary" ? "Legendary Pack" : "Basic Pack")],
      components: [closeRow()],
    });

    // через 1.2 сек показываем карту
    setTimeout(() => {
      interaction.message
        .edit({ embeds: [cardRevealEmbed(demoCard)], components: [closeRow()] })
        .catch(() => {});
    }, 1200);

    return;
  }

  // TITLES select equip/unequip
  if (interaction.customId === "ui:titles:select") {
    const roleId = interaction.values?.[0];
    if (!roleId) return;

    const p = await getPlayer(interaction.user.id);
    if (!p.ownedRoles.includes(String(roleId))) {
      return interaction.reply({ content: "❌ This title is not yours.", ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) return interaction.reply({ content: "❌ Can't read your member data.", ephemeral: true });

    const has = member.roles.cache.has(roleId);
    if (has) {
      const res = await tryRemoveRole(interaction.guild, interaction.user.id, roleId);
      if (!res.ok) return interaction.reply({ content: `⚠️ Can't remove role: ${res.reason}`, ephemeral: true });
    } else {
      const res = await tryGiveRole(interaction.guild, interaction.user.id, roleId);
      if (!res.ok) return interaction.reply({ content: `⚠️ Can't assign role: ${res.reason}`, ephemeral: true });
    }

    // перерисуем Titles tab красиво
    const updatedMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => member);

    const text = getTitlesText(interaction.guild, p);
    const roles = (p.ownedRoles || []).map((rid) => interaction.guild.roles.cache.get(rid)).filter(Boolean);
    const options = roles.slice(0, 25).map((r) => {
      const equipped = updatedMember.roles.cache.has(r.id);
      return {
        label: r.name.slice(0, 100),
        value: r.id,
        description: equipped ? "Equipped (select to remove)" : "Not equipped (select to wear)",
      };
    });

    const { menu } = require("../ui/components");
    const menuRow = options.length ? [menu("ui:titles:select", "Equip/Unequip a title…", options)] : [];

    return interaction.update({
      embeds: [profileTitlesEmbed(interaction.user, text)],
      components: [profileTabsSelect(), ...menuRow, closeRow()],
    });
  }
};
