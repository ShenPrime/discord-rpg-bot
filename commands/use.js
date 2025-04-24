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

// Define usable item effects (stat-boosting potions only)
const USABLE_ITEMS = {
  'Potion of Strength': { stat: 'strength', message: 'Your strength increased!' },
  'Potion of Agility': { stat: 'agility', message: 'Your agility increased!' },
  'Potion of Defense': { stat: 'defense', message: 'Your defense increased!' },
  'Potion of Fortune': { stat: 'luck', message: 'Your luck increased!' },
  'Resurrection Elixir': { stat: 'revive', message: 'You are revived from defeat!' }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('use')
    .setDescription('Use a consumable item from your inventory.')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('The name of the item to use (case-sensitive)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character) {
      await interaction.reply({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
      return;
    }
    const itemName = interaction.options.getString('item');
    // Find the potion in inventory (support object form for uses)
    const invIdx = character.inventory.findIndex(item => (typeof item === 'string' ? item : item.name) === itemName);
    if (invIdx === -1) {
      await interaction.reply({ content: `You do not have "${itemName}" in your inventory.`, ephemeral: true });
      return;
    }
    let invItem = character.inventory[invIdx];
    // Potions are now objects with uses, stat, boost, rarity
    const effect = USABLE_ITEMS[itemName];
    if (!effect) {
      await interaction.reply({ content: `You cannot use "${itemName}".`, ephemeral: true });
      return;
    }
    // Determine uses and boost
    let uses = (typeof invItem === 'object' && invItem.uses) ? invItem.uses : 1;
    let stat = (typeof invItem === 'object' && invItem.stat) ? invItem.stat : effect.stat;
    let boost = (typeof invItem === 'object' && invItem.boost) ? invItem.boost : 1;
    let rarity = (typeof invItem === 'object' && invItem.rarity) ? invItem.rarity : 'common';
    // Apply effect
    if (stat && stat !== 'revive') {
      if (!character.stats) character.stats = { strength: 2, defense: 2, agility: 2, luck: 2 };
      character.stats[stat] = (character.stats[stat] || 0) + boost;
    }
    let reply = '';
    if (stat === 'revive') {
      reply = `You used **${itemName}** and ${effect.message}`;
    } else {
      reply = `You used **${itemName}** and ${effect.message} (+${boost} ${stat.charAt(0).toUpperCase() + stat.slice(1)})`;
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
    await interaction.reply({ content: reply, ephemeral: true });
  }
};
