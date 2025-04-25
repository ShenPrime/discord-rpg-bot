require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const shop = require('./commands/shop.js');
const sell = require('./commands/sell.js');
const equip = require('./commands/equip.js');
const use = require('./commands/use.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Dynamically load command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] The command at ./commands/${file} is missing required properties.`);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  // Auto-register slash commands on startup
  const { REST, Routes } = require('discord.js');
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    }
  }
  const rest = new REST({ version: '10' }).setToken(token);
  try {
    console.log('Started refreshing application (/) commands...');
    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
      console.log('Successfully reloaded guild commands.');
    } else {
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log('Successfully reloaded global commands.');
    }
  } catch (error) {
    console.error(error);
  }
});

const inventory = require('./commands/inventory.js');
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command && typeof command.autocomplete === 'function') {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(error);
      }
    }
    return;
  }
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
  } else if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') {
    try {
      await shop.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your shop selection!', ephemeral: true });
      }
    }
  } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('sell_')) {
    try {
      await sell.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your sell selection!', ephemeral: true });
      }
    }
  } else if (
    interaction.isButton() && (
      interaction.customId === 'inv_next' ||
      interaction.customId === 'inv_prev' ||
      interaction.customId === 'back_to_inventory' ||
      interaction.customId === 'show_equipped'
    )
  ) {
    try {
      await inventory.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your inventory action!', ephemeral: true });
      }
    }
  } else if (interaction.isButton() && interaction.customId === 'explore_again') {
    // Rerun the explore command logic for the user, updating the original message
    const exploreCommand = client.commands.get('explore');
    if (exploreCommand) {
      await exploreCommand.execute(interaction, (data) => interaction.update({ ...data, ephemeral: true }));
    }
  } else if (interaction.isButton() && interaction.customId === 'fight_again') {
    // Rerun the fight command logic for the user, updating the original message
    const fightCommand = client.commands.get('fight');
    if (fightCommand) {
      await fightCommand.execute(interaction, (data) => interaction.update({ ...data, ephemeral: true }));
    }
  } else if (interaction.isButton() && interaction.customId.startsWith('equip_page_')) {
    // Pagination for equip select menu
    const page = parseInt(interaction.customId.replace('equip_page_', ''), 10);
    const equipCommand = client.commands.get('equip');
    if (equipCommand) {
      await equipCommand.execute({ ...interaction, reply: (data) => interaction.update({ ...data, ephemeral: true }) }, page);
    }
  } else if (interaction.isButton() && interaction.customId.startsWith('shop_page_')) {
    // Pagination for shop select menu
    const page = parseInt(interaction.customId.replace('shop_page_', ''), 10);
    const shopCommand = client.commands.get('shop');
    if (shopCommand) {
      // We need to preserve the category option for shop
      await shopCommand.execute({ ...interaction, reply: (data) => interaction.update({ ...data, ephemeral: true }) }, page);
    }
  } else if (interaction.isButton() && interaction.customId.startsWith('use_page_')) {
    // Pagination for use select menu
    const page = parseInt(interaction.customId.replace('use_page_', ''), 10);
    const useCommand = client.commands.get('use');
    if (useCommand) {
      await useCommand.execute({ ...interaction, reply: (data) => interaction.update({ ...data, ephemeral: true }) }, page);
    }
  } else if (interaction.isButton() && interaction.customId.startsWith('sell_page_')) {
    // Pagination for sell select menu
    const page = parseInt(interaction.customId.replace('sell_page_', ''), 10);
    const sellCommand = client.commands.get('sell');
    if (sellCommand) {
      await sellCommand.execute({ ...interaction, reply: (data) => interaction.update({ ...data, ephemeral: true }) }, page);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

// TODO: Add RPG features (character, exploration, combat, inventory, leveling)
