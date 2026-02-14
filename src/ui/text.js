// src/ui/text.js

function bulletList(items = []) {
  if (!items.length) return "—";
  return items.map((x) => `• ${x}`).join("\n");
}

function codeBlock(text) {
  return "```" + "\n" + (text || "") + "\n```";
}

module.exports = {
  bulletList,
  codeBlock,
};
