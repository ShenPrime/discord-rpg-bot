const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const CHARACTERS_FILE = path.join(__dirname, '../characters.json');

function loadCharacters() {
  if (!fs.existsSync(CHARACTERS_FILE)) return {};
  try {
    const data = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}
function saveCharacters(characters) {
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));
}

// Usable items will be pulled from the lootTable based on the presence of a 'uses' property
const { lootTable } = require('./loot');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('use')
    .setDescription('Use a consumable item from your inventory.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character) {
      await interaction.reply({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
      return;
    }
    if (!Array.isArray(character.inventory) || character.inventory.length === 0) {
      await interaction.reply({ content: 'Your inventory is empty.', ephemeral: true });
      return;
    }
    // Find usable items (must be in lootTable, have 'uses', and be in inventory)
    const usableLoot = lootTable.filter(i => i.uses);
    // Get unique usable items from inventory
    const usableInventory = character.inventory
      .map(item => typeof item === 'string' ? item : item.name)
      .filter((itemName, idx, arr) => arr.indexOf(itemName) === idx && usableLoot.find(l => l.name === itemName));
    if (usableInventory.length === 0) {
      await interaction.reply({ content: 'You have no usable items.', ephemeral: true });
      return;
    }
    // Build select menu options
    const options = usableInventory.map(itemName => {
      const lootItem = usableLoot.find(l => l.name === itemName);
      let desc = '';
      if (lootItem) {
        if (lootItem.stat && lootItem.boost) desc = `+${lootItem.boost} ${lootItem.stat}`;
        if (lootItem.stat === 'revive') desc = 'Revives from defeat';
      }
      return {
        label: itemName,
        value: itemName,
        description: desc || undefined
      };
    });
    await interaction.reply({
      content: 'Select the item you want to use:',
      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: 'use_select',
              min_values: 1,
              max_values: 1,
              options
            }
          ]
        }
      ],
      ephemeral: true
    });
  },

  async handleSelect(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character) {
      await interaction.reply({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
      return;
    }
    if (!Array.isArray(character.inventory) || character.inventory.length === 0) {
      await interaction.reply({ content: 'Your inventory is empty.', ephemeral: true });
      return;
    }
    const itemName = interaction.values[0];
    // Find the item in inventory
    const invIdx = character.inventory.findIndex(item => (typeof item === 'string' ? item : item.name) === itemName);
    if (invIdx === -1) {
      await interaction.reply({ content: `You do not have "${itemName}" in your inventory.`, ephemeral: true });
      return;
    }
    let invItem = character.inventory[invIdx];
    // Look up usable item in lootTable (must have 'uses' property)
    const lootItem = lootTable.find(i => i.name === itemName && i.uses);
    if (!lootItem) {
      await interaction.reply({ content: `You cannot use "${itemName}".`, ephemeral: true });
      return;
    }
    // Determine uses and boost from inventory (object form) or lootTable fallback
    let uses = (typeof invItem === 'object' && invItem.uses) ? invItem.uses : lootItem.uses;
    let stat = (typeof invItem === 'object' && invItem.stat) ? invItem.stat : lootItem.stat;
    let boost = (typeof invItem === 'object' && invItem.boost) ? invItem.boost : lootItem.boost;
    let rarity = (typeof invItem === 'object' && invItem.rarity) ? invItem.rarity : lootItem.rarity;
    let message = '';
    // Set message for stat boost or revive
    if (stat === 'revive') {
      message = 'You are revived from defeat!';
    } else {
      // Default message if none in lootTable
      message = lootItem.message || `Your ${stat} increased!`;
    }
    // Apply effect
    if (stat && stat !== 'revive') {
      if (!character.stats) character.stats = { strength: 2, defense: 2, agility: 2, luck: 2 };
      character.stats[stat] = (character.stats[stat] || 0) + boost;
    }
    let reply = '';
    if (stat === 'revive') {
      reply = `You used **${itemName}** and ${message}`;
    } else {
      reply = `You used **${itemName}** and ${message} (+${boost} ${stat.charAt(0).toUpperCase() + stat.slice(1)})`;
    }
    // Decrement uses
    if (uses > 1) {
      if (typeof invItem === 'object') {
        invItem.uses -= 1;
        character.inventory[invIdx] = invItem;
      }
      reply += `\nRemaining uses: ${uses - 1}`;
    } else {
      character.inventory.splice(invIdx, 1);
    }
    saveCharacters(characters);
    await interaction.update({ content: reply, components: [], ephemeral: true });
  }
};
