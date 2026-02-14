const { mutate, getUser } = require('../core/db');

module.exports = async function selectMenus(interaction, client) {
  const id = interaction.customId;

  if (id === 'titles:select') {
    const selected = interaction.values?.[0];
    const guild = interaction.guild;

    const result = mutate((db) => {
      const u = getUser(db, interaction.user.id);
      if (selected === 'none') {
        u.titles.equippedRoleId = null;
        return { ok: true, equipped: null, owned: u.titles.ownedRoleIds };
      }
      if (!u.titles.ownedRoleIds.includes(selected)) {
        return { ok: false, reason: 'You do not own this title.' };
      }
      u.titles.equippedRoleId = selected;
      return { ok: true, equipped: selected, owned: u.titles.ownedRoleIds };
    });

    if (!result.ok) {
      await interaction.reply({ content: `❌ ${result.reason}`, ephemeral: true });
      return;
    }

    // Apply role to member
    const member = interaction.member;
    if (member && member.roles) {
      // remove previously equipped roles that are owned by the user
      const owned = result.owned;
      for (const rid of owned) {
        if (member.roles.cache.has(rid)) {
          await member.roles.remove(rid).catch(() => {});
        }
      }
      if (result.equipped) {
        await member.roles.add(result.equipped).catch(() => {});
      }
    }

    await interaction.reply({
      content: result.equipped
        ? `✅ Equipped title: **${guild.roles.cache.get(result.equipped)?.name || result.equipped}**`
        : '✅ Title removed.',
      ephemeral: true,
    });

    return;
  }
};
