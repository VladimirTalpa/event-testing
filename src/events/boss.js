
const { PermissionsBitField, EmbedBuilder, AttachmentBuilder } = require("discord.js");

const {
  BLEACH_CHANNEL_ID,
  JJK_CHANNEL_ID,
  ROUND_COOLDOWN_MS,
  MAX_HITS,
  PING_BOSS_ROLE_ID,
} = require("../config");

const { bossByChannel } = require("../core/state");
const { clamp, safeName, sleep } = require("../core/utils");
const { getPlayer, setPlayer } = require("../core/players");
const { BOSSES } = require("../data/bosses");
const { bossButtons, singleActionRow, comboDefenseRows, dualChoiceRow, triChoiceRow } = require("../ui/components");
const { buildBossIntroImage, buildBossResultImage } = require("../ui/boss-card");
const {
  bossSpawnEmbed,
  bossRoundEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
  calcBleachSurvivalBonus,
  calcBleachReiatsuMultiplier,
  calcBleachDropLuckMultiplier,
  calcJjkSurvivalBonus,
  calcJjkCEMultiplier,
  calcJjkDropLuckMultiplier,
} = require("../ui/embeds");

/* ===================== ROLE ADD/REMOVE ===================== */
async function tryGiveRole(guild, userId, roleId) {
  try {
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return { ok: false, reason: "Bot lacks Manage Roles permission." };
    }
    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: "Role not found." };
    const botTop = botMember.roles.highest?.position ?? 0;
    if (botTop <= role.position) return { ok: false, reason: "Bot role is below target role (hierarchy)." };
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Discord rejected role add (permissions/hierarchy)." };
  }
}

function ensureOwnedRole(player, roleId) {
  if (!roleId) return;
  const id = String(roleId);
  if (!player.ownedRoles.includes(id)) player.ownedRoles.push(id);
}

function isAllowedSpawnChannel(eventKey, channelId) {
  if (eventKey === "bleach") return channelId === BLEACH_CHANNEL_ID;
  if (eventKey === "jjk") return channelId === JJK_CHANNEL_ID;
  return false;
}

function getMaxHits(def) {
  return def.maxHits ?? MAX_HITS;
}

function computeSurviveChance(eventKey, player, baseChance, bonusMaxBleach, bonusMaxJjk) {
  if (eventKey === "bleach") {
    const itemBonus = calcBleachSurvivalBonus(player.bleach.items);
    const perm = clamp(player.bleach.survivalBonus, 0, bonusMaxBleach);
    return Math.min(0.95, baseChance + (itemBonus + perm) / 100);
  }
  const itemBonus = calcJjkSurvivalBonus(player.jjk.items);
  const perm = clamp(player.jjk.survivalBonus, 0, bonusMaxJjk);
  return Math.min(0.95, baseChance + (itemBonus + perm) / 100);
}

function getEventMultiplier(eventKey, player) {
  if (eventKey === "bleach") return calcBleachReiatsuMultiplier(player.bleach.items);
  return calcJjkCEMultiplier(player.jjk.items);
}
function getEventDropMult(eventKey, player) {
  if (eventKey === "bleach") return calcBleachDropLuckMultiplier(player.bleach.items);
  return calcJjkDropLuckMultiplier(player.jjk.items);
}

function aliveIds(boss) {
  const maxHits = getMaxHits(boss.def);
  return [...boss.participants.entries()]
    .filter(([, st]) => st.hits < maxHits)
    .map(([uid]) => uid);
}

async function applyHit(uid, boss, channel, reasonText) {
  const maxHits = getMaxHits(boss.def);
  const st = boss.participants.get(uid);
  if (!st) return;
  st.hits++;
  const name = safeName(st.displayName);
  await channel.send(`ðŸ’¥ **${name}** ${reasonText} (**${st.hits}/${maxHits}**)`).catch(() => {});
  if (st.hits >= maxHits) await channel.send(`â˜ ï¸ **${name}** was eliminated.`).catch(() => {});
}

function eliminate(uid, boss) {
  const st = boss.participants.get(uid);
  if (!st) return;
  st.hits = getMaxHits(boss.def);
}

