const {
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const cfg = require('../config');
const { mutate, getUser } = require('../core/db');
const { BOSSES, makeBossEmbed } = require('../core/bosses');
const { walletEmbed, cardsEmbed, gearsEmbed, titlesEmbed, storeEmbed, cardRevealEmbed } = require('../ui/embeds');
const { profileNavRow, storeNavRow, bossRow, mobRow, titlesSelect } = require('../ui/components');
const { drawCard } = require('../core/cards');

function isEventStaff(member) {
  if (!member) return false;
  return cfg.EVENT_ROLE_IDS.some((rid) => member.roles.cache.has(rid)) || member.permissions.has(PermissionsBitField.Flags.Administrator);
}

function bestRarityForAnime(cards, anime) {
  const order = ['Common', 'Rare', 'Legendary', 'Mythic'];
  let best = 'Common';
  for (const c of cards) {
    if (c.anime !== anime) continue;
    if (order.indexOf(c.rarity) > order.indexOf(best)) best = c.rarity;
  }
  return best;
}

function survivalChanceByRarity(rarity) {
  switch (rarity) {
    case 'Rare':
      return 0.8;
    case 'Legendary':
      return 0.9;
    case 'Mythic':
      return 0.95;
    default:
      return 0.7;
  }
}

module.exports = async function buttons(interaction, client) {
  const id = interaction.customId;

  /* ================== GLOBAL CLOSE ================== */
  if (id === 'ui:close') {
    // If ephemeral, just update; otherwise delete message if allowed.
    if (interaction.message?.deletable) {
      await interaction.message.delete().catch(() => {});
      return;
    }
    await interaction.update({ content: 'Closed.', embeds: [], components: [] }).catch(() => {});
    return;
  }

  /* ================== PROFILE NAV ================== */
  if (id.startsWith('profile:')) {
    const view = id.split(':')[1];
    const targetId = interaction.message?.interaction?.user?.id || interaction.user.id;
    const guild = interaction.guild;

    const payload = mutate((db) => {
      const u = getUser(db, targetId);
      return {
        wallet: u.wallet,
        cards: u.cards,
        gears: u.gears,
        titles: u.titles,
      };
    });

    const userTag = guild?.members.cache.get(targetId)?.user?.tag || interaction.user.tag;

    let embed;
    if (view === 'wallet') embed = walletEmbed(userTag, payload.wallet);
    else if (view === 'cards') embed = cardsEmbed(userTag, payload.cards);
    else if (view === 'gears') embed = gearsEmbed(userTag, payload.gears);
    else if (view === 'titles') embed = titlesEmbed(userTag, payload.titles, guild);
    else embed = walletEmbed(userTag, payload.wallet);

    const components = [profileNavRow(view)];
    if (view === 'titles') components.unshift(titlesSelect(payload.titles.ownedRoleIds, payload.titles.equippedRoleId));

    await interaction.update({ embeds: [embed], components });
    return;
  }

  /* ================== STORE NAV ================== */
  if (id.startsWith('store:')) {
    const tab = id.split(':')[1];

    // store message keeps meta in embed footer text via hidden in message content JSON
    // We'll store it in message content as: "STORE_CTX:{event}:{userId}"
    const content = interaction.message?.content || '';
    const m = content.match(/^STORE_CTX:(bleach|jjk):(\d+)/);
    const event = m?.[1] || 'bleach';
    const ownerId = m?.[2] || interaction.user.id;

    if (interaction.user.id !== ownerId) {
      await interaction.reply({ content: 'This menu is not yours.', ephemeral: true });
      return;
    }

    const payload = mutate((db) => {
      const u = getUser(db, ownerId);
      return { wallet: u.wallet };
    });

    await interaction.update({
      content: `STORE_CTX:${event}:${ownerId}`,
      embeds: [storeEmbed(tab, event, payload.wallet)],
      components: [storeNavRow(tab), storeActionsRow(tab, event)],
    });
    return;
  }

  /* ================== STORE ACTIONS ================== */
  if (id.startsWith('buy:')) {
    const parts = id.split(':');
    const type = parts[1];

    const content = interaction.message?.content || '';
    const m = content.match(/^STORE_CTX:(bleach|jjk):(\d+)/);
    const event = m?.[1] || 'bleach';
    const ownerId = m?.[2] || interaction.user.id;

    if (interaction.user.id !== ownerId) {
      await interaction.reply({ content: 'This menu is not yours.', ephemeral: true });
      return;
    }

    if (type === 'basicpack' || type === 'legendarypack') {
      const packType = type === 'basicpack' ? 'Basic' : 'Legendary';
      const price = packType === 'Basic' ? 120 : 450;

      const result = mutate((db) => {
        const u = getUser(db, ownerId);
        const key = event === 'bleach' ? 'reiatsu' : 'cursed_energy';
        if (u.wallet[key] < price) return { ok: false, reason: 'Not enough currency.' };
        u.wallet[key] -= price;
        const card = drawCard({ anime: event, packType });
        u.cards.push({
          id: card.id,
          anime: card.anime,
          rarity: card.rarity,
          role: card.role,
          level: 1,
          xp: 0,
          stars: 0,
          evolution: card.rarity,
          hp: card.hp,
          atk: card.atk,
          def: card.def,
          status: 'idle',
          passive: card.passive,
          art: card.art,
          createdAt: Date.now(),
        });
        return { ok: true, card, key, price, wallet: u.wallet };
      });

      if (!result.ok) {
        await interaction.reply({ content: `❌ ${result.reason}`, ephemeral: true });
        return;
      }

      // Reveal animation: just a short defer + edit
      await interaction.deferReply({ ephemeral: true });
      await new Promise((r) => setTimeout(r, 700));
      await interaction.editReply({ embeds: [cardRevealEmbed(interaction.user.tag, result.card)] });

      // Update store embed balances
      const tab = 'packs';
      await interaction.message.edit({
        content: `STORE_CTX:${event}:${ownerId}`,
        embeds: [storeEmbed(tab, event, result.wallet)],
        components: [storeNavRow(tab), storeActionsRow(tab, event)],
      }).catch(() => {});

      return;
    }

    if (type === 'cosmeticrole') {
      const roleId = cfg.SHOP_COSMETIC_ROLE_ID;
      const price = 300;

      const r = interaction.guild.roles.cache.get(roleId);
      if (!r) {
        await interaction.reply({ content: '❌ Role not found. Check SHOP_COSMETIC_ROLE_ID.', ephemeral: true });
        return;
      }

      const result = mutate((db) => {
        const u = getUser(db, ownerId);
        const key = event === 'bleach' ? 'reiatsu' : 'cursed_energy';
        if (u.wallet[key] < price) return { ok: false, reason: 'Not enough currency.' };
        u.wallet[key] -= price;
        if (!u.titles.ownedRoleIds.includes(roleId)) u.titles.ownedRoleIds.push(roleId);
        return { ok: true, wallet: u.wallet };
      });

      if (!result.ok) {
        await interaction.reply({ content: `❌ ${result.reason}`, ephemeral: true });
        return;
      }

      await interaction.reply({ content: `✅ Bought title: **${r.name}**. Equip it in **/profile → Titles**.`, ephemeral: true });

      const tab = 'event';
      await interaction.message.edit({
        content: `STORE_CTX:${event}:${ownerId}`,
        embeds: [storeEmbed(tab, event, result.wallet)],
        components: [storeNavRow(tab), storeActionsRow(tab, event)],
      }).catch(() => {});

      return;
    }
  }

  /* ================== BOSS EVENTS ================== */
  if (id.startsWith('boss:')) {
    const action = id.split(':')[1];
    const state = client.state.bosses.get(interaction.message.id);

    if (!state) {
      await interaction.reply({ content: '❌ Boss state not found (message restarted). Spawn again.', ephemeral: true });
      return;
    }

    const boss = BOSSES[state.bossId];

    if (action === 'join') {
      if (!state.players.has(interaction.user.id)) {
        state.players.set(interaction.user.id, { hits: 0, eliminated: false });
      }
      await interaction.reply({ content: '✅ Joined the boss fight.', ephemeral: true });
      await refreshBossMessage(interaction, client, state);
      return;
    }

    if (action === 'hit') {
      if (!state.players.has(interaction.user.id)) {
        await interaction.reply({ content: '❌ You must **Join** first.', ephemeral: true });
        return;
      }

      const p = state.players.get(interaction.user.id);
      if (p.eliminated) {
        await interaction.reply({ content: '☠ You are eliminated.', ephemeral: true });
        return;
      }

      if (p.hits >= cfg.MAX_HITS) {
        await interaction.reply({ content: `❌ Hit limit reached (max ${cfg.MAX_HITS} per round).`, ephemeral: true });
        return;
      }

      const result = mutate((db) => {
        const u = getUser(db, interaction.user.id);
        const rarity = bestRarityForAnime(u.cards, boss.anime);
        const survive = Math.random() < survivalChanceByRarity(rarity);

        // Reward only if survived this hit
        if (survive) {
          if (boss.anime === 'bleach') {
            u.wallet.reiatsu += boss.rewards.reiatsu || 0;
            u.wallet.bleach_shards += boss.rewards.bleach_shards || 0;
          } else {
            u.wallet.cursed_energy += boss.rewards.cursed_energy || 0;
            u.wallet.cursed_shards += boss.rewards.cursed_shards || 0;
          }
          u.wallet.drako += boss.rewards.drako || 0;
        }

        return { survive, rarity };
      });

      p.hits += 1;
      if (!result.survive) {
        p.eliminated = true;
        state.eliminated.add(interaction.user.id);
      }

      await interaction.reply({
        content: result.survive
          ? `✅ Hit success! (Your best ${boss.anime.toUpperCase()} rarity: **${result.rarity}**)`
          : `☠ You got hit and got eliminated! (Best rarity: **${result.rarity}**)`,
        ephemeral: true,
      });

      await refreshBossMessage(interaction, client, state);
      return;
    }

    if (action === 'next') {
      if (!isEventStaff(interaction.member)) {
        await interaction.reply({ content: '❌ Staff only.', ephemeral: true });
        return;
      }
      if (state.round >= state.maxRounds) {
        await interaction.reply({ content: '❌ Boss is already at final round.', ephemeral: true });
        return;
      }
      state.round += 1;
      for (const p of state.players.values()) p.hits = 0;
      await interaction.deferUpdate();
      await refreshBossMessage(interaction, client, state);
      return;
    }

    if (action === 'end') {
      if (!isEventStaff(interaction.member)) {
        await interaction.reply({ content: '❌ Staff only.', ephemeral: true });
        return;
      }
      client.state.bosses.delete(interaction.message.id);
      await interaction.update({
        embeds: [
          {
            color: cfg.COLOR,
            title: `✅ Boss ended — ${boss.label}`,
            description: `Thanks for playing. Use /spawnboss to spawn a new one.`,
          },
        ],
        components: [],
      });
      return;
    }
  }

  /* ================== MOB EVENTS ================== */
  if (id.startsWith('mob:')) {
    const action = id.split(':')[1];
    const state = client.state.mobs.get(interaction.message.id);

    if (!state) {
      await interaction.reply({ content: '❌ Mob state not found. Spawn again.', ephemeral: true });
      return;
    }

    if (action === 'hit') {
      const now = Date.now();
      if (now > state.endsAt) {
        await interaction.reply({ content: '❌ Mob expired.', ephemeral: true });
        return;
      }

      const hitChance = 0.72;
      const hit = Math.random() < hitChance;

      const res = mutate((db) => {
        const u = getUser(db, interaction.user.id);
        const isBleach = state.event === 'bleach';
        const key = isBleach ? 'reiatsu' : 'cursed_energy';

        // Kill bonuses based on total kills
        if (hit) {
          if (isBleach) {
            u.wallet.reiatsu += cfg.BLEACH_MOB_HIT;
            u.stats.mobs_bleach_kills += 1;
            const bonus = Math.min(cfg.BLEACH_BONUS_MAX, u.stats.mobs_bleach_kills * cfg.BLEACH_BONUS_PER_KILL);
            u.wallet.reiatsu += bonus;
            return { ok: true, hit: true, earned: cfg.BLEACH_MOB_HIT + bonus, key };
          }
          u.wallet.cursed_energy += cfg.JJK_MOB_HIT;
          u.stats.mobs_jjk_kills += 1;
          const bonus = Math.min(cfg.JJK_BONUS_MAX, u.stats.mobs_jjk_kills * cfg.JJK_BONUS_PER_KILL);
          u.wallet.cursed_energy += bonus;
          return { ok: true, hit: true, earned: cfg.JJK_MOB_HIT + bonus, key };
        }

        // Miss gives small reward
        if (isBleach) {
          u.wallet.reiatsu += cfg.BLEACH_MOB_MISS;
          return { ok: true, hit: false, earned: cfg.BLEACH_MOB_MISS, key };
        }
        u.wallet.cursed_energy += cfg.JJK_MOB_MISS;
        return { ok: true, hit: false, earned: cfg.JJK_MOB_MISS, key };
      });

      await interaction.reply({
        content: res.hit ? `✅ Hit! +${res.earned}` : `➖ Miss, but you still get +${res.earned}`,
        ephemeral: true,
      });

      return;
    }

    if (action === 'end') {
      if (!isEventStaff(interaction.member)) {
        await interaction.reply({ content: '❌ Staff only.', ephemeral: true });
        return;
      }
      client.state.mobs.delete(interaction.message.id);
      await interaction.update({ content: '✅ Mob ended.', embeds: [], components: [] });
      return;
    }
  }
};

function storeActionsRow(tab, event) {
  const row = new ActionRowBuilder();

  if (tab === 'packs') {
    row.addComponents(
      new ButtonBuilder().setCustomId('buy:basicpack').setLabel('Buy Basic Pack (120)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('buy:legendarypack').setLabel('Buy Legendary Pack (450)').setStyle(ButtonStyle.Success)
    );
    return row;
  }

  if (tab === 'event') {
    row.addComponents(
      new ButtonBuilder().setCustomId('buy:cosmeticrole').setLabel('Buy Cosmetic Title (300)').setStyle(ButtonStyle.Success)
    );
    return row;
  }

  // gear placeholder
  row.addComponents(
    new ButtonBuilder().setCustomId('buy:gear_placeholder').setLabel('Coming soon').setStyle(ButtonStyle.Secondary).setDisabled(true)
  );
  return row;
}

async function refreshBossMessage(interaction, client, state) {
  const alive = [...state.players.values()].filter((p) => !p.eliminated).length;
  const eliminated = [...state.players.values()].filter((p) => p.eliminated).length;

  const stateText = `**HP:** ${Math.max(0, 100 - Math.floor(((state.round - 1) / state.maxRounds) * 100))}%`;

  const embed = makeBossEmbed({
    bossId: state.bossId,
    round: state.round,
    maxRounds: state.maxRounds,
    aliveCount: alive,
    eliminatedCount: eliminated,
    stateText,
  });

  const canNext = isEventStaff(interaction.member);
  const canEnd = isEventStaff(interaction.member);

  await interaction.message.edit({
    embeds: [embed],
    components: [bossRow({ canJoin: true, canHit: true, canNext, canEnd }), new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ui:close').setLabel('Close').setStyle(ButtonStyle.Secondary)
    )],
  }).catch(() => {});
}
