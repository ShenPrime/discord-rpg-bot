const { SlashCommandBuilder } = require('discord.js');


const { getCharacter, deleteCharacter } = require('../characterModel');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletecharacter')
    .setDescription('Delete your RPG character and all progress.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const character = await getCharacter(userId);
    if (!character) {
      await interaction.reply({ content: 'You do not have a character to delete.', ephemeral: true });
      return;
    }
    await deleteCharacter(userId);
    await interaction.reply({ content: 'Your character has been deleted. You can start over with /character.', ephemeral: true });
  }
};
