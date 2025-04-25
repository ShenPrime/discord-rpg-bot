// Utility function to merge or add an item to the inventory.
// This should be used by all commands that add stackable items to a character's inventory.

/**
 * Adds or merges an item into the character's inventory array.
 * @param {Array} inventory - The character's inventory array (will be mutated).
 * @param {Object} itemObj - The item to add/merge (should include count property).
 */
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  return true;
}

function mergeOrAddInventoryItem(inventory, itemObj) {
  if (!Array.isArray(inventory)) return;
  const isStackable = itemObj && !itemObj.uses;
  if (!isStackable) {
    inventory.push({ ...itemObj, count: itemObj.count || 1 });
    return;
  }
  // Delegate all gold merging to addGoldToInventory utility
  if (itemObj.name === "Gold") {
    const addGoldToInventory = require('./addGoldToInventory');
    addGoldToInventory(inventory, itemObj.count || 1);
    return;
  }
  // Only compare core gameplay fields for other items
  let existingIdx = inventory.findIndex(i => {
    if (i.uses) return false;
    if (i.name !== itemObj.name) return false;
    if (i.type !== itemObj.type) return false;
    if ((i.slot || null) !== (itemObj.slot || null)) return false;
    if ((i.rarity || null) !== (itemObj.rarity || null)) return false;
    if (i.stats || itemObj.stats) {
      if (!deepEqual(i.stats || {}, itemObj.stats || {})) return false;
    }
    return true;
  });
  if (existingIdx !== -1) {
    inventory[existingIdx].count = (inventory[existingIdx].count || 1) + (itemObj.count || 1);
  } else {
    inventory.push({ ...itemObj, count: itemObj.count || 1 });
  }
}


module.exports = mergeOrAddInventoryItem;
