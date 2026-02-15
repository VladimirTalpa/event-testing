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

/* ===================== STORE / FORGE / PROFILE ===================== */
function storeHomeEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🛒 Store")
    .setDescription(
      [
        "Choose a section:",
        "• **Event Shop** — shops from events (Bleach / JJK)",
        "• **Card Packs** — coming soon",
        "• **Gear Shop** — coming soon",
      ].join("\n")
    );
}
function storeEventEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🎟️ Event Shop")
    .setDescription("Select which event shop you want to open.");
}

function forgeHomeEmbed() {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🔨 Forge")
    .setDescription(
      [
        "Forge menu:",
        "• **Craft (Gear)** — coming soon",
        "• **Evolve (Characters)** — coming soon",
      ].join("\n")
    );
}

function profileHomeEmbed(user) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`👤 Profile — ${safeName(user?.username)}`)
    .setDescription("Use buttons to open pages: Currency / Titles / Drako Leaderboard / etc.");
}

function profileCurrencyEmbed(user, player) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`💰 Currency — ${safeName(user?.username)}`)
    .setDescription(
      [
        `${E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**`,
        `${E_CE} Cursed Energy: **${player.jjk.cursedEnergy}**`,
        `${E_DRAKO} Drako: **${player.drako}**`,
        "",
        `🔁 Drako rate (Bleach): **${DRAKO_RATE_BLEACH} ${E_REIATSU} = 1 ${E_DRAKO}** (one-way)`,
        `🔁 Drako rate (JJK): **${DRAKO_RATE_JJK} ${E_CE} = 1 ${E_DRAKO}** (one-way)`,
      ].join("\n")
    );
}

function titlesEmbed(guild, player) {
  const roles = player.ownedRoles.map((rid) => guild.roles.cache.get(rid)).filter(Boolean);
  const lines = roles.length ? roles.map((r) => `• <@&${r.id}>`).join("\n") : "_No titles yet._";

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("🎖️ Titles")
    .setDescription(
      "These are the **roles you obtained from events**.\n" +
      "Select a role to **equip/unequip**.\n\n" +
      lines
    );
}

/* ===================== BOSSES/MOBS/SHOP/LEADERBOARD (existing) ===================== */
function bossSpawnEmbed(def, channelName, joinedCount, fightersText) {
  const eventTag = def.event === "bleach" ? `${E_BLEACH} BLEACH` : `${E_JJK} JJK`;
  const currency = def.event === "bleach" ? E_REIATSU : E_CE;

  const maxHits = def.maxHits ?? MAX_HITS;

  const rewardLine =
    def.winRewardRange
      ? `\`${def.winRewardRange.min}–${def.winRewardRange.max} on win • +${def.hitReward}/success (banked)\``
      : `\`${def.winReward} on win • +${def.hitReward}/success (banked)\``;

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
      { name: `${currency} Rewards`, value: rewardLine, inline: true },
      { name: `📌 Channel`, value: `\`#${channelName}\``, inline: true }
    )
    .setImage(def.spawnMedia)
    .setFooter({ text: `Boss • ${def.rounds.length} rounds • ${maxHits} hits = eliminated` });
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
      { name: `🎭 Drops`, value: `Role drops may occur.`, inline: true }
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
  const actionWord = eventKey === "jjk" ? "Exorcise" : "Attack";

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${eventTag} — ${mob.icon} ${mob.name} Appeared!`)
    .setDescription(
      [
        `⏳ **Time:** 2 minutes`,
        `🎲 **Hit chance:** 50%`,
        `${mob.currencyEmoji} **Hit:** ${mob.hitReward} • **Miss:** ${mob.missReward}`,
        `If you hit: +${mob.bonusPerKill}% boss bonus (max ${mob.bonusMax}%).`,
        "",
        `Press **${actionWord}**.`,
      ].join("\n")
    )
    .addFields({ name: `${E_MEMBERS} Attackers`, value: `\`${joinedCount}\``, inline: true })
    .setImage(mob.media);
}

