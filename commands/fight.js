// commands/fight.js
const { SlashCommandBuilder } = require('discord.js');
const mergeOrAddInventoryItem = require('../mergeOrAddInventoryItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Engage in a quick battle!'),
  async execute(interaction) {
    // Load user character
    const { loadCharacters, saveCharacters } = require('../characterUtils');
    let characters = loadCharacters();
    const userId = interaction.user.id;
    let character = characters[userId];
    if (!character) {
      await interaction.reply({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
      return;
    }
    // Stat-based outcome
    // Apply temporary stat boosts from activeEffects
    let str = character.stats?.strength || 2;
    let agi = character.stats?.agility || 2;
    let def = character.stats?.defense || 2;
    let luck = character.stats?.luck || 2;
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      for (const effect of character.activeEffects) {
        if (effect.stat === 'strength') str += effect.boost;
        if (effect.stat === 'agility') agi += effect.boost;
        if (effect.stat === 'defense') def += effect.boost;
        if (effect.stat === 'luck') luck += effect.boost;
      }
    }
    // Win chance: 40% + 3% per STR, 2% per AGI (max 90%)
    const winChance = Math.min(0.4 + str * 0.03 + agi * 0.02, 0.9);
    // Draw chance: 15% + 3% per DEF (max 60%)
    const drawChance = Math.min(0.15 + def * 0.03, 0.6);
    // Crit chance: 5% per LUCK (max 50%)
    const critChance = Math.min(luck * 0.05, 0.5);
    const roll = Math.random();
    let outcome, reason, xpGained = 0, loot = null, lootMsg = '', levelUpMsg = '';
    // Use centralized loot table
    const { lootTable } = require('./loot');
    const { getLootByType, weightedRandomItem } = require('../lootUtils');
    if (roll < critChance) {
      outcome = 'Critical hit! You won effortlessly.';
      reason = `Your luck (${luck}) paid off!`;
      xpGained = Math.floor(Math.random() * 21) + 30; // 30-50 XP
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
      reason = `Your strength (${str}) and agility (${agi}) led to victory.`;
      xpGained = Math.floor(Math.random() * 16) + 15; // 15-30 XP
      // 60% chance for loot
      if (Math.random() < 0.6) {
        // 40% rare loot, 60% gold (luck increases rare chance, nerfed to +0.2% per luck)
        const rareChance = Math.min(0.4 + luck * 0.002, 0.95);
        let lootType;
        if (Math.random() < rareChance) {
          const rareTypes = ['weapon', 'armor', 'potion'];
          lootType = rareTypes[Math.floor(Math.random() * rareTypes.length)];
        } else {
          lootType = 'currency';
        }
        const lootItems = getLootByType(lootTable, lootType);
        loot = weightedRandomItem(lootItems);
        console.log('[FIGHT LOOT DEBUG] lootType:', lootType);
        console.log('[FIGHT LOOT DEBUG] lootItems:', lootItems);
        console.log('[FIGHT LOOT DEBUG] selected loot:', loot);
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
      const xpPenalty = Math.floor(Math.random() * 16) + 10; // 10-25 XP
      character.xp = Math.max(0, (character.xp || 0) - xpPenalty);
      reason += `\nYou lost ${xpPenalty} XP!`;
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
      // All items except those with 'uses' should be stackable
      const isStackable = loot && !loot.uses;
      if (isStackable) {
        mergeOrAddInventoryItem(character.inventory, loot);
      } else {
        character.inventory.push({ ...loot, count: 1 });
      }
      reason += `\n${lootMsg}`;
    }
    // Handle level up
    let leveledUp = false;
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
    // Decrement usesLeft for temporary effects and remove expired ones
    if (character.activeEffects && Array.isArray(character.activeEffects)) {
      character.activeEffects = character.activeEffects.map(e => ({...e, usesLeft: e.usesLeft - 1})).filter(e => e.usesLeft > 0);
    }
    // Save
    characters[userId] = character;
    saveCharacters(characters);
    await interaction.reply({ content: `Battle result: ${outcome}\n${reason}${levelUpMsg}`, ephemeral: true });
  }
};
