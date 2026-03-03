// All slash commands
const slashCommands = [
  { name: 'dungeon_spawn', description: 'Spawn a dungeon' },
  // Include other slash commands here
];

// Processing the commands
const processedCommands = slashCommands.map(command => {
  return command.name;
});