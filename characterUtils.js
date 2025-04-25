// Utility functions for XP, level, and stat calculations (no file I/O)

function getXpForNextLevel(level) {
  // Non-linear XP curve: grows faster with level
  return 100 + 50 * (level - 1) + 10 * Math.pow(level - 1, 2);
}

function getClassForLevel(level) {
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
      character.stats = { strength: 2, defense: 2, luck: 2 };
    }
    const strUp = randStat();
    const defUp = randStat();

    const luckUp = randStat();
    character.stats.strength += strUp;
    character.stats.defense += defUp;

    character.stats.luck += luckUp;
    character.class = getClassForLevel(character.level);
    leveledUp = true;
    levelUpMsg += `\n🎉 You leveled up! You are now level ${character.level}!\nStats gained: STR +${strUp}, DEF +${defUp}, LUCK +${luckUp}`;
  }
  return { leveledUp, levelUpMsg };
}

module.exports = {
  getXpForNextLevel,
  checkLevelUp,
  getClassForLevel
};
