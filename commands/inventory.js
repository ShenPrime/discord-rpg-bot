// commands/inventory.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

// Utility functions to load/save characters (shared with character.js)
const { getCharacter, saveCharacter } = require('../characterModel');


const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const ITEMS_PER_PAGE = 10;
const INV_CATEGORIES = [
  { label: 'Weapons', value: 'weapons' },
  { label: 'Armor', value: 'armor' },
  { label: 'Potions', value: 'potions' },
  { label: 'Everything', value: 'everything' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Check your inventory.'),
  async execute(interaction) {
    // Flush fight session if it exists
    const fightSessionManager = require('../fightSessionManager');
    const userId = interaction.user.id;
    await fightSessionManager.flushIfExists(userId);
    // Always initialize category and page to defaults
    let category = 'everything';
    let page = 0;
    // Handle select menu interaction
    if (interaction.isStringSelectMenu && interaction.isStringSelectMenu() && interaction.customId.startsWith('inventory_cat')) {
      category = interaction.values[0];
      const match = interaction.customId.match(/inventory_cat_(\d+)/);
      if (match) page = parseInt(match[1], 10) || 0;
    } else if (interaction.options && interaction.options.getString && interaction.options.getString('category')) {
      category = interaction.options.getString('category');
    }
    if (interaction.isButton && interaction.isButton()) {
      const match = interaction.customId.match(/inventory_(\w+)_(\d+)/);
      if (match) {
        category = match[1];
        page = parseInt(match[2], 10) || 0;
      }
    }
    const isButton = interaction.isButton && interaction.isButton();
    const respond = (...args) => isButton ? interaction.update(...args) : interaction.reply(...args);
    // Flush fight session if it exists (unified logic)
    await fightSessionManager.flushIfExists(userId);
    let character = await getCharacter(interaction.user.id);
    if (!character) {
      await respond({ content: 'You do not have a character yet. Use /character to create one!', flags: MessageFlags.Ephemeral });
      return;
    }
    // Ensure inventory exists
    if (!Array.isArray(character.inventory)) {
      character.inventory = [];
      await saveCharacter(userId, character);
    }
    if (character.inventory.length === 0) {
      await respond({ content: 'Your inventory is empty.', flags: MessageFlags.Ephemeral });
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
};
function getItemType(item) {
  // Use item.type if present
  if (typeof item === 'object' && item !== null && item.type) {
    const type = item.type.toLowerCase();
    if (type === 'weapon') return 'Weapon';
    if (type === 'armor') return 'Armor';
    if (type === 'potion') return 'Potion';
    if (type === 'currency' || type === 'gold') return 'Gold';
    return 'Default';
  }
  // Fallback: try to use name if type is missing
  const name = typeof item === 'object' && item !== null ? (item.name || '') : (item || '');
  if (/sword|axe|dagger|bow|mace|staff|wand/i.test(name)) return 'Weapon';
  if (/potion/i.test(name)) return 'Potion';
  if (/^gold$/i.test(name.trim())) return 'Gold';
  if (/armor|shield|chainmail|helmet|chestplate|pants|ring|necklace|greaves|leggings|plate|mail|bracers|gauntlets|boots|crown|band|amulet/i.test(name)) return 'Armor';
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
  const sellPrice = (typeof entry.data === 'object' && entry.data.price) ? Math.floor(entry.data.price * 0.2) : 4;
  return {
    name: `${icon} ${itemName}`,
    value: `${value.trim() || '—'}\nSell Price: ${sellPrice} Gold`,
    inline: false
  };
}));

// Filter items by category
function filterByCategory(items, cat) {
  if (cat === 'everything') return items;
  if (cat === 'weapons') return items.filter(i => getItemType(i.name || i) === 'Weapon');
  if (cat === 'armor') return items.filter(i => getItemType(i.name || i) === 'Armor');
  if (cat === 'potions') return items.filter(i => getItemType(i.name || i) === 'Potion');
  return items;
}
if (!category) category = 'everything';
// Filter by category on the raw itemCounts, then map to display objects
const filteredKeys = Object.keys(itemCounts).filter(itemName => {
  if (category === 'everything') return true;
  const type = getItemType(itemName);
  if (category === 'weapons') return type === 'Weapon';
  if (category === 'armor') return type === 'Armor';
  if (category === 'potions') return type === 'Potion';
  return true;
});
const filtered = [];
if (goldTotal > 0 && (category === 'everything' || category === 'gold')) {
  filtered.push({
    name: `${typeIcons.Gold} Gold`,
    value: `${goldTotal} Gold`,
    inline: false
  });
}
filtered.push(...filteredKeys.filter(itemName => itemName !== 'Gold').map((itemName) => {
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
  const sellPrice = (typeof entry.data === 'object' && entry.data.price) ? Math.floor(entry.data.price * 0.2) : 4;
  return {
    name: `${icon} ${itemName}`,
    value: `${value.trim() || '—'}\nSell Price: ${sellPrice} Gold`,
    inline: false
  };
}));
const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
if (page < 0) page = 0;
if (page >= totalPages) page = totalPages - 1;
const pagedItems = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
const embed = new EmbedBuilder()
  .setTitle(`${interaction.user.username}'s Inventory — ${INV_CATEGORIES.find(c => c.value === category).label}`)
  .setColor(0xffd700)
  .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
  .setDescription(pagedItems.length ? pagedItems.map(i => `${i.name}\n${i.value}`).join('\n\n') : 'No items in this category.');
// Category select
const selectRow = new ActionRowBuilder().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId(`inventory_cat_${page}`)
    .setPlaceholder('Select category')
    .addOptions(INV_CATEGORIES.map(c => ({ label: c.label, value: c.value, default: c.value === category })))
);
// Pagination buttons
const buttonRow = new ActionRowBuilder();
const prevButton = new ButtonBuilder()
  .setCustomId(`inventory_${category}_${page - 1}`)
  .setLabel('Previous')
  .setStyle(ButtonStyle.Secondary)
  .setDisabled(page === 0);
