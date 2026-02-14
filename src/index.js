require('dotenv').config();

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

client.commands = new Collection();
client.state = {
  // messageId -> boss state
  bosses: new Map(),
  // messageId -> mob state
  mobs: new Map(),
};

require('./handlers/registerCommands')(client);
require('./handlers/registerEvents')(client);

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
