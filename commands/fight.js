// commands/fight.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Engage in a quick battle!'),
  async execute(interaction) {
    // Load user character
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
    let characters = loadCharacters();
    const userId = interaction.user.id;
    let character = characters[userId];
    if (!character) {
      await interaction.reply({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
      return;
    }
    // Stat-based outcome
    const str = character.stats?.strength || 2;
    const agi = character.stats?.agility || 2;
    const def = character.stats?.defense || 2;
    const luck = character.stats?.luck || 2;
    // Win chance: 40% + 3% per STR, 2% per AGI (max 90%)
    const winChance = Math.min(0.4 + str * 0.03 + agi * 0.02, 0.9);
    // Draw chance: 15% + 3% per DEF (max 60%)
    const drawChance = Math.min(0.15 + def * 0.03, 0.6);
    // Crit chance: 5% per LUCK (max 50%)
    const critChance = Math.min(luck * 0.05, 0.5);
    const roll = Math.random();
    let outcome, reason, xpGained = 0, loot = null, lootMsg = '', levelUpMsg = '';
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
        const lootItems = getLootByType(lootType);
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
      character.inventory.push(loot);
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
    // Save
    characters[userId] = character;
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));
    await interaction.reply({ content: `Battle result: ${outcome}\n${reason}${levelUpMsg}`, ephemeral: true });
  }
};
