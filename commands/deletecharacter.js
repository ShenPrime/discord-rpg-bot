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
    .setName('deletecharacter')
    .setDescription('Delete your RPG character and all progress.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    if (!characters[userId]) {
      await interaction.reply({ content: 'You do not have a character to delete.', ephemeral: true });
      return;
    }
    delete characters[userId];
    saveCharacters(characters);
    await interaction.reply({ content: 'Your character has been deleted. You can start over with /character.', ephemeral: true });
  }
};
