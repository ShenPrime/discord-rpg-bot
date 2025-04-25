const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const CHARACTERS_FILE = path.join(__dirname, '../characters.json');

// Loot table extracted from explore.js/fight.js for shop
// Character file helpers
const { loadCharacters, saveCharacters } = require('../characterUtils');

const { houseTable, mountTable, armorTable, weaponTable, potionTable } = require('./loot');
const mergeOrAddInventoryItem = require('../mergeOrAddInventoryItem');

// Houses (scaling size & price)

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
          { name: 'Houses', value: 'House' },
          { name: 'Mounts', value: 'Mount' },
        )
    ),

  // No autocomplete: item selection is handled via select menus in execute()

  async execute(interaction) {
    const category = interaction.options.getString('category');
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    // Gold handling: sum both 'Gold' (with count) and 'X Gold' (with amount or name)
    let gold = 0;
    if (character && Array.isArray(character.inventory)) {
      for (const i of character.inventory) {
        if (typeof i === 'object') {
          if (i.name === 'Gold') {
            gold += i.count || 0;
          } else {
            const m = i.name && i.name.match(/(\d+) Gold/i);
            if (m) gold += i.amount || parseInt(m[1], 10) || 0;
          }
        }
      }
    }
    // Prepare dropdown/select menu
    let choices = [];
    if (category === 'House') {
      choices = houseTable.map(h => ({ label: h.name, value: h.name, description: `${h.size} - ${h.price} Gold` }));
    } else if (category === 'Mount') {
      choices = mountTable.map(m => ({ label: m.name, value: m.name, description: `${m.price} Gold` }));
    } else if (category === 'Armor') {
      choices = armorTable.map(a => ({ label: a.name, value: a.name, description: `${a.rarity} - ${a.price} Gold` }));
    } else if (category === 'Weapon') {
      choices = weaponTable.map(w => ({ label: w.name, value: w.name, description: `${w.rarity} - ${w.price} Gold` }));
    } else if (category === 'Potion') {
      choices = potionTable.map(p => ({ label: p.name, value: p.name, description: `${p.rarity} - ${p.price} Gold` }));
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
    let goldIdx = -1;
    if (character && Array.isArray(character.inventory)) {
      character.inventory.forEach((i, idx) => {
        if (typeof i === 'object') {
          if (i.name === 'Gold') {
            gold += i.count || 0;
            goldIdx = idx;
          } else {
            const m = i.name && i.name.match(/(\d+) Gold/i);
            if (m) gold += i.amount || parseInt(m[1], 10) || 0;
          }
        }
      });
    }
    // Get selected items
    const selected = interaction.values;
    let purchaseResults = [];
    for (const itemName of selected) {
      let shopItem = null;
      if (category === 'House') {
        shopItem = houseTable.find(h => h.name === itemName);
      } else if (category === 'Mount') {
        shopItem = mountTable.find(m => m.name === itemName);
      } else if (category === 'Armor') {
        shopItem = armorTable.find(a => a.name === itemName);
      } else if (category === 'Weapon') {
        shopItem = weaponTable.find(w => w.name === itemName);
      } else if (category === 'Potion') {
        shopItem = potionTable.find(p => p.name === itemName);
      }
      if (!shopItem) continue;
      if (gold < shopItem.price) {
        purchaseResults.push(`❌ Not enough gold for **${shopItem.name}** (costs ${shopItem.price}, you have ${gold})`);
        continue;
      }
      // Deduct gold from single gold entry
      if (goldIdx !== -1) {
        character.inventory[goldIdx].count -= shopItem.price;
        if (character.inventory[goldIdx].count <= 0) {
          character.inventory.splice(goldIdx, 1);
        }
      }
      gold -= shopItem.price;
      // Add item or set house
      if (category === 'House') {
        character.house = shopItem;
        purchaseResults.push(`🏠 Bought **${shopItem.name}** for ${shopItem.price} Gold!`);
      } else if (category === 'Mount') {
        character.mount = shopItem;
        purchaseResults.push(`🐎 Bought **${shopItem.name}** for ${shopItem.price} Gold!`);
      } else {
        // Use count property for stackable items
        // All items except those with 'uses' should be stackable
        const isStackable = !shopItem.uses;
        if (isStackable) {
          // Find an unequipped, matching item (all properties except count)
          mergeOrAddInventoryItem(character.inventory, shopItem);
        } else {
          character.inventory.push({ ...shopItem, count: 1 });
        }
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
