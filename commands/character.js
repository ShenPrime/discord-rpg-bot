const { SlashCommandBuilder } = require('discord.js');
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
    let characters = loadCharacters();
    let character = characters[userId];

    if (character) {
      // Level and XP display
      const xp = character.xp || 0;
      const level = character.level || 1;
      const xpForNext = 100 * level;

      // Level up if necessary
      if (xp >= xpForNext) {
        character.level = level + 1;
        character.xp = xp - xpForNext;
        // Level up stats by random 1-5
        if (!character.stats) {
          character.stats = { strength: 2, defense: 2, agility: 2, luck: 2 };
        }
        function randStat() { return Math.floor(Math.random() * 2) + 1; }
        const strUp = randStat();
        const defUp = randStat();
        const agiUp = randStat();
        const luckUp = randStat();
        character.stats.strength += strUp;
        character.stats.defense += defUp;
        character.stats.agility += agiUp;
        character.stats.luck += luckUp;
        saveCharacters(characters);
        await interaction.reply({
          content: `You leveled up! You are now level ${character.level}.
Stats gained: STR +${strUp}, DEF +${defUp}, AGI +${agiUp}, LUCK +${luckUp}`,
          ephemeral: true
        });
      }

      // Calculate equipment bonuses
      // Use lootTable from loot.js for equipment stats
      const { lootTable } = require('./loot');
      const baseStats = character.stats || { strength: 2, defense: 2, agility: 2, luck: 2 };
      let eqStats = { strength: 0, defense: 0, agility: 0, luck: 0 };
      let eqList = [];
      if (character.equipment) {
        for (const [slot, itemName] of Object.entries(character.equipment)) {
          // Find the item in lootTable
          const lootItem = lootTable.find(i => i.name === itemName && i.stats);
          if (lootItem && lootItem.stats) {
            eqList.push(`${slot}: ${itemName}`);
            for (const [stat, val] of Object.entries(lootItem.stats)) {
              eqStats[stat] = (eqStats[stat] || 0) + val;
            }
          }
        }
      }
      const totalStats = {
        strength: baseStats.strength + (eqStats.strength || 0),
        defense: baseStats.defense + (eqStats.defense || 0),
        agility: baseStats.agility + (eqStats.agility || 0),
        luck: baseStats.luck + (eqStats.luck || 0)
      };

      await interaction.reply({
        embeds: [{
          title: `${interaction.user.username}'s Character`,
          fields: [
            { name: 'Name', value: character.name },
            { name: 'Class', value: character.class },
            { name: 'Level', value: `${character.level}` },
            { name: 'XP', value: `${character.xp} / ${100 * character.level}` },
            { name: 'Stats', value: `STR: ${baseStats.strength} | DEF: ${baseStats.defense} | AGI: ${baseStats.agility} | LUCK: ${baseStats.luck}` },
            { name: 'Equipment', value: eqList.length ? eqList.join('\n') : 'None', inline: false },
            { name: 'Total Stats', value: `STR: ${totalStats.strength} | DEF: ${totalStats.defense} | AGI: ${totalStats.agility} | LUCK: ${totalStats.luck}` },
            ...(character.house ? [{
              name: '🏠 House',
              value: `**${character.house.name}** (${character.house.size})\n${character.house.description}`
            }] : [])
          ],
          color: 0x00ff99,
        }]
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
        class: 'Adventurer', // Default class
        level: 1,
        xp: 0,
        stats: {
          strength: 2,
          defense: 2,
          agility: 2,
          luck: 2
        }
      };
      characters[userId] = character;
      saveCharacters(characters);
      await interaction.reply({
        content: `Character created! Welcome, ${character.name} the ${character.class} (Level ${character.level}).`,
        ephemeral: true
      });
    }
  },
};
