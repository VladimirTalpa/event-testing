// src/core/bosses.js

const {
  COLOR,
  E_BLEACH,
  E_JJK,
  E_REIATSU,
  E_CE,
  E_DRAKO,
  MAX_HITS,
  VASTO_DROP_ROLE_ID,
  ULQ_DROP_ROLE_ID,
  GRIMMJOW_DROP_ROLE_ID,
  MAHORAGA_DROP_ROLE_ID,
} = require('../config');

const BOSSES = {
  vasto: {
    id: 'vasto',
    label: 'Vasto Lorde',
    anime: 'bleach',
    emoji: E_BLEACH,
    rounds: 4,
    // Rewards per successful hit
    rewards: { reiatsu: 35, bleach_shards: 2, drako: 0 },
    dropRoleId: VASTO_DROP_ROLE_ID,
  },
  ulquiorra: {
    id: 'ulquiorra',
    label: 'Ulquiorra',
    anime: 'bleach',
    emoji: E_BLEACH,
    rounds: 5,
    rewards: { reiatsu: 45, bleach_shards: 3, drako: 1 },
    dropRoleId: ULQ_DROP_ROLE_ID,
  },
  grimmjow: {
    id: 'grimmjow',
    label: 'Grimmjow',
    anime: 'bleach',
    emoji: E_BLEACH,
    rounds: 5,
    rewards: { reiatsu: 50, bleach_shards: 4, drako: 1 },
    dropRoleId: GRIMMJOW_DROP_ROLE_ID,
  },
  mahoraga: {
    id: 'mahoraga',
    label: 'Mahoraga',
    anime: 'jjk',
    emoji: E_JJK,
    rounds: 5,
    rewards: { cursed_energy: 40, cursed_shards: 3, drako: 1 },
    dropRoleId: MAHORAGA_DROP_ROLE_ID,
  },
  specialgrade: {
    id: 'specialgrade',
    label: 'Special Grade Curse',
    anime: 'jjk',
    emoji: E_JJK,
    rounds: 4,
    rewards: { cursed_energy: 30, cursed_shards: 2, drako: 0 },
    dropRoleId: null,
  },
};

function bossCurrencyField(boss) {
  if (boss.anime === 'bleach') return { key: 'reiatsu', emoji: E_REIATSU };
  return { key: 'cursed_energy', emoji: E_CE };
}

function rewardsToText(boss) {
  const parts = [];
  const c = bossCurrencyField(boss);
  if (boss.rewards[c.key]) parts.push(`${c.emoji} **${boss.rewards[c.key]}**`);
  if (boss.anime === 'bleach' && boss.rewards.bleach_shards) parts.push(`🧩 **${boss.rewards.bleach_shards} Bleach Shards**`);
  if (boss.anime === 'jjk' && boss.rewards.cursed_shards) parts.push(`🧩 **${boss.rewards.cursed_shards} Cursed Shards**`);
  if (boss.rewards.drako) parts.push(`${E_DRAKO} **${boss.rewards.drako}**`);
  return parts.join(' • ');
}

function makeBossEmbed({ bossId, round, maxRounds, aliveCount, eliminatedCount, stateText }) {
  const boss = BOSSES[bossId];
  const title = `${boss.emoji} ${boss.label} — Round ${round}/${maxRounds}`;
  return {
    color: COLOR,
    title,
    description:
      `${stateText}\n\n` +
      `**Rewards (per successful hit):** ${rewardsToText(boss)}\n` +
      `**Limits:** ${MAX_HITS} hits per player per round\n\n` +
      `**Alive:** ${aliveCount} • **Eliminated:** ${eliminatedCount}`,
    footer: { text: 'Boss Event • Use buttons below' },
  };
}

module.exports = {
  BOSSES,
  makeBossEmbed,
};
