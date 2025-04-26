const { SlashCommandBuilder } = require('discord.js');


const { getCharacter, saveCharacter } = require('../characterModel');



// Usable items will be pulled from the lootTable based on the presence of a 'uses' property
const { lootTable } = require('./loot');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('use')
    .setDescription('Use an item from your inventory.')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('The name of the item to use')
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
        // Usable: must have 'uses' property or be a potion
        return (typeof item === 'object' && (item.uses || (item.type && item.type.toLowerCase() === 'potion')));
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
    
    let character = await getCharacter(userId);
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to use from!', ephemeral: true });
      return;
    }
    const itemName = interaction.options.getString('item');
    let invIdx = character.inventory.findIndex(item => {
      let name = typeof item === 'string' ? item : item.name;
      return name === itemName;
    });
    if (invIdx === -1) {
      await interaction.reply({ content: `You do not have any ${itemName} to use.`, ephemeral: true });
      return;
    }
    let item = character.inventory[invIdx];
    // Usable: must have 'uses' property or be a potion
    const isUsable = (typeof item === 'object' && (item.uses || (item.type && item.type.toLowerCase() === 'potion')));
    if (!isUsable) {
      await interaction.reply({ content: `${itemName} cannot be used.`, ephemeral: true });
      return;
    }
    // Use logic (decrement uses/count, remove if depleted, apply effects if needed)
    let usedMsg = '';
    // Find lootTable entry for stat/boost
    const lootEntry = lootTable.find(l => l.name === itemName && l.type && l.type.toLowerCase() === 'potion');
    let boostMsg = '';
    if (lootEntry && lootEntry.stat && lootEntry.stat !== 'revive') {
      if (!Array.isArray(character.activeEffects)) character.activeEffects = [];
      const stat = lootEntry.stat;
      const boost = lootEntry.boost || 1;
      const usesLeft = lootEntry.effectUses || 5;
      character.activeEffects.push({ stat, boost, usesLeft });
      boostMsg = `\n+${boost} ${stat.charAt(0).toUpperCase() + stat.slice(1)} for ${usesLeft} fights/explores!`;
    }
    // Always use count for potions (stackable logic)
    if (item.type && item.type.toLowerCase() === 'potion') {
      if (item.count && item.count > 1) {
        item.count -= 1;
        usedMsg = `You used **${itemName}**. (${item.count} left)`;
        character.inventory[invIdx] = item;
      } else {
        character.inventory.splice(invIdx, 1);
        usedMsg = `You used **${itemName}**. It is now gone!`;
      }
    } else if (item.uses) {
      item.uses -= 1;
      usedMsg = `You used **${itemName}**. (${item.uses} uses left)`;
      if (item.uses <= 0) {
        character.inventory.splice(invIdx, 1);
        usedMsg = `You used **${itemName}**. It is now depleted!`;
      } else {
        character.inventory[invIdx] = item;
      }
    } else if (item.count && item.count > 1) {
      item.count -= 1;
      usedMsg = `You used **${itemName}**. (${item.count} left)`;
      character.inventory[invIdx] = item;
    } else {
      character.inventory.splice(invIdx, 1);
      usedMsg = `You used **${itemName}**. It is now gone!`;
    }
    await saveCharacter(userId, character);
    await interaction.reply({ content: `✅ ${usedMsg}${boostMsg}`, ephemeral: true });
  }
};
