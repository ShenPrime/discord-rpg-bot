// commands/fight.js
const { SlashCommandBuilder } = require('discord.js');
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
    // Stat-based outcome
    // Apply temporary stat boosts from activeEffects
    let str = character.stats?.strength || 2;
    let def = character.stats?.defense || 2;
    let luck = character.stats?.luck || 2;
    const level = character.level || 1;
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      for (const effect of character.activeEffects) {
        if (effect.stat === 'strength') str += effect.boost;
        if (effect.stat === 'defense') def += effect.boost;
        if (effect.stat === 'luck') luck += effect.boost;
      }
    }
    // Win chance: 5% base + 0.25% per STR + 0.3% per level, soft capped with tanh (max ~80%)
    const rawChance = 0.05 + (str * 0.0025) + (level * 0.003);
    const winChance = 0.8 * Math.tanh(rawChance / 0.8);
    // Draw chance: 10% + 1% per DEF (max 40%)
    const drawChance = Math.min(0.10 + def * 0.01, 0.4);
    // Crit chance: 0.4% per LUCK + 0.5% per level, soft capped with tanh (max ~30%)
    const critRaw = (luck * 0.004) + (level * 0.005);
    const critChance = 0.3 * Math.tanh(critRaw / 0.3);
    const roll = Math.random();
    let outcome, reason, xpGained = 0, loot = null, lootMsg = '', levelUpMsg = '';
    // Use centralized loot table
    const { lootTable } = require('./loot');
    const { getLootByType, weightedRandomItem } = require('../lootUtils');
    if (roll < critChance) {
      outcome = 'Critical hit! You won effortlessly.';
      reason = `Your luck (${luck}) paid off!`;
      xpGained = Math.floor(Math.random() * 41) + 80; // 80-120 XP
      // Guaranteed rare loot
      // Pick a rare loot type
      const rareTypes = ['weapon', 'armor', 'potion'];
      const lootType = rareTypes[Math.floor(Math.random() * rareTypes.length)];
      const lootItems = getLootByType(lootType);
      loot = weightedRandomItem(lootItems);
      if (loot) {
        lootMsg = `You found: **${loot.name}**! (Rarity: ${loot.rarity})`;
      }
    } else if (roll < critChance + winChance) {
      outcome = 'You defeated the enemy and gained experience!';
      reason = `Your strength (${str}) and level (${level}) led to victory.`;
      xpGained = Math.floor(Math.random() * 31) + 40; // 40-70 XP
      // 60% chance for loot
      if (Math.random() < 0.6) {
        // 40% rare loot, 60% gold (luck increases rare chance, nerfed to +0.2% per luck)
        const rareChance = Math.min(0.4 + luck * 0.002, 0.95);
        let lootType;
        if (Math.random() < rareChance) {
          const rareTypes = ['weapon', 'armor', 'potion', 'gem'];
          lootType = rareTypes[Math.floor(Math.random() * rareTypes.length)];
        } else {
          lootType = 'currency';
        }
        const lootItems = getLootByType(lootTable, lootType);
        loot = weightedRandomItem(lootItems);
        if (loot) {
          lootMsg = `You found: **${loot.name}**! (Rarity: ${loot.rarity})`;
        }
      }
    } else if (roll < critChance + winChance + drawChance) {
      outcome = 'You fought bravely but the battle was a draw.';
      reason = `Your defense (${def}) helped you hold your ground.`;
      xpGained = Math.floor(Math.random() * 6) + 5; // 5-10 XP
    } else {
      outcome = 'The enemy was too strong. You had to retreat!';
      reason = 'Better luck (and stats) next time!';
      // Penalty: lose XP and possibly items
      // XP penalty now scales with level, and DEF reduces the penalty
      const level = character.level || 1;
      let basePenalty = (level * 5) + Math.floor(Math.random() * (level * 3 + 1)); // e.g. lvl 30: 150-240
      let defReduction = def * 0.0025; // 0.25% per DEF, no cap
      let xpPenalty = Math.max(1, Math.floor(basePenalty * (1 - defReduction)));
      character.xp = Math.max(0, (character.xp || 0) - xpPenalty);
      if (def > 0) {
        reason += `\nYou lost ${xpPenalty} XP! (Base: ${basePenalty}, DEF reduced penalty by ${(defReduction*100).toFixed(2)}%)`;
      } else {
        reason += `\nYou lost ${xpPenalty} XP!`;
      }
      // Lose 1-2 random equipped items (gear) if any
      if (character.equipment && Object.keys(character.equipment).length > 0) {
        const equippedItems = Object.entries(character.equipment);
        const itemsToLose = Math.min(equippedItems.length, Math.floor(Math.random() * 2) + 1);
        let lostItems = [];
        for (let i = 0; i < itemsToLose; i++) {
          if (equippedItems.length === 0) break;
          const idx = Math.floor(Math.random() * equippedItems.length);
          const [slot, item] = equippedItems.splice(idx, 1)[0];
          lostItems.push(item);
          delete character.equipment[slot];
        }
        reason += `\nYou dropped: ${lostItems.map(x => `**${x}**`).join(', ')} from your equipped gear!`;
      }
    }
    // Apply rewards
    if (xpGained > 0) {
      character.xp = (character.xp || 0) + xpGained;
      reason += `\nYou gained ${xpGained} XP!`;
    }
    if (loot) {
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
        } else {
          character.inventory.push({ ...loot, count: 1 });
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
    const respond = replyFn || (data => interaction.reply(data));
    const xpForNext = getXpForNextLevel(character.level || 1);
    const levelLine = `Level: ${character.level || 1} | XP: ${character.xp} / ${xpForNext}`;
    await respond({ content: `Battle result: ${outcome}\n${reason}${levelUpMsg}\n${levelLine}`, components: [row], ephemeral: true });
  }
};
