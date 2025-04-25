// commands/inventory.js
const { SlashCommandBuilder } = require('discord.js');

// Utility functions to load/save characters (shared with character.js)
const { getCharacter, saveCharacter } = require('../characterModel');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Check your inventory.'),
  async execute(interaction) {
    const isButton = interaction.isButton && interaction.isButton();
    const respond = (...args) => isButton ? interaction.update(...args) : interaction.reply(...args);
    const userId = interaction.user.id;
    let character = await getCharacter(userId);
    if (!character) {
      await respond({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
      return;
    }
    // Ensure inventory exists
    if (!Array.isArray(character.inventory)) {
      character.inventory = [];
      await saveCharacter(userId, character);
    }
    if (character.inventory.length === 0) {
      await respond({ content: 'Your inventory is empty.', ephemeral: true });
      return;
    }
      // Rich formatting: numbered, grouped with icons


      // --- GOLD REFACTOR START ---
// Ensure only a single gold entry exists in the inventory
let goldEntryIdx = character.inventory.findIndex(item => typeof item === 'object' && item.name === 'Gold');
let goldTotal = 0;
let newInventory = [];
for (const item of character.inventory) {
  if (typeof item === 'object' && item.name === 'Gold') {
    goldTotal += (item.count || 0);
    // skip adding for now
  } else if (typeof item === 'string' && /(\d+) Gold/i.test(item)) {
    // legacy string gold entries
    const goldMatch = item.match(/(\d+) Gold/i);
    if (goldMatch) goldTotal += parseInt(goldMatch[1], 10);
  } else {
    newInventory.push(item);
  }
}
if (goldTotal > 0) {
  newInventory.unshift({ name: 'Gold', count: goldTotal, rarity: 'common', price: 1 });
}
// Update inventory in memory and on disk if changed
if (JSON.stringify(newInventory) !== JSON.stringify(character.inventory)) {
  character.inventory = newInventory;
  await saveCharacter(userId, character);
}
// Build display items
const typeIcons = {
  Weapon: '⚔️',
  Potion: '🧪',
  Gold: '💰',
  Armor: '🛡️',
  Default: '🎒'
};function getItemType(item) {
  if (/sword|axe|dagger|bow/i.test(item)) return 'Weapon';
  if (/potion/i.test(item)) return 'Potion';
  if (/gold/i.test(item)) return 'Gold';
  if (/armor|shield|chainmail/i.test(item)) return 'Armor';
  return 'Default';
}
// Count equipped items by name (excluding gold)
const equippedCounts = {};if (character.equipment) {
  for (const eq of Object.values(character.equipment)) {
    if (eq && eq !== 'Gold') {
      equippedCounts[eq] = (equippedCounts[eq] || 0) + 1;
    }
  }
}
const itemCounts = {};for (const item of character.inventory) {
  let itemName = typeof item === 'string' ? item : item.name;
  if (itemName === 'Gold') {
    itemCounts[itemName] = itemCounts[itemName] || { count: 0, data: item };    itemCounts[itemName].count += (typeof item === 'object' && item.count) ? item.count : 1;
    continue;
  }
  // Subtract equipped count from inventory count
  const totalCount = (typeof item === 'object' && item.count) ? item.count : 1;
  const equippedCount = equippedCounts[itemName] || 0;
  const unequippedCount = totalCount - equippedCount;
  if (unequippedCount > 0) {
    itemCounts[itemName] = itemCounts[itemName] || { count: 0, data: item };    itemCounts[itemName].count += unequippedCount;
  }
}
const uniqueItems = Object.keys(itemCounts);
let inventoryItems = [];
if (goldTotal > 0) {
  inventoryItems.push({
    name: `${typeIcons.Gold} Gold`,
    value: `${goldTotal} Gold`,
    inline: false
  });
}
inventoryItems = inventoryItems.concat(uniqueItems.filter(itemName => itemName !== 'Gold').map((itemName) => {
        const entry = itemCounts[itemName];
        const type = getItemType(itemName);
        const icon = typeIcons[type] || typeIcons.Default;
        const count = entry.count;
        let value = '';
        if (typeof entry.data === 'object' && entry.data !== null) {
          if (entry.data.rarity) value += `Rarity: ${entry.data.rarity}\n`;
          if (entry.data.price) value += `Price: ${entry.data.price} Gold\n`;

          if (entry.data.stats) {
            const stats = Object.entries(entry.data.stats).map(([k, v]) => `${k.slice(0,3).toUpperCase()}: +${v}`).join(', ');
            if (stats) value += `Stats: ${stats}\n`;
          }
          if (entry.data.uses) value += `Uses: ${entry.data.uses}\n`;
          if (entry.data.boost) value += `Boost: +${entry.data.boost} ${entry.data.stat || ''}\n`;
        }
        if (entry.data && entry.data.count > 1) value += `Count: ${entry.data.count}`;
return {
  name: `${icon} ${itemName}`,
  value: value.trim() || '—',
  inline: false
};}));

      // Pagination logic
      const ITEMS_PER_PAGE = 10;
      let page = 0;
      if (interaction.options && interaction.options.getInteger && interaction.options.getInteger('page') !== null) {
        page = interaction.options.getInteger('page') - 1;
      }
      const totalPages = Math.ceil(inventoryItems.length / ITEMS_PER_PAGE) || 1;
      if (page < 0) page = 0;
      if (page >= totalPages) page = totalPages - 1;
      const pagedItems = inventoryItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

      const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s Inventory`)
        .setColor(0xffd700)
        .setFooter({ text: `Page ${page + 1} of ${totalPages}` });
      pagedItems.forEach(item => embed.addFields(item));

      // Always add 'Show Equipped' button
      const row = new ActionRowBuilder();
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('show_equipped')
          .setLabel('Show Equipped')
          .setStyle(ButtonStyle.Primary)
      );
      if (totalPages > 1) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('inv_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('inv_next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages - 1)
        );
      }
      // Button interaction logic is now handled globally in index.js
      // Handle button actions directly here if invoked as a button
      if (isButton) {
        let customId = interaction.customId;
        // Parse page from message footer if available
        let currentPage = 0;
        const footer = interaction.message?.embeds?.[0]?.footer?.text;
        if (footer) {
          const match = footer.match(/Page (\d+) of (\d+)/);
          if (match) currentPage = parseInt(match[1], 10) - 1;
        }
        let page = currentPage;
        if (customId === 'inv_next') page++;
        if (customId === 'inv_prev') page--;
        if (page < 0) page = 0;
        const totalPages = Math.ceil(inventoryItems.length / ITEMS_PER_PAGE) || 1;
        if (page >= totalPages) page = totalPages - 1;
        const pagedItems = inventoryItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
        if (customId === 'show_equipped') {
          // Show only equipped items
          const slotOrder = ['head', 'arms', 'chest', 'legs', 'necklace', 'ring1', 'ring2', 'weapon'];
          const { lootTable } = require('./loot');
          const equippedItems = slotOrder
            .filter(slot => character.equipment && character.equipment[slot])
            .map(slot => {
              const itemName = character.equipment[slot];
              const lootItem = lootTable.find(i => i.name === itemName && i.stats);
              let statsStr = '';
              if (lootItem && lootItem.stats) {
                statsStr = Object.entries(lootItem.stats)
                  .map(([k, v]) => `+${v} ${k.slice(0,3).toUpperCase()}`)
                  .join(', ');
              }
              return {
                name: `${slot.charAt(0).toUpperCase() + slot.slice(1)}`,
                value: itemName + (statsStr ? `\n${statsStr}` : ''),
                inline: false
              };            });
          const equipEmbed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Equipped Items`)
            .setColor(0x00bfff);
          if (equippedItems.length) {
            equippedItems.forEach(item => equipEmbed.addFields(item));
          } else {
            equipEmbed.setDescription('No items equipped.');
          }
          // Show equipped items, add back button
          const backRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('back_to_inventory')
                .setLabel('Back to Inventory')
                .setStyle(ButtonStyle.Primary)
            );
          await interaction.update({
            embeds: [equipEmbed],
            components: [backRow],
            ephemeral: true
          });
          return;
        }
        if (customId === 'back_to_inventory') {
          page = 0;
        }
        const embed = new (require('discord.js')).EmbedBuilder()
          .setTitle(`${interaction.user.username}'s Inventory`)
          .setColor(0xffd700)
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` });
        pagedItems.forEach(item => embed.addFields(item));
        const row = new ActionRowBuilder();
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('show_equipped')
            .setLabel('Show Equipped')
            .setStyle(ButtonStyle.Primary)
        );
        if (totalPages > 1) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId('inv_prev')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('inv_next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === totalPages - 1)
          );
        }
        await interaction.update({
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
        return;
      }
      // Otherwise, respond to slash command
      await saveCharacter(userId, character);
      await respond({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    }
  }
