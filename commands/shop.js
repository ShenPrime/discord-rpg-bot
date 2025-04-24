const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const CHARACTERS_FILE = path.join(__dirname, '../characters.json');

// Loot table extracted from explore.js/fight.js for shop
// Character file helpers
function loadCharacters() {
  if (!fs.existsSync(CHARACTERS_FILE)) return {};
  try {
    const data = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}
function saveCharacters(characters) {
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));
}

const { lootTable } = require('./loot');

// Houses (scaling size & price)
const HOUSES = [
  { name: 'Cottage', size: 'Small', price: 50000, description: 'A cozy cottage. Modest but homey.' },
  { name: 'Townhouse', size: 'Medium', price: 100000, description: 'A comfortable townhouse in the city.' },
  { name: 'Villa', size: 'Large', price: 200000, description: 'A luxurious villa with gardens.' },
  { name: 'Mansion', size: 'Huge', price: 500000, description: 'A sprawling mansion with many rooms.' },
  { name: 'Castle', size: 'Epic', price: 1000000, description: 'A legendary castle fit for a king or queen.' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse the shop and buy items or houses.')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Category to browse')
        .setRequired(true)
        .addChoices(
          { name: 'Weapons', value: 'Weapon' },
          { name: 'Armor', value: 'Armor' },
          { name: 'Potions', value: 'Potion' },
          { name: 'Houses', value: 'House' }
        )
    ),

  // No autocomplete: item selection is handled via select menus in execute()

  async execute(interaction) {
    const category = interaction.options.getString('category');
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    // Gold handling: support both gold as a number and as inventory items
    let gold = 0;
    if (character && Array.isArray(character.inventory)) {
      for (const i of character.inventory) {
        let n = typeof i === 'string' ? i : i.name;
        const m = n && n.match(/(\d+) Gold/i);
        if (m) gold += parseInt(m[1], 10);
      }
    }
    // Prepare dropdown/select menu
    let choices = [];
    if (category === 'House') {
      choices = HOUSES.map(h => ({ label: h.name, value: h.name, description: `${h.size} - ${h.price} Gold` }));
    } else {
      choices = lootTable.filter(i => (i.type || i.category) === category).map(i => ({ label: i.name, value: i.name, description: `${i.rarity} - ${i.price} Gold` }));
    }
    // Send select menu
    await interaction.reply({
      content: `Select what you want to buy from the ${category} shop:`,
      components: [
        {
          type: 1, // ACTION_ROW
          components: [
            {
              type: 3, // SELECT_MENU
              custom_id: 'shop_select',
              min_values: 1,
              max_values: Math.min(choices.length, 10), // Discord max is 25, but 10 is reasonable for multi-buy
              options: choices
            }
          ]
        }
      ],
      ephemeral: true
    });
  },

  // Handle select menu interaction
  async handleSelect(interaction) {
    // Try to retrieve category from the original reply message content
    let category = null;
    if (interaction.message && interaction.message.content) {
      const match = interaction.message.content.match(/from the (\w+) shop/i);
      if (match) category = match[1];
    }
    if (!category) {
      await interaction.reply({ content: 'Could not determine shop category. Please try again.', ephemeral: true });
      return;
    }
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    let gold = 0;
    if (character && Array.isArray(character.inventory)) {
      for (const i of character.inventory) {
        let n = typeof i === 'string' ? i : i.name;
        const m = n && n.match(/(\d+) Gold/i);
        if (m) gold += parseInt(m[1], 10);
      }
    }
    // Get selected items
    const selected = interaction.values;
    let purchaseResults = [];
    for (const itemName of selected) {
      let shopItem = null;
      if (category === 'House') {
        shopItem = HOUSES.find(h => h.name === itemName);
      } else {
        shopItem = lootTable.find(i => i.name === itemName && (i.type || i.category) === category);
      }
      if (!shopItem) continue;
      if (gold < shopItem.price) {
        purchaseResults.push(`❌ Not enough gold for **${shopItem.name}** (costs ${shopItem.price}, you have ${gold})`);
        continue;
      }
      // Deduct gold
      let goldToRemove = shopItem.price;
      let newInventory = [];
      for (const i of character.inventory) {
        let n = typeof i === 'string' ? i : i.name;
        const m = n && n.match(/(\d+) Gold/i);
        if (m && goldToRemove > 0) {
          let amt = parseInt(m[1], 10);
          if (amt <= goldToRemove) {
            goldToRemove -= amt;
            continue;
          } else {
            newInventory.push({ name: `${amt - goldToRemove} Gold`, rarity: 'common', price: amt - goldToRemove });
            goldToRemove = 0;
            continue;
          }
        }
        newInventory.push(i);
      }
      character.inventory = newInventory;
      // Add item or set house
      if (category === 'House') {
        character.house = shopItem;
        purchaseResults.push(`🏠 Bought **${shopItem.name}** for ${shopItem.price} Gold!`);
      } else {
        character.inventory.push(shopItem);
        purchaseResults.push(`✅ Bought **${shopItem.name}** for ${shopItem.price} Gold!`);
      }
      gold -= shopItem.price;
    }
    characters[userId] = character;
    saveCharacters(characters);
    await interaction.update({
      content: purchaseResults.join('\n') + `\nRemaining gold: ${gold} Gold`,
      components: [],
      ephemeral: true
    });
  }
};

// Export the select menu handler for use in your main bot file
// Usage: if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') await shop.handleSelect(interaction);
