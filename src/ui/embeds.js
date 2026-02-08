// src/ui/embeds.js
const { EmbedBuilder } = require("discord.js");

const {
  COLOR,
  MAX_HITS,

  E_MEMBERS,
  E_BLEACH,
  E_JJK,
  E_REIATSU,
  E_CE,
  E_DRAKO,
  DRAKO_RATE_BLEACH,
  DRAKO_RATE_JJK,
  DROP_ROBUX_CHANCE_DISPLAY,
} = require("../config");

const { BLEACH_SHOP_ITEMS, JJK_SHOP_ITEMS } = require("../data/shop");
const { safeName } = require("../core/utils");

/* ===== bonuses / multipliers ===== */
function calcBleachSurvivalBonus(items) {
  let bonus = 0;
  if (items.zanpakuto_basic) bonus += 4;
  if (items.hollow_mask_fragment) bonus += 7;
  if (items.soul_reaper_cloak) bonus += 9;
  if (items.reiatsu_amplifier) bonus += 2;
  return bonus;
}
function calcBleachReiatsuMultiplier(items) {
  return items.reiatsu_amplifier ? 1.25 : 1.0;
}
function calcBleachDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.zanpakuto_basic) mult += 0.05;
  if (items.hollow_mask_fragment) mult += 0.10;
  if (items.soul_reaper_cloak) mult += 0.06;
  return mult;
}

function calcJjkSurvivalBonus(items) {
  let bonus = 0;
  if (items.black_flash_manual) bonus += 2;
  if (items.domain_charm) bonus += 8;
  if (items.cursed_tool) bonus += 10;
  if (items.reverse_talisman) bonus += 0;
  if (items.binding_vow_seal) bonus += 15;
  return bonus;
}
function calcJjkCEMultiplier(items) {
  let mult = 1.0;
  if (items.black_flash_manual) mult *= 1.20;
  if (items.binding_vow_seal) mult *= 0.90;
  return mult;
}
function calcJjkDropLuckMultiplier(items) {
  let mult = 1.0;
  if (items.cursed_tool) mult += 0.08;
  return mult;
}

/* ===================== BOSSES / MOBS EMBEDS (UNCHANGED) ===================== */
function bossSpawnEmbed(def, channelName, joinedCount, fightersText) {
  const eventTag = def.event === "bleach" ? `${E_BLEACH} BLEACH` : `${E_JJK} JJK`;
  const currency = def.event === "bleach" ? E_REIATSU : E_CE;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${eventTag} — ${def.icon} ${def.name} Appeared!`)
    .setDescription(
      `**Difficulty:** ${def.difficulty}\n` +
      `⏳ **Join time:** ${Math.round(def.joinMs / 60000)} minutes\n` +
      `Press **🗡 Join Battle** to participate.`
    )
    .addFields(
      { name: `${E_MEMBERS} Fighters`, value: fightersText, inline: false },
      { name: `Joined`, value: `\`${joinedCount}\``, inline: true },
      { name: `${currency} Rewards`, value: `\`${def.winReward} on win • +${def.hitReward}/success (banked)\``, inline: true },
      { name: `📌 Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(def.spawnMedia)
    .setFooter({ text: `Boss • ${def.rounds.length} rounds • ${MAX_HITS} hits = eliminated` });
}

function bossRoundEmbed(def, roundIndex, aliveCount) {
  const r = def.rounds[roundIndex];
  const eventTag = def.event === "bleach" ? `${E_BLEACH} BLEACH` : `${E_JJK} JJK`;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${eventTag} — ${def.icon} ${def.name} • ${r.title}`)
    .setDescription(r.intro)
    .addFields({ name: `${E_MEMBERS} Alive fighters`, value: `\`${aliveCount}\``, inline: true })
    .setImage(r.media || def.spawnMedia)
    .setFooter({ text: `Round ${roundIndex + 1}/${def.rounds.length}` });
}

