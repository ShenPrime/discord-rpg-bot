// commands/fight.js
const { SlashCommandBuilder } = require('discord.js');
const { lootTable } = require('./loot');
const fightSessionManager = require('../fightSessionManager');
const { getTotalStats } = require('../characterUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Engage in a quick battle!'),
  async execute(interaction, replyFn) {
    // Load user character
    const { getXpForNextLevel, checkLevelUp } = require('../characterUtils');
    const { getCharacter, saveCharacter } = require('../characterModel');
    const userId = interaction.user.id;
    // Use session.character if available, otherwise fetch from DB
    let session = fightSessionManager.getSession(userId);
    let character;
    if (session && session.character) {
      character = session.character;
    } else {
      character = await getCharacter(userId);
      if (!character) {
        const respond = replyFn || (data => interaction.reply(data));
        await respond({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
        return;
      }
    }
    // Session data to accumulate
    let sessionDelta = { gold: 0, xp: 0, loot: [], collections: { houses: [], mounts: [], weapons: [], armor: [], familiars: [] } };
    // Overhauled fight logic: D20 + stat modifiers
    // Player strength = level (plus any active effects)
    const level = character.level || 1;
    // Calculate player modifier as the sum of TOTAL STR, DEF, LUCK (base + equipment + temp effects)
    const { totalStats } = getTotalStats(character, lootTable);
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
        } else if (roll < 0.098) {
          lootType = 'weapon';
        } else if (roll < 0.196) {
          lootType = 'armor';
        } else if (roll < 0.294) {
          lootType = 'gem';
        } else {
          lootType = 'currency';
        }
        let lootItems;
        if (lootType === 'familiar') {
          const { familiarTable } = require('./loot');
          lootItems = familiarTable;
        } else if (lootType === 'weapon' || lootType === 'armor') {
          // Level-based rarity filtering for weapon/armor using config array
          const rarityUnlocks = [
            { level: 20, rarities: ['common'] },
            { level: 30, rarities: ['common', 'uncommon'] },
            { level: 40, rarities: ['common', 'uncommon', 'refined'] },
            { level: 50, rarities: ['common', 'uncommon', 'refined', 'rare'] },
            { level: 60, rarities: ['common', 'uncommon', 'refined', 'rare', 'superior'] },
            { level: 70, rarities: ['common', 'uncommon', 'refined', 'rare', 'superior', 'epic'] },
            { level: 80, rarities: ['common', 'uncommon', 'refined', 'rare', 'superior', 'epic', 'legendary'] },
            { level: 90, rarities: ['common', 'uncommon', 'refined', 'rare', 'superior', 'epic', 'legendary', 'mythic'] },
            { level: Infinity, rarities: ['common', 'uncommon', 'refined', 'rare', 'superior', 'epic', 'legendary', 'mythic', 'divine'] }
          ];
          const allowedRarities = rarityUnlocks.find(t => level < t.level).rarities;
          lootItems = getLootByType(lootTable, lootType).filter(item => allowedRarities.includes(item.rarity));
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
      sessionDelta.xp += xpGained;
      reason += `\nYou gained ${xpGained} XP!`;
    }
    if (loot) {
      if (loot.type === 'Familiar' || loot.type === 'familiar') {
        // Add to session familiars collection
        sessionDelta.collections.familiars.push({ name: loot.name, rarity: loot.rarity, count: 1 });
        lootMsg = `🎉 You befriended a Familiar: **${loot.name}**! (Rarity: ${loot.rarity})\nIt has been added to your Collections.`;
      } else if (loot.type === 'Weapon' || loot.type === 'Armor') {
        // Add epic/legendary weapons/armor to collections
        if (loot.rarity === 'epic' || loot.rarity === 'legendary') {
          if (loot.type === 'Weapon') sessionDelta.collections.weapons.push(loot);
          else if (loot.type === 'Armor') sessionDelta.collections.armor.push(loot);
        }
        // Add to loot (inventory)
        sessionDelta.loot.push({ ...loot });
      } else if (loot.type === 'currency' && loot.name.match(/Gold/i)) {
        let goldAmount = loot.count || loot.amount || loot.price || 1;
        sessionDelta.gold += goldAmount;
      } else {
        sessionDelta.loot.push({ ...loot });
      }
      reason += `\n${lootMsg}`;
    }
    // PREVIEW: Check if user will level up with session XP applied (for immediate feedback)
    const previewCharacter = JSON.parse(JSON.stringify(character));
    previewCharacter.xp = (previewCharacter.xp || 0) + sessionDelta.xp;
    const { leveledUp, levelUpMsg: levelUpMsgUtil } = checkLevelUp(previewCharacter);
    if (leveledUp) levelUpMsg += levelUpMsgUtil;
    // Now apply sessionDelta to session
    if (leveledUp) {
      await fightSessionManager.createOrUpdateSession(userId, sessionDelta);
      await fightSessionManager.flushOnLevelUp(userId);
    } else {
      await fightSessionManager.createOrUpdateSession(userId, sessionDelta);
    }
    // Decrement usesLeft for temporary effects and remove expired ones
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      character.activeEffects = character.activeEffects.map(e => ({...e, usesLeft: e.usesLeft - 1})).filter(e => e.usesLeft > 0);
    }
    // Save is now handled by session manager (except level up flush)
    // await saveCharacter(userId, character);
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
    // Show XP: if using session.character, do NOT add sessionXp again
    const fightSession = fightSessionManager.getSession(userId);
    let xpDisplay;
    if (fightSession && fightSession.character) {
      xpDisplay = fightSession.character.xp || 0;
    } else {
      const sessionXp = fightSession ? fightSession.xp : 0;
      xpDisplay = (character.xp || 0) + sessionXp;
    }
    const levelLine = `Level: ${character.level || 1} | XP: ${xpDisplay} / ${xpForNext}`;
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
