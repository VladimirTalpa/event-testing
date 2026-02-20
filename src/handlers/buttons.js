const { bossByChannel, mobByChannel, pvpById } = require("../core/state");
const { getPlayer, setPlayer } = require("../core/players");
const { safeName } = require("../core/utils");
const { mobEmbed, shopEmbed, wardrobeEmbed } = require("../ui/embeds");
const { CID, bossButtons, mobButtons, shopButtons, pvpButtons } = require("../ui/components");
const {
  AttachmentBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const { MOBS } = require("../data/mobs");
const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");
const { CARD_PACKS, rollCard } = require("../data/cards");
const { buildBossLiveImage } = require("../ui/boss-card");
const { buildShopV2Payload } = require("../ui/shop-v2");
const { buildPackOpeningImage, buildCardRevealImage } = require("../ui/card-pack");
const { collectRowsForPlayer, buildCardsBookPayload } = require("../ui/cards-book-v2");
const { buildPvpResultImage } = require("../ui/pvpclash-card");
const { buildClanSetupPayload, buildClanHelpText, hasClanCreateAccess, memberHasRole, CLAN_SPECIAL_CREATE_ROLE_ID, CLAN_SPECIAL_ROLE_COST } = require("../ui/clan-setup-v2");
const {
  getClan,
  findClanByName,
  canManageClan,
  createClan,
  requestJoinClan,
  acceptInvite,
  inviteToClan,
  approveJoinRequest,
  denyJoinRequest,
  promoteOfficer,
  demoteOfficer,
  transferOwnership,
  kickMember,
  leaveClan,
  startClanBoss,
  hitClanBoss,
  getClanWeeklyLeaderboard,
} = require("../core/clans");
const { buildClanBossHudImage, buildClanLeaderboardImage, buildClanInfoImage } = require("../ui/clan-card");
const JOIN_HUD_REFRESH_DELAY_MS = 900;
const joinHudRefreshState = new Map();
const OPENING_SHOWCASE_DELAY_MS = 1500;

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

function ensureOwnedRole(player, roleId) {
  if (!roleId) return;
  const id = String(roleId);
  if (!player.ownedRoles.includes(id)) player.ownedRoles.push(id);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripFlags(payload) {
  const out = { ...(payload || {}) };
  delete out.flags;
  return out;
}

async function editClanPanel(interaction, payload, extra = {}) {
  const base = stripFlags(payload);
  const msg = { ...base, ...extra };
  try {
    await interaction.editReply(msg);
    return true;
  } catch {}
  try {
    if (interaction.message) {
      await interaction.message.edit(msg);
      return true;
    }
  } catch {}
  return false;
}

async function syncClanPanel(interaction, payload, fallbackNotice = "Clan panel update failed.") {
  const ok = await editClanPanel(interaction, payload);
  if (ok) return true;
  try {
    await interaction.followUp({ content: fallbackNotice, ephemeral: true });
  } catch {}
  return false;
}

async function sendClanFiles(interaction, files, content = "") {
  if (!Array.isArray(files) || !files.length) return;
  try {
    await interaction.followUp({
      content: content || undefined,
      files,
      ephemeral: true,
    });
  } catch {}
}

function parseUserIdInput(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  const m = s.match(/\d{17,20}/);
  return m ? m[0] : "";
}

function clanIconPrefix(icon) {
  const s = String(icon || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return "🛡️ ";
  return `${s} `;
}

async function resolveClanDamageRows(guild, damageByUser, limit = 10) {
  const rows = Object.entries(damageByUser || {})
    .map(([uid, dmg]) => ({ uid: String(uid), dmg: Math.max(0, Math.floor(Number(dmg || 0))) }))
    .sort((a, b) => b.dmg - a.dmg)
    .slice(0, Math.max(1, Math.floor(Number(limit || 10))));

  const out = [];
  for (const row of rows) {
    let name = row.uid;
    try {
      const m = await guild.members.fetch(row.uid);
      name = safeName(m?.displayName || m?.user?.username || row.uid);
    } catch {}
    out.push({ name, dmg: row.dmg });
  }
  return out;
}

async function buildClanInfoReply(guild, clan) {
  const hasBoss = !!(clan.activeBoss && clan.activeBoss.hpCurrent > 0 && clan.activeBoss.endsAt > Date.now());
  let ownerLabel = clan.ownerId;
  try {
    const m = await guild.members.fetch(clan.ownerId);
    ownerLabel = safeName(m?.displayName || m?.user?.username || clan.ownerId);
  } catch {}
  const memberNames = [];
  for (const uid of clan.members.slice(0, 15)) {
    let display = uid;
    try {
      const m = await guild.members.fetch(uid);
      display = safeName(m?.displayName || m?.user?.username || uid);
    } catch {}
    memberNames.push(display);
  }
  const officerNames = [];
  for (const uid of clan.officers.slice(0, 10)) {
    let display = uid;
    try {
      const m = await guild.members.fetch(uid);
      display = safeName(m?.displayName || m?.user?.username || uid);
    } catch {}
    officerNames.push(display);
  }
  const createdText = clan.createdAt ? new Date(clan.createdAt).toISOString().slice(0, 10) : "-";
  const png = await buildClanInfoImage({
    name: clan.name,
    icon: clan.icon,
    ownerName: ownerLabel,
    createdText,
    members: memberNames,
    officers: officerNames,
    memberCount: clan.members.length,
    maxMembers: 30,
    officerCount: clan.officers.length,
    requestCount: (clan.joinRequests || []).length,
    inviteCount: (clan.invites || []).length,
    weekly: clan.weekly,
    activeBoss: hasBoss ? clan.activeBoss : null,
  });
  const file = new AttachmentBuilder(png, { name: `clan-info-${clan.id}.png` });
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## ${clanIconPrefix(clan.icon)}CLAN PROFILE\n` +
        `Name: **${clan.name}**  |  Owner: <@${clan.ownerId}>`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### Weekly Snapshot\n` +
        `- Damage: **${clan.weekly.totalDamage}**\n` +
        `- Boss Clears: **${clan.weekly.bossClears}**\n` +
        `- Activity: **${clan.weekly.activity}**`
      )
    );
  return { files: [file], components: [container] };
}

async function editShopMessage(interaction, payload) {
  const msgPayload = { ...payload, flags: undefined };
  try {
    await interaction.editReply(msgPayload);
    return true;
  } catch {}
  try {
    await interaction.message?.edit(msgPayload);
    return true;
  } catch {}
  return false;
}

async function editCardsBookMessage(interaction, payload) {
  const msgPayload = { ...payload, flags: undefined };
  try {
    await interaction.editReply(msgPayload);
    return true;
  } catch {}
  try {
    await interaction.message?.edit(msgPayload);
    return true;
  } catch {}
  return false;
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

async function buildBossSpawnPngPayload(boss) {
  const png = await buildBossLiveImage(boss.def, {
    phase: "JOIN WINDOW",
    hpLeft: Math.max(1, Math.floor(boss.currentHp || 1)),
    hpTotal: Math.max(1, Math.floor(boss.totalHp || boss.currentHp || 1)),
    topDamage: getTopDamageRows(boss, 7),
    noteA: `Join time ${Math.round((boss.def?.joinMs || 0) / 1000)}s`,
    noteB: `Joined ${boss.participants.size}`,
    noteC: "Press Join Battle to enter",
  }).catch(() => null);
  if (!png) return null;
  const file = new AttachmentBuilder(png, { name: `raid-join-${boss.def.id}.png` });
  return { files: [file], components: bossButtons(!boss.joining) };
}

async function flushBossJoinHud(channelId) {
  const boss = bossByChannel.get(channelId);
  if (!boss || !boss.joining || !boss.messageId) return;
  const channel = boss.messageChannel;
  if (!channel) return;

  const msg = await channel.messages.fetch(boss.messageId).catch(() => null);
  if (!msg) return;

  const payload = await buildBossSpawnPngPayload(boss);
  if (payload) await msg.edit(payload).catch(() => {});
}

function scheduleBossJoinHudRefresh(channel, boss) {
  if (!channel?.id || !boss) return;
  boss.messageChannel = channel;
  const key = channel.id;

  let st = joinHudRefreshState.get(key);
  if (!st) st = { timer: null, running: false, dirty: false };
  st.dirty = true;

  if (st.timer || st.running) {
    joinHudRefreshState.set(key, st);
    return;
  }

  st.timer = setTimeout(async () => {
    const curr = joinHudRefreshState.get(key);
    if (!curr) return;
    curr.timer = null;
    if (curr.running) return;
    curr.running = true;
    try {
      while (curr.dirty) {
        curr.dirty = false;
        await flushBossJoinHud(key);
      }
    } finally {
      curr.running = false;
      if (!curr.dirty && !curr.timer) joinHudRefreshState.delete(key);
    }
  }, JOIN_HUD_REFRESH_DELAY_MS);
  if (typeof st.timer?.unref === "function") st.timer.unref();
  joinHudRefreshState.set(key, st);
}

module.exports = async function handleButtons(interaction) {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  const cid = interaction.customId;
  if (cid.startsWith("clanui:")) {
    if (cid === "clanui:create" || cid === "clanui:request" || cid === "clanui:accept" ||
        cid === "clanui:invite" || cid === "clanui:approve" || cid === "clanui:deny" ||
        cid === "clanui:promote" || cid === "clanui:demote" || cid === "clanui:transfer" || cid === "clanui:kick") {
      const action = cid.split(":")[1];
      const modal = new ModalBuilder().setCustomId(`clanmodal:${action}`).setTitle(`Clan ${action}`);
      const input = new TextInputBuilder()
        .setCustomId("value")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      if (action === "create") {
        input
          .setLabel("Clan Name | optional icon URL (name|url)")
          .setPlaceholder("Mohg Legends|https://cdn.discordapp.com/attachments/.../icon.png")
          .setMaxLength(180);
      } else if (action === "request" || action === "accept") {
        input.setLabel("Clan Name").setPlaceholder("Exact clan name").setMaxLength(64);
      } else if (action === "approve" || action === "deny") {
        input.setLabel("User @mention / ID / queue index").setPlaceholder("@User OR 123456789012345678 OR 1").setMaxLength(64);
      } else {
        input.setLabel("Target User ID / @mention").setPlaceholder("123456789012345678").setMaxLength(40);
      }
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      try {
        await interaction.showModal(modal);
      } catch {
        await interaction.reply({ content: "Modal could not be opened. Please click again.", ephemeral: true }).catch(() => {});
      }
      return;
    }

    // For non-modal clan UI actions, defer first to prevent "interaction failed".
    try { await interaction.deferUpdate(); } catch {}

    if (cid === "clanui:help") {
      const c = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(buildClanHelpText()));
      await interaction.followUp({ components: [c], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 }).catch(() => {});
      const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "Opened help in ephemeral message." });
      return syncClanPanel(interaction, payload);
    }

    if (cid === "clanui:refresh") {
      const payload = await buildClanSetupPayload({
        guild: interaction.guild,
        userId: interaction.user.id,
        member: interaction.member,
        notice: "Panel refreshed.",
      });
      return syncClanPanel(interaction, payload);
    }

    if (cid === "clanui:leave") {
      const res = await leaveClan({ userId: interaction.user.id });
      const payload = await buildClanSetupPayload({
        guild: interaction.guild,
        userId: interaction.user.id,
        member: interaction.member,
        notice: res.ok ? "You left your clan." : res.error,
      });
      return syncClanPanel(interaction, payload);
    }

    if (cid === "clanui:requests") {
      const p = await getPlayer(interaction.user.id);
      if (!p.clanId) {
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "You are not in a clan." });
        return syncClanPanel(interaction, payload);
      }
      const clan = await getClan(p.clanId);
      if (!clan || !canManageClan(clan, interaction.user.id)) {
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "Only owner/officers can view queue." });
        return syncClanPanel(interaction, payload);
      }
      const req = (clan.joinRequests || []).slice(0, 12).map((x, i) => `**#${i + 1}** <@${x.userId}>`).join("\n");
      const inv = (clan.invites || []).slice(0, 12).map((x, i) => `**#${i + 1}** <@${x.userId}>`).join("\n");
      const payload = await buildClanSetupPayload({
        guild: interaction.guild,
        userId: interaction.user.id,
        member: interaction.member,
        notice: `Queue\nRequests:\n${req || "_none_"}\nInvites:\n${inv || "_none_"}`,
      });
      return syncClanPanel(interaction, payload);
    }

    if (cid.startsWith("clanui:buyrole:")) {
      const eventKey = cid.endsWith(":jjk") ? "jjk" : "bleach";
      const p = await getPlayer(interaction.user.id);
      const liveMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => interaction.member);
      if (memberHasRole(liveMember, CLAN_SPECIAL_CREATE_ROLE_ID)) {
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: liveMember, notice: "Special role already owned." });
        return syncClanPanel(interaction, payload);
      }
      if (eventKey === "bleach") {
        if (p.bleach.reiatsu < CLAN_SPECIAL_ROLE_COST) {
          const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: liveMember, notice: `Need ${CLAN_SPECIAL_ROLE_COST} Reiatsu.` });
          return syncClanPanel(interaction, payload);
        }
        p.bleach.reiatsu -= CLAN_SPECIAL_ROLE_COST;
      } else {
        if (p.jjk.cursedEnergy < CLAN_SPECIAL_ROLE_COST) {
          const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: liveMember, notice: `Need ${CLAN_SPECIAL_ROLE_COST} Cursed Energy.` });
          return syncClanPanel(interaction, payload);
        }
        p.jjk.cursedEnergy -= CLAN_SPECIAL_ROLE_COST;
      }
      if (!Array.isArray(p.ownedRoles)) p.ownedRoles = [];
      if (!p.ownedRoles.includes(CLAN_SPECIAL_CREATE_ROLE_ID)) p.ownedRoles.push(CLAN_SPECIAL_CREATE_ROLE_ID);
      await setPlayer(interaction.user.id, p);
      const roleRes = await tryGiveRole(interaction.guild, interaction.user.id, CLAN_SPECIAL_CREATE_ROLE_ID);
      const payload = await buildClanSetupPayload({
        guild: interaction.guild,
        userId: interaction.user.id,
        member: await interaction.guild.members.fetch(interaction.user.id).catch(() => interaction.member),
        notice: roleRes.ok ? "Special clan create role purchased." : `Role saved to wardrobe. Assign failed: ${roleRes.reason}`,
      });
      return syncClanPanel(interaction, payload);
    }

    if (
      cid.startsWith("clanui:boss:start:") ||
      cid.startsWith("clanui:boss:hit:") ||
      cid === "clanui:boss:hit" ||
      cid === "clanui:boss:status"
    ) {
      const p = await getPlayer(interaction.user.id);
      if (!p.clanId) {
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "Join a clan first." });
        return syncClanPanel(interaction, payload);
      }
      const clan = await getClan(p.clanId);
      if (!clan) {
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "Clan not found." });
        return syncClanPanel(interaction, payload);
      }
      if (cid.startsWith("clanui:boss:start:")) {
        const eventKey = cid.endsWith(":jjk") ? "jjk" : "bleach";
        const res = await startClanBoss({ userId: interaction.user.id, eventKey });
        if (!res.ok) {
          const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: res.error });
          return syncClanPanel(interaction, payload);
        }
        const b = res.clan.activeBoss;
        const png = await buildClanBossHudImage({
          clanName: res.clan.name,
          bossName: b.name,
          eventKey: b.eventKey,
          hpMax: b.hpMax,
          hpCurrent: b.hpCurrent,
          topDamage: [],
          joined: res.clan.members.length,
          alive: res.clan.members.length,
          totalDamage: 0,
          weeklyClears: res.clan.weekly.bossClears,
          endsAt: b.endsAt,
        });
        const file = new AttachmentBuilder(png, { name: `clan-boss-${b.eventKey}.png` });
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: `Boss started: ${b.name}` });
        await sendClanFiles(interaction, [file], "Clan Boss HUD");
        return syncClanPanel(interaction, payload);
      }
      if (cid.startsWith("clanui:boss:hit:") || cid === "clanui:boss:hit") {
        const eventKey = cid === "clanui:boss:hit"
          ? String(clan.activeBoss?.eventKey || "")
          : (cid.endsWith(":jjk") ? "jjk" : "bleach");
        if (!eventKey) {
          const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "No active clan boss to hit." });
          return syncClanPanel(interaction, payload);
        }
        const res = await hitClanBoss({ userId: interaction.user.id, cardEventKey: eventKey });
        if (!res.ok) {
          const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: res.error });
          return syncClanPanel(interaction, payload);
        }
        const b = res.clan.activeBoss;
        if (!res.cleared && b) {
          const top = await resolveClanDamageRows(interaction.guild, b.damageByUser || {}, 10);
          const png = await buildClanBossHudImage({
            clanName: res.clan.name, bossName: b.name, eventKey: b.eventKey, hpMax: b.hpMax, hpCurrent: b.hpCurrent,
            topDamage: top, joined: res.clan.members.length, alive: res.clan.members.length,
            totalDamage: top.reduce((a, x) => a + Number(x.dmg || 0), 0), weeklyClears: res.clan.weekly.bossClears, endsAt: b.endsAt,
          });
          const file = new AttachmentBuilder(png, { name: `clan-boss-${b.eventKey}.png` });
          const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: `Hit dealt: ${res.dmg}` });
          await sendClanFiles(interaction, [file], "Clan Boss HUD");
          return syncClanPanel(interaction, payload);
        }
        const lbRows = await getClanWeeklyLeaderboard(10);
        const png = await buildClanLeaderboardImage(lbRows);
        const file = new AttachmentBuilder(png, { name: "clan-leaderboard-weekly.png" });
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: `Boss cleared by ${res.clan.name}.` });
        await sendClanFiles(interaction, [file], "Clan Weekly Leaderboard");
        return syncClanPanel(interaction, payload);
      }
      if (cid === "clanui:boss:status") {
        const b = clan.activeBoss;
        if (!b || b.hpCurrent <= 0 || b.endsAt <= Date.now()) {
          const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "No active clan boss." });
          return syncClanPanel(interaction, payload);
        }
        const top = await resolveClanDamageRows(interaction.guild, b.damageByUser || {}, 10);
        const png = await buildClanBossHudImage({
          clanName: clan.name, bossName: b.name, eventKey: b.eventKey, hpMax: b.hpMax, hpCurrent: b.hpCurrent,
          topDamage: top, joined: clan.members.length, alive: clan.members.length,
          totalDamage: top.reduce((a, x) => a + Number(x.dmg || 0), 0), weeklyClears: clan.weekly.bossClears, endsAt: b.endsAt,
        });
        const file = new AttachmentBuilder(png, { name: `clan-boss-status-${b.eventKey}.png` });
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: `Boss HP ${b.hpCurrent}/${b.hpMax}` });
        await sendClanFiles(interaction, [file], "Clan Boss Status");
        return syncClanPanel(interaction, payload);
      }
    }

    if (cid === "clanui:leaderboard") {
      const rows = await getClanWeeklyLeaderboard(10);
      const png = await buildClanLeaderboardImage(rows);
      const file = new AttachmentBuilder(png, { name: "clan-leaderboard-weekly.png" });
      const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "Weekly leaderboard updated." });
      await sendClanFiles(interaction, [file], "Clan Weekly Leaderboard");
      return syncClanPanel(interaction, payload);
    }

    if (cid === "clanui:info") {
      const p = await getPlayer(interaction.user.id);
      if (!p.clanId) {
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "No clan found." });
        return syncClanPanel(interaction, payload);
      }
      const clan = await getClan(p.clanId);
      if (!clan) {
        const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "Clan not found." });
        return syncClanPanel(interaction, payload);
      }
      const info = await buildClanInfoReply(interaction.guild, clan);
      const payload = await buildClanSetupPayload({ guild: interaction.guild, userId: interaction.user.id, member: interaction.member, notice: "Clan profile rendered." });
      await sendClanFiles(interaction, info.files, "Clan Profile");
      return syncClanPanel(interaction, payload);
    }

    const payload = await buildClanSetupPayload({
      guild: interaction.guild,
      userId: interaction.user.id,
      member: interaction.member,
      notice: "Unknown clan action.",
    });
    return syncClanPanel(interaction, payload);
  }

  try { await interaction.deferUpdate(); } catch {}

  if (cid.startsWith("cardsbook_nav:")) {
    const [, eventKeyRaw, targetId, ownerId, pageRaw, dir] = cid.split(":");
    if (String(interaction.user.id) !== String(ownerId)) {
      await interaction.followUp({ content: "Only the command user can turn pages.", ephemeral: true }).catch(() => {});
      return;
    }

    const eventKey = eventKeyRaw === "jjk" ? "jjk" : "bleach";
    const targetUserId = String(targetId || interaction.user.id);
    const page = Math.max(0, Number(pageRaw || 0));
    const nextPage = Math.max(0, page + (dir === "next" ? 1 : -1));

    const p = await getPlayer(targetUserId);
    const rows = collectRowsForPlayer(p, eventKey);
    if (!rows.length) {
      await interaction.followUp({ content: "No cards found.", ephemeral: true }).catch(() => {});
      return;
    }

    let targetName = `User ${targetUserId}`;
    try {
      const member = await interaction.guild?.members?.fetch(targetUserId).catch(() => null);
      if (member?.user?.username) targetName = safeName(member.user.username);
    } catch {}

    const book = await buildCardsBookPayload({
      eventKey,
      targetId: targetUserId,
      targetName,
      ownerId,
      rows,
      page: nextPage,
    });

    await editCardsBookMessage(interaction, {
      components: book.components,
      files: book.files,
    });
    return;
  }

  if (cid.startsWith("shopv2_nav:")) {
    const [, eventKeyRaw, pageRaw, selectedRaw, dir] = cid.split(":");
    const eventKey = eventKeyRaw === "jjk" ? "jjk" : "bleach";
    const page = Number(pageRaw || 0);
    const nextPage = dir === "next" ? page + 1 : page - 1;
    const selectedKey = selectedRaw && selectedRaw !== "none" ? selectedRaw : null;
    const p = await getPlayer(interaction.user.id);
    const payload = buildShopV2Payload({
      eventKey,
      player: p,
      page: nextPage,
      selectedKey,
    });
    await editShopMessage(interaction, payload);
    return;
  }

  if (cid.startsWith("shopv2_buy:")) {
    const [, eventKeyRaw, pageRaw, selectedRaw] = cid.split(":");
    const eventKey = eventKeyRaw === "jjk" ? "jjk" : "bleach";
    const page = Number(pageRaw || 0);
    const key = selectedRaw && selectedRaw !== "none" ? selectedRaw : null;
    if (!key) {
      await interaction.followUp({ content: "Select an item first.", ephemeral: true }).catch(() => {});
      return;
    }

    const p = await getPlayer(interaction.user.id);
    const itemList = eventKey === "bleach" ? BLEACH_SHOP_ITEMS : JJK_SHOP_ITEMS;
    const item = itemList.find((x) => x.key === key);
    if (!item) {
      await interaction.followUp({ content: "Unknown item.", ephemeral: true }).catch(() => {});
      return;
    }

    const inv = eventKey === "bleach" ? p.bleach.items : p.jjk.items;
    if (inv[key] && item.type !== "pack") {
      await interaction.followUp({ content: "You already own this item.", ephemeral: true }).catch(() => {});
      await editShopMessage(interaction, buildShopV2Payload({ eventKey, player: p, page, selectedKey: key }));
      return;
    }

    const balance = eventKey === "bleach" ? p.bleach.reiatsu : p.jjk.cursedEnergy;
    if (balance < item.price) {
      const need = item.price - balance;
      await interaction.followUp({ content: `Need ${need} more to buy this item.`, ephemeral: true }).catch(() => {});
      await editShopMessage(interaction, buildShopV2Payload({ eventKey, player: p, page, selectedKey: key }));
      return;
    }

    if (item.type === "pack" || key === CARD_PACKS[eventKey]?.key) {
      const packEventKey =
        key === CARD_PACKS.jjk?.key ? "jjk" :
        key === CARD_PACKS.bleach?.key ? "bleach" :
        eventKey;

      if (eventKey === "bleach") p.bleach.reiatsu -= item.price;
      else p.jjk.cursedEnergy -= item.price;

      if (!p.cards || typeof p.cards !== "object") p.cards = { bleach: {}, jjk: {} };
      if (!p.cards.bleach || typeof p.cards.bleach !== "object") p.cards.bleach = {};
      if (!p.cards.jjk || typeof p.cards.jjk !== "object") p.cards.jjk = {};
      if (!p.cardLevels || typeof p.cardLevels !== "object") p.cardLevels = { bleach: {}, jjk: {} };
      if (!p.cardLevels.bleach || typeof p.cardLevels.bleach !== "object") p.cardLevels.bleach = {};
      if (!p.cardLevels.jjk || typeof p.cardLevels.jjk !== "object") p.cardLevels.jjk = {};

      const rolled = rollCard(packEventKey);
      if (!rolled) {
        await interaction.followUp({ content: `Pack failed to open for ${packEventKey.toUpperCase()}.`, ephemeral: true }).catch(() => {});
        return;
      }

      const cardStore = packEventKey === "bleach" ? p.cards.bleach : p.cards.jjk;
      const levelStore = packEventKey === "bleach" ? p.cardLevels.bleach : p.cardLevels.jjk;
      const afterCount = Math.max(0, Number(cardStore[rolled.id] || 0)) + 1;
      cardStore[rolled.id] = afterCount;
      if (!levelStore[rolled.id]) levelStore[rolled.id] = 1;

      await setPlayer(interaction.user.id, p);
      await editShopMessage(interaction, buildShopV2Payload({ eventKey, player: p, page, selectedKey: key }));

      const openingPng = await buildPackOpeningImage({
        eventKey: packEventKey,
        username: interaction.user.username,
        packName: item.name,
      }).catch(() => null);
      if (openingPng) {
        const openingFile = new AttachmentBuilder(openingPng, { name: `opening-${packEventKey}.png` });
        await interaction.followUp({ files: [openingFile], ephemeral: true }).catch(() => {});
      }

      await delay(OPENING_SHOWCASE_DELAY_MS);

      const revealPng = await buildCardRevealImage({
        eventKey: packEventKey,
        username: interaction.user.username,
        card: rolled,
        countOwned: afterCount,
        level: levelStore[rolled.id] || 1,
      }).catch(() => null);

      if (revealPng) {
        const revealFile = new AttachmentBuilder(revealPng, { name: `card-${rolled.id}.png` });
        await interaction.followUp({ files: [revealFile], ephemeral: true }).catch(() => {});
      }

      await interaction
        .followUp({
          content: `Pulled **${rolled.name}** (${rolled.rarity}) from **${packEventKey.toUpperCase()}** | Owned: **${afterCount}**`,
          ephemeral: true,
        })
        .catch(() => {});
      return;
    }

    if (eventKey === "bleach") p.bleach.reiatsu -= item.price;
    else p.jjk.cursedEnergy -= item.price;
    inv[key] = true;

    if (item.roleId) {
      ensureOwnedRole(p, item.roleId);
      const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
      if (!res.ok) {
        await interaction.followUp({
          content: `Bought role, but bot couldn't assign: ${res.reason} (saved to wardrobe)`,
          ephemeral: true,
        }).catch(() => {});
      }
    }

    await setPlayer(interaction.user.id, p);
    await interaction.followUp({ content: `Purchased: ${item.name}`, ephemeral: true }).catch(() => {});
    await editShopMessage(interaction, buildShopV2Payload({ eventKey, player: p, page, selectedKey: key }));
    return;
  }

  /* ===================== Boss join ===================== */
  if (cid === CID.BOSS_JOIN) {
    const boss = bossByChannel.get(channel.id);
    if (!boss || !boss.joining) {
      await interaction.followUp({ content: "❌ No active boss join.", ephemeral: true }).catch(() => {});
      return;
    }

    const uid = interaction.user.id;
    if (boss.participants.has(uid)) {
      await interaction.followUp({ content: "⚠️ You already joined.", ephemeral: true }).catch(() => {});
      return;
    }

    boss.participants.set(uid, { hits: 0, displayName: interaction.user.username });

    // Batch join HUD refresh to avoid heavy PNG re-render on every single click.
    scheduleBossJoinHudRefresh(channel, boss);

    await interaction.followUp({ content: "✅ Joined the fight.", ephemeral: true }).catch(() => {});
    return;
  }

  /* ===================== Boss rules ===================== */
  if (cid === CID.BOSS_RULES) {
    const boss = bossByChannel.get(channel.id);
    const def = boss?.def;

    const maxHits = def?.maxHits ?? 2;

    const txt = def
      ? `**${def.name}** • Difficulty: **${def.difficulty}** • Rounds: **${def.rounds.length}**\n` +
        `Win: **${def.winRewardRange ? `${def.winRewardRange.min}-${def.winRewardRange.max}` : def.winReward}**\n` +
        `Success per round: **+${def.hitReward}** (banked, paid only on victory)\n` +
        `${maxHits} hits = eliminated`
      : `${maxHits} hits = eliminated.`;

    await interaction.followUp({ content: txt, ephemeral: true }).catch(() => {});
    return;
  }

  /* ===================== Boss action buttons ===================== */
  if (cid.startsWith("boss_action:")) {
    const parts = cid.split(":");
    const bossId = parts[1];
    const roundIndex = Number(parts[2]);
    const token = parts[3];
    const kind = parts[4];
    const payload = parts[5];

    const boss = bossByChannel.get(channel.id);
    if (!boss || boss.def.id !== bossId) {
      await interaction.followUp({ content: "❌ No active boss action.", ephemeral: true }).catch(() => {});
      return;
    }
    if (!boss.activeAction || boss.activeAction.token !== token || boss.activeAction.roundIndex !== roundIndex) {
      await interaction.followUp({ content: "⌛ Too late.", ephemeral: true }).catch(() => {});
      return;
    }

    const uid = interaction.user.id;
    const st = boss.participants.get(uid);
    const maxHits = boss.def.maxHits ?? 2;
    if (!st || st.hits >= maxHits) {
      await interaction.followUp({ content: "❌ You are not in the fight.", ephemeral: true }).catch(() => {});
      return;
    }

    // Existing press / combo
    if (kind === "press") {
      if (boss.activeAction.pressed.has(uid)) {
        await interaction.followUp({ content: "✅ Already pressed.", ephemeral: true }).catch(() => {});
        return;
      }
      boss.activeAction.pressed.add(uid);
      await interaction.followUp({ content: "✅ Registered!", ephemeral: true }).catch(() => {});
      return;
    }

    if (kind === "combo") {
      if (boss.activeAction.mode !== "combo") {
        await interaction.followUp({ content: "❌ Not a combo phase.", ephemeral: true }).catch(() => {});
        return;
      }
      if (boss.activeAction.comboFailed.has(uid)) {
        await interaction.followUp({ content: "❌ You already failed this combo.", ephemeral: true }).catch(() => {});
        return;
      }
      const seq = boss.activeAction.comboSeq || [];
      const prog = boss.activeAction.comboProgress.get(uid) || 0;
      const expected = seq[prog];

      if (payload !== expected) {
        boss.activeAction.comboFailed.add(uid);
        await interaction.followUp({ content: "❌ Wrong button! (you will take a hit when the timer ends)", ephemeral: true }).catch(() => {});
        return;
      }

      const next = prog + 1;
      boss.activeAction.comboProgress.set(uid, next);

      if (next >= 4) await interaction.followUp({ content: "✅ Combo completed!", ephemeral: true }).catch(() => {});
      else await interaction.followUp({ content: `✅ Good! (${next}/4)`, ephemeral: true }).catch(() => {});
      return;
    }

    // NEW: multi_press
    if (kind === "multi") {
      if (boss.activeAction.mode !== "multi_press") {
        await interaction.followUp({ content: "❌ Not a multi-press phase.", ephemeral: true }).catch(() => {});
        return;
      }
      const map = boss.activeAction.counts;
      const prev = map.get(uid) || 0;
      map.set(uid, prev + 1);
      await interaction.followUp({ content: `✅ Blocked (${prev + 1})`, ephemeral: true }).catch(() => {});
      return;
    }

    // NEW: choice_qte
    if (kind === "choice") {
      if (boss.activeAction.mode !== "choice") {
        await interaction.followUp({ content: "❌ Not a choice phase.", ephemeral: true }).catch(() => {});
        return;
      }
      boss.activeAction.choice.set(uid, payload);
      await interaction.followUp({ content: "✅ Chosen.", ephemeral: true }).catch(() => {});
      return;
    }

    // NEW: tri_press
    if (kind === "tri") {
      if (boss.activeAction.mode !== "tri_press") {
        await interaction.followUp({ content: "❌ Not a focus phase.", ephemeral: true }).catch(() => {});
        return;
      }
      const set = boss.activeAction.pressed.get(uid) || new Set();
      set.add(payload);
      boss.activeAction.pressed.set(uid, set);
      await interaction.followUp({ content: `✅ (${set.size}/3)`, ephemeral: true }).catch(() => {});
      return;
    }

    // NEW: quiz
    if (kind === "quiz") {
      if (boss.activeAction.mode !== "quiz") {
        await interaction.followUp({ content: "❌ Not a quiz phase.", ephemeral: true }).catch(() => {});
        return;
      }
      boss.activeAction.choice.set(uid, payload);
      await interaction.followUp({ content: "✅ Answer locked.", ephemeral: true }).catch(() => {});
      return;
    }
  }

  /* ===================== Mob attack ===================== */
  if (cid.startsWith(`${CID.MOB_ATTACK}:`)) {
    const eventKey = cid.split(":")[1];
    const state = mobByChannel.get(channel.id);

    if (!state || state.resolved || state.eventKey !== eventKey) {
      await interaction.followUp({ content: "❌ No active mob event.", ephemeral: true }).catch(() => {});
      return;
    }

    const uid = interaction.user.id;
    if (state.attackers.has(uid)) {
      await interaction.followUp({ content: "⚠️ You already attacked.", ephemeral: true }).catch(() => {});
      return;
    }

    state.attackers.set(uid, { displayName: interaction.member?.displayName || interaction.user.username });

    const mob = MOBS[eventKey];
    const msg = await channel.messages.fetch(state.messageId).catch(() => null);
    if (msg) {
      await msg.edit({
        embeds: [mobEmbed(eventKey, state.attackers.size, mob)],
        components: mobButtons(eventKey, false),
      }).catch(() => {});
    }

    await interaction.followUp({ content: "⚔️ Action registered!", ephemeral: true }).catch(() => {});
    return;
  }

  /* ===================== PvP Clash ===================== */
  if (cid.startsWith(`${CID.PVP_ACCEPT}:`) || cid.startsWith(`${CID.PVP_DECLINE}:`)) {
    const isAccept = cid.startsWith(`${CID.PVP_ACCEPT}:`);
    const [, currency, amountStr, challengerId, targetId] = cid.split(":");
    const amount = Number(amountStr);

    if (!Number.isFinite(amount) || amount <= 0) {
      await interaction.followUp({ content: "❌ Invalid amount.", ephemeral: true }).catch(() => {});
      return;
    }

    // Only target can accept/decline
    if (interaction.user.id !== targetId) {
      await interaction.followUp({ content: "❌ This is not your duel request.", ephemeral: true }).catch(() => {});
      return;
    }

    const key = `${channel.id}:${challengerId}:${targetId}`;
    const req = pvpById.get(key);
    if (!req || req.done) {
      await interaction.followUp({ content: "⌛ This request expired.", ephemeral: true }).catch(() => {});
      return;
    }

    req.done = true;
    pvpById.set(key, req);

    if (!isAccept) {
      await interaction.message?.edit({ components: pvpButtons(currency, amount, challengerId, targetId, true) }).catch(() => {});
      await interaction.followUp({ content: "❌ Duel declined.", ephemeral: false }).catch(() => {});
      return;
    }

    // Accept: do transfer
    const p1 = await getPlayer(challengerId);
    const p2 = await getPlayer(targetId);

    function getBal(p, cur) {
      if (cur === "reiatsu") return p.bleach.reiatsu;
      if (cur === "cursed_energy") return p.jjk.cursedEnergy;
      if (cur === "drako") return p.drako;
      return 0;
    }
    function setBal(p, cur, v) {
      if (cur === "reiatsu") p.bleach.reiatsu = v;
      if (cur === "cursed_energy") p.jjk.cursedEnergy = v;
      if (cur === "drako") p.drako = v;
    }

    const b1 = getBal(p1, currency);
    const b2 = getBal(p2, currency);

    if (b1 < amount) {
      await interaction.followUp({ content: `❌ Challenger lacks funds.`, ephemeral: false }).catch(() => {});
      return;
    }
    if (b2 < amount) {
      await interaction.followUp({ content: `❌ You lack funds.`, ephemeral: false }).catch(() => {});
      return;
    }

    // 50/50 outcome (simple for now)
    const winnerIsChallenger = Math.random() < 0.5;
    const winnerId = winnerIsChallenger ? challengerId : targetId;
    const loserId = winnerIsChallenger ? targetId : challengerId;

    const winner = winnerIsChallenger ? p1 : p2;
    const loser = winnerIsChallenger ? p2 : p1;

    setBal(loser, currency, getBal(loser, currency) - amount);
    setBal(winner, currency, getBal(winner, currency) + amount);

    await setPlayer(challengerId, p1);
    await setPlayer(targetId, p2);

    const winnerUser = await interaction.client.users.fetch(winnerId).catch(() => null);
    const loserUser = await interaction.client.users.fetch(loserId).catch(() => null);
    const resultPng = await buildPvpResultImage({
      winnerName: safeName(winnerUser?.username || `User ${winnerId}`),
      loserName: safeName(loserUser?.username || `User ${loserId}`),
      amount,
      currency,
      winnerAfter: getBal(winner, currency),
      loserAfter: getBal(loser, currency),
    });
    const resultFile = new AttachmentBuilder(resultPng, { name: `pvp-result-${challengerId}-${targetId}.png` });

    await interaction.message?.edit({ components: pvpButtons(currency, amount, challengerId, targetId, true) }).catch(() => {});
    await interaction.followUp({
      content: `PVP CLASH RESOLVED. Winner: <@${winnerId}> | Loser: <@${loserId}>`,
      files: [resultFile],
      ephemeral: false,
    }).catch(() => {});
    return;
  }

  /* ===================== Shop buys ===================== */
  if (cid.startsWith("buy_")) {
    const p = await getPlayer(interaction.user.id);

    const bleachMap = {
      buy_bleach_zanpakuto_basic: "zanpakuto_basic",
      buy_bleach_hollow_mask_fragment: "hollow_mask_fragment",
      buy_bleach_soul_reaper_cloak: "soul_reaper_cloak",
      buy_bleach_reiatsu_amplifier: "reiatsu_amplifier",
      buy_bleach_cosmetic_role: "cosmetic_role",
    };

    const jjkMap = {
      buy_jjk_black_flash_manual: "black_flash_manual",
      buy_jjk_domain_charm: "domain_charm",
      buy_jjk_cursed_tool: "cursed_tool",
      buy_jjk_reverse_talisman: "reverse_talisman",
      buy_jjk_binding_vow_seal: "binding_vow_seal",
    };

    let eventKey = null;
    let key = null;

    if (bleachMap[cid]) { eventKey = "bleach"; key = bleachMap[cid]; }
    if (jjkMap[cid]) { eventKey = "jjk"; key = jjkMap[cid]; }

    if (!eventKey || !key) {
      await interaction.followUp({ content: "❌ Unknown item.", ephemeral: true }).catch(() => {});
      return;
    }

    const itemList = eventKey === "bleach" ? BLEACH_SHOP_ITEMS : JJK_SHOP_ITEMS;
    const item = itemList.find((x) => x.key === key);
    if (!item) {
      await interaction.followUp({ content: "❌ Unknown item.", ephemeral: true }).catch(() => {});
      return;
    }

    const inv = eventKey === "bleach" ? p.bleach.items : p.jjk.items;
    if (inv[key]) {
      await interaction.followUp({ content: "✅ You already own this item.", ephemeral: true }).catch(() => {});
      return;
    }

    const { E_REIATSU, E_CE } = require("../config");

    if (eventKey === "bleach") {
      if (p.bleach.reiatsu < item.price) {
        await interaction.followUp({ content: `❌ Need ${E_REIATSU} ${item.price}.`, ephemeral: true }).catch(() => {});
        return;
      }
      p.bleach.reiatsu -= item.price;
      p.bleach.items[key] = true;
    } else {
      if (p.jjk.cursedEnergy < item.price) {
        await interaction.followUp({ content: `❌ Need ${E_CE} ${item.price}.`, ephemeral: true }).catch(() => {});
        return;
      }
      p.jjk.cursedEnergy -= item.price;
      p.jjk.items[key] = true;
    }

    if (item.roleId) {
      ensureOwnedRole(p, item.roleId);
      const res = await tryGiveRole(interaction.guild, interaction.user.id, item.roleId);
      if (!res.ok) {
        await interaction.followUp({
          content: `⚠️ Bought role, but bot couldn't assign: ${res.reason} (saved to wardrobe)`,
          ephemeral: true
        }).catch(() => {});
      }
    }

    await setPlayer(interaction.user.id, p);

    const msgId = interaction.message?.id;
    if (msgId) {
      const msg = await channel.messages.fetch(msgId).catch(() => null);
      if (msg) {
        await msg.edit({
          embeds: [shopEmbed(eventKey, p)],
          components: shopButtons(eventKey, p),
        }).catch(() => {});
      }
    }

    await interaction.followUp({ content: "✅ Purchased!", ephemeral: true }).catch(() => {});
    return;
  }
};

