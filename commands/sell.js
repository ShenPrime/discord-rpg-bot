const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const CHARACTERS_FILE = path.join(__dirname, '../characters.json');

const { getCharacter, saveCharacter } = require('../characterModel');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell individual items with count 1 from your inventory.'),

  async execute(interaction, page = 0, categoryArg = null) {
    // Step 1: Show category select menu or show items in category
    const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
    const paginateSelectMenu = require('../paginateSelectMenu');
    const categories = [
      { label: 'Weapons', value: 'Weapon' },
      { label: 'Armor', value: 'Armor' },
      { label: 'Potions', value: 'Potion' },
      { label: 'Gems', value: 'Gem' }
    ];
    if (!categoryArg) {
      const catRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('sell_category')
          .setPlaceholder('Select a category to sell from')
          .addOptions(categories)
      );
      await interaction.reply({
        content: 'Select a category to sell from:',
        components: [catRow],
        ephemeral: true
      });
      return;
    }
    // Show items in the selected category
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to sell from!', ephemeral: true });
      return;
    }
    // Filter count:1 items by category
    const items = character.inventory.map((item, idx) => ({...item, __invIdx: idx}))
      .filter(item => {
        if (!item || typeof item !== 'object') return false;
        const count = item.count || 1;
        if (count !== 1) return false;
        if (/gold/i.test(item.name)) return false;
        return item.type === categoryArg;
      });
    if (!items.length) {
      await interaction.reply({
        content: `You have no ${categoryArg.toLowerCase()}s to sell!`,
        components: [],
        ephemeral: true
      });
      return;
    }
    // Build options for select menu
    const options = items.map(item => ({
      label: `${item.name} - ${item.price || 10} Gold`,
      value: String(item.__invIdx),
      description: item.name.length < 90 ? item.name : item.name.slice(0, 90)
    }));
    const { components, currentPage, totalPages, content } = paginateSelectMenu({
      choices: options,
      page,
      selectCustomId: `sell_item_${categoryArg}`,
      buttonCustomIdPrefix: `sell_page_${categoryArg}_`,
      placeholder: `Select one or more ${categoryArg.toLowerCase()}s to sell`,
      minValues: 1,
      maxValues: 10,
      contentPrefix: `Select one or more ${categoryArg.toLowerCase()}s to sell:`
    });
    await interaction.reply({
      content,
      components,
      ephemeral: true
    });
    return;
  },
  async handleSelect(interaction) {
    const paginateSelectMenu = require('../paginateSelectMenu');
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to sell from!', ephemeral: true });
      return;
    }
    // Step 1: Category selection
    if (interaction.customId === 'sell_category') {
      const category = interaction.values[0];
      // Show first page of items in category
      await module.exports.execute(interaction, 0, category);
      return;
    }
    // Pagination for item select menu
    if (/^sell_page_([A-Za-z]+)_/.test(interaction.customId)) {
      const match = interaction.customId.match(/^sell_page_([A-Za-z]+)_(\d+)$/);
      if (!match) {
        await interaction.reply({ content: 'Invalid page navigation.', ephemeral: true });
        return;
      }
      const category = match[1];
      const page = parseInt(match[2], 10);
      await module.exports.execute(interaction, page, category);
      return;
    }
    // Step 2: Item selection
    if (/^sell_item_([A-Za-z]+)/.test(interaction.customId)) {
      const match = interaction.customId.match(/^sell_item_([A-Za-z]+)/);
      const category = match ? match[1] : null;
      if (!category) {
        await interaction.reply({ content: 'Invalid item selection.', ephemeral: true });
        return;
      }
      const addGoldToInventory = require('../addGoldToInventory');
      let soldItems = [];
      let totalGold = 0;
      // Sort indices descending so splicing doesn't affect subsequent indices
      const selectedIndices = interaction.values.map(Number).sort((a, b) => b - a);
      for (const invIdx of selectedIndices) {
        const item = character.inventory[invIdx];
        if (!item || typeof item !== 'object' || (item.count || 1) !== 1 || /gold/i.test(item.name)) {
          continue;
        }
        const price = item.price || 10;
        soldItems.push(`**${item.name}** for ${price} Gold`);
        totalGold += price;
        character.inventory.splice(invIdx, 1);
      }
      if (soldItems.length === 0) {
        await interaction.update({ content: 'No valid items were selected to sell.', components: [], ephemeral: true });
        return;
      }
      addGoldToInventory(character.inventory, totalGold);
      await saveCharacter(userId, character);
      await interaction.update({
        content: `✅ Sold ${soldItems.join(', ')}!\nTotal Gold Earned: ${totalGold}`,
        components: [],
        ephemeral: true
      });
      return;
    }
    // Fallback
    await interaction.reply({ content: 'Invalid selection.', ephemeral: true });
  }
};

// Usage: if (interaction.isStringSelectMenu() && interaction.customId === 'sell_select') await sell.handleSelect(interaction);