function bankSuccess(uid, boss, amount) {
  const add = Math.max(0, Math.floor(amount || 0));
  boss.hitBank.set(uid, (boss.hitBank.get(uid) || 0) + add);

  if (!boss.damageByUser) boss.damageByUser = new Map();
  boss.damageByUser.set(uid, (boss.damageByUser.get(uid) || 0) + add);

  if (!Number.isFinite(boss.currentHp)) boss.currentHp = 0;
  boss.currentHp = Math.max(0, boss.currentHp - add);
}

function randomComboSeq() {
  const colors = ["red", "blue", "green", "yellow"];
  const seq = [];
  for (let i = 0; i < 4; i++) seq.push(colors[Math.floor(Math.random() * colors.length)]);
  return seq;
}
function comboToEmoji(c) {
  if (c === "red") return "ðŸ”´";
  if (c === "blue") return "ðŸ”µ";
  if (c === "green") return "ðŸŸ¢";
  return "ðŸŸ¡";
}

function randInt(a, b) {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.floor(min + Math.random() * (max - min + 1));
}

function getInitialBossHp(def, fighters) {
  if (Number.isFinite(def.bossHp) && def.bossHp > 0) return Math.floor(def.bossHp);

  const rounds = Array.isArray(def.rounds) ? def.rounds.length : 1;
  const avgWin = def.winRewardRange
    ? Math.floor((def.winRewardRange.min + def.winRewardRange.max) / 2)
    : (def.winReward || 200);
  const fighterFactor = Math.max(1, fighters) * (def.event === "jjk" ? 380 : 300);

  return Math.max(1200, avgWin * 2 + rounds * 160 + fighterFactor);
}

function getHpPercent(boss) {
  if (!Number.isFinite(boss.totalHp) || boss.totalHp <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((boss.currentHp / boss.totalHp) * 100)));
}

function getTopDamageRows(boss, limit = 8) {
  const rows = [...(boss.damageByUser?.entries() || [])]
    .map(([uid, dmg]) => ({
      uid,
      dmg: Math.max(0, Math.floor(dmg || 0)),
      name: safeName(boss.participants.get(uid)?.displayName || uid),
    }))
    .sort((a, b) => b.dmg - a.dmg);

  return rows.slice(0, limit);
}

function hpBarText(pct, width = 20) {
  const p = Math.max(0, Math.min(100, pct));
  const fill = Math.round((p / 100) * width);
  return `${"#".repeat(fill)}${"-".repeat(Math.max(0, width - fill))}`;
}

function buildRaidHudEmbed(boss, phaseLabel, nextRoundSeconds = 0) {
  const top = getTopDamageRows(boss, 5);
  const topText = top.length
    ? top.map((r, i) => `${i + 1}. ${r.name}: ${r.dmg}`).join("\n")
    : "No damage yet.";

  const hpPct = getHpPercent(boss);
  const alive = aliveIds(boss).length;
  const hpLeft = Math.max(0, Math.floor(boss.currentHp || 0));
  const rounds = Array.isArray(boss.def?.rounds) ? boss.def.rounds.length : 0;
  const roundNo = Math.min(rounds, Math.max(1, Number(boss.roundNo || 1)));
  const etaText = nextRoundSeconds > 0 ? `\nNext mechanic in: **${nextRoundSeconds}s**` : "";

  return new EmbedBuilder()
    .setColor(boss.def.event === "bleach" ? 0xff7b1c : 0xdc2626)
    .setTitle(`${boss.def.name} - LIVE RAID HUD`)
    .setDescription(
      `Phase: **${phaseLabel}**\n` +
      `Round: **${roundNo}/${rounds}**\n` +
      `HP: **${hpLeft}/${boss.totalHp} (${hpPct}%)**\n` +
      `\`${hpBarText(hpPct)}\`${etaText}`
    )
    .addFields(
      { name: "Alive", value: `\`${alive}\``, inline: true },
      { name: "Joined", value: `\`${boss.participants.size}\``, inline: true },
      { name: "Top Damage", value: topText, inline: false }
    );
}

