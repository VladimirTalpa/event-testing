
const {
  PermissionsBitField,
  AttachmentBuilder,
  MessageFlags,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
} = require("discord.js");

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
  if (!st) return { hit: false, eliminated: false, name: "unknown", reasonText };
  st.hits++;
  const eliminated = st.hits >= maxHits;
  return {
    hit: true,
    eliminated,
    name: safeName(st.displayName),
    reasonText,
    hits: st.hits,
    maxHits,
  };
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

function buildBossSpawnV2Payload(boss, channelId) {
  const fighters = [...boss.participants.values()];
  const joined = fighters.length;
  const joinedNames = joined ? fighters.map((p) => safeName(p.displayName)).slice(0, 8).join(", ") : "No fighters yet";
  const reward =
    boss.def.winRewardRange
      ? `${boss.def.winRewardRange.min}-${boss.def.winRewardRange.max}`
      : `${boss.def.winReward}`;
  const maxHits = getMaxHits(boss.def);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${boss.def.icon} ${boss.def.name} RAID`)
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `- Difficulty: **${boss.def.difficulty}**\n` +
        `- Join Window: **${Math.round(boss.def.joinMs / 1000)}s**\n` +
        `- Reward: **${reward}** | +**${boss.def.hitReward}** banked\n` +
        `- Eliminated at: **${maxHits}/${maxHits} hits**\n` +
        `- Channel: <#${channelId}>`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Joined (${joined}):** ${joinedNames}`)
    )
    .addActionRowComponents(...bossButtons(!boss.joining));

  return { flags: MessageFlags.IsComponentsV2, components: [container] };
}

function buildRaidHudV2Payload(boss, phaseLabel, nextRoundSeconds = 0) {
  const top = getTopDamageRows(boss, 5);
  const hpPct = getHpPercent(boss);
  const alive = aliveIds(boss).length;
  const hpLeft = Math.max(0, Math.floor(boss.currentHp || 0));
  const rounds = Array.isArray(boss.def?.rounds) ? boss.def.rounds.length : 0;
  const roundNo = Math.min(rounds, Math.max(1, Number(boss.roundNo || 1)));
  const nextText = nextRoundSeconds > 0 ? `\n- Next in: **${nextRoundSeconds}s**` : "";
  const topText = top.length ? top.map((r, i) => `${i + 1}. ${r.name}: ${r.dmg}`).join("\n") : "No damage yet.";

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${boss.def.name} - LIVE RAID HUD`)
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `- Phase: **${phaseLabel}**\n` +
        `- Round: **${roundNo}/${rounds}**\n` +
        `- HP: **${hpLeft}/${boss.totalHp} (${hpPct}%)**\n` +
        `- Bar: \`${hpBarText(hpPct)}\`\n` +
        `- Alive: **${alive}** | Joined: **${boss.participants.size}**${nextText}`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### Top Damage\n${topText}`)
    );

  return { flags: MessageFlags.IsComponentsV2, components: [container] };
}

