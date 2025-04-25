const { SlashCommandBuilder } = require('discord.js');
const { getCharacter, saveCharacter } = require('../characterModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell_stack')
    .setDescription('Sell a stackable item from your inventory for gold.')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('The name of the item to sell')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option.setName('quantity')
        .setDescription('How many to sell (number or "all")')
        .setRequired(true)
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
    // Suggest stackable items (count > 1 or not unique)
    const seen = new Set();
    let items = character.inventory
      .filter(item => {
        let name = typeof item === 'string' ? item : item.name;
        if (!name || name.toLowerCase() === 'gold' || seen.has(name)) return false;
        let count = (typeof item === 'object' && item.count) ? item.count : 1;
        seen.add(name);
        return count > 1 || (typeof item === 'object' && !item.uses);
      })
      .map(item => {
        let name = typeof item === 'string' ? item : item.name;
        let count = (typeof item === 'object' && item.count) ? item.count : 1;
        return { name, value: name, count };
      });
    // Fuzzy match: prioritize starts-with, then includes, then others
    if (input) {
      items = items.filter(i => i.name.toLowerCase().includes(input));
      items.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        // Prioritize startsWith
        const aStarts = aName.startsWith(input);
        const bStarts = bName.startsWith(input);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        // Then shorter names
        if (aName.length !== bName.length) return aName.length - bName.length;
        // Then higher count
        return b.count - a.count;
      });
    }
    // Show count in suggestion label
    const suggestions = items.slice(0, 25).map(i => ({
      name: `${i.name} (${i.count})`,
      value: i.name
    }));
    await interaction.respond(suggestions);
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    
    let character = await getCharacter(userId);
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to sell from!', ephemeral: true });
      return;
    }
    const itemName = interaction.options.getString('item');
    let quantity = interaction.options.getString('quantity');
    let invIdx = character.inventory.findIndex(item => {
      let name = typeof item === 'string' ? item : item.name;
      return name === itemName;
    });
    if (invIdx === -1) {
      await interaction.reply({ content: `You do not have any ${itemName} to sell.`, ephemeral: true });
      return;
    }
    let item = character.inventory[invIdx];
    let name = typeof item === 'string' ? item : item.name;
    let price = (typeof item === 'object' && item.price) ? item.price : 10;
    let count = (typeof item === 'object' && item.count) ? item.count : 1;
    if (quantity === 'all') quantity = count;
    else quantity = parseInt(quantity, 10);
    if (!quantity || quantity < 1 || quantity > count) {
      await interaction.reply({ content: `You can only sell between 1 and ${count} of your ${name}.`, ephemeral: true });
      return;
    }
    // Remove/sell the quantity
    let goldEarned = price * quantity;
    if (typeof item === 'object' && item.count && item.count > quantity) {
      item.count -= quantity;
      character.inventory[invIdx] = item;
    } else {
      character.inventory.splice(invIdx, 1);
    }
    // Add gold
    const addGoldToInventory = require('../addGoldToInventory');
    addGoldToInventory(character.inventory, goldEarned);
    await saveCharacter(userId, character);
    await interaction.reply({
      content: `✅ Sold **${name}** x${quantity} for ${goldEarned} Gold!`,
      ephemeral: true
    });
  }
};
