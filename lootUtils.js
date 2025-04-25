// Utility functions for loot table operations

/**
 * Filters a loot table by type or category (case-insensitive).
 * Also supports plural/singular for 'gem'.
 * @param {Array} lootTable - The loot table array.
 * @param {string} type - The type or category to filter by.
 * @returns {Array} Filtered loot items.
 */
function getLootByType(lootTable, type) {
  if (typeof type !== 'string' || !type.trim()) return [];
  const typeLower = type.toLowerCase();
  if (typeLower === 'gems' || typeLower === 'gem') {
    return lootTable.filter(item => typeof item.type === 'string' && item.type.toLowerCase() === 'gem');
  }
  return lootTable.filter(item => {
    const t = typeof item.type === 'string' ? item.type : (typeof item.category === 'string' ? item.category : null);
    return t && t.toLowerCase() === typeLower;
  });
}

/**
 * Selects a weighted random item from an array of loot items.
 * Each item can have a 'chance' property (default 1).
 * @param {Array} items - The items to choose from.
 * @returns {Object|null} The selected item or null if empty.
 */
function weightedRandomItem(items) {
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + (item.chance || 1), 0);
  let r = Math.random() * total;
  for (const item of items) {
    if (r < (item.chance || 1)) return item;
    r -= (item.chance || 1);
  }
  return items[items.length - 1];
}

module.exports = {
  getLootByType,
  weightedRandomItem
};
