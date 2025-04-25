const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const CHARACTERS_FILE = path.join(__dirname, '../characters.json');

const { loadCharacters, saveCharacters } = require('../characterUtils');

// No ITEM_EFFECTS needed; use lootTable for slot and stats
const { lootTable } = require('./loot');
const mergeOrAddInventoryItem = require('../mergeOrAddInventoryItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('equip')
    .setDescription('Equip an item from your inventory to boost your stats.'),
    // No string option, use select menu instead

  async execute(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to equip from!', ephemeral: true });
      return;
    }
    // Only show equippable items, support both string and object formats
    const inventoryNames = character.inventory.map(item => typeof item === 'string' ? item : item.name);
    // Only items in lootTable with a slot property are equippable
    const equippableItems = lootTable.filter(item => item.slot);
    const uniqueEquippable = [...new Set(inventoryNames.filter(itemName => equippableItems.find(eq => eq.name === itemName)))];
    if (uniqueEquippable.length === 0) {
      await interaction.reply({ content: 'You have no equippable items.', ephemeral: true });
      return;
    }
    const options = uniqueEquippable.map(itemName => {
      const lootItem = equippableItems.find(eq => eq.name === itemName);
      let statsStr = '';
      if (lootItem && lootItem.stats) {
        statsStr = Object.entries(lootItem.stats)
          .map(([k, v]) => `+${v} ${k.slice(0,3).toUpperCase()}`)
          .join(', ');
      }
      return {
        label: `${itemName}${statsStr ? ' (' + statsStr + ')' : ''}`,
        value: itemName,
        description: statsStr || undefined
      };
    });
    await interaction.reply({
      content: 'Select the item you want to equip:',
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: 'equip_select',
              min_values: 1,
              max_values: 1,
              options
            }
          ]
        }
      ],
      ephemeral: true
    });
  },

  async handleSelect(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to equip from!', ephemeral: true });
      return;
    }
    const itemName = interaction.values[0];
    // Find the first matching item in inventory (support string/object)
    const invIdx = character.inventory.findIndex(item => (typeof item === 'string' ? item : item.name) === itemName);
    if (invIdx === -1) {
      await interaction.reply({ content: `You do not have "${itemName}" in your inventory.`, ephemeral: true });
      return;
    }
    // Look up the item in lootTable for slot and stats
    const lootItem = lootTable.find(i => i.name === itemName && i.slot);
    if (!lootItem) {
      await interaction.reply({ content: `"${itemName}" cannot be equipped.`, ephemeral: true });
      return;
    }
    if (!character.equipment) character.equipment = {};
    let slot = lootItem.slot;
    let replaced = null;
    // Special handling for rings (2 slots)
    if (slot === 'ring') {
      if (!character.equipment.ring1) {
        slot = 'ring1';
      } else if (!character.equipment.ring2) {
        slot = 'ring2';
      } else {
        // Both slots filled, replace ring1 by default
        slot = 'ring1';
        replaced = character.equipment[slot];
      }
    } else if (slot === 'necklace') {
      slot = 'necklace';
      if (character.equipment[slot]) {
        replaced = character.equipment[slot];
      }
    } else {
      if (character.equipment[slot]) {
        replaced = character.equipment[slot];
      }
    }
    // Properly stack or merge replaced item into inventory using full lootTable object
    if (replaced) {
      // Find the full item object in lootTable
      let replacedObj = null;
      if (typeof replaced === 'object' && replaced.name) {
        replacedObj = lootTable.find(i => i.name === replaced.name);
      } else if (typeof replaced === 'string') {
        replacedObj = lootTable.find(i => i.name === replaced);
      }
      // Fallback: use replaced as-is if not found
      if (!replacedObj) replacedObj = typeof replaced === 'object' ? replaced : { name: replaced };
      // Stack if possible
      if (!replacedObj.uses) {
        mergeOrAddInventoryItem(character.inventory, { ...replacedObj, count: replaced.count || 1 });
      } else {
        character.inventory.push({ ...replacedObj });
      }
    }
    // Remove the equipped item from inventory (handle count if present)
    if (typeof character.inventory[invIdx] === 'object' && character.inventory[invIdx].count) {
      character.inventory[invIdx].count -= 1;
      if (character.inventory[invIdx].count === 0) {
        character.inventory.splice(invIdx, 1);
      }
    } else {
      character.inventory.splice(invIdx, 1);
    }
    character.equipment[slot] = itemName;
    saveCharacters(characters);
    await interaction.update({ content: `You equipped **${itemName}** in your ${slot} slot.${replaced ? ` (Replaced ${replaced})` : ''}`, components: [], ephemeral: true });
  }
};