async function upsertRaidHudMessage(channel, boss, phaseLabel, nextRoundSeconds = 0) {
  const embed = buildRaidHudEmbed(boss, phaseLabel, nextRoundSeconds);
  if (!boss.hudMessageId) {
    const msg = await channel.send({ embeds: [embed] }).catch(() => null);
    if (msg?.id) boss.hudMessageId = msg.id;
    return;
  }
  const msg = await channel.messages.fetch(boss.hudMessageId).catch(() => null);
  if (!msg) {
    const resend = await channel.send({ embeds: [embed] }).catch(() => null);
    if (resend?.id) boss.hudMessageId = resend.id;
    return;
  }
  await msg.edit({ embeds: [embed] }).catch(() => {});
}

async function sendBossResultCard(channel, boss, victory, survivorsCount = 0) {
  const topDamage = getTopDamageRows(boss, 8);
  const png = await buildBossResultImage(boss.def, {
    victory,
    topDamage,
    hpLeft: Math.max(0, Math.floor(boss.currentHp || 0)),
    hpTotal: Math.max(1, Math.floor(boss.totalHp || 1)),
    survivors: survivorsCount,
    joined: boss.participants.size,
  }).catch(() => null);

  if (!png) return;
  const file = new AttachmentBuilder(png, { name: `boss-result-${boss.def.id}.png` });
  await channel.send({ files: [file] }).catch(() => {});
}

async function sendBossIntroSequence(channel, def) {
  await channel.send("`[ANOMALY]` Dimensional signature detected...").catch(() => {});
  await sleep(1200);
  await channel.send("`[SYSTEM]` Raid gateway stabilizing...").catch(() => {});
  await sleep(1200);
  const intro = await buildBossIntroImage(def, { joinMs: def.joinMs }).catch(() => null);
  if (intro) {
    const file = new AttachmentBuilder(intro, { name: `boss-intro-${def.id}.png` });
    await channel.send({ files: [file] }).catch(() => {});
  }
}

async function updateBossSpawnMessage(channel, boss) {
  const fighters = [...boss.participants.values()];
  const fightersText = fighters.length
    ? fighters.map((p) => safeName(p.displayName)).join(", ").slice(0, 1000)
    : "`No fighters yet`";

  const msg = await channel.messages.fetch(boss.messageId).catch(() => null);
  if (!msg) return;

  await msg.edit({
    embeds: [bossSpawnEmbed(boss.def, channel.name, fighters.length, fightersText)],
    components: bossButtons(!boss.joining),
  }).catch(() => {});
}

