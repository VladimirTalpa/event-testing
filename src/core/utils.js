function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { sleep, randInt };
