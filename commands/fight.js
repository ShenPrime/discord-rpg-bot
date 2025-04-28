// commands/fight.js
const { SlashCommandBuilder } = require('discord.js');
const { lootTable } = require('./loot');
const mergeOrAddInventoryItem = require('../mergeOrAddInventoryItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Engage in a quick battle!'),
  async execute(interaction, replyFn) {
    // Load user character
    const { getXpForNextLevel, checkLevelUp } = require('../characterUtils');
    const { getCharacter, saveCharacter } = require('../characterModel');
    const userId = interaction.user.id;
    let character = await getCharacter(userId);
    if (!character) {
      const respond = replyFn || (data => interaction.reply(data));
      await respond({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
      return;
    }
    // Overhauled fight logic: D20 + stat modifiers
    // Player strength = level (plus any active effects)
    const level = character.level || 1;
    // Calculate player modifier as the sum of TOTAL STR, DEF, LUCK (base + equipment + temp effects)
    const statKeys = ['strength', 'defense', 'luck'];
    // Base stats
    let baseStats = { strength: character.stats?.strength ?? 0, defense: character.stats?.defense ?? 0, luck: character.stats?.luck ?? 0 };
    // Equipment bonuses
    let eqStats = { strength: 0, defense: 0, luck: 0 };
    if (character.equipment) {
      for (const [slot, itemName] of Object.entries(character.equipment)) {
        const lootItem = lootTable.find(i => i.name === itemName && i.stats);
        if (lootItem && lootItem.stats) {
          for (const [stat, val] of Object.entries(lootItem.stats)) {
            if (statKeys.includes(stat)) {
              eqStats[stat] = (eqStats[stat] || 0) + val;
            }
          }
        }
      }
    }
    // Temporary effects
    let tempStats = { strength: 0, defense: 0, luck: 0 };
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      for (const effect of character.activeEffects) {
        if (statKeys.includes(effect.stat)) {
          tempStats[effect.stat] += effect.boost;
        }
      }
    }
    // Total stats
    let totalStats = { ...baseStats };
    for (const stat of statKeys) {
      totalStats[stat] = (totalStats[stat] || 0) + (eqStats[stat] || 0) + (tempStats[stat] || 0);
    }
    const playerStrength = totalStats.strength;
    const playerDefense = totalStats.defense;
    const playerLuck = totalStats.luck;
    const playerModifier = playerStrength + playerDefense + playerLuck;
    // Enemy strength = player level * 3
    const enemyStrength = level * 3;
    // Roll D20 for both
    const playerRoll = Math.floor(Math.random() * 20) + 1;
    const enemyRoll = Math.floor(Math.random() * 20) + 1;
    const playerTotal = playerRoll + playerModifier;
    const enemyTotal = enemyRoll + enemyStrength;
    let outcome, reason, xpGained = 0, loot = null, lootMsg = '', levelUpMsg = '';
    // Use centralized loot table
   
    const { getLootByType, weightedRandomItem } = require('../lootUtils');
    if (playerTotal > enemyTotal) {
      outcome = 'You defeated the enemy and gained experience!';
      reason = `You rolled a **${playerRoll}** + stat modifier (**${playerModifier}**, STR ${playerStrength} + DEF ${playerDefense} + LUCK ${playerLuck}) = **${playerTotal}**\nEnemy rolled a **${enemyRoll}** + strength modifier (**${enemyStrength}**) = **${enemyTotal}**\nVictory!`;
      xpGained = Math.floor(Math.random() * 31) + 40; // 40-70 XP
      // 40% chance for loot
      if (Math.random() < 0.4) {
        // 2% familiar, 9.8% weapon, 29.4% gem, 19.6% armor, 39.2% currency
        let lootType;
        const roll = Math.random();
        if (roll < 0.02) {
          lootType = 'familiar';
        } else if (roll < 0.118) {
          lootType = 'weapon';
        } else if (roll < 0.412) {
          lootType = 'gem';
        } else if (roll < 0.608) {
          lootType = 'armor';
        } else {
          lootType = 'currency';
        }
        let lootItems;
        if (lootType === 'familiar') {
          // require familiarTable from loot.js
          const { familiarTable } = require('./loot');
          lootItems = familiarTable;
        } else {
          lootItems = getLootByType(lootTable, lootType);
        }
        loot = weightedRandomItem(lootItems);
        if (loot) {
          lootMsg = `You found: **${loot.name}**! (Rarity: ${loot.rarity})`;
        }
      }
    } else if (playerTotal < enemyTotal) {
      outcome = 'You were defeated by the enemy.';
      reason = `You rolled a **${playerRoll}** + stat modifier (**${playerModifier}**, STR ${playerStrength} + DEF ${playerDefense} + LUCK ${playerLuck}) = **${playerTotal}**\nEnemy rolled a **${enemyRoll}** + strength modifier (**${enemyStrength}**) = **${enemyTotal}**\nDefeat.`;
      reason += `\nYou lost, but you keep your XP.`;
      if (Math.random() < 0.2) {
        // Only gems or gold can drop on defeat
        let lootType;
        const roll = Math.random();
        if (roll < 0.3) {
          lootType = 'gem';
        } else {
          lootType = 'currency';
        }
        const lootItems = getLootByType(lootTable, lootType);
        loot = weightedRandomItem(lootItems);
        if (loot) {
          lootMsg = `You found: **${loot.name}**! (Rarity: ${loot.rarity})`;
        }
      }
    } else {
      outcome = 'The battle was a draw.';
      reason = `You rolled a **${playerRoll}** + stat modifier (**${playerModifier}**, STR ${playerStrength} + DEF ${playerDefense} + LUCK ${playerLuck}) = **${playerTotal}**\nEnemy rolled a **${enemyRoll}** + strength modifier (**${enemyStrength}**) = **${enemyTotal}**\nIt was a tie!`;
      xpGained = Math.floor(Math.random() * 6) + 5; // 5-10 XP
    }
    // Apply rewards
    if (xpGained > 0) {
      character.xp = (character.xp || 0) + xpGained;
      reason += `\nYou gained ${xpGained} XP!`;
    }
    if (loot) {
      if (loot.type === 'Familiar' || loot.type === 'familiar') {
        character.collections = character.collections || {};
        character.collections.familiars = character.collections.familiars || [];
        const existing = character.collections.familiars.find(f => f.name === loot.name);
        if (!existing) {
          character.collections.familiars.push({ name: loot.name, rarity: loot.rarity, count: 1 });
          lootMsg = `🎉 You befriended a new Familiar: **${loot.name}**! (Rarity: ${loot.rarity})\nIt has been added to your Collections.`;
        } else {
          existing.count = (existing.count || 1) + 1;
          lootMsg = `You encountered **${loot.name}** again! (Rarity: ${loot.rarity})\nYour collection count for this Familiar is now ${existing.count}.`;
        }
      } else {
        if (!Array.isArray(character.inventory)) character.inventory = [];
        // Match /explore.js: Directly merge currency/gold loot
        if (loot.type === 'currency' && loot.name.match(/Gold/i)) {
          const addGoldToInventory = require('../addGoldToInventory');
          let goldAmount = loot.count || loot.amount || loot.price || 1;
          addGoldToInventory(character.inventory, goldAmount);
        } else {
          // All items except those with 'uses' should be stackable
          const isStackable = loot && !loot.uses;
          if (isStackable) {
            mergeOrAddInventoryItem(character.inventory, loot);
            // Add epic/legendary weapons/armor to collections
            if (loot && (loot.type === 'Weapon' || loot.type === 'Armor') && (loot.rarity === 'epic' || loot.rarity === 'legendary')) {
              character.collections = character.collections || { houses: [], mounts: [], weapons: [], armor: [] };
              const mergeOrAddCollectionItem = require('../mergeOrAddCollectionItem');
              if (loot.type === 'Weapon') {
                mergeOrAddCollectionItem(character.collections.weapons, loot);
              } else if (loot.type === 'Armor') {
                mergeOrAddCollectionItem(character.collections.armor, loot);
              }
            }
          } else {
            character.inventory.push({ ...loot, count: 1 });
          }
        }
      }
      reason += `\n${lootMsg}`;
    }
    // Handle level up
    const { leveledUp, levelUpMsg: levelUpMsgUtil } = checkLevelUp(character);
    if (leveledUp) levelUpMsg += levelUpMsgUtil;
    // Decrement usesLeft for temporary effects and remove expired ones
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      character.activeEffects = character.activeEffects.map(e => ({...e, usesLeft: e.usesLeft - 1})).filter(e => e.usesLeft > 0);
    }
    // Save
    await saveCharacter(userId, character);
    // Add 'Fight Again' button
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fight_again')
        .setLabel('Fight Again')
        .setStyle(ButtonStyle.Primary)
    );
    const respond = replyFn || (data => interaction.reply({ ...data, flags: 64 }));
    const xpForNext = getXpForNextLevel(character.level || 1);
    const levelLine = `Level: ${character.level || 1} | XP: ${character.xp} / ${xpForNext}`;
    try {
      await respond({ content: `Battle result: ${outcome}\n${reason}${levelUpMsg}\n${levelLine}`, components: [row] });
    } catch (err) {
      if (err.code === 10062 || err.message?.includes('Unknown interaction')) {
        // Interaction expired or already acknowledged, do nothing or log
        console.warn('Tried to respond to an expired or unknown interaction.');
      } else {
        throw err;
      }
    }
  }
};
