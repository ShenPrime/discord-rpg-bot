// commands/explore.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('explore')
    .setDescription('Explore a mysterious area and discover what happens!'),
  async execute(interaction, replyFn) {
    // Load user character
    const userId = interaction.user.id;
    // Use same helpers as inventory.js
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
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character) {
      await interaction.reply({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
      return;
    }
    // Ensure inventory exists
    if (!Array.isArray(character.inventory)) character.inventory = [];
    // Give XP and handle level up
    const xpGained = Math.floor(Math.random() * 11) + 5; // 5-15 XP
    character.xp = (character.xp || 0) + xpGained;
    let leveledUp = false;
    let levelUpMsg = '';
    while (character.xp >= 100 * (character.level || 1)) {
      character.xp -= 100 * (character.level || 1);
      character.level = (character.level || 1) + 1;
      // Stat increases on level up
      if (!character.stats) {
        character.stats = { strength: 2, defense: 2, agility: 2, luck: 2 };
      }
      function randStat() { return Math.floor(Math.random() * 5) + 1; }
      const strUp = randStat();
      const defUp = randStat();
      const agiUp = randStat();
      const luckUp = randStat();
      character.stats.strength += strUp;
      character.stats.defense += defUp;
      character.stats.agility += agiUp;
      character.stats.luck += luckUp;
      leveledUp = true;
      levelUpMsg += `\n🎉 You leveled up! You are now level ${character.level}!\nStats gained: STR +${strUp}, DEF +${defUp}, AGI +${agiUp}, LUCK +${luckUp}`;
    }
    // Use centralized loot table
    const { lootTable } = require('./loot');
    // Helper: filter loot by type
    function getLootByType(type) {
      return lootTable.filter(item => (item.type || item.category) && (item.type || item.category).toLowerCase() === type.toLowerCase());
    }
    // Helper: weighted random item
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
    // Weighted random item helper
    function weightedRandomItem(items) {
      const total = items.reduce((sum, item) => sum + item.chance, 0);
      let r = Math.random() * total;
      for (const item of items) {
        if (r < item.chance) return item;
        r -= item.chance;
      }
      return items[items.length - 1]; // Fallback
    }
    // Stats influence exploration
    const agi = character.stats?.agility || 2;
    const luck = character.stats?.luck || 2;
    // Base 50% + 2% per AGI (max 90%)
    const findChance = Math.min(0.5 + agi * 0.02, 0.9);
    let foundItem = null;
    let foundItemRarity = null;
    if (Math.random() < findChance) {
      // Luck: 60% chance for gold, 40% for rare loot at luck=2; +1% rare per LUCK (nerfed)
      const rareChance = Math.min(0.4 + luck * 0.002, 0.95);
      let lootType;
      if (Math.random() < rareChance) {
        // Rare loot: weapon, armor, potion
        const rareTypes = ['weapon', 'armor', 'potion'];
        lootType = rareTypes[Math.floor(Math.random() * rareTypes.length)];
      } else {
        lootType = 'currency';
      }
      const lootItems = getLootByType(lootType);
      const itemObj = weightedRandomItem(lootItems);
      if (itemObj) {
        foundItem = itemObj.name;
        foundItemRarity = itemObj.rarity;
        character.inventory.push(itemObj);
      }
    }
    characters[userId] = character;
    saveCharacters(characters);
    let reply = `You explore...\nYou gain ${xpGained} XP!`;
    reply += `\nLevel: ${character.level || 1} | XP: ${character.xp} / ${100 * (character.level || 1)}`;
    if (leveledUp) reply += levelUpMsg;
    if (foundItem) {
      reply += `\nYou found: **${foundItem}**! (Rarity: ${foundItemRarity}) It has been added to your inventory.`;
    } else {
      reply += '\nYou found nothing else this time.';
    }
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('explore_again')
        .setLabel('Explore Again')
        .setStyle(ButtonStyle.Primary)
    );
    if (replyFn) {
      await replyFn({ content: reply, components: [row], ephemeral: true });
    } else {
      await interaction.reply({ content: reply, components: [row], ephemeral: true });
    }
  }
};