async function runBoss(channel, boss, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  try {
    boss.joining = false;
    await updateBossSpawnMessage(channel, boss);

    let alive = aliveIds(boss);
    if (!alive.length) {
      await channel.send(`ðŸ’¨ Nobody joined. **${boss.def.name}** vanished.`).catch(() => {});
      return;
    }

    if (!Number.isFinite(boss.totalHp) || boss.totalHp <= 0) {
      boss.totalHp = getInitialBossHp(boss.def, alive.length);
    }
    if (!Number.isFinite(boss.currentHp) || boss.currentHp <= 0) {
      boss.currentHp = boss.totalHp;
    }
    if (!boss.damageByUser) boss.damageByUser = new Map();

    boss.roundNo = 1;
    await upsertRaidHudMessage(channel, boss, "Fight Start");

    for (let i = 0; i < boss.def.rounds.length; i++) {
      alive = aliveIds(boss);
      if (!alive.length) break;

      const r = boss.def.rounds[i];
      boss.roundNo = i + 1;

    
      if (r.type !== "final_quiz") {
        await channel.send({ embeds: [bossRoundEmbed(boss.def, i, alive.length)] }).catch(() => {});
      } else {
        await channel.send(`â“ **${r.title}**\n${r.intro}`).catch(() => {});
      }

     
      if (r.type === "pressure" || r.type === "attack") {
        for (const uid of alive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.def.event, player, boss.def.baseChance, bonusMaxBleach, bonusMaxJjk);
          const ok = Math.random() < chance;

          if (!ok) {
            await applyHit(uid, boss, channel, `couldn't withstand **${boss.def.name}**!`);
          } else {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);

            const nm = safeName(boss.participants.get(uid)?.displayName);
            await channel.send(`âœ… **${nm}** succeeded! (+ ${add} banked)`).catch(() => {});
          }
          await sleep(250);
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
          await channel.send(`â³ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

    
      if (r.type === "coop_block") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "coop",
          pressed: new Set(),
          requiredPresses: r.requiredPresses || 4,
        };

        const customId = `boss_action:${boss.def.id}:${i}:${token}:press:block`;
        const msg = await channel.send({
          content:
            `ðŸ›¡ï¸ **COOP BLOCK WINDOW: ${Math.round((r.windowMs || 5000) / 1000)}s**\n` +
            `Requirement: **${boss.activeAction.requiredPresses} different players** must press **Block**.`,
          components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "ðŸ›¡ï¸", false),
        }).catch(() => null);

        await sleep(r.windowMs || 5000);

        if (msg?.id) await msg.edit({ components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "ðŸ›¡ï¸", true) }).catch(() => {});

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        const req = boss.activeAction?.requiredPresses || 4;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        const success = pressed.size >= req;

        if (!success) {
          await channel.send(`âŒ Not enough blocks (${pressed.size}/${req}). Everyone takes a hit!`).catch(() => {});
          for (const uid of nowAlive) {
            await applyHit(uid, boss, channel, `failed to block in time!`);
            await sleep(140);
          }
        } else {
          await channel.send(`âœ… Block succeeded (${pressed.size}/${req}). Pressers counterattacked!`).catch(() => {});
          for (const uid of nowAlive) {
            if (pressed.has(uid)) {
              const player = await getPlayer(uid);
              const mult = getEventMultiplier(boss.def.event, player);
              const add = Math.floor(boss.def.hitReward * mult);
              bankSuccess(uid, boss, add);
            }
          }
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
          await channel.send(`â³ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

   
      if (r.type === "quick_block" || r.type === "finisher") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = { token, roundIndex: i, mode: "press", pressed: new Set() };

        const label = r.buttonLabel || (r.type === "finisher" ? "Finisher" : "Block");
        const emoji = r.buttonEmoji || (r.type === "finisher" ? "âš”ï¸" : "ðŸ›¡ï¸");
        const customId = `boss_action:${boss.def.id}:${i}:${token}:press:${r.type}`;

        const msg = await channel.send({
          content: `âš ï¸ **${label.toUpperCase()} WINDOW: ${Math.round((r.windowMs || 5000) / 1000)}s** â€” press **${label}**!`,
          components: singleActionRow(customId, label, emoji, false),
        }).catch(() => null);

        await sleep(r.windowMs || 5000);

        if (msg?.id) await msg.edit({ components: singleActionRow(customId, label, emoji, true) }).catch(() => {});

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);

        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const isJjk = boss.def.event === "jjk";
          const hasReverse = isJjk && player.jjk.items.reverse_talisman;

          if (pressed.has(uid)) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
          } else {
            if (hasReverse && !boss.reverseUsed.has(uid)) {
              boss.reverseUsed.add(uid);
              const nm = safeName(boss.participants.get(uid)?.displayName);
              await channel.send(`âœ¨ **${nm}** was saved by Reverse Technique! (ignored 1 hit)`).catch(() => {});
            } else {
              await applyHit(uid, boss, channel, `was too slow!`);
            }
          }
          await sleep(170);
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
          await channel.send(`â³ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

      
      if (r.type === "combo_defense") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const seq = randomComboSeq();

        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "combo",
          comboSeq: seq,
          comboProgress: new Map(),
          comboFailed: new Set(),
        };

        const seqText = seq.map(comboToEmoji).join(" ");

        const msg = await channel.send({
          content:
            `ðŸŽ® **COMBO DEFENSE (QTE)** â€” You have **${Math.round((r.windowMs || 5000) / 1000)}s**\n` +
            `Press in order: ${seqText}\n` +
            `Mistake or timeout = a hit.`,
          components: comboDefenseRows(token, boss.def.id, i),
        }).catch(() => null);

        await sleep(r.windowMs || 5000);

        if (msg?.id) {
          const disabledRows = comboDefenseRows(token, boss.def.id, i).map((row) => {
            row.components.forEach((b) => b.setDisabled(true));
            return row;
          });
          await msg.edit({ components: disabledRows }).catch(() => {});
        }

        const action = boss.activeAction;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);

        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const isJjk = boss.def.event === "jjk";
          const hasReverse = isJjk && player.jjk.items.reverse_talisman;

          const prog = action?.comboProgress?.get(uid) ?? 0;
          const failed = action?.comboFailed?.has(uid);
          const completed = !failed && prog >= 4;

          if (completed) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
          } else {
            if (hasReverse && !boss.reverseUsed.has(uid)) {
              boss.reverseUsed.add(uid);
              const nm = safeName(boss.participants.get(uid)?.displayName);
              await channel.send(`âœ¨ **${nm}** was saved by Reverse Technique! (ignored 1 hit)`).catch(() => {});
            } else {
              await applyHit(uid, boss, channel, `failed the Combo Defense!`);
            }
          }
          await sleep(170);
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
          await channel.send(`â³ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

 
      if (r.type === "group_final") {
        const nowAlive = aliveIds(boss);
        const required = r.requiredWins || 3;

        let wins = 0;
        const winners = new Set();

        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.def.event, player, boss.def.baseChance, bonusMaxBleach, bonusMaxJjk);
          const ok = Math.random() < chance;
          if (ok) { wins++; winners.add(uid); }
        }

        if (wins < required) {
          await channel.send(`âŒ Not enough successful final hits (${wins}/${required}). **Everyone loses.**`).catch(() => {});
          for (const uid of nowAlive) {
            await applyHit(uid, boss, channel, `was overwhelmed in the final push!`);
            eliminate(uid, boss);
            await sleep(100);
          }
        } else {
          await channel.send(`âœ… Final push succeeded! (${wins}/${required}) Winners dealt the decisive blow.`).catch(() => {});
          for (const uid of nowAlive) {
            if (winners.has(uid)) {
              const player = await getPlayer(uid);
              const mult = getEventMultiplier(boss.def.event, player);
              const add = Math.floor(boss.def.hitReward * mult);
              bankSuccess(uid, boss, add);
            }
          }
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
          await channel.send(`â³ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

      /* ===================== NEW ROUND TYPES (Mahoraga) ===================== */


      if (r.type === "multi_press") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "multi_press",
          counts: new Map(), 
          requiredPresses: r.requiredPresses || 3,
        };

        const customId = `boss_action:${boss.def.id}:${i}:${token}:multi:${r.type}`;

        const msg = await channel.send({
          content: `ðŸ›¡ï¸ **BLOCK x${boss.activeAction.requiredPresses}** â€” you have **${Math.round((r.windowMs || 10000) / 1000)}s**`,
          components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "ðŸ›¡ï¸", false),
        }).catch(() => null);

        await sleep(r.windowMs || 10000);

        if (msg?.id) await msg.edit({ components: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "ðŸ›¡ï¸", true) }).catch(() => {});

        const action = boss.activeAction?.token === token ? boss.activeAction : null;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const cnt = action?.counts?.get(uid) || 0;
          if (cnt >= (action?.requiredPresses || 3)) {
            const player = await getPlayer(uid);
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            await channel.send(`âœ… <@${uid}> Blocked! (pressed ${cnt})`).catch(() => {});
          } else {
            await applyHit(uid, boss, channel, `failed to block enough times! (pressed ${cnt})`);
          }
          await sleep(140);
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
          await channel.send(`â³ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

   
      if (r.type === "choice_qte") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "choice",
          choice: new Map(), 
        };

        const cA = r.choices?.[0];
        const cB = r.choices?.[1];
        const idA = `boss_action:${boss.def.id}:${i}:${token}:choice:${cA.key}`;
        const idB = `boss_action:${boss.def.id}:${i}:${token}:choice:${cB.key}`;

        const msg = await channel.send({
          content: `âš¡ Choose fast â€” **${Math.round((r.windowMs || 3000) / 1000)}s**`,
          components: dualChoiceRow(idA, cA.label, cA.emoji, idB, cB.label, cB.emoji, false),
        }).catch(() => null);

        await sleep(r.windowMs || 3000);

        if (msg?.id) await msg.edit({
          components: dualChoiceRow(idA, cA.label, cA.emoji, idB, cB.label, cB.emoji, true),
        }).catch(() => {});

        const action = boss.activeAction?.token === token ? boss.activeAction : null;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const picked = action?.choice?.get(uid);
          if (picked === r.correct) {
            const player = await getPlayer(uid);
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
          } else {
            await applyHit(uid, boss, channel, `chose wrong!`);
          }
          await sleep(140);
        }

        if (r.afterText || r.afterMedia) {
          const e = new EmbedBuilder().setColor(0x8e44ad).setImage(r.afterMedia || boss.def.spawnMedia);
          await channel.send({ content: r.afterText || "", embeds: [e] }).catch(() => {});
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
          await channel.send(`â³ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

    
      if (r.type === "scripted_hit_all") {
        await sleep(r.delayMs || 5000);

        for (const line of (r.spamLines || [])) {
          await channel.send(line).catch(() => {});
          await sleep(350);
        }

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          await applyHit(uid, boss, channel, `was struck by the adaptation surge!`);
          await sleep(120);
        }

        if (r.endMedia || r.endText) {
          const e = new EmbedBuilder().setColor(0x8e44ad).setImage(r.endMedia || boss.def.spawnMedia);
          await channel.send({ content: r.endText || "", embeds: [e] }).catch(() => {});
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
          await channel.send(`â³ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

     
      if (r.type === "tri_press") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "tri_press",
          pressed: new Map(),
          requiredKeys: (r.buttons || []).map((b) => b.key),
        };

        const btns = (r.buttons || []).map((b) => ({
          customId: `boss_action:${boss.def.id}:${i}:${token}:tri:${b.key}`,
          label: b.label,
          emoji: b.emoji,
        }));

        const msg = await channel.send({
          content: `ðŸ§  Do all 3 â€” **${Math.round((r.windowMs || 12000) / 1000)}s**`,
          components: triChoiceRow(btns, false),
        }).catch(() => null);

        await sleep(r.windowMs || 12000);

        if (msg?.id) await msg.edit({ components: triChoiceRow(btns, true) }).catch(() => {});

        const action = boss.activeAction?.token === token ? boss.activeAction : null;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const set = action?.pressed?.get(uid) || new Set();
          const ok = (action?.requiredKeys || []).every((k) => set.has(k));

          if (ok) {
            const player = await getPlayer(uid);
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
          } else {
            await applyHit(uid, boss, channel, `couldn't regain focus in time!`);
          }
          await sleep(140);
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await channel.send(`â³ Next round in **${Math.round(ROUND_COOLDOWN_MS / 1000)}s**...`).catch(() => {});
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

    
      if (r.type === "final_quiz") {
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        boss.activeAction = {
          token,
          roundIndex: i,
          mode: "quiz",
          choice: new Map(), 
        };

        const btns = (r.choices || []).map((c) => ({
          customId: `boss_action:${boss.def.id}:${i}:${token}:quiz:${c.key}`,
          label: c.label,
          emoji: c.emoji,
        }));

        const msg = await channel.send({
          content: `â³ Answer in **${Math.round((r.windowMs || 8000) / 1000)}s**`,
          components: triChoiceRow(btns, false),
        }).catch(() => null);

        await sleep(r.windowMs || 8000);

        if (msg?.id) await msg.edit({ components: triChoiceRow(btns, true) }).catch(() => {});

        const action = boss.activeAction?.token === token ? boss.activeAction : null;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        for (const uid of nowAlive) {
          const picked = action?.choice?.get(uid);
          if (picked !== r.correct) {
            eliminate(uid, boss);
          } else {
            const player = await getPlayer(uid);
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
          }
          await sleep(120);
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        // no next round after final
        continue;
      }
    }

    const survivors = aliveIds(boss);
    if (!survivors.length) {
      await upsertRaidHudMessage(channel, boss, "Team Wiped");
      await sendBossResultCard(channel, boss, false, 0);
      await channel.send({ embeds: [bossDefeatEmbed(boss.def)] }).catch(() => {});
      return;
    }

    const lines = [];
    for (const uid of survivors) {
      const player = await getPlayer(uid);
      const mult = getEventMultiplier(boss.def.event, player);

     
      const winBase =
        boss.def.winRewardRange
          ? randInt(boss.def.winRewardRange.min, boss.def.winRewardRange.max)
          : boss.def.winReward;

      const win = Math.floor(winBase * mult);
      const hits = boss.hitBank.get(uid) || 0;
      const total = win + hits;

      if (boss.def.event === "bleach") player.bleach.reiatsu += total;
      else player.jjk.cursedEnergy += total;

      // Mahoraga shard drops + expedition key chance
      if (boss.def.event === "jjk" && boss.def.shardDropRange) {
        const shards = randInt(boss.def.shardDropRange.min, boss.def.shardDropRange.max);
        player.jjk.materials.cursedShards += shards;
        lines.push(`ðŸ§© <@${uid}> Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ð» **${shards} Cursed Shards**.`);
      }
      if (boss.def.event === "jjk" && boss.def.expeditionKeyChance) {
        if (Math.random() < boss.def.expeditionKeyChance) {
          player.jjk.materials.expeditionKeys += 1;
          lines.push(`ðŸ—ï¸ <@${uid}> Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ð» **Expedition Key**!`);
        }
      }

      await setPlayer(uid, player);

      lines.push(`â€¢ <@${uid}> +${win} (Win) +${hits} (Bank)`);

      const luckMult = getEventDropMult(boss.def.event, player);
      const baseChance = boss.def.roleDropChance || 0;
      const chance = Math.min(0.25, baseChance * luckMult);

      if (boss.def.roleDropId && Math.random() < chance) {
        ensureOwnedRole(player, boss.def.roleDropId);
        await setPlayer(uid, player);

        const res = await tryGiveRole(channel.guild, uid, boss.def.roleDropId);
        lines.push(
          res.ok
            ? `ðŸŽ­ <@${uid}> obtained a **Boss role**!`
            : `âš ï¸ <@${uid}> won a role but bot couldn't assign: ${res.reason} (saved to wardrobe)`
        );
      }
    }

    await upsertRaidHudMessage(channel, boss, "Raid Clear");
    await sendBossResultCard(channel, boss, true, survivors.length);
    await channel.send({ embeds: [bossVictoryEmbed(boss.def, survivors.length)] }).catch(() => {});
    await channel.send(lines.join("\n").slice(0, 1900)).catch(() => {});
  } catch (e) {
    console.error("runBoss crashed:", e);
    await channel.send("âš ï¸ Boss event crashed. Please report to admin.").catch(() => {});
  } finally {
    bossByChannel.delete(channel.id);
  }
}

async function spawnBoss(channel, bossId, withPing = true) {
  const def = BOSSES[bossId];
  if (!def) return;

  if (!isAllowedSpawnChannel(def.event, channel.id)) {
    await channel.send(`âŒ This boss can only spawn in the correct event channel.`).catch(() => {});
    return;
  }
  if (bossByChannel.has(channel.id)) return;

  if (withPing) await channel.send(`<@&${PING_BOSS_ROLE_ID}>`).catch(() => {});

  await sendBossIntroSequence(channel, def);

  if (def.preText) {
    await channel.send(def.preText).catch(() => {});
    await sleep(def.preTextDelayMs || 10000);

    if (def.teaserMedia) {
      const teaser = new EmbedBuilder().setColor(0x2f3136).setImage(def.teaserMedia);
      await channel.send({ embeds: [teaser] }).catch(() => {});
      await sleep(def.teaserDelayMs || 5000);
    }
  }

  const boss = {
    def,
    messageId: null,
    joining: true,
    participants: new Map(),
    hitBank: new Map(),
    damageByUser: new Map(),
    totalHp: 0,
    currentHp: 0,
    roundNo: 0,
    activeAction: null,
    hudMessageId: null,
    reverseUsed: new Set(),
  };

  const msg = await channel.send({
    embeds: [bossSpawnEmbed(def, channel.name, 0, "`No fighters yet`")],
    components: bossButtons(false),
  });

  boss.messageId = msg.id;
  bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    const still = bossByChannel.get(channel.id);
    if (still && still.messageId === boss.messageId) runBoss(channel, still).catch(() => {});
  }, def.joinMs);
}

module.exports = { spawnBoss, runBoss };