const nextButton = new ButtonBuilder()
  .setCustomId(`inventory_${category}_${page + 1}`)
  .setLabel('Next')
  .setStyle(ButtonStyle.Secondary)
  .setDisabled(page === totalPages - 1);
const sellAllButton = new ButtonBuilder()
  .setCustomId('inventory_sell_all')
  .setLabel('Sell All Unequipped')
  .setStyle(ButtonStyle.Danger);
buttonRow.addComponents(prevButton, nextButton, sellAllButton);

const confirmSellAllRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('inventory_sell_all_confirm')
    .setLabel('Yes, Sell All')
    .setStyle(ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId('inventory_sell_all_cancel')
    .setLabel('No, Cancel')
    .setStyle(ButtonStyle.Secondary)
);
// Respond or update
if (interaction.isButton && interaction.isButton() && interaction.customId === 'inventory_sell_all') {
  // Prompt user for confirmation
  await interaction.update({
    content: 'Are you sure? This will sell **all unequipped items** except for **potions** and items of rarity **epic** or **legendary**? This cannot be undone.',
    embeds: [],
    components: [confirmSellAllRow],
    flags: MessageFlags.Ephemeral
  });
  return;
}
if (interaction.isButton && interaction.isButton() && interaction.customId === 'inventory_sell_all_confirm') {
  // Sell all unequipped items except potions and epic/legendary
  const saleSummary = [];
  let sellableGold = 0;
  let updatedInventory = [];
  for (const item of character.inventory) {
    if (typeof item === 'object' && item.name !== 'Gold') {
      const isPotion = /potion/i.test(item.name);
      const rarity = (item.rarity || (item.data && item.data.rarity) || '').toLowerCase();
      const isEpicOrLegendary = rarity === 'epic' || rarity === 'legendary';
      const equippedCount = equippedCounts[item.name] || 0;
      const count = item.count || 1;
      const unequippedCount = count - equippedCount;
      const sellPrice = item.price ? Math.floor(item.price * 0.4) : 4;
      if (!isPotion && !isEpicOrLegendary && unequippedCount > 0) {
        sellableGold += sellPrice * unequippedCount;
        saleSummary.push({ name: item.name, count: unequippedCount, gold: sellPrice * unequippedCount });
        if (equippedCount > 0) {
          // Keep equipped copies
          updatedInventory.push({ ...item, count: equippedCount });
        }
        // else: do not push (all copies sold)
      } else {
        updatedInventory.push(item);
      }
    } else {
      updatedInventory.push(item);
    }
  }
  // Update gold
  let goldItem = updatedInventory.find(i => typeof i === 'object' && i.name === 'Gold');
  if (!goldItem) {
    goldItem = { name: 'Gold', count: 0, rarity: 'common', price: 1 };
    updatedInventory.unshift(goldItem);
  }
  goldItem.count += sellableGold;
  character.inventory = updatedInventory;
  await saveCharacter(userId, character);
  // Sort sale summary by gold descending
  saleSummary.sort((a, b) => b.gold - a.gold);
  // Paginated sale summary
  const { getSaleSummaryEmbed } = require('./saleSummary');
  const summaryPage = 0;
  const { embed, components } = getSaleSummaryEmbed(saleSummary, sellableGold, summaryPage);
  await interaction.update({
    content: saleSummary.length ? undefined : 'No unequipped items to sell!',
    embeds: saleSummary.length ? [embed] : [],
    components: saleSummary.length ? components : [],
    flags: MessageFlags.Ephemeral
  });
  // Store summary in memory for pagination (could use a cache or DB for persistence)
  interaction.client._lastSaleSummary = {
    userId,
    saleSummary,
    totalGold: sellableGold
  };
  return;
}
// Sale summary pagination
if (
  interaction.isButton && interaction.isButton() &&
  (interaction.customId.startsWith('sale_summary_prev_') || interaction.customId.startsWith('sale_summary_next_'))
) {
  const match = interaction.customId.match(/sale_summary_(?:prev|next)_(\d+)/);
  const page = match ? parseInt(match[1], 10) : 0;
  const summaryData = interaction.client._lastSaleSummary;
  if (!summaryData || summaryData.userId !== userId) {
    await interaction.update({ content: 'Sale summary not found or expired.', embeds: [], components: [], flags: MessageFlags.Ephemeral });
    return;
  }
  const { getSaleSummaryEmbed } = require('./saleSummary');
  const { embed, components } = getSaleSummaryEmbed(summaryData.saleSummary, summaryData.totalGold, page);
  await interaction.update({ embeds: [embed], components, flags: MessageFlags.Ephemeral });
  return;
}
if (interaction.isButton && interaction.isButton() && interaction.customId === 'inventory_sell_all_cancel') {
  // Cancel and return to inventory
  await interaction.update({
    content: 'Sell all unequipped cancelled.',
    embeds: [],
    components: [],
    flags: MessageFlags.Ephemeral
  });
  return;
}
if (interaction.isButton && interaction.isButton()) {
  await interaction.update({ embeds: [embed], components: [selectRow, buttonRow], flags: MessageFlags.Ephemeral });
} else if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
  await interaction.update({ embeds: [embed], components: [selectRow, buttonRow], flags: MessageFlags.Ephemeral });
} else {
  await interaction.reply({ embeds: [embed], components: [selectRow, buttonRow], flags: MessageFlags.Ephemeral });
}
return;
  }
}
