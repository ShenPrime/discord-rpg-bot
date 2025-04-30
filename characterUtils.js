// Utility functions for XP, level, and stat calculations (no file I/O)

function getXpForNextLevel(level) {
  // Level 2: 1000 XP, each level adds 4000 XP more
  if (level < 2) return 1000;
  return 1000 + 4000 * (level - 1);
}

function getClassForLevel(level) {
  if (level >= 100) return 'The One Above All';
  if (level >= 95) return 'Cosmic Supreme';
  if (level >= 90) return 'Supreme Celestial';
  if (level >= 85) return 'Supreme';
  if (level >= 80) return 'Diety';
  if (level >= 75) return 'Divine Avatar';
  if (level >= 65) return 'Transcendent';
  if (level >= 55) return 'Divine Hero';
  if (level >= 50) return 'Mythic Champion';
  if (level >= 45) return 'Legendary Hero';
  if (level >= 35) return 'Master Knight';
  if (level >= 25) return 'Elite Warrior';
  if (level >= 15) return 'Veteran';
  if (level >= 10) return 'Warrior';
  return 'Adventurer';
}

function checkLevelUp(character) {
  let leveledUp = false;
  let levelUpMsg = '';
  const randStat = () => Math.floor(Math.random() * 2) + 1;
  while (character.xp >= getXpForNextLevel(character.level || 1)) {
    character.xp -= getXpForNextLevel(character.level || 1);
    character.level = (character.level || 1) + 1;
    if (!character.stats) {
      character.stats = { strength: 1, defense: 0, luck: 0 };
    }
    character.stats.strength += 1;
    character.class = getClassForLevel(character.level);
    leveledUp = true;
    levelUpMsg += `\n🎉 You leveled up! You are now level ${character.level}!\nStats gained: STR +1`;
  }
  return { leveledUp, levelUpMsg };
}

// Calculates total stats (base, equipment, temporary effects)
function getTotalStats(character, lootTable) {
  const statKeys = ['strength', 'defense', 'luck'];
  // Base stats
  let baseStats = {
    strength: character.stats?.strength ?? 0,
    defense: character.stats?.defense ?? 0,
    luck: character.stats?.luck ?? 0
  };
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
  return { totalStats, baseStats, eqStats, tempStats };
}

module.exports = {
  getXpForNextLevel,
  checkLevelUp,
  getClassForLevel,
  getTotalStats
};
