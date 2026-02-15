const { E_REIATSU, E_CE } = require("../config");

module.exports = {
  MOBS: {
    bleach: {
      icon: "👹",
      name: "Hollow",
      currencyEmoji: E_REIATSU,
      hitReward: 25,
      missReward: 10,
      bonusPerKill: 2,
      bonusMax: 30,
      media: "https://i.imgur.com/8yKQFQ2.png",
    },
    jjk: {
      icon: "👻",
      name: "Cursed Spirit",
      currencyEmoji: E_CE,
      hitReward: 25,
      missReward: 10,
      bonusPerKill: 2,
      bonusMax: 30,
      media: "https://i.imgur.com/8yKQFQ2.png",
    },
  },
};
