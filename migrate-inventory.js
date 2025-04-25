// migrate-inventory.js
// Run this script ONCE to migrate characters.json to use count property for stackable items
// Usage: node migrate-inventory.js

const fs = require('fs');
const path = require('path');
const CHARACTERS_FILE = path.join(__dirname, 'characters.json');

function isStackable(item) {
  // Stackable: no slot and no uses property
  return item && typeof item === 'object' && !item.slot && !item.uses;
}

function getStackKey(item) {
  // Use name, type, rarity, price, stat, boost for grouping
  return [
    item.name,
    item.type,
    item.rarity,
    item.price,
    item.stat,
    item.boost
  ].join('|');
}

function migrateInventory(inventory) {
  if (!Array.isArray(inventory)) return [];
  const stackMap = new Map();
  let goldTotal = 0;
  const result = [];
  for (const item of inventory) {
    // Handle gold: any item with name matching /gold/i or type 'currency'
    const isGold = (typeof item === 'object' && /gold/i.test(item.name)) || (item.type === 'currency');
    if (isGold) {
      // Try to extract amount from 'amount' property or from name (e.g. '20 Gold')
      let amt = 0;
      if (typeof item.amount === 'number') {
        amt = item.amount;
      } else if (typeof item.name === 'string') {
        const m = item.name.match(/(\d+)/);
        if (m) amt = parseInt(m[1], 10);
      }
      // Fallback to price if nothing else
      if (!amt && typeof item.price === 'number') amt = item.price;
      goldTotal += amt;
      continue;
    }
    // Stack anything not a consumable (has 'uses')
    if (typeof item === 'object' && !item.uses) {
      // Use all properties except count/amount for key
      const key = JSON.stringify(Object.assign({}, item, { count: undefined, amount: undefined }));
      if (stackMap.has(key)) {
        stackMap.get(key).count += 1;
      } else {
        const newItem = { ...item, count: 1 };
        stackMap.set(key, newItem);
        result.push(newItem);
      }
    } else {
      // Consumables with uses are not stacked
      result.push(item);
    }
  }
  // Add single gold entry if any
  if (goldTotal > 0) {
    result.unshift({ name: 'Gold', type: 'currency', amount: goldTotal, count: 1 });
  }
  return result;
}

function main() {
  const data = JSON.parse(fs.readFileSync(CHARACTERS_FILE, 'utf-8'));
  let changed = false;
  for (const userId of Object.keys(data)) {
    const character = data[userId];
    if (character && Array.isArray(character.inventory)) {
      const migrated = migrateInventory(character.inventory);
      // Only update if changed
      if (JSON.stringify(migrated) !== JSON.stringify(character.inventory)) {
        character.inventory = migrated;
        changed = true;
      }
    }
  }
  if (changed) {
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(data, null, 2));
    console.log('Migration complete. characters.json updated.');
  } else {
    console.log('No migration needed. characters.json already up to date.');
  }
}

main();
