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

/* ===================== BOSSES (DO NOT TOUCH VISUAL) ===================== */
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

/* ===================== MOBS (DO NOT TOUCH VISUAL) ===================== */
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

/* ===================== CLEAN INVENTORY / SHOP / WARDROBE ===================== */
function inventoryEmbed(eventKey, player, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const itemBonus = calcBleachSurvivalBonus(inv);
    const mult = calcBleachReiatsuMultiplier(inv);

    const ownedLines = [
      `• Zanpakutō: ${inv.zanpakuto_basic ? "✅" : "❌"}`,
      `• Mask Fragment: ${inv.hollow_mask_fragment ? "✅" : "❌"}`,
      `• Cloak: ${inv.soul_reaper_cloak ? "✅" : "❌"}`,
      `• Amplifier: ${inv.reiatsu_amplifier ? "✅" : "❌"}`,
      `• Aizen role: ${inv.cosmetic_role ? "✅" : "❌"}`,
    ].join("\n");

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${E_BLEACH} Bleach — Inventory`)
      .addFields(
        {
          name: "💰 Balances",
          value:
            `${E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**\n` +
            `${E_DRAKO} Drako: **${player.drako}**\n` +
            `Rate: **${DRAKO_RATE_BLEACH} ${E_REIATSU} = 1 ${E_DRAKO}** (one-way)`,
          inline: false,
        },
        {
          name: "📈 Bonuses",
          value:
            `⭐ Mob boss-bonus: **${player.bleach.survivalBonus}% / ${bonusMaxBleach}%**\n` +
            `🛡 Item survival: **${itemBonus}%**\n` +
            `🍀 Drop luck: **x${calcBleachDropLuckMultiplier(inv).toFixed(2)}**\n` +
            `💰 Reward mult: **x${mult.toFixed(2)}**`,
          inline: false,
        },
        {
          name: "🎒 Items",
          value: ownedLines,
          inline: false,
        },
        {
          name: "🧥 Wardrobe",
          value: `Saved roles: **${player.ownedRoles.length}**`,
          inline: false,
        }
      );
  }

  const inv = player.jjk.items;
  const itemBonus = calcJjkSurvivalBonus(inv);
  const mult = calcJjkCEMultiplier(inv);

  const shards = Number.isFinite(player.jjk?.materials?.cursed_shard) ? player.jjk.materials.cursed_shard : 0;

  const ownedLines = [
    `• Black Flash Manual: ${inv.black_flash_manual ? "✅" : "❌"}`,
    `• Domain Charm: ${inv.domain_charm ? "✅" : "❌"}`,
    `• Cursed Tool: ${inv.cursed_tool ? "✅" : "❌"}`,
    `• Reverse Talisman: ${inv.reverse_talisman ? "✅" : "❌"}`,
    `• Binding Vow Seal: ${inv.binding_vow_seal ? "✅" : "❌"}`,
  ].join("\n");

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_JJK} Jujutsu Kaisen — Inventory`)
    .addFields(
      {
        name: "💰 Balances",
        value:
          `${E_CE} Cursed Energy: **${player.jjk.cursedEnergy}**\n` +
          `${E_DRAKO} Drako: **${player.drako}**\n` +
          `Rate: **${DRAKO_RATE_JJK} ${E_CE} = 1 ${E_DRAKO}** (one-way)`,
        inline: false,
      },
      {
        name: "📈 Bonuses",
        value:
          `⭐ Mob boss-bonus: **${player.jjk.survivalBonus}% / ${bonusMaxJjk}%**\n` +
          `🛡 Item survival: **${itemBonus}%**\n` +
          `🍀 Drop luck: **x${calcJjkDropLuckMultiplier(inv).toFixed(2)}**\n` +
          `💰 Reward mult: **x${mult.toFixed(2)}**`,
        inline: false,
      },
      {
        name: "🧩 Materials",
        value: `• Cursed Shard: **${shards}**`,
        inline: false,
      },
      {
        name: "🎒 Items",
        value: ownedLines,
        inline: false,
      },
      {
        name: "🧥 Wardrobe",
        value: `Saved roles: **${player.ownedRoles.length}**`,
        inline: false,
      }
    );
}

function shopEmbed(eventKey, player) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;

    const lines = BLEACH_SHOP_ITEMS.map((it) => {
      const owned = inv[it.key] ? "✅ Owned" : `${E_REIATSU} **${it.price}**`;
      return `**${it.name}** — ${owned}\n> ${it.desc}`;
    });

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${E_BLEACH} Bleach — Shop`)
      .setDescription(lines.join("\n\n"))
      .setFooter({ text: `Your Reiatsu: ${player.bleach.reiatsu} • Drako: ${player.drako}` });
  }

  const inv = player.jjk.items;

  const lines = JJK_SHOP_ITEMS.map((it) => {
    const owned = inv[it.key] ? "✅ Owned" : `${E_CE} **${it.price}**`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_JJK} Jujutsu Kaisen — Shop`)
    .setDescription(lines.join("\n\n"))
    .setFooter({ text: `Your CE: ${player.jjk.cursedEnergy} • Drako: ${player.drako}` });
}

function wardrobeEmbed(guild, player) {
  const roles = player.ownedRoles.map((rid) => guild.roles.cache.get(rid)).filter(Boolean);
  const lines = roles.length ? roles.map((r) => `• <@&${r.id}>`).join("\n") : "_No saved roles yet._";

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🧥 Wardrobe")
    .setDescription(
      "Saved roles never disappear.\n" +
      "Select a role to **equip/unequip**.\n\n" +
      lines
    )
    .setFooter({ text: `Saved roles: ${roles.length}` });
}

module.exports = {
  // boss/mob embeds
  bossSpawnEmbed,
  bossRoundEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
  mobEmbed,

  // clean UI embeds
  inventoryEmbed,
  shopEmbed,
  wardrobeEmbed,

  // bonus helpers
  calcBleachSurvivalBonus,
  calcBleachReiatsuMultiplier,
  calcBleachDropLuckMultiplier,
  calcJjkSurvivalBonus,
  calcJjkCEMultiplier,
  calcJjkDropLuckMultiplier,
};
