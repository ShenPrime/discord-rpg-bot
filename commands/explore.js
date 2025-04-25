// commands/explore.js
const { SlashCommandBuilder } = require('discord.js');
const mergeOrAddInventoryItem = require('../mergeOrAddInventoryItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('explore')
    .setDescription('Explore a mysterious area and discover what happens!'),
  async execute(interaction, replyFn) {
    // Load user character
    const userId = interaction.user.id;
    // Use same helpers as inventory.js
    const { loadCharacters, saveCharacters } = require('../characterUtils');
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
      function randStat() { return Math.floor(Math.random() * 2) + 1; }
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
    const { exploreTable } = require('./loot');
    // Helper: filter loot by type
    const { getLootByType, weightedRandomItem } = require('../lootUtils');
    // Stats influence exploration (apply temporary effects)
    let agi = character.stats?.agility || 2;
    let luck = character.stats?.luck || 2;
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      for (const effect of character.activeEffects) {
        if (effect.stat === 'agility') agi += effect.boost;
        if (effect.stat === 'luck') luck += effect.boost;
      }
    }
    // Base 50% + 2% per AGI (max 90%)
    const findChance = Math.min(0.5 + agi * 0.002, 0.9);
    let foundItem = null;
    let foundItemRarity = null;
    if (Math.random() < findChance) {
      // Luck: 60% chance for gold, 40% for rare loot at luck=2; +1% rare per LUCK (nerfed)
      const rareChance = Math.min(0.4 + luck * 0.002, 0.95);
      let lootType;
      if (Math.random() < rareChance) {
        // Rare loot: weapon, armor, potion, gem
        const rareTypes = ['weapon', 'armor', 'potion', 'gem'];
        lootType = rareTypes[Math.floor(Math.random() * rareTypes.length)];
      } else {
        lootType = 'currency';
      }
      const lootItems = getLootByType(exploreTable, lootType);
      const itemObj = weightedRandomItem(lootItems);
      console.log('[EXPLORE LOOT DEBUG] lootType:', lootType);
      console.log('[EXPLORE LOOT DEBUG] lootItems:', lootItems);
      console.log('[EXPLORE LOOT DEBUG] selected itemObj:', itemObj);
      if (itemObj) {
        foundItem = itemObj.name;
        foundItemRarity = itemObj.rarity;
        // Special handling for gold/currency and stackables
        if (itemObj.name === 'Gold' || lootType === 'currency') {
          const addGoldToInventory = require('../addGoldToInventory');
          let goldAmount = itemObj.count || itemObj.amount || itemObj.price || 1;
          addGoldToInventory(character.inventory, goldAmount);
          console.log('[EXPLORE LOOT DEBUG] inventory after gold:', character.inventory);
        } else {
          mergeOrAddInventoryItem(character.inventory, itemObj);
          console.log('[EXPLORE LOOT DEBUG] inventory after item:', character.inventory);
        }
      }
    } else {
      // No item found
    }
    // Decrement usesLeft for temporary effects and remove expired ones
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      character.activeEffects = character.activeEffects.map(e => ({...e, usesLeft: e.usesLeft - 1})).filter(e => e.usesLeft > 0);
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