async function sendRoundSummaryV2(channel, title, lines) {
  const content = lines.filter(Boolean).join("\n");
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${title}`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content || "No changes."));
  await channel.send({ flags: MessageFlags.IsComponentsV2, components: [container] }).catch(() => {});
}

function buildImagePanelV2Payload({ title, lines = [], imageUrl, actionRows = [] }) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.filter(Boolean).join("\n") || "-"));

  if (imageUrl) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(String(imageUrl))
      )
    );
  }

  if (Array.isArray(actionRows) && actionRows.length) {
    container.addActionRowComponents(...actionRows);
  }

  return { flags: MessageFlags.IsComponentsV2, components: [container] };
}

async function upsertRaidHudMessage(channel, boss, phaseLabel, nextRoundSeconds = 0) {
  const payload = buildRaidHudV2Payload(boss, phaseLabel, nextRoundSeconds);
  if (!boss.hudMessageId) {
    const msg = await channel.send(payload).catch(() => null);
    if (msg?.id) boss.hudMessageId = msg.id;
    return;
  }
  const msg = await channel.messages.fetch(boss.hudMessageId).catch(() => null);
  if (!msg) {
    const resend = await channel.send(payload).catch(() => null);
    if (resend?.id) boss.hudMessageId = resend.id;
    return;
  }
  await msg.edit(payload).catch(() => {});
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
  const msg = await channel.messages.fetch(boss.messageId).catch(() => null);
  if (!msg) return;

  await msg.edit(buildBossSpawnV2Payload(boss, channel.id)).catch(() => {});
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

    
      await channel.send(
        buildImagePanelV2Payload({
          title: `${r.title || `Round ${i + 1}`}`,
          lines: [
            r.intro || "Prepare for the next mechanic.",
            `Alive entering round: **${alive.length}**`,
          ],
          imageUrl: r.media || boss.def.spawnMedia,
        })
      ).catch(() => {});

     
      if (r.type === "pressure" || r.type === "attack") {
        let successCount = 0;
        let failCount = 0;
        let bankedTotal = 0;
        const eliminated = [];
        for (const uid of alive) {
          const player = await getPlayer(uid);
          const chance = computeSurviveChance(boss.def.event, player, boss.def.baseChance, bonusMaxBleach, bonusMaxJjk);
          const ok = Math.random() < chance;

          if (!ok) {
            const hit = await applyHit(uid, boss, channel, `couldn't withstand **${boss.def.name}**!`);
            failCount += 1;
            if (hit?.eliminated) eliminated.push(hit.name);
          } else {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            successCount += 1;
            bankedTotal += add;
          }
          await sleep(250);
        }

        await sendRoundSummaryV2(channel, `${r.title || ("Round " + (i + 1))} - Result`, [
          `Success: **${successCount}**`,
          `Failed: **${failCount}**`,
          `Banked this round: **${bankedTotal}**`,
          eliminated.length ? `Eliminated: ${eliminated.join(", ")}` : "",
        ]);
        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
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
        const msg = await channel.send(
          buildImagePanelV2Payload({
            title: `COOP BLOCK WINDOW ${Math.round((r.windowMs || 5000) / 1000)}s`,
            lines: [
              `Requirement: **${boss.activeAction.requiredPresses}** different players`,
              "Press Block before timer ends.",
            ],
            imageUrl: r.media || boss.def.spawnMedia,
            actionRows: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "ðŸ›¡ï¸", false),
          })
        ).catch(() => null);

        await sleep(r.windowMs || 5000);

        if (msg?.id) {
          await msg.edit(
            buildImagePanelV2Payload({
              title: `COOP BLOCK WINDOW ${Math.round((r.windowMs || 5000) / 1000)}s`,
              lines: [
                `Requirement: **${boss.activeAction.requiredPresses}** different players`,
                "Window closed.",
              ],
              imageUrl: r.media || boss.def.spawnMedia,
              actionRows: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "ðŸ›¡ï¸", true),
            })
          ).catch(() => {});
        }

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        const req = boss.activeAction?.requiredPresses || 4;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        const success = pressed.size >= req;
        let failedCount = 0;
        let successCount = 0;
        let bankedTotal = 0;
        const eliminated = [];

        if (!success) {
          for (const uid of nowAlive) {
            const hit = await applyHit(uid, boss, channel, `failed to block in time!`);
            failedCount += 1;
            if (hit?.eliminated) eliminated.push(hit.name);
            await sleep(140);
          }
        } else {
          for (const uid of nowAlive) {
            if (pressed.has(uid)) {
              const player = await getPlayer(uid);
              const mult = getEventMultiplier(boss.def.event, player);
              const add = Math.floor(boss.def.hitReward * mult);
              bankSuccess(uid, boss, add);
              successCount += 1;
              bankedTotal += add;
            }
          }
        }

        await sendRoundSummaryV2(channel, `${r.title || ("Round " + (i + 1))} - Result`, [
          `Blocks registered: **${pressed.size}/${req}**`,
          `Counter success: **${successCount}**`,
          `Failed: **${failedCount}**`,
          `Banked this round: **${bankedTotal}**`,
          eliminated.length ? `Eliminated: ${eliminated.join(", ")}` : "",
        ]);
        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
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

        const msg = await channel.send(
          buildImagePanelV2Payload({
            title: `${label.toUpperCase()} WINDOW ${Math.round((r.windowMs || 5000) / 1000)}s`,
            lines: [`Press **${label}** before the timer ends.`],
            imageUrl: r.media || boss.def.spawnMedia,
            actionRows: singleActionRow(customId, label, emoji, false),
          })
        ).catch(() => null);

        await sleep(r.windowMs || 5000);

        if (msg?.id) {
          await msg.edit(
            buildImagePanelV2Payload({
              title: `${label.toUpperCase()} WINDOW ${Math.round((r.windowMs || 5000) / 1000)}s`,
              lines: ["Window closed."],
              imageUrl: r.media || boss.def.spawnMedia,
              actionRows: singleActionRow(customId, label, emoji, true),
            })
          ).catch(() => {});
        }

        const pressed = boss.activeAction?.token === token ? boss.activeAction.pressed : new Set();
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        let successCount = 0;
        let failCount = 0;
        let savedByReverse = 0;
        let bankedTotal = 0;
        const eliminated = [];

        for (const uid of nowAlive) {
          const player = await getPlayer(uid);
          const isJjk = boss.def.event === "jjk";
          const hasReverse = isJjk && player.jjk.items.reverse_talisman;

          if (pressed.has(uid)) {
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            successCount += 1;
            bankedTotal += add;
          } else {
            if (hasReverse && !boss.reverseUsed.has(uid)) {
              boss.reverseUsed.add(uid);
              savedByReverse += 1;
            } else {
              const hit = await applyHit(uid, boss, channel, `was too slow!`);
              failCount += 1;
              if (hit?.eliminated) eliminated.push(hit.name);
            }
          }
          await sleep(170);
        }

        await sendRoundSummaryV2(channel, `${r.title || ("Round " + (i + 1))} - Result`, [
          `Success: **${successCount}**`,
          `Failed: **${failCount}**`,
          `Reverse saves: **${savedByReverse}**`,
          `Banked this round: **${bankedTotal}**`,
          eliminated.length ? `Eliminated: ${eliminated.join(", ")}` : "",
        ]);
        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
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

        const msg = await channel.send(
          buildImagePanelV2Payload({
            title: `COMBO DEFENSE ${Math.round((r.windowMs || 5000) / 1000)}s`,
            lines: [
              `Press in order: ${seqText}`,
              "Mistake or timeout = a hit.",
            ],
            imageUrl: r.media || boss.def.spawnMedia,
            actionRows: comboDefenseRows(token, boss.def.id, i),
          })
        ).catch(() => null);

        await sleep(r.windowMs || 5000);

        if (msg?.id) {
          const disabledRows = comboDefenseRows(token, boss.def.id, i).map((row) => {
            row.components.forEach((b) => b.setDisabled(true));
            return row;
          });
          await msg.edit(
            buildImagePanelV2Payload({
              title: `COMBO DEFENSE ${Math.round((r.windowMs || 5000) / 1000)}s`,
              lines: [
                `Press in order: ${seqText}`,
                "Window closed.",
              ],
              imageUrl: r.media || boss.def.spawnMedia,
              actionRows: disabledRows,
            })
          ).catch(() => {});
        }

        const action = boss.activeAction;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        let successCount = 0;
        let failCount = 0;
        let savedByReverse = 0;
        let bankedTotal = 0;
        const eliminated = [];

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
            successCount += 1;
            bankedTotal += add;
          } else {
            if (hasReverse && !boss.reverseUsed.has(uid)) {
              boss.reverseUsed.add(uid);
              savedByReverse += 1;
            } else {
              const hit = await applyHit(uid, boss, channel, `failed the Combo Defense!`);
              failCount += 1;
              if (hit?.eliminated) eliminated.push(hit.name);
            }
          }
          await sleep(170);
        }

        await sendRoundSummaryV2(channel, `${r.title || ("Round " + (i + 1))} - Result`, [
          `Completed combo: **${successCount}**`,
          `Failed combo: **${failCount}**`,
          `Reverse saves: **${savedByReverse}**`,
          `Banked this round: **${bankedTotal}**`,
          eliminated.length ? `Eliminated: ${eliminated.join(", ")}` : "",
        ]);
        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
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
          const eliminated = [];
          for (const uid of nowAlive) {
            const hit = await applyHit(uid, boss, channel, `was overwhelmed in the final push!`);
            if (hit?.name) eliminated.push(hit.name);
            eliminate(uid, boss);
            await sleep(100);
          }
          await sendRoundSummaryV2(channel, `${r.title || ("Round " + (i + 1))} - Result`, [
            `Successful rolls: **${wins}/${required}**`,
            `Outcome: **TEAM WIPE**`,
            eliminated.length ? `Eliminated: ${eliminated.join(", ")}` : "",
          ]);
        } else {
          let bankedTotal = 0;
          for (const uid of nowAlive) {
            if (winners.has(uid)) {
              const player = await getPlayer(uid);
              const mult = getEventMultiplier(boss.def.event, player);
              const add = Math.floor(boss.def.hitReward * mult);
              bankSuccess(uid, boss, add);
              bankedTotal += add;
            }
          }
          await sendRoundSummaryV2(channel, `${r.title || ("Round " + (i + 1))} - Result`, [
            `Successful rolls: **${wins}/${required}**`,
            `Outcome: **Success**`,
            `Banked this round: **${bankedTotal}**`,
          ]);
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
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

        const msg = await channel.send(
          buildImagePanelV2Payload({
            title: `BLOCK x${boss.activeAction.requiredPresses} (${Math.round((r.windowMs || 10000) / 1000)}s)`,
            lines: ["Press Block repeatedly before the timer ends."],
            imageUrl: r.media || boss.def.spawnMedia,
            actionRows: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "ðŸ›¡ï¸", false),
          })
        ).catch(() => null);

        await sleep(r.windowMs || 10000);

        if (msg?.id) {
          await msg.edit(
            buildImagePanelV2Payload({
              title: `BLOCK x${boss.activeAction.requiredPresses} (${Math.round((r.windowMs || 10000) / 1000)}s)`,
              lines: ["Window closed."],
              imageUrl: r.media || boss.def.spawnMedia,
              actionRows: singleActionRow(customId, r.buttonLabel || "Block", r.buttonEmoji || "ðŸ›¡ï¸", true),
            })
          ).catch(() => {});
        }

        const action = boss.activeAction?.token === token ? boss.activeAction : null;
        boss.activeAction = null;

        const nowAlive = aliveIds(boss);
        let successCount = 0;
        let failCount = 0;
        let bankedTotal = 0;
        const eliminated = [];
        for (const uid of nowAlive) {
          const cnt = action?.counts?.get(uid) || 0;
          if (cnt >= (action?.requiredPresses || 3)) {
            const player = await getPlayer(uid);
            const mult = getEventMultiplier(boss.def.event, player);
            const add = Math.floor(boss.def.hitReward * mult);
            bankSuccess(uid, boss, add);
            successCount += 1;
            bankedTotal += add;
          } else {
            const hit = await applyHit(uid, boss, channel, `failed to block enough times! (pressed ${cnt})`);
            failCount += 1;
            if (hit?.eliminated) eliminated.push(hit.name);
          }
          await sleep(140);
        }

        await sendRoundSummaryV2(channel, `${r.title || ("Round " + (i + 1))} - Result`, [
          `Met presses: **${successCount}**`,
          `Failed presses: **${failCount}**`,
          `Banked this round: **${bankedTotal}**`,
          eliminated.length ? `Eliminated: ${eliminated.join(", ")}` : "",
        ]);
        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
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

        const msg = await channel.send(
          buildImagePanelV2Payload({
            title: `CHOICE WINDOW ${Math.round((r.windowMs || 3000) / 1000)}s`,
            lines: ["Pick the correct action quickly."],
            imageUrl: r.media || boss.def.spawnMedia,
            actionRows: dualChoiceRow(idA, cA.label, cA.emoji, idB, cB.label, cB.emoji, false),
          })
        ).catch(() => null);

        await sleep(r.windowMs || 3000);

        if (msg?.id) {
          await msg.edit(
            buildImagePanelV2Payload({
              title: `CHOICE WINDOW ${Math.round((r.windowMs || 3000) / 1000)}s`,
              lines: ["Window closed."],
              imageUrl: r.media || boss.def.spawnMedia,
              actionRows: dualChoiceRow(idA, cA.label, cA.emoji, idB, cB.label, cB.emoji, true),
            })
          ).catch(() => {});
        }

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
          await channel.send(
            buildImagePanelV2Payload({
              title: "Phase Outcome",
              lines: [r.afterText || ""],
              imageUrl: r.afterMedia || boss.def.spawnMedia,
            })
          ).catch(() => {});
        }

        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
          await sleep(ROUND_COOLDOWN_MS);
        }
        continue;
      }

    
      if (r.type === "scripted_hit_all") {
        await sleep(r.delayMs || 5000);
        await sendRoundSummaryV2(channel, `${r.title || ("Round " + (i + 1))} - Alert`, [
          "Adaptation surge detected.",
          "All active fighters are hit by the wave.",
        ]);

        const nowAlive = aliveIds(boss);
        const eliminated = [];
        for (const uid of nowAlive) {
          const hit = await applyHit(uid, boss, channel, `was struck by the adaptation surge!`);
          if (hit?.eliminated) eliminated.push(hit.name);
          await sleep(120);
        }

        if (r.endMedia || r.endText) {
          await channel.send(
            buildImagePanelV2Payload({
              title: "Adaptation Surge",
              lines: [r.endText || ""],
              imageUrl: r.endMedia || boss.def.spawnMedia,
            })
          ).catch(() => {});
        }

        await sendRoundSummaryV2(channel, `${r.title || ("Round " + (i + 1))} - Result`, [
          `Targets hit: **${nowAlive.length}**`,
          eliminated.length ? `Eliminated: ${eliminated.join(", ")}` : "",
        ]);
        await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)));

        if (i < boss.def.rounds.length - 1) {
          await upsertRaidHudMessage(channel, boss, r.title || ("Round " + (i + 1)), Math.round(ROUND_COOLDOWN_MS / 1000));
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

        const msg = await channel.send(
          buildImagePanelV2Payload({
            title: `FOCUS WINDOW ${Math.round((r.windowMs || 12000) / 1000)}s`,
            lines: ["Press all 3 buttons before timer ends."],
            imageUrl: r.media || boss.def.spawnMedia,
            actionRows: triChoiceRow(btns, false),
          })
        ).catch(() => null);

        await sleep(r.windowMs || 12000);

        if (msg?.id) {
          await msg.edit(
            buildImagePanelV2Payload({
              title: `FOCUS WINDOW ${Math.round((r.windowMs || 12000) / 1000)}s`,
              lines: ["Window closed."],
              imageUrl: r.media || boss.def.spawnMedia,
              actionRows: triChoiceRow(btns, true),
            })
          ).catch(() => {});
        }

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

        const msg = await channel.send(
          buildImagePanelV2Payload({
            title: `FINAL QUIZ ${Math.round((r.windowMs || 8000) / 1000)}s`,
            lines: ["Choose the correct finisher before timer ends."],
            imageUrl: r.media || boss.def.spawnMedia,
            actionRows: triChoiceRow(btns, false),
          })
        ).catch(() => null);

        await sleep(r.windowMs || 8000);

        if (msg?.id) {
          await msg.edit(
            buildImagePanelV2Payload({
              title: `FINAL QUIZ ${Math.round((r.windowMs || 8000) / 1000)}s`,
              lines: ["Window closed."],
              imageUrl: r.media || boss.def.spawnMedia,
              actionRows: triChoiceRow(btns, true),
            })
          ).catch(() => {});
        }

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
      await sendRoundSummaryV2(channel, "Raid Result", [
        "Status: **Team Wiped**",
        "No survivors remained in the final phase.",
      ]);
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
    await sendRoundSummaryV2(channel, "Raid Result", [
      "Status: **Raid Clear**",
      `Survivors: **${survivors.length}**`,
    ]);
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
      await channel.send(
        buildImagePanelV2Payload({
          title: `${def.name} Signature Detected`,
          lines: ["Raid energy spike confirmed."],
          imageUrl: def.teaserMedia,
        })
      ).catch(() => {});
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

  const msg = await channel.send(buildBossSpawnV2Payload(boss, channel.id));

  boss.messageId = msg.id;
  bossByChannel.set(channel.id, boss);

  setTimeout(() => {
    const still = bossByChannel.get(channel.id);
    if (still && still.messageId === boss.messageId) runBoss(channel, still).catch(() => {});
  }, def.joinMs);
}

module.exports = { spawnBoss, runBoss };




