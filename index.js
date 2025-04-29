require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const shop = require('./commands/shop.js');
const setactive = require('./commands/setactive.js');
const sell = require('./commands/sell.js');
const testmodal = require('./commands/testmodal.js');
const equip = require('./commands/equip.js');
const use = require('./commands/use.js');
const character = require('./commands/character.js');
const deletecharacter = require('./commands/deletecharacter.js');
const exo_leaderboard = require('./commands/exo_leaderboard.js');
// const explore = require('./commands/explore.js'); // Deprecated
const fight = require('./commands/fight.js');
const inventory = require('./commands/inventory.js');
const ping = require('./commands/ping.js');
// const sell_stack = require('./commands/sell_stack.js'); // Deprecated
const loot = require('./commands/loot.js');

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
  } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('collections_cat')) {
    try {
      const collections = require('./commands/collections.js');
      await collections.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your collections selection!', ephemeral: true });
      }
    }
  } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('inventory_cat')) {
    try {
      await inventory.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your inventory selection!', ephemeral: true });
      }
    }
  } else if (interaction.isButton() && interaction.customId.startsWith('collections_')) {
    try {
      const collections = require('./commands/collections.js');
      await collections.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your collections pagination!', ephemeral: true });
      }
    }
  } else if (interaction.isStringSelectMenu() && (interaction.customId === 'setactive_house' || interaction.customId === 'setactive_mount' || interaction.customId === 'setactive_familiar')) {
    try {
      await setactive.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your selection!', ephemeral: true });
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
  } else if (interaction.isModalSubmit() && interaction.customId === 'test_modal') {
    try {
      await testmodal.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your test modal!', ephemeral: true });
      }
    }
  } else if (interaction.isModalSubmit() && interaction.customId.startsWith('sell_multi')) {
    try {
      await sell.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your sell modal!', ephemeral: true });
      }
    }
  } else if (interaction.isModalSubmit() && interaction.customId.startsWith('sell_quantity')) {
    try {
      await sell.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your sell modal!', ephemeral: true });
      }
    }
  } else if (
    interaction.isButton() &&
    (interaction.customId.startsWith('inventory_') ||
     interaction.customId.startsWith('sale_summary_prev_') ||
     interaction.customId.startsWith('sale_summary_next_'))
  ) {
    try {
      await inventory.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your inventory action!', ephemeral: true });
      }
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
    // customId format: shop_page_<category>_<page>
    const match = interaction.customId.match(/^shop_page_(\w+)_(-?\d+)$/);
    if (match) {
      const category = match[1];
      const page = parseInt(match[2], 10);
      const shopCommand = client.commands.get('shop');
      if (shopCommand) {
        await shopCommand.execute({ ...interaction, reply: (data) => interaction.update({ ...data, ephemeral: true }) }, page, category);
      }
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
