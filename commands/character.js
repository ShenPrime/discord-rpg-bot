const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const { getXpForNextLevel, checkLevelUp, getClassForLevel } = require('../characterUtils');
const { getCharacter, saveCharacter } = require('../characterModel');







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
    // Flush fight session if it exists (unified logic)
    const fightSessionManager = require('../fightSessionManager');
    const userId = interaction.user.id;
    await fightSessionManager.flushIfExists(userId);
    let character = await getCharacter(userId);

    if (character) {
      // Level and XP display
      const xp = character.xp || 0;
      const level = character.level || 1;
      const xpForNext = getXpForNextLevel(level);


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
      // Backwards compatibility: migrate old house/mount to collections
      if (character.house && (!character.collections || !Array.isArray(character.collections.houses) || character.collections.houses.length === 0)) {
        character.collections = character.collections || { houses: [], mounts: [], weapons: [], armor: [] };
        character.collections.houses = [character.house];
        character.activeHouse = character.house.name;
        delete character.house;
        await saveCharacter(userId, character);
      }
      if (character.mount && (!character.collections || !Array.isArray(character.collections.mounts) || character.collections.mounts.length === 0)) {
        character.collections = character.collections || { houses: [], mounts: [] };
        character.collections.mounts = [character.mount];
        character.activeMount = character.mount.name;
        delete character.mount;
        await saveCharacter(userId, character);
      }
      // Migrate epic/legendary weapons and armor from inventory to collections
      let migrated = false;
      if (character.inventory && Array.isArray(character.inventory)) {
        character.collections = character.collections || { houses: [], mounts: [], weapons: [], armor: [] };
        const mergeOrAddCollectionItem = require('../mergeOrAddCollectionItem');
        // Weapons
        character.inventory.forEach(item => {
          if (item.type === 'Weapon' && (item.rarity === 'epic' || item.rarity === 'legendary')) {
            mergeOrAddCollectionItem(character.collections.weapons, item);
            migrated = true;
          }
        });
        // Armor
        character.inventory.forEach(item => {
          if (item.type === 'Armor' && (item.rarity === 'epic' || item.rarity === 'legendary')) {
            mergeOrAddCollectionItem(character.collections.armor, item);
            migrated = true;
          }
        });
        if (migrated) {
          await saveCharacter(userId, character);
        }
      }
      // Show active house and mount from collections
      let houseStr = '';
      if (character.collections && character.activeHouse) {
        const house = character.collections.houses.find(h => h.name === character.activeHouse);
        if (house) {
          houseStr = `🏠 **${house.name}**${house.size ? ` (${house.size})` : ''}\n${house.description || ''}`;
        }
      }
      let mountStr = '';
      if (character.collections && character.activeMount) {
        const mount = character.collections.mounts.find(m => m.name === character.activeMount);
        if (mount) {
          mountStr = `🐎 **${mount.name}**\n${mount.description || ''}`;
        }
      }
      // Familiar
      let familiarStr = '';
      if (character.collections && character.activeFamiliar) {
        const familiar = (character.collections.familiars || []).find(f => f.name === character.activeFamiliar);
        if (familiar) {
          familiarStr = `🦊 **${familiar.name}**${familiar.rarity ? ` (${familiar.rarity})` : ''}${familiar.count && familiar.count > 1 ? ` x${familiar.count}` : ''}`;
        }
      }
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
            (mountStr ? `\n\n${mountStr}` : '') +
            (familiarStr ? `\n\n${familiarStr}` : ''),
          color: 0x3498db,
          footer: { text: 'Your RPG Character Sheet' }
        }],
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
          strength: 1,
          defense: 0,
          luck: 0
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

      });
    }
  },
};


