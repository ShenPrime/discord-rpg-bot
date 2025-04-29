const multiSellSessions = new Map(); // userId -> { items, timestamp }
const MULTI_SELL_TTL = 5 * 60 * 1000; // 5 minutes

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const { getCharacter, saveCharacter } = require('../characterModel');

const fightSessionManager = require('../fightSessionManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell individual items with count 1 from your inventory.'),

  async execute(interaction, page = 0) {
    // Flush fight session if it exists
    const userId = interaction.user.id;
    await fightSessionManager.flushIfExists(userId);
    // Show all sellable items (count: 1, not gold), paginated
    const paginateSelectMenu = require('../paginateSelectMenu');
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
        // Exclude gold/currency by type or by exact name
if ((item.type && item.type.toLowerCase() === 'currency') || (item.type && item.type.toLowerCase() === 'gold')) return false;
if (typeof item.name === 'string' && item.name.trim().toLowerCase() === 'gold') return false;
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
      label: `${item.name} - ${Math.floor((item.price || 10) * 0.2)} Gold${item.count > 1 ? ` (x${item.count})` : ''}`,
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
    // Flush fight session if it exists
    const fightSessionManager = require('../fightSessionManager');
    const userId = interaction.user.id;
    await fightSessionManager.flushIfExists(userId);
    const delimiter = '|||';
    const paginateSelectMenu = require('../paginateSelectMenu');
    
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

      // Multi-stackable modal: up to 5 stackable items
      if (stackables.length > 0 && stackables.length <= 5 && singles.length === 0) {
        // Exactly one stackable item selected: show modal for quantity
        // Multi-stackable: build modal for up to 5 items
        const delimiter = '|||';
        const encodedItems = stackables.map(item => encodeURIComponent(item.name) + delimiter + encodeURIComponent(item.rarity || '')).join('::');
        // Store stackable items in memory for this user
        // console.log('[SELL] Setting session for', interaction.user.id, stackables);
        multiSellSessions.set(interaction.user.id, {
          items: stackables,
          timestamp: Date.now()
        });
        // Schedule cleanup
        setTimeout(() => {
          const session = multiSellSessions.get(interaction.user.id);
          if (session && Date.now() - session.timestamp > MULTI_SELL_TTL) {
            multiSellSessions.delete(interaction.user.id);
          }
        }, MULTI_SELL_TTL + 1000);
        const modal = new ModalBuilder()
          .setCustomId('sell_multi')
          .setTitle('Sell Multiple Items');
        const actionRows = stackables.map((item, idx) => {
          const qtyInput = new TextInputBuilder()
            .setCustomId(`qty_${idx}`)
            .setLabel(`${item.name} (max ${item.count})`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('Enter quantity');
          return new ActionRowBuilder().addComponents(qtyInput);
        });
        actionRows.forEach(row => modal.addComponents(row));
        // console.log('DEBUG MODAL STRUCTURE:', JSON.stringify(modal.toJSON(), null, 2));
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
          const sellPrice = Math.floor((item.price || 10) * 0.2);
          soldItems.push(`**${item.name}** for ${sellPrice} Gold`);
          totalGold += sellPrice;
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
    // In-memory store for pending multi-sell sessions
// Multi-stackable modal submit
    if (interaction.isModalSubmit && interaction.customId === 'sell_multi') {
      try {
        // Debug modal field dump removed for production
        // let fieldArr = [];
        // if (Array.isArray(interaction.fields.fields)) {
        //   fieldArr = interaction.fields.fields;
        // } else if (Array.isArray(interaction.fields)) {
        // Look up stackable items from in-memory store
        const session = multiSellSessions.get(interaction.user.id);
        if (!session || !session.items) {
          await interaction.reply({ content: 'Session expired or invalid. Please try again.', ephemeral: true });
          return;
        }
        const stackableItems = session.items;
        // Optionally clean up after use
        multiSellSessions.delete(interaction.user.id);
        // Now extract quantities for each stackable item
        let messages = [];
        let totalGold = 0;
        let indicesToRemove = [];
        const userId = interaction.user.id;
        let character = await getCharacter(userId);
        for (let i = 0; i < stackableItems.length; i++) {
          const item = stackableItems[i];
          // Find the inventory index for this item (by name and rarity)
          const invIdx = character.inventory.findIndex(invItem => invItem && typeof invItem === 'object' && invItem.name === item.name && ((invItem.rarity || '') === (item.rarity || '')) && invItem.count > 1);
          if (invIdx === -1) {
            messages.push(`❌ ${item.name}: Not found or not stackable.`);
            continue;
          }
          // Use the inventory item reference for mutation
          const invItem = character.inventory[invIdx];
          // Robustly extract quantity from modal fields for all Discord.js versions
          // Always extract modal values from interaction.fields.fields as an array (Discord.js v14+)
          // Discord.js v14+ (your version): interaction.fields.fields is always an array of field objects
          // Use Discord.js v14+ API: getTextInputValue
          let debugQtyInfo = '';
          let qty;
          try {
            qty = interaction.fields.getTextInputValue(`qty_${i}`);
            debugQtyInfo += `getTextInputValue qty_${i}: ${qty}\n`;
          } catch (e) {
            debugQtyInfo += `getTextInputValue qty_${i} ERROR: ${e.message}\n`;
            qty = undefined;
          }
          qty = qty === 'all' ? item.count : parseInt(qty, 10);
          debugQtyInfo += `Parsed qty: ${qty}\n`;
          // If quantity is invalid, reply with debug info for diagnosis
          if (!qty || qty < 1 || qty > item.count) {
            const debugModal = require('../debug_modal');
            if (!interaction.replied && !interaction.deferred) {
              await debugModal(interaction);
              // Also send extracted qty debug info
              await interaction.followUp({ content: `DEBUG QTY INFO for ${item.name}:\n${debugQtyInfo}`, ephemeral: true });
            }
            messages.push(`❌ ${item.name}: Sell between 1 and ${item.count}.`);
            continue;
          }
          const sellPrice = Math.floor((item.price || 10) * 0.2);
          if (item.count > qty) {
            item.count -= qty;
            character.inventory[invIdx] = item;
          } else {
            indicesToRemove.push(invIdx);
          }
          totalGold += sellPrice * qty;
          messages.push(`✅ Sold **${item.name}** x${qty} for ${sellPrice * qty} Gold!`);
        }
        // Remove sold-out items after processing all
        indicesToRemove.sort((a, b) => b - a).forEach(idx => character.inventory.splice(idx, 1));
        const addGoldToInventory = require('../addGoldToInventory');
        addGoldToInventory(character.inventory, totalGold);
        await saveCharacter(userId, character);
        // DEBUG: show final state before reply
        // Always show confirmation message to the user
        const confirmation = messages.join('\n') + (totalGold ? `\nTotal Gold Earned: ${totalGold}` : '');
        // Defer reply if not already handled
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferReply({ ephemeral: true });
        }
        // Always use editReply for confirmation
        await interaction.editReply({
          content: confirmation
        });
        // Debug output removed for production
        // try {
        //   await interaction.followUp({
        //     content: 'DEBUG FINAL STATE:\n' +
        //       'messages: ' + JSON.stringify(messages) + '\n' +
        //       'totalGold: ' + totalGold + '\n' +
        //       'inventory: ' + JSON.stringify(character.inventory),
        //     ephemeral: true
        //   });
        // } catch(e) {/* ignore if followUp fails */}
        return;
      } catch (e) {
        // const debugModal = require('../debug_modal');
        // if (!interaction.replied && !interaction.deferred) await debugModal(interaction);
        return;
      }
    }
    // Legacy single stackable modal (keep for backward compatibility)
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
      // Find stackable item by name, type, and rarity (if present), not index
      const invIdx = character.inventory.findIndex(item => {
        if (!item || typeof item !== 'object') return false;
        if (item.name !== decodedName) return false;
        if ((item.rarity || '') !== decodedRarity) return false;
        if ((item.type || '').toLowerCase() !== 'potion') return false;
        if (!item.count || item.count < 1) return false;
        return true;
      });
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
      addGoldToInventory(character.inventory, sellPrice * qty);
      await saveCharacter(userId, character);
      await interaction.reply({
        content: `✅ Sold **${item.name}** x${qty} for ${sellPrice * qty} Gold!`,
        ephemeral: true
      });
      return;
    }
    // Fallback
    await interaction.reply({ content: 'Invalid selection.', ephemeral: true });
  }
};

// Usage: if (interaction.isStringSelectMenu() && interaction.customId === 'sell_select') await sell.handleSelect(interaction);
