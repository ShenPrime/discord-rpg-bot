const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');


const { getCharacter, saveCharacter } = require('../characterModel');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell individual items with count 1 from your inventory.'),

  async execute(interaction, page = 0) {
    // Show all sellable items (count: 1, not gold), paginated
    const paginateSelectMenu = require('../paginateSelectMenu');
    const userId = interaction.user.id;
    let character = await getCharacter(userId);
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to sell from!', ephemeral: true });
      return;
    }
    // Filter sellable items (count: 1, not gold), must actually exist in inventory and not be equipped
    // Remove equipped items from sellable pool
    const equippedNames = new Set();
    if (character.equipment) {
      for (const eq of Object.values(character.equipment)) {
        if (eq && typeof eq === 'string') equippedNames.add(eq);
      }
    }
    const items = character.inventory.map((item, idx) => ({ ...item, __invIdx: idx }))
      .filter(item => {
        if (!item || typeof item !== 'object') return false;
        const count = item.count || 1;
        if (count < 1) return false;
        if (/gold/i.test(item.name)) return false;
        if (equippedNames.has(item.name)) return false;
        return true;
      });
    if (!items.length) {
      await interaction.reply({
        content: `You have no items to sell!`,
        components: [],
        ephemeral: true
      });
      return;
    }
    // Build options for select menu
    const options = items.map(item => ({
      label: `${item.name} - ${item.price || 10} Gold${item.count > 1 ? ` (x${item.count})` : ''}`,
      value: String(item.__invIdx),
      description: item.name.length < 90 ? item.name : item.name.slice(0, 90)
    }));
    const { components, currentPage, totalPages, content } = paginateSelectMenu({
      choices: options,
      page,
      selectCustomId: `sell_item`,
      buttonCustomIdPrefix: `sell_page_`,
      placeholder: `Select one or more items to sell`,
      minValues: 1,
      maxValues: 10,
      contentPrefix: `Select one or more items to sell:`
    });
    await interaction.reply({
      content,
      components,
      ephemeral: true
    });
    return;
  },
  async handleSelect(interaction) {
    const delimiter = '|||';
    const paginateSelectMenu = require('../paginateSelectMenu');
    const userId = interaction.user.id;
    
    let character = await getCharacter(userId);
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to sell from!', ephemeral: true });
      return;
    }
    // Pagination for item select menu
    if (/^sell_page_(\d+)$/.test(interaction.customId)) {
      const match = interaction.customId.match(/^sell_page_(\d+)$/);
      if (!match) {
        await interaction.reply({ content: 'Invalid page navigation.', ephemeral: true });
        return;
      }
      const page = parseInt(match[1], 10);
      await module.exports.execute(interaction, page);
      return;
    }
    // Step 2: Item selection
    if (interaction.customId === 'sell_item') {
      const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
      const userId = interaction.user.id;
      let character = await getCharacter(userId);
      // Enhanced selection logic
      const selectedIndices = interaction.values.map(Number);
      const selectedItems = selectedIndices.map(idx => character.inventory[idx]);
      const stackables = selectedItems.filter(item => item && typeof item === 'object' && item.count > 1);
      const singles = selectedItems.filter(item => item && typeof item === 'object' && (!item.count || item.count === 1));
      const invalids = selectedItems.filter(item => !item || typeof item !== 'object' || /gold/i.test(item.name));

      if (invalids.length > 0) {
        await interaction.update({ content: 'One or more invalid items selected.', components: [], ephemeral: true });
        return;
      }

      if (stackables.length === 1 && singles.length === 0) {
        // Exactly one stackable item selected: show modal for quantity
        const item = stackables[0];
        // Use encodeURIComponent to safely encode name (and rarity if needed) in modal customId
        const encodedName = encodeURIComponent(item.name);
        const encodedRarity = encodeURIComponent(item.rarity || '');
        const delimiter = '|||';
        const modal = new ModalBuilder()
          .setCustomId(`sell_quantity${delimiter}${encodedName}${delimiter}${encodedRarity}`)
          .setTitle(`Sell ${item.name}`);
        const qtyInput = new TextInputBuilder()
          .setCustomId('quantity')
          .setLabel(`How many to sell? (1-${item.count})`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Enter quantity');
        modal.addComponents(new ActionRowBuilder().addComponents(qtyInput));
        await interaction.showModal(modal);
        return;
      } else if (stackables.length === 0 && singles.length > 0) {
        // All single-count items: sell all at once
        const addGoldToInventory = require('../addGoldToInventory');
        let soldItems = [];
        let totalGold = 0;
        // Sort indices descending so splicing doesn't affect subsequent indices
        for (const idx of selectedIndices.sort((a, b) => b - a)) {
          const item = character.inventory[idx];
          const price = item.price || 10;
          soldItems.push(`**${item.name}** for ${price} Gold`);
          totalGold += price;
          character.inventory.splice(idx, 1);
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
      } else {
        // Invalid selection: either multiple stackables, or mix of stackable and singles
        await interaction.update({
          content: `Please select either:
- One stackable item to sell a quantity (will prompt for amount), OR
- Any number of non-stackable (single) items to sell at once.
You cannot mix stackables and singles or select multiple stackables.`,
          components: [],
          ephemeral: true
        });
        return;
      }
    }
    // Handle modal submit for selling stackable item
    if (interaction.isModalSubmit && interaction.customId.startsWith(`sell_quantity${delimiter}`)) {
      // Extract encoded name and rarity using the robust delimiter
      const parts = interaction.customId.split(delimiter);
      if (parts.length !== 3) {
        const debugModal = require('../debug_modal');
        await debugModal(interaction);
        return;
      }
      const decodedName = decodeURIComponent(parts[1]);
      const decodedRarity = decodeURIComponent(parts[2] || '');
      const userId = interaction.user.id;
      let character = await getCharacter(userId);
      // Find the stackable item by name and rarity (treat missing rarity as empty string)
      const invIdx = character.inventory.findIndex(item => item && typeof item === 'object' && item.name === decodedName && ((item.rarity || '') === decodedRarity) && item.count > 1);
      if (invIdx === -1) {
        const debugModal = require('../debug_modal');
        await debugModal(interaction);
        return;
      }
      const item = character.inventory[invIdx];
      let qty = interaction.fields.getTextInputValue('quantity');
      qty = qty === 'all' ? item.count : parseInt(qty, 10);
      if (!qty || qty < 1 || qty > item.count) {
        await interaction.reply({ content: `You can only sell between 1 and ${item.count} of your ${item.name}.`, ephemeral: true });
        return;
      }
      const price = item.price || 10;
      const addGoldToInventory = require('../addGoldToInventory');
      // Remove/sell the quantity
      if (item.count > qty) {
        item.count -= qty;
        character.inventory[invIdx] = item;
      } else {
        character.inventory.splice(invIdx, 1);
      }
      addGoldToInventory(character.inventory, price * qty);
      await saveCharacter(userId, character);
      await interaction.reply({
        content: `✅ Sold **${item.name}** x${qty} for ${price * qty} Gold!`,
        ephemeral: true
      });
      return;
    }
    // Fallback
    await interaction.reply({ content: 'Invalid selection.', ephemeral: true });
  }
};

// Usage: if (interaction.isStringSelectMenu() && interaction.customId === 'sell_select') await sell.handleSelect(interaction);
