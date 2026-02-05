const { prisma } = require("./prisma");

const EVENT_KEY = "bleach";
const CURRENCY = "reiatsu";

async function ensurePlayer(guildId, userId) {
  return prisma.player.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: {},
    create: { guildId, userId },
  });
}

async function getPlayerState(guildId, userId) {
  await ensurePlayer(guildId, userId);

  const player = await prisma.player.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });

  const balRow = await prisma.balance.upsert({
    where: {
      guildId_userId_eventKey_currency: { guildId, userId, eventKey: EVENT_KEY, currency: CURRENCY },
    },
    update: {},
    create: { guildId, userId, eventKey: EVENT_KEY, currency: CURRENCY, amount: 0 },
  });

  const items = await prisma.item.findMany({
    where: { guildId, userId, eventKey: EVENT_KEY, owned: true },
  });

  const owned = new Set(items.map((i) => i.key));

  return {
    reiatsu: balRow.amount,
    survivalBonus: player?.survivalBonus ?? 0,
    lastDaily: Number(player?.lastDaily ?? 0),
    items: {
      zanpakuto_basic: owned.has("zanpakuto_basic"),
      hollow_mask_fragment: owned.has("hollow_mask_fragment"),
      soul_reaper_cloak: owned.has("soul_reaper_cloak"),
      reiatsu_amplifier: owned.has("reiatsu_amplifier"),
      cosmetic_role: owned.has("cosmetic_role"),
    },
  };
}

async function setLastDaily(guildId, userId, ts) {
  await ensurePlayer(guildId, userId);
  await prisma.player.update({
    where: { guildId_userId: { guildId, userId } },
    data: { lastDaily: BigInt(ts) },
  });
}

async function addSurvivalBonus(guildId, userId, delta, max) {
  await ensurePlayer(guildId, userId);
  const updated = await prisma.player.update({
    where: { guildId_userId: { guildId, userId } },
    data: { survivalBonus: { increment: delta } },
  });

  if (updated.survivalBonus > max) {
    await prisma.player.update({
      where: { guildId_userId: { guildId, userId } },
      data: { survivalBonus: max },
    });
    return max;
  }
  return updated.survivalBonus;
}

async function getReiatsu(guildId, userId) {
  await ensurePlayer(guildId, userId);
  const row = await prisma.balance.upsert({
    where: {
      guildId_userId_eventKey_currency: { guildId, userId, eventKey: EVENT_KEY, currency: CURRENCY },
    },
    update: {},
    create: { guildId, userId, eventKey: EVENT_KEY, currency: CURRENCY, amount: 0 },
  });
  return row.amount;
}

async function addReiatsu(guildId, userId, delta) {
  await ensurePlayer(guildId, userId);
  const row = await prisma.balance.upsert({
    where: {
      guildId_userId_eventKey_currency: { guildId, userId, eventKey: EVENT_KEY, currency: CURRENCY },
    },
    update: { amount: { increment: delta } },
    create: { guildId, userId, eventKey: EVENT_KEY, currency: CURRENCY, amount: delta },
  });
  return row.amount;
}

async function spendReiatsu(guildId, userId, cost) {
  await ensurePlayer(guildId, userId);
  const row = await prisma.balance.upsert({
    where: {
      guildId_userId_eventKey_currency: { guildId, userId, eventKey: EVENT_KEY, currency: CURRENCY },
    },
    update: {},
    create: { guildId, userId, eventKey: EVENT_KEY, currency: CURRENCY, amount: 0 },
  });

  if (row.amount < cost) return { ok: false, have: row.amount };

  const updated = await prisma.balance.update({
    where: { id: row.id },
    data: { amount: { decrement: cost } },
  });

  return { ok: true, have: updated.amount };
}

async function hasItem(guildId, userId, key) {
  const item = await prisma.item.findUnique({
    where: { guildId_userId_eventKey_key: { guildId, userId, eventKey: EVENT_KEY, key } },
  });
  return !!item?.owned;
}

async function giveItem(guildId, userId, key) {
  await ensurePlayer(guildId, userId);
  return prisma.item.upsert({
    where: { guildId_userId_eventKey_key: { guildId, userId, eventKey: EVENT_KEY, key } },
    update: { owned: true },
    create: { guildId, userId, eventKey: EVENT_KEY, key, owned: true },
  });
}

async function topLeaderboard(guildId, limit = 10) {
  const rows = await prisma.balance.findMany({
    where: { guildId, eventKey: EVENT_KEY, currency: CURRENCY },
    orderBy: { amount: "desc" },
    take: limit,
  });
  return rows.map((r) => ({ userId: r.userId, reiatsu: r.amount }));
}

module.exports = {
  getPlayerState,
  getReiatsu,
  addReiatsu,
  spendReiatsu,
  setLastDaily,
  addSurvivalBonus,
  hasItem,
  giveItem,
  topLeaderboard,
};
