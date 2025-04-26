const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCharacter } = require('../characterModel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collections')
    .setDescription('Show all houses and mounts you currently own.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const character = await getCharacter(userId);
    if (!character || !character.collections) {
      await interaction.reply({
        content: "You don't own any houses or mounts yet!",
        ephemeral: true
      });
      return;
    }
    const houses = character.collections.houses || [];
    const mounts = character.collections.mounts || [];
    const houseList = houses.length
      ? houses.map(h => `🏠 **${h.name}**${h.size ? ` (${h.size})` : ''}${h.price ? ` — 💰${h.price} Gold` : ''}${h.description ? `\n${h.description}` : ''}`).join('\n\n')
      : 'None';
    const mountList = mounts.length
      ? mounts.map(m => `🐎 **${m.name}**${m.price ? ` — 💰${m.price} Gold` : ''}${m.description ? `\n${m.description}` : ''}`).join('\n\n')
      : 'None';
    const embed = new EmbedBuilder()
      .setTitle(`${character.name}'s Collections`)
      .addFields(
        { name: 'Houses', value: houseList, inline: false },
        { name: 'Mounts', value: mountList, inline: false }
      )
      .setColor(0x8e44ad)
      .setFooter({ text: 'All houses and mounts you own.' });
    await interaction.reply({ embeds: [embed] });
  }
};
