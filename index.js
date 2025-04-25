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
  } else if (interaction.isStringSelectMenu() && interaction.customId === 'sell_select') {
    try {
      await sell.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your sell selection!', ephemeral: true });
      }
    }
  } else if (interaction.isStringSelectMenu() && interaction.customId === 'equip_select') {
    try {
      await equip.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your equip selection!', ephemeral: true });
      }
    }
  } else if (interaction.isStringSelectMenu() && interaction.customId === 'use_select') {
    try {
      await use.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error processing your use selection!', ephemeral: true });
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
  }
});

client.login(process.env.DISCORD_TOKEN);

// TODO: Add RPG features (character, exploration, combat, inventory, leveling)
