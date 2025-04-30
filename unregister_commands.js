// unregister_commands.js
// Usage: node unregister_commands.js
// This script removes deprecated global and guild slash commands from Discord
// Requires DISCORD_TOKEN and (optionally) GUILD_ID as environment variables

const { REST, Routes } = require('discord.js');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID; // Your bot's application ID
const guildId = process.env.GUILD_ID; // Optional: for guild-specific commands

// List the command names you want to delete
const commandsToDelete = ['explore', 'sell_stack'];

if (!token || !clientId) {
  console.error('DISCORD_TOKEN and CLIENT_ID must be set in your environment or .env file.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

async function unregisterCommands() {
  try {
    if (guildId) {
      // For guild commands
      const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
      for (const command of guildCommands) {
        if (commandsToDelete.includes(command.name)) {
          await rest.delete(Routes.applicationGuildCommand(clientId, guildId, command.id));
          console.log(`Deleted guild command: ${command.name}`);
        }
      }
    } else {
      // For global commands
      const globalCommands = await rest.get(Routes.applicationCommands(clientId));
      for (const command of globalCommands) {
        if (commandsToDelete.includes(command.name)) {
          await rest.delete(Routes.applicationCommand(clientId, command.id));
          console.log(`Deleted global command: ${command.name}`);
        }
      }
    }
    console.log('Unregistering complete.');
  } catch (error) {
    console.error('Error unregistering commands:', error);
  }
}

unregisterCommands();