function bossVictoryEmbed(def, survivorsCount) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`✅ ${def.name} Defeated!`)
    .setDescription("Rewards granted to survivors.")
    .addFields(
      { name: `${E_MEMBERS} Survivors`, value: `\`${survivorsCount}\``, inline: true },
      { name: `🎭 Drops`, value: `Role + Robux (display ${(DROP_ROBUX_CHANCE_DISPLAY * 100).toFixed(1)}%)`, inline: true }
    )
    .setImage(def.victoryMedia);
}

function bossDefeatEmbed(def) {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`❌ Defeat`)
    .setDescription(`Everyone lost. **${def.name}** wins.`)
    .setImage(def.defeatMedia);
}

function mobEmbed(eventKey, joinedCount, mob) {
  const eventTag = eventKey === "bleach" ? `${E_BLEACH} BLEACH` : `${E_JJK} JJK`;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${eventTag} — ${mob.icon} ${mob.name} Appeared!`)
    .setDescription(
      [
        `⏳ **Time:** 2 minutes`,
        `🎲 **Hit chance:** 50%`,
        `${mob.currencyEmoji} **Hit:** ${mob.hitReward} • **Miss:** ${mob.missReward}`,
        `If you hit: +${mob.bonusPerKill}% boss bonus (max ${mob.bonusMax}%).`,
      ].join("\n")
    )
    .addFields({ name: `${E_MEMBERS} Attackers`, value: `\`${joinedCount}\``, inline: true })
    .setImage(mob.media);
}

/* ===================== INVENTORY / SHOP / WARDROBE (CLEANER) ===================== */
function inventoryEmbed(eventKey, player, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const itemBonus = calcBleachSurvivalBonus(inv);
    const mult = calcBleachReiatsuMultiplier(inv);
    const luck = calcBleachDropLuckMultiplier(inv);

    const owned = (k) => (inv[k] ? "✅" : "❌");

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${E_BLEACH} Bleach — Inventory`)
      .setDescription(
        [
          `**Wallet**`,
          `${E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**`,
          `${E_DRAKO} Drako Coin: **${player.drako}**`,
          `Rate: **${DRAKO_RATE_BLEACH} ${E_REIATSU} = 1 ${E_DRAKO}** (one-way)`,
          "",
          `**Bonuses**`,
          `⭐ Mob bonus: **${player.bleach.survivalBonus}% / ${bonusMaxBleach}%**`,
          `🛡 Item survival: **+${itemBonus}%**`,
          `🍀 Drop luck: **x${luck.toFixed(2)}**`,
          `💰 Reward mult: **x${mult.toFixed(2)}**`,
          "",
          `**Items**`,
          `• Zanpakutō: ${owned("zanpakuto_basic")}`,
          `• Mask Fragment: ${owned("hollow_mask_fragment")}`,
          `• Cloak: ${owned("soul_reaper_cloak")}`,
          `• Amplifier: ${owned("reiatsu_amplifier")}`,
          `• Aizen role: ${owned("cosmetic_role")}`,
          "",
          `🧥 Wardrobe saved roles: **${player.ownedRoles.length}**`,
        ].join("\n")
      );
  }

  const inv = player.jjk.items;
  const mats = player.jjk.materials || {};
  const itemBonus = calcJjkSurvivalBonus(inv);
  const mult = calcJjkCEMultiplier(inv);
  const luck = calcJjkDropLuckMultiplier(inv);

  const owned = (k) => (inv[k] ? "✅" : "❌");
  const cursedShard = Number.isFinite(mats.cursed_shard) ? mats.cursed_shard : 0;

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_JJK} Jujutsu Kaisen — Inventory`)
    .setDescription(
      [
        `**Wallet**`,
        `${E_CE} Cursed Energy: **${player.jjk.cursedEnergy}**`,
        `${E_DRAKO} Drako Coin: **${player.drako}**`,
        `Rate: **${DRAKO_RATE_JJK} ${E_CE} = 1 ${E_DRAKO}** (one-way)`,
        "",
        `**Bonuses**`,
        `⭐ Mob bonus: **${player.jjk.survivalBonus}% / ${bonusMaxJjk}%**`,
        `🛡 Item survival: **+${itemBonus}%**`,
        `🍀 Drop luck: **x${luck.toFixed(2)}**`,
        `💰 Reward mult: **x${mult.toFixed(2)}**`,
        "",
        `**Materials**`,
        `🧩 Cursed Shard: **${cursedShard}**`,
        "",
        `**Items**`,
        `• Black Flash Manual: ${owned("black_flash_manual")}`,
        `• Domain Charm: ${owned("domain_charm")}`,
        `• Cursed Tool: ${owned("cursed_tool")}`,
        `• Reverse Talisman: ${owned("reverse_talisman")}`,
        `• Binding Vow Seal: ${owned("binding_vow_seal")}`,
        "",
        `🧥 Wardrobe saved roles: **${player.ownedRoles.length}**`,
      ].join("\n")
    );
}

