require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Events, MessageFlags } = require('discord.js');
const shop = require('./commands/shop.js');
const setactive = require('./commands/setactive.js');
const sell = require('./commands/sell.js');
const inventory = require('./commands/inventory.js');


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Helper to safely reply with an ephemeral error message
async function safeReply(interaction, content) {
  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  }
}

// Helper to handle pagination button interactions for commands
async function handlePaginationButton(interaction, commandName, page, ...args) {
  const command = client.commands.get(commandName);
  if (command) {
    await command.execute(
      { ...interaction, reply: (data) => interaction.update({ ...data, flags: MessageFlags.Ephemeral }) },
      page,
      ...args
    );
  }
}

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

// Prepare slash command data for registration
const commands = [];
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  // Auto-register slash commands on startup
  const { REST, Routes } = require('discord.js');
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;


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

// ===== Discord Interaction Event Handling =====
client.on(Events.InteractionCreate, async interaction => {
    // --- Autocomplete Handler ---
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
    // --- Chat Input (Slash) Command Handler ---
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error executing this command!');
    }
    // --- Select Menu Handlers ---
  }else if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') {
    try {
      await shop.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error processing your shop selection!');
    }
  } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('collections_cat')) {
    try {
      const collections = require('./commands/collections.js');
      await collections.execute(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error processing your collections selection!');
    }
  } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('inventory_cat')) {
    try {
      await inventory.execute(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error processing your inventory selection!');
    }
  } else if (interaction.isButton() && interaction.customId.startsWith('collections_')) {
    try {
      const collections = require('./commands/collections.js');
      await collections.execute(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error processing your collections pagination!');
    }
  } else if (interaction.isStringSelectMenu() && (interaction.customId === 'setactive_house' || interaction.customId === 'setactive_mount' || interaction.customId === 'setactive_familiar')) {
    try {
      await setactive.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error processing your selection!');
    }
  } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('sell_')) {
    try {
      await sell.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error processing your sell selection!');
    }
    // --- Modal Submit Handlers ---
  }else if (interaction.isModalSubmit() && interaction.customId.startsWith('sell_multi')) {
    try {
      await sell.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error processing your sell modal!');
    }
  } else if (interaction.isModalSubmit() && interaction.customId.startsWith('sell_quantity')) {
    try {
      await sell.handleSelect(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error processing your sell modal!');
    }
    // --- Button Handlers ---
  }else if (
    interaction.isButton() &&
    (interaction.customId.startsWith('inventory_') ||
     interaction.customId.startsWith('sale_summary_prev_') ||
     interaction.customId.startsWith('sale_summary_next_'))
  ) {
    try {
      await inventory.execute(interaction);
    } catch (error) {
      console.error(error);
      await safeReply(interaction, 'There was an error processing your inventory action!');
    }
  } else if (interaction.isButton() && interaction.customId === 'fight_again') {
    // Rerun the fight command logic for the user, updating the original message
    const fightCommand = client.commands.get('fight');
    if (fightCommand) {
      await fightCommand.execute(interaction, (data) => interaction.update({ ...data, flags: MessageFlags.Ephemeral }));
    }
  } else if (interaction.isButton() && interaction.customId.startsWith('equip_page_')) {
    // Pagination for equip select menu
    const page = parseInt(interaction.customId.replace('equip_page_', ''), 10);
    await handlePaginationButton(interaction, 'equip', page);
  } else if (interaction.isButton() && interaction.customId.startsWith('shop_page_')) {
    // Pagination for shop select menu
    // customId format: shop_page_<category>_<page>
    const match = interaction.customId.match(/^shop_page_(\w+)_(-?\d+)$/);
    if (match) {
      const category = match[1];
      const page = parseInt(match[2], 10);
      await handlePaginationButton(interaction, 'shop', page, category);
    }
  } else if (interaction.isButton() && interaction.customId.startsWith('use_page_')) {
    // Pagination for use select menu
    const page = parseInt(interaction.customId.replace('use_page_', ''), 10);
    await handlePaginationButton(interaction, 'use', page);
  } else if (interaction.isButton() && interaction.customId.startsWith('sell_page_')) {
    // Pagination for sell select menu
    const page = parseInt(interaction.customId.replace('sell_page_', ''), 10);
    await handlePaginationButton(interaction, 'sell', page);
  }
});
client.login(process.env.DISCORD_TOKEN);
