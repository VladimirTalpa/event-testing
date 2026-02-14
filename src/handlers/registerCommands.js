const fs = require('fs');
const path = require('path');

module.exports = function registerCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const files = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    const cmd = require(path.join(commandsPath, file));
    if (!cmd?.data?.name || typeof cmd.execute !== 'function') {
      console.warn(`⚠️ Skipping invalid command file: ${file}`);
      continue;
    }
    client.commands.set(cmd.data.name, cmd);
  }

  console.log(`📦 Loaded ${client.commands.size} commands.`);
};
