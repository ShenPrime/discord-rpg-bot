const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const CHARACTERS_FILE = path.join(__dirname, '../characters.json');
const { getCharacter, saveCharacter } = require('../characterModel');


// No ITEM_EFFECTS needed; use lootTable for slot and stats
const { lootTable } = require('./loot');

// Helper: determine if an item is equipable
function isEquipable(item) {
  if (!item) return false;
  if (typeof item === 'string') return false;
  // Must have a slot (weapon, armor, etc)
  return !!item.slot;
}

const mergeOrAddInventoryItem = require('../mergeOrAddInventoryItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('equip')
    .setDescription('Equip an item from your inventory.')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('The name of the item to equip')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.respond([]);
      return;
    }
    const focused = interaction.options.getFocused(true);
    const input = (focused && focused.value ? focused.value : '').toLowerCase();
    const seen = new Set();
    let items = character.inventory
      .filter(item => {
        let name = typeof item === 'string' ? item : item.name;
        if (!name || name.toLowerCase() === 'gold' || seen.has(name)) return false;
        seen.add(name);
        return isEquipable(item);
      })
      .map(item => {
        let name = typeof item === 'string' ? item : item.name;
        let count = (typeof item === 'object' && item.count) ? item.count : 1;
        return { name, value: name, count };
      });
    if (input) {
      items = items.filter(i => i.name.toLowerCase().includes(input));
      items.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(input);
        const bStarts = bName.startsWith(input);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        if (aName.length !== bName.length) return aName.length - bName.length;
        return b.count - a.count;
      });
    }
    const suggestions = items.slice(0, 25).map(i => ({
      name: `${i.name} (${i.count})`,
      value: i.name
    }));
    await interaction.respond(suggestions);
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to equip from!', ephemeral: true });
      return;
    }
    const itemName = interaction.options.getString('item');
    let invIdx = character.inventory.findIndex(item => {
      let name = typeof item === 'string' ? item : item.name;
      return name === itemName;
    });
    if (invIdx === -1) {
      await interaction.reply({ content: `You do not have any ${itemName} to equip.`, ephemeral: true });
      return;
    }
    let item = character.inventory[invIdx];
    if (!isEquipable(item)) {
      await interaction.reply({ content: `${itemName} cannot be equipped.`, ephemeral: true });
      return;
    }
    // Equip logic (simple version: equip to the slot, unequip old if needed)
    if (!character.equipment) character.equipment = {};
    const slot = item.slot;
    let unequipped = null;
    if (character.equipment[slot]) {
      // Unequip current (always a string: item name)
      unequipped = character.equipment[slot];
      // Find a matching item object in lootTable or create a string fallback
      const { lootTable } = require('./loot');
      let lootObj = lootTable.find(i => i.name === unequipped);
      if (lootObj) {
        mergeOrAddInventoryItem(character.inventory, { ...lootObj });
      } else {
        // fallback for legacy or unknown, just push
        character.inventory.push(unequipped);
      }
    }
    character.equipment[slot] = itemName; // Store only the name
    // Remove from inventory
    character.inventory.splice(invIdx, 1);
    await saveCharacter(userId, character);
    let msg = `✅ Equipped **${itemName}** in slot ${slot}.`;
    if (unequipped) msg += ` (Unequipped **${unequipped}**.)`;
    await interaction.reply({ content: msg, ephemeral: true });
  }
};
