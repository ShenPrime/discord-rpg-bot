const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getXpForNextLevel, checkLevelUp, getClassForLevel } = require('../characterUtils');
const { getCharacter, saveCharacter } = require('../characterModel');

function loadCharacters() {
  if (!fs.existsSync(CHARACTERS_FILE)) return {};
  try {
    const data = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Normalize all inventories: ensure every item except gold has a count property
    for (const charId in parsed) {
      const character = parsed[charId];
      if (Array.isArray(character.inventory)) {
        character.inventory = character.inventory.map(item => {
          if (typeof item === 'object' && item.name && item.name !== 'Gold') {
            if (!Object.prototype.hasOwnProperty.call(item, 'count')) {
              return { ...item, count: 1 };
            }
          }
          return item;
        });
      }
    }
    return parsed;
  } catch (e) {
    return {};
  }
}

module.exports.loadCharacters = loadCharacters;

function saveCharacters(characters) {
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('Create or view your RPG character.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Your character name (required for first time)')
        .setRequired(false)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    let character = await getCharacter(userId);

    if (character) {
      // Level and XP display
      const xp = character.xp || 0;
      const level = character.level || 1;
      const xpForNext = getXpForNextLevel(level);

      // Level up if necessary (may level up multiple times)
      const { leveledUp, levelUpMsg } = checkLevelUp(character);
      if (leveledUp) {
        await saveCharacter(userId, character);
        await interaction.reply({
          content: levelUpMsg,
          ephemeral: true
        });
      }

      // Always update class in case level/class is out of sync
      character.class = getClassForLevel(character.level);
      // Class and stat icons
      const classIcons = {
        'Adventurer': '🧑‍🌾',
        'Warrior': '🗡️',
        'Veteran': '🦾',
        'Elite Warrior': '⚔️',
        'Master Knight': '🛡️',
        'Legendary Hero': '🦸',
        'Mythic Champion': '🐉',
        'Divine Hero': '👼',
        'Transcendent': '🌌',
        'Divine Avatar': '👑',
        'Diety': '☀️',
        'Supreme': '💎',
        'Supreme Celestial': '🌠',
        'Cosmic Supreme': '🪐'
      };
      const statIcons = {
        strength: '💪',
        defense: '🛡️',
        luck: '🍀'
      };
      const userMention = `<@${userId}>`;
      const classIcon = classIcons[character.class] || '✨';
      // Stat lines (only strength, defense, luck)
      const statKeys = ['strength', 'defense', 'luck'];
      let statLines = statKeys.map(stat => {
        const val = character.stats?.[stat] ?? 0;
        const icon = statIcons[stat] || '';
        return `${icon} **${stat.charAt(0).toUpperCase() + stat.slice(1)}:** ${val}`;
      }).join('\n');
      // Calculate total stats (base + equipment + temp)
      const { lootTable } = require('./loot');
      const baseStats = { strength: character.stats?.strength ?? 0, defense: character.stats?.defense ?? 0, luck: character.stats?.luck ?? 0 };
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
      let tempStats = { strength: 0, defense: 0, luck: 0 };
      if (character.activeEffects && Array.isArray(character.activeEffects)) {
        for (const effect of character.activeEffects) {
          if (statKeys.includes(effect.stat)) {
            tempStats[effect.stat] += effect.boost;
          }
        }
      }
      let totalStats = { ...baseStats };
      for (const stat of statKeys) {
        totalStats[stat] = (totalStats[stat] || 0) + (eqStats[stat] || 0) + (tempStats[stat] || 0);
      }
      let totalStatLines = statKeys.map(stat => {
        const icon = statIcons[stat] || '';
        return `${icon} **${stat.charAt(0).toUpperCase() + stat.slice(1)}:** ${totalStats[stat]}`;
      }).join('   ');
      // Equipment
      let eqList = [];
      if (character.equipment) {
        for (const [slot, itemName] of Object.entries(character.equipment)) {
          eqList.push(`• ${slot}: **${itemName}**`);
        }
      }
      // Temporary effects
      let tempEffects = [];
      if (character.activeEffects && Array.isArray(character.activeEffects)) {
        for (const effect of character.activeEffects) {
          tempEffects.push(`+${effect.boost} ${effect.stat} (${effect.usesLeft} uses left)`);
        }
      }
      // House and mount
      let houseStr = character.house ? `🏠 **${character.house.name}** (${character.house.size})\n${character.house.description}` : '';
      let mountStr = character.mount ? `🐎 **${character.mount.name}**\n${character.mount.description}` : '';
      // Embed
      await saveCharacter(userId, character);
      await interaction.reply({
        embeds: [{
          title: `${classIcon} ${character.name} — ${character.class}`,
          description:
            `${userMention}\n\n` +
            `**Level:** ${character.level}\n` +
            `**XP:** ${character.xp || 0} / ${getXpForNextLevel(character.level || 1)}\n\n` +
            `__Base Stats:__\n${statLines}\n` +
            `__Total Stats:__\n${totalStatLines}` +
            (eqList.length ? `\n\n**Equipment:**\n${eqList.join(' \n')}` : '') +
            (tempEffects.length ? `\n\n**Temporary Effects:**\n${tempEffects.join(' \n')}` : '') +
            (houseStr ? `\n\n${houseStr}` : '') +
            (mountStr ? `\n\n${mountStr}` : ''),
          color: 0x3498db,
          footer: { text: 'Your RPG Character Sheet' }
        }],
        ephemeral: true
      });
    } else {
      // Prompt for name if not provided
      const inputName = interaction.options.getString('name');
      if (!inputName) {
        await interaction.reply({
          content: 'Please provide a name for your character using `/character name:<your name>`.',
          ephemeral: true
        });
        return;
      }
      character = {
        name: inputName,
        class: getClassForLevel(1), // Default class based on level
        level: 1,
        xp: 0,
        stats: {
          strength: 2,
          defense: 2,
          agility: 2,
          luck: 2
        }
      };
      await saveCharacter(userId, character);
      // Class icons
      const classIcons = {
        'Adventurer': '🧑‍🌾',
        'Warrior': '🗡️',
        'Veteran': '🦾',
        'Elite Warrior': '⚔️',
        'Master Knight': '🛡️',
        'Legendary Hero': '🦸',
        'Mythic Champion': '🐉',
        'Divine Hero': '👼',
        'Transcendent': '🌌',
        'Divine Avatar': '👑',
        'Diety': '☀️',
        'Supreme': '💎',
        'Supreme Celestial': '🌠',
        'Cosmic Supreme': '🪐'
      };
      const statIcons = {
        strength: '💪',
        defense: '🛡️',
        luck: '🍀'
      };
      const userMention = `<@${userId}>`;
      const classIcon = classIcons[character.class] || '✨';
      // Stat lines
      let statLines = Object.entries(character.stats || {}).map(([stat, val]) => {
        const icon = statIcons[stat] || '';
        return `${icon} **${stat.charAt(0).toUpperCase() + stat.slice(1)}:** ${val}`;
      }).join('\n');
      // Embed
      await interaction.reply({
        embeds: [{
          title: `${classIcon} ${character.name} — ${character.class}`,
          description:
            `${userMention}\n\n` +
            `**Level:** ${character.level}\n` +
            `**XP:** ${character.xp || 0} / ${getXpForNextLevel(character.level || 1)}\n\n` +
            statLines,
          color: 0x3498db,
          footer: { text: 'Your RPG Character Sheet' }
        }],
        ephemeral: true
      });
    }
  },
};


