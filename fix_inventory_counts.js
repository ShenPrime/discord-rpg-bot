// One-time fixer script to normalize inventory items in characters.json
// Usage: node fix_inventory_counts.js

const fs = require('fs');
const path = require('path');

const CHARACTERS_FILE = path.join(__dirname, 'characters.json');

function fixInventories() {
  if (!fs.existsSync(CHARACTERS_FILE)) {
    console.error('characters.json not found!');
    process.exit(1);
  }
  const data = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
  let characters;
  try {
    characters = JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse characters.json:', e);
    process.exit(1);
  }
  let changed = false;
  for (const charId in characters) {
    const character = characters[charId];
    if (Array.isArray(character.inventory)) {
      let newInv = character.inventory.map(item => {
        if (typeof item === 'object' && item.name && item.name !== 'Gold') {
          if (!Object.prototype.hasOwnProperty.call(item, 'count')) {
            changed = true;
            return { ...item, count: 1 };
          }
        }
        return item;
      });
      character.inventory = newInv;
    }
  }
  if (changed) {
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));
    console.log('Inventories normalized: all items now have a count property.');
  } else {
    console.log('No changes needed: all items already have a count property.');
  }
}

fixInventories();
