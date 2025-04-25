const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Loot table extracted from explore.js/fight.js for shop
// Character file helpers
const { getCharacter, saveCharacter } = require('../characterModel');

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

  async execute(interaction, page = 0) {
    const paginateSelectMenu = require('../paginateSelectMenu');
    const category = interaction.options.getString('category');
    const userId = interaction.user.id;
    
    let character = await getCharacter(userId);
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
      choices = armorTable.map(a => {
        let stats = '';
        if (a.stats && typeof a.stats === 'object') {
          stats = Object.entries(a.stats)
            .map(([stat, val]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)} +${val}`)
            .join(', ');
        }
        return {
          label: a.name,
          value: a.name,
          description: `${a.rarity} - ${a.price} Gold${stats ? ' | ' + stats : ''}`
        };
      });
    } else if (category === 'Weapon') {
      choices = weaponTable.map(w => {
        let stats = '';
        if (w.stats && typeof w.stats === 'object') {
          stats = Object.entries(w.stats)
            .map(([stat, val]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)} +${val}`)
            .join(', ');
        }
        return {
          label: w.name,
          value: w.name,
          description: `${w.rarity} - ${w.price} Gold${stats ? ' | ' + stats : ''}`
        };
      });
    } else if (category === 'Potion') {
      choices = potionTable.map(p => {
        let statBoost = '';
        if (p.stat && p.boost) {
          statBoost = `${p.stat.charAt(0).toUpperCase() + p.stat.slice(1)} +${p.boost}`;
        }
        return {
          label: p.name,
          value: p.name,
          description: `${p.rarity} - ${p.price} Gold${statBoost ? ' | ' + statBoost : ''}`
        };
      });
    }
    // Send select menu
    if (choices.length === 0) {
      await interaction.reply({ content: `There is nothing to buy in the ${category} shop.`, ephemeral: true });
      return;
    }
    // Use global pagination utility
    const { components, currentPage, totalPages, content } = paginateSelectMenu({
      choices,
      page,
      selectCustomId: 'shop_select',
      buttonCustomIdPrefix: 'shop_page_',
      placeholder: 'Select what you want to buy',
      minValues: 1,
      maxValues: 10,
      contentPrefix: `Select what you want to buy from the ${category} shop:`
    });
    await interaction.reply({
      content,
      components,
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
    
    let character = await getCharacter(userId);
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
    await saveCharacter(userId, character);
    await interaction.update({
      content: purchaseResults.join('\n') + `\nRemaining gold: ${gold} Gold`,
      components: [],
      ephemeral: true
    });
  }
};

// Export the select menu handler for use in your main bot file
// Usage: if (interaction.isStringSelectMenu() && interaction.customId === 'shop_select') await shop.handleSelect(interaction);
