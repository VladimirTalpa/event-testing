const {
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const cfg = require("../config");
const { getPlayer, setPlayer, getTopPlayers } = require("../core/players");
const { renderStore, renderProfile } = require("../ui/embeds");
const { buildStoreNavRow, buildProfileNavRow, buildPackBuyRows } = require("../ui/components");
const packs = require("../systems/packs");
const bosses = require("../systems/bosses"); // будет заглушка если файла нет

function isAdmin(interaction) {
  // если у тебя роль админа в конфиге - допиши проверку тут
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

module.exports = async function handleSlash(interaction) {
  const name = interaction.commandName;

  // Всегда дефери, чтобы ничего не "умирало" из-за таймаута
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: false });
  }

  // ===== NEW: /store
  if (name === "store") {
    const section = interaction.options.getString("section") || "event";
    const embed = await renderStore(interaction.user.id, section);
    const rows = [buildStoreNavRow(section)];

    if (section === "packs") {
      // кнопки покупки паков + кнопки открыть (если есть в инвентаре)
      const p = await getPlayer(interaction.user.id);
      rows.push(...buildPackBuyRows(p));
    }

    return interaction.editReply({ embeds: [embed], components: rows });
  }

  // ===== NEW: /profile
  if (name === "profile") {
    const section = interaction.options.getString("section") || "currency";
    const embed = await renderProfile(interaction.user.id, section);
    const rows = [buildProfileNavRow(section)];
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  // ===== NEW: /packs open
  if (name === "packs") {
    const sub = interaction.options.getSubcommand();
    if (sub !== "open") return interaction.editReply({ content: "Unknown packs command." });

    const type = interaction.options.getString("type"); // basic / legendary
    const result = await packs.openPack(interaction.user.id, type);

    if (!result.ok) {
      return interaction.editReply({ content: `❌ ${result.error}` });
    }

    return interaction.editReply({
      embeds: result.embeds,
      components: result.components || [],
    });
  }

  // ===== NEW: /forge (пока UI, логика в части 3)
  if (name === "forge") {
    const section = interaction.options.getString("section") || "craft";
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(cfg.COLOR || 0x8a2be2)
          .setTitle("🔨 Forge")
          .setDescription(
            section === "craft"
              ? "Craft Gear будет в **части 3/3**.\nПока доступно: Store → Gear Shop (скоро)."
              : "Evolve персонажей будет в **части 3/3**.\nПока доступно: открывай паки и собирай shards."
          ),
      ],
      components: [],
    });
  }

  // ===== NEW: /expedition (в части 3)
  if (name === "expedition") {
    const sub = interaction.options.getSubcommand();
    if (sub === "status") {
      const p = await getPlayer(interaction.user.id);
      const exp = p.expedition || {};
      const text = exp.active
        ? `🧭 Expedition is active.\nTicks: **${exp.ticksDone || 0}**\nParty size: **${(exp.party || []).length}**`
        : "🧭 No active expedition.\n(Полная система будет в части 3/3.)";

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(cfg.COLOR || 0x8a2be2)
            .setTitle("🧭 Expeditions")
            .setDescription(text),
        ],
      });
    }

    if (sub === "start") {
      return interaction.editReply({
        content:
          "🧭 Start expedition будет в **части 3/3** (выбор 3 героев + обновления каждые 10 минут + смерть карточки).",
      });
    }
  }

  // =========================
  // Ниже — “старые” команды.
  // Я сделал их рабочими базово, чтобы не было “мёртвых”.
  // =========================

  if (name === "balance") {
    const user = interaction.options.getUser("user") || interaction.user;
    const p = await getPlayer(user.id);

    const embed = new EmbedBuilder()
      .setColor(cfg.COLOR || 0x8a2be2)
      .setTitle(`💰 Balance — ${user.username}`)
      .addFields(
        { name: "Reiatsu (Bleach)", value: `${p.bleach.reiatsu}`, inline: true },
        { name: "Cursed Energy (JJK)", value: `${p.jjk.cursedEnergy}`, inline: true },
        { name: "Drako Coin", value: `${p.drako}`, inline: true }
      );

    return interaction.editReply({ embeds: [embed] });
  }

  if (name === "give") {
    const currency = interaction.options.getString("currency");
    const amount = interaction.options.getInteger("amount");
    const target = interaction.options.getUser("user");

    if (target.bot) return interaction.editReply({ content: "❌ You can't send to bots." });
    if (target.id === interaction.user.id) return interaction.editReply({ content: "❌ You can't send to yourself." });

    const sender = await getPlayer(interaction.user.id);
    const receiver = await getPlayer(target.id);

    const take = (obj, path, amt) => {
      const cur = path.reduce((a, k) => a[k], obj);
      if (cur < amt) return false;
      path.reduce((a, k, idx) => {
        if (idx === path.length - 1) a[k] -= amt;
        return a[k] !== undefined ? a[k] : a;
      }, obj);
      return true;
    };

    const add = (obj, path, amt) => {
      path.reduce((a, k, idx) => {
        if (idx === path.length - 1) a[k] += amt;
        return a[k];
      }, obj);
    };

    const map = {
      reiatsu: [["bleach", "reiatsu"], "Reiatsu"],
      cursed_energy: [["jjk", "cursedEnergy"], "Cursed Energy"],
      drako: [["drako"], "Drako Coin"],
    };

    const entry = map[currency];
    if (!entry) return interaction.editReply({ content: "❌ Unknown currency." });

    const [path, label] = entry;

    // tiny path helpers
    const getVal = (obj) => path.reduce((a, k) => a[k], obj);
    if (getVal(sender) < amount) {
      return interaction.editReply({ content: `❌ Not enough ${label}.` });
    }

    // apply
    path.reduce((a, k, idx) => {
      if (idx === path.length - 1) a[k] -= amount;
      return a[k] ?? a;
    }, sender);

    path.reduce((a, k, idx) => {
      if (idx === path.length - 1) a[k] += amount;
      return a[k] ?? a;
    }, receiver);

    await setPlayer(interaction.user.id, sender);
    await setPlayer(target.id, receiver);

    return interaction.editReply({ content: `✅ Sent **${amount} ${label}** to **${target.username}**.` });
  }

  if (name === "exchange_drako") {
    const event = interaction.options.getString("event"); // bleach / jjk
    const drako = interaction.options.getInteger("drako");

    const p = await getPlayer(interaction.user.id);

    if (event === "bleach") {
      const cost = drako * (cfg.DRAKO_RATE_BLEACH || 100);
      if (p.bleach.reiatsu < cost) return interaction.editReply({ content: `❌ Need ${cost} Reiatsu.` });
      p.bleach.reiatsu -= cost;
      p.drako += drako;
      await setPlayer(interaction.user.id, p);
      return interaction.editReply({ content: `✅ Bought **${drako} Drako** for **${cost} Reiatsu**.` });
    }

    if (event === "jjk") {
      const cost = drako * (cfg.DRAKO_RATE_JJK || 100);
      if (p.jjk.cursedEnergy < cost) return interaction.editReply({ content: `❌ Need ${cost} Cursed Energy.` });
      p.jjk.cursedEnergy -= cost;
      p.drako += drako;
      await setPlayer(interaction.user.id, p);
      return interaction.editReply({ content: `✅ Bought **${drako} Drako** for **${cost} Cursed Energy**.` });
    }

    return interaction.editReply({ content: "❌ Unknown event." });
  }

  if (name === "leaderboard") {
    const event = interaction.options.getString("event"); // bleach/jjk
    const top = await getTopPlayers(event, 10);

    const lines = top.map((r, i) => `**${i + 1}.** <@${r.userId}> — **${r.score}**`);
    const embed = new EmbedBuilder()
      .setColor(cfg.COLOR || 0x8a2be2)
      .setTitle(`🏆 Leaderboard — ${event.toUpperCase()}`)
      .setDescription(lines.join("\n") || "No data.");

    return interaction.editReply({ embeds: [embed] });
  }

  if (name === "dailyclaim") {
    const p = await getPlayer(interaction.user.id);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    if (p.bleach.lastDaily && now - p.bleach.lastDaily < dayMs) {
      const left = Math.ceil((dayMs - (now - p.bleach.lastDaily)) / 60000);
      return interaction.editReply({ content: `⏳ Already claimed. Try again in ~${left} minutes.` });
    }

    const reward = 250;
    p.bleach.reiatsu += reward;
    p.bleach.lastDaily = now;
    await setPlayer(interaction.user.id, p);

    return interaction.editReply({ content: `✅ Claimed daily: **+${reward} Reiatsu**.` });
  }

  if (name === "adminadd") {
    if (!isAdmin(interaction)) return interaction.editReply({ content: "❌ Admin only." });

    const currency = interaction.options.getString("currency");
    const amount = interaction.options.getInteger("amount");
    const user = interaction.options.getUser("user") || interaction.user;

    const p = await getPlayer(user.id);

    if (currency === "reiatsu") p.bleach.reiatsu += amount;
    else if (currency === "cursed_energy") p.jjk.cursedEnergy += amount;
    else if (currency === "drako") p.drako += amount;
    else return interaction.editReply({ content: "❌ Unknown currency." });

    await setPlayer(user.id, p);

    return interaction.editReply({ content: `✅ Added **${amount}** to **${currency}** for <@${user.id}>.` });
  }

  // Боссы: если у тебя есть старая система — не ломаю, просто вызываю,
  // если файла нет, будет “заглушка”
  if (name === "spawnboss") {
    if (typeof bosses.spawnBoss === "function") {
      const boss = interaction.options.getString("boss");
      const res = await bosses.spawnBoss(interaction, boss);
      return interaction.editReply(res);
    }
    return interaction.editReply({ content: "⚠️ Boss system file missing. (Часть 3/3 даст полноценный boss UI если надо.)" });
  }

  if (name === "spawnmob") {
    if (typeof bosses.spawnMob === "function") {
      const event = interaction.options.getString("event");
      const res = await bosses.spawnMob(interaction, event);
      return interaction.editReply(res);
    }
    return interaction.editReply({ content: "⚠️ Mob system file missing." });
  }

  // Остальные старые команды, чтобы не были “мёртвыми”
  if (["inventory", "shop", "wardrobe", "pvpclash"].includes(name)) {
    return interaction.editReply({
      content: `⚠️ Command **/${name}** is not wired in this refactor yet.\nUse **/store** and **/profile** for the new system.`,
    });
  }

  return interaction.editReply({ content: "❌ Unknown command." });
};
