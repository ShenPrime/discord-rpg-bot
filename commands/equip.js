const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getCharacter, saveCharacter } = require('../characterModel');
const fightSessionManager = require('../fightSessionManager');

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
    
    let character = await getCharacter(userId);
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
        let statLabel = '';
        if (typeof item === 'object' && item.stats) {
          const statMap = { strength: 'STR', defense: 'DEF', luck: 'LUK' };
          statLabel = Object.entries(item.stats)
            .map(([stat, val]) => `+${val} ${statMap[stat] || stat}`)
            .join(', ');
          if (statLabel) statLabel = ` (${statLabel})`;
        }
        return { name: `${name}${statLabel}${count > 1 ? ` x${count}` : ''}`, value: name, count };
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
      name: i.name,
      value: i.value
    }));
    await interaction.respond(suggestions);
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    // Flush any pending fight session for this user before equip command
    await fightSessionManager.flushIfExists(userId);
    let character = await getCharacter(userId);
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to equip from!', flags: MessageFlags.Ephemeral });
      return;
    }
    const itemName = interaction.options.getString('item');
    let invIdx = character.inventory.findIndex(item => {
      let name = typeof item === 'string' ? item : item.name;
      return name === itemName;
    });
    if (invIdx === -1) {
      await interaction.reply({ content: `You do not have any ${itemName} to equip.`, flags: MessageFlags.Ephemeral });
      return;
    }
    let item = character.inventory[invIdx];
    if (!isEquipable(item)) {
      await interaction.reply({ content: `${itemName} cannot be equipped.`, flags: MessageFlags.Ephemeral });
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
        // Always merge unequipped item using mergeOrAddInventoryItem for correct stacking
        mergeOrAddInventoryItem(character.inventory, { ...lootObj, count: 1 });
      } else {
        // fallback for legacy or unknown, always merge as string item
        mergeOrAddInventoryItem(character.inventory, typeof unequipped === 'object' ? { ...unequipped, count: 1 } : { name: unequipped, count: 1 });
      }
    }
    character.equipment[slot] = itemName; // Store only the name
    // Remove one from inventory (decrement count if stackable)
    if (typeof item === 'object' && item.count && item.count > 1) {
      character.inventory[invIdx].count -= 1;
    } else {
      character.inventory.splice(invIdx, 1);
    }
    await saveCharacter(userId, character);
    let msg = `✅ Equipped **${itemName}** in slot ${slot}.`;
    if (unequipped) msg += ` (Unequipped **${unequipped}**.)`;
    await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
  }
};
