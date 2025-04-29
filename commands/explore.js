// commands/explore.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const mergeOrAddInventoryItem = require('../mergeOrAddInventoryItem');

module.exports = {
  data: {
    name: 'explore',
    description: '[DEPRECATED] This command is no longer supported.'
  },
  async execute(interaction) {
    await interaction.reply({ content: '⚠️ The /explore command is deprecated and should not be used. Please use the new commands instead.', flags: MessageFlags.Ephemeral });
    return;
  },
// --- DEPRECATED LOGIC BELOW ---

  data: new SlashCommandBuilder()
    .setName('explore')
    .setDescription('Explore a mysterious area and discover what happens!'),
  async execute(interaction, replyFn) {
    // Load user character
    const userId = interaction.user.id;
    const { getXpForNextLevel, checkLevelUp } = require('../characterUtils');
    const { getCharacter, saveCharacter } = require('../characterModel');
    let character = await getCharacter(userId);
    if (!character) {
      await interaction.reply({ content: 'You do not have a character yet. Use /character to create one!', flags: MessageFlags.Ephemeral });
      return;
    }
    // Ensure inventory exists
    if (!Array.isArray(character.inventory)) character.inventory = [];
    // Give XP and handle level up
    const xpGained = Math.floor(Math.random() * 11) + 5; // 5-15 XP
    character.xp = (character.xp || 0) + xpGained;
    const { leveledUp, levelUpMsg } = checkLevelUp(character);
    // Use centralized loot table
    const { exploreTable } = require('./loot');
    // Helper: filter loot by type
    const { getLootByType, weightedRandomItem } = require('../lootUtils');
    // Stats influence exploration (apply temporary effects)
    let luck = character.stats?.luck || 2;
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      for (const effect of character.activeEffects) {
        if (effect.stat === 'luck') luck += effect.boost;
      }
    }
    // Base 50% find chance (no agility bonus)
    const findChance = 0.5;
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
      if (itemObj) {
        foundItem = itemObj.name;
        foundItemRarity = itemObj.rarity;
        // Special handling for gold/currency and stackables
        if (itemObj.name === 'Gold' || lootType === 'currency') {
          const addGoldToInventory = require('../addGoldToInventory');
          let goldAmount = itemObj.count || itemObj.amount || itemObj.price || 1;
          addGoldToInventory(character.inventory, goldAmount);
        } else {
          mergeOrAddInventoryItem(character.inventory, itemObj);
          // Add epic/legendary weapons/armor to collections
          if (itemObj && (itemObj.type === 'Weapon' || itemObj.type === 'Armor') && (itemObj.rarity === 'epic' || itemObj.rarity === 'legendary')) {
            character.collections = character.collections || { houses: [], mounts: [], weapons: [], armor: [] };
            const mergeOrAddCollectionItem = require('../mergeOrAddCollectionItem');
            if (itemObj.type === 'Weapon') {
              mergeOrAddCollectionItem(character.collections.weapons, itemObj);
            } else if (itemObj.type === 'Armor') {
              mergeOrAddCollectionItem(character.collections.armor, itemObj);
            }
          }
        }
      }
    } else {
      // No item found
    }
    // Decrement usesLeft for temporary effects and remove expired ones
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      character.activeEffects = character.activeEffects.map(e => ({...e, usesLeft: e.usesLeft - 1})).filter(e => e.usesLeft > 0);
    }
    await saveCharacter(userId, character);
    let reply = `You explore...\nYou gain ${xpGained} XP!`;
    reply += `\nLevel: ${character.level || 1} | XP: ${character.xp} / ${getXpForNextLevel(character.level || 1)}`;
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
      await replyFn({ content: reply, components: [row], flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: reply, components: [row], flags: MessageFlags.Ephemeral });
    }
  }
};
