
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function safeName(name) { return String(name || "Unknown").replace(/@/g, "").replace(/#/g, "＃"); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

async function editMessageSafe(channel, messageId, payload) {
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return null;
  await msg.edit(payload).catch(() => {});
  return msg;
}

module.exports = { sleep, safeName, clamp, editMessageSafe };