function shopEmbed(eventKey, player) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;

    const lines = BLEACH_SHOP_ITEMS.map((it) => {
      const owned = inv[it.key] ? "✅ Owned" : `${E_REIATSU} ${it.price}`;
      return `**${it.name}** — ${owned}\n> ${it.desc}`;
    });

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${E_BLEACH} Bleach — Shop`)
      .setDescription(lines.join("\n\n"))
      .addFields(
        { name: `${E_REIATSU} Your Reiatsu`, value: `\`${player.bleach.reiatsu}\``, inline: true },
        { name: `${E_DRAKO} Your Drako`, value: `\`${player.drako}\``, inline: true },
        { name: `Exchange`, value: `\`${DRAKO_RATE_BLEACH} Reiatsu = 1 Drako (one-way)\``, inline: false }
      );
  }

  const inv = player.jjk.items;
  const lines = JJK_SHOP_ITEMS.map((it) => {
    const owned = inv[it.key] ? "✅ Owned" : `${E_CE} ${it.price}`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_JJK} Jujutsu Kaisen — Shop`)
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: `${E_CE} Your Cursed Energy`, value: `\`${player.jjk.cursedEnergy}\``, inline: true },
      { name: `${E_DRAKO} Your Drako`, value: `\`${player.drako}\``, inline: true },
      { name: `Exchange`, value: `\`${DRAKO_RATE_JJK} Cursed Energy = 1 Drako (one-way)\``, inline: false }
    );
}

function leaderboardEmbed(eventKey, entries) {
  const tag = eventKey === "bleach" ? `${E_BLEACH} Bleach` : `${E_JJK} JJK`;
  const currency = eventKey === "bleach" ? E_REIATSU : E_CE;
  const lines = entries.map((e, i) => `**#${i + 1}** — ${safeName(e.name)}: **${currency} ${e.score}**`);
  return new EmbedBuilder().setColor(COLOR).setTitle(`🏆 ${tag} Leaderboard`).setDescription(lines.join("\n") || "No data yet.");
}

function wardrobeEmbed(guild, player) {
  const roles = player.ownedRoles.map((rid) => guild.roles.cache.get(rid)).filter(Boolean);
  const lines = roles.length ? roles.map((r) => `• <@&${r.id}>`).join("\n") : "_No saved roles yet._";

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🧥 Wardrobe")
    .setDescription(
      [
        `Saved roles never disappear.`,
        `Select a role to **equip/unequip**.`,
        "",
        lines,
      ].join("\n")
    );
}

module.exports = {
  // embeds
  bossSpawnEmbed,
  bossRoundEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
  mobEmbed,
  inventoryEmbed,
  shopEmbed,
  leaderboardEmbed,
  wardrobeEmbed,

  // bonus helpers exported because events need them too:
  calcBleachSurvivalBonus,
  calcBleachReiatsuMultiplier,
  calcBleachDropLuckMultiplier,
  calcJjkSurvivalBonus,
  calcJjkCEMultiplier,
  calcJjkDropLuckMultiplier,
};
