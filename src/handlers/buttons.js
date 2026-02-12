  /* ===================== MENU ===================== */
  if (
    cid === CID.MENU_INV ||
    cid === CID.MENU_CARDS ||
    cid === CID.MENU_PACKS ||
    cid === CID.MENU_PROFILE ||
    cid === CID.MENU_LB_DRAKO
  ) {
    const { menuButtons } = require("../ui/components");
    const { inventoryEmbed, shopEmbed, drakoLeaderboardEmbed, menuEmbed, profileEmbed } = require("../ui/embeds");
    const { getTopPlayers, getPlayer } = require("../core/players");

    // cards/packs пока заглушки (ты ещё не внедрил систему карт)
    if (cid === CID.MENU_CARDS) {
      await interaction.followUp({ content: "🃏 Cards system is not added yet.", ephemeral: true }).catch(() => {});
      return;
    }
    if (cid === CID.MENU_PACKS) {
      await interaction.followUp({ content: "🛒 Packs system is not added yet.", ephemeral: true }).catch(() => {});
      return;
    }

    if (cid === CID.MENU_PROFILE) {
      const p = await getPlayer(interaction.user.id);
      await interaction.followUp({
        embeds: [profileEmbed(interaction.user, p)],
        components: menuButtons(false),
        ephemeral: true,
      }).catch(() => {});
      return;
    }

    if (cid === CID.MENU_INV) {
      const p = await getPlayer(interaction.user.id);
      await interaction.followUp({
        content: "Choose: ` /inventory event:bleach ` or ` /inventory event:jjk ` (пока так).",
        ephemeral: true,
      }).catch(() => {});
      return;
    }

    if (cid === CID.MENU_LB_DRAKO) {
      const rows = await getTopPlayers("drako", 10);
      const entries = [];

      for (const r of rows) {
        let name = r.userId;
        try {
          const m = await interaction.guild.members.fetch(r.userId);
          name = safeName(m?.displayName || m?.user?.username || r.userId);
        } catch {}
        entries.push({ name, score: r.score });
      }

      await interaction.followUp({
        embeds: [drakoLeaderboardEmbed(entries)],
        components: menuButtons(false),
        ephemeral: true,
      }).catch(() => {});
      return;
    }
  }
