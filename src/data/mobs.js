const {
  E_REIATSU,
  E_CE,
  BLEACH_MOB_MS,
  BLEACH_MOB_HIT,
  BLEACH_MOB_MISS,
  BLEACH_BONUS_PER_KILL,
  BLEACH_BONUS_MAX,
  JJK_MOB_MS,
  JJK_MOB_HIT,
  JJK_MOB_MISS,
  JJK_BONUS_PER_KILL,
  JJK_BONUS_MAX,
} = require("../config");
const { HOLLOW_MEDIA, CURSED_SPIRIT_MEDIA } = require("./media");

const MOBS = {
  bleach: {
    icon: "👹",
    name: "Hollow",
    currencyEmoji: E_REIATSU,
    joinMs: BLEACH_MOB_MS,
    hitReward: BLEACH_MOB_HIT,
    missReward: BLEACH_MOB_MISS,
    bonusPerKill: BLEACH_BONUS_PER_KILL,
    bonusMax: BLEACH_BONUS_MAX,
    media: HOLLOW_MEDIA,
  },
  jjk: {
    icon: "👻",
    name: "Cursed Spirit",
    currencyEmoji: E_CE,
    joinMs: JJK_MOB_MS,
    hitReward: JJK_MOB_HIT,
    missReward: JJK_MOB_MISS,
    bonusPerKill: JJK_BONUS_PER_KILL,
    bonusMax: JJK_BONUS_MAX,
    media: CURSED_SPIRIT_MEDIA,
  },
};

module.exports = { MOBS };
