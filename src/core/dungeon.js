const { v4: uuidv4 } = require("uuid");

const activeDungeons = new Map();

async function spawnDungeon(event, channelId) {
  const dungeonId = uuidv4().slice(0, 8);
  
  const dungeon = {
    id: dungeonId,
    event: event,
    channelId: channelId,
    status: "REGISTRATION", // REGISTRATION -> BATTLE -> COMPLETE
    participants: [], // { userId, userName, selectedCard, cardLevel, damage }
    totalDamage: 0,
    targetDamage: 1000,
    currentRound: 0,
    maxRounds: 5,
    createdAt: Date.now(),
    endsAt: Date.now() + 10 * 60 * 1000, // 10 минут жизни
    messageId: null,
    battleLog: [],
  };

  activeDungeons.set(dungeonId, dungeon);

  // Автоудаление через 10 минут
  setTimeout(() => {
    activeDungeons.delete(dungeonId);
  }, 10 * 60 * 1000);

  return dungeon;
}

function getDungeon(dungeonId) {
  return activeDungeons.get(dungeonId) || null;
}

function addParticipant(dungeonId, userId, userName) {
  const dungeon = activeDungeons.get(dungeonId);
  if (!dungeon) return { ok: false, error: "Dungeon not found" };
  if (dungeon.status !== "REGISTRATION") return { ok: false, error: "Registration closed" };
  
  const exists = dungeon.participants.find(p => p.userId === userId);
  if (exists) return { ok: false, error: "Already joined" };
  
  dungeon.participants.push({
    userId,
    userName,
    selectedCard: null,
    cardLevel: 1,
    cardDmg: 0,
    totalDamage: 0,
    rounds: [],
  });
  
  return { ok: true, dungeon };
}

function selectCard(dungeonId, userId, cardId, cardLevel, cardDmg) {
  const dungeon = activeDungeons.get(dungeonId);
  if (!dungeon) return { ok: false };
  
  const participant = dungeon.participants.find(p => p.userId === userId);
  if (!participant) return { ok: false };
  
  participant.selectedCard = cardId;
  participant.cardLevel = cardLevel;
  participant.cardDmg = cardDmg;
  
  return { ok: true };
}

function startBattle(dungeonId) {
  const dungeon = activeDungeons.get(dungeonId);
  if (!dungeon) return { ok: false };
  
  dungeon.status = "BATTLE";
  dungeon.currentRound = 0;
  
  return { ok: true };
}

function executeBattleRound(dungeonId) {
  const dungeon = activeDungeons.get(dungeonId);
  if (!dungeon || dungeon.status !== "BATTLE") return { ok: false };
  
  dungeon.currentRound++;
  const roundDamages = [];
  let roundTotalDamage = 0;
  
  for (const participant of dungeon.participants) {
    if (!participant.selectedCard) continue;
    
    // Урон с вариацией ±15%
    const variance = 0.85 + Math.random() * 0.3;
    const dmg = Math.floor(participant.cardDmg * variance);
    
    participant.totalDamage += dmg;
    dungeon.totalDamage += dmg;
    roundTotalDamage += dmg;
    
    roundDamages.push({
      userId: participant.userId,
      userName: participant.userName,
      damage: dmg,
      totalDamage: participant.totalDamage,
    });
    
    participant.rounds.push(dmg);
  }
  
  dungeon.battleLog.push({
    round: dungeon.currentRound,
    damages: roundDamages,
    totalRoundDmg: roundTotalDamage,
  });
  
  const completed = dungeon.totalDamage >= dungeon.targetDamage || dungeon.currentRound >= dungeon.maxRounds;
  if (completed) {
    dungeon.status = "COMPLETE";
  }
  
  return {
    ok: true,
    round: dungeon.currentRound,
    roundDamages,
    totalDamage: dungeon.totalDamage,
    targetDamage: dungeon.targetDamage,
    completed,
  };
}

function getDungeonStats(dungeonId) {
  const dungeon = activeDungeons.get(dungeonId);
  if (!dungeon) return null;
  
  const stats = dungeon.participants.map(p => ({
    name: p.userName,
    totalDamage: p.totalDamage,
    cardLevel: p.cardLevel,
    roundCount: p.rounds.length,
    avgDamage: p.rounds.length > 0 
      ? Math.floor(p.rounds.reduce((a, b) => a + b, 0) / p.rounds.length)
      : 0,
  }));
  
  return {
    dungeonId: dungeon.id,
    event: dungeon.event,
    totalDamage: dungeon.totalDamage,
    targetDamage: dungeon.targetDamage,
    status: dungeon.status,
    round: dungeon.currentRound,
    maxRounds: dungeon.maxRounds,
    participants: stats,
  };
}

module.exports = {
  spawnDungeon,
  getDungeon,
  addParticipant,
  selectCard,
  startBattle,
  executeBattleRound,
  getDungeonStats,
  activeDungeons,
};