function inventoryEmbed(eventKey, player, bonusMaxBleach = 30, bonusMaxJjk = 30) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const itemBonus = calcBleachSurvivalBonus(inv);
    const mult = calcBleachReiatsuMultiplier(inv);

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${E_BLEACH} Bleach — Inventory`)
      .setDescription(
        [
          `${E_REIATSU} Reiatsu: **${player.bleach.reiatsu}**`,
          `${E_DRAKO} Drako Coin: **${player.drako}**`,
          `🔁 Drako rate: **${DRAKO_RATE_BLEACH} ${E_REIATSU} = 1 ${E_DRAKO}** (one-way)`,
          "",
          `⭐ Boss bonus (mob kills): **${player.bleach.survivalBonus}% / ${bonusMaxBleach}%**`,
          `🛡 Item survival bonus: **${itemBonus}%**`,
          `🍀 Drop luck: **x${calcBleachDropLuckMultiplier(inv).toFixed(2)}**`,
          `💰 Reward multiplier: **x${mult.toFixed(2)}**`,
          "",
          `• Zanpakutō: ${inv.zanpakuto_basic ? "✅" : "❌"}`,
          `• Mask Fragment: ${inv.hollow_mask_fragment ? "✅" : "❌"}`,
          `• Cloak: ${inv.soul_reaper_cloak ? "✅" : "❌"}`,
          `• Amplifier: ${inv.reiatsu_amplifier ? "✅" : "❌"}`,
          `• Aizen role: ${inv.cosmetic_role ? "✅" : "❌"}`,
          "",
          `🎖 Titles saved: **${player.ownedRoles.length}**`,
        ].join("\n")
      );
  }

  const inv = player.jjk.items;
  const itemBonus = calcJjkSurvivalBonus(inv);
  const mult = calcJjkCEMultiplier(inv);

  const mats = player.jjk.materials || { cursedShards: 0, expeditionKeys: 0 };

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_JJK} Jujutsu Kaisen — Inventory`)
    .setDescription(
      [
        `${E_CE} Cursed Energy: **${player.jjk.cursedEnergy}**`,
        `${E_DRAKO} Drako Coin: **${player.drako}**`,
        `🔁 Drako rate: **${DRAKO_RATE_JJK} ${E_CE} = 1 ${E_DRAKO}** (one-way)`,
        "",
        `🧩 Materials:`,
        `• Cursed Shards: **${mats.cursedShards}**`,
        `• Expedition Keys: **${mats.expeditionKeys}**`,
        "",
        `⭐ Boss bonus (mob kills): **${player.jjk.survivalBonus}% / ${bonusMaxJjk}%**`,
        `🛡 Item survival bonus: **${itemBonus}%**`,
        `🍀 Drop luck: **x${calcJjkDropLuckMultiplier(inv).toFixed(2)}**`,
        `💰 Reward multiplier: **x${mult.toFixed(2)}**`,
        "",
        `• Black Flash Manual: ${inv.black_flash_manual ? "✅" : "❌"}`,
        `• Domain Charm: ${inv.domain_charm ? "✅" : "❌"}`,
        `• Cursed Tool: ${inv.cursed_tool ? "✅" : "❌"}`,
        `• Reverse Talisman: ${inv.reverse_talisman ? "✅" : "❌"}`,
        `• Binding Vow Seal: ${inv.binding_vow_seal ? "✅" : "❌"}`,
        "",
        `🎖 Titles saved: **${player.ownedRoles.length}**`,
      ].join("\n")
    );
}

function shopEmbed(eventKey, player) {
  if (eventKey === "bleach") {
    const inv = player.bleach.items;
    const lines = BLEACH_SHOP_ITEMS.map((it) => {
      const owned = inv[it.key] ? "✅ Owned" : `${E_REIATSU} ${it.price} Reiatsu`;
      return `**${it.name}** — ${owned}\n> ${it.desc}`;
    });

    return new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`${E_BLEACH} Bleach — Shop`)
      .setDescription(lines.join("\n\n"))
      .addFields(
        { name: `${E_REIATSU} Your Reiatsu`, value: `\`${player.bleach.reiatsu}\``, inline: true },
        { name: `${E_DRAKO} Your Drako`, value: `\`${player.drako}\``, inline: true },
        { name: `🔁 Drako rate`, value: `\`${DRAKO_RATE_BLEACH} Reiatsu = 1 Drako (one-way)\``, inline: false }
      );
  }

  const inv = player.jjk.items;
  const lines = JJK_SHOP_ITEMS.map((it) => {
    const owned = inv[it.key] ? "✅ Owned" : `${E_CE} ${it.price} Cursed Energy`;
    return `**${it.name}** — ${owned}\n> ${it.desc}`;
  });

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${E_JJK} Jujutsu Kaisen — Shop`)
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: `${E_CE} Your Cursed Energy`, value: `\`${player.jjk.cursedEnergy}\``, inline: true },
      { name: `${E_DRAKO} Your Drako`, value: `\`${player.drako}\``, inline: true },
      { name: `🔁 Drako rate`, value: `\`${DRAKO_RATE_JJK} Cursed Energy = 1 Drako (one-way)\``, inline: false }
    );
}

function leaderboardEmbed(eventKey, entries) {
  const isDrako = eventKey === "drako";
  const tag = isDrako ? `${E_DRAKO} Drako` : (eventKey === "bleach" ? `${E_BLEACH} Bleach` : `${E_JJK} JJK`);
  const currency = isDrako ? E_DRAKO : (eventKey === "bleach" ? E_REIATSU : E_CE);

  const lines = entries.map((e, i) => `**#${i + 1}** — ${safeName(e.name)}: **${currency} ${e.score}**`);
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`🏆 ${tag} Leaderboard`)
    .setDescription(lines.join("\n") || "No data yet.");
}

module.exports = {
  // new
  storeHomeEmbed,
  storeEventEmbed,
  forgeHomeEmbed,
  profileHomeEmbed,
  profileCurrencyEmbed,
  titlesEmbed,

  // existing
  bossSpawnEmbed,
  bossRoundEmbed,
  bossVictoryEmbed,
  bossDefeatEmbed,
  mobEmbed,
  inventoryEmbed,
  shopEmbed,
  leaderboardEmbed,

  calcBleachSurvivalBonus,
  calcBleachReiatsuMultiplier,
  calcBleachDropLuckMultiplier,
  calcJjkSurvivalBonus,
  calcJjkCEMultiplier,
  calcJjkDropLuckMultiplier,
};
