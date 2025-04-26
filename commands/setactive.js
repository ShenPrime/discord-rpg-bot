const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { getCharacter, saveCharacter } = require('../characterModel');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('setactive')
    .setDescription('Switch your active house or mount for your character sheet.')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('What to switch')
        .setRequired(true)
        .addChoices(
          { name: 'House', value: 'house' },
          { name: 'Mount', value: 'mount' }
        )
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const type = interaction.options.getString('type');
    const character = await getCharacter(userId);
    if (!character || !character.collections || !Array.isArray(character.collections[type + 's']) || character.collections[type + 's'].length === 0) {
      await interaction.reply({
        content: `You don't own any ${type === 'house' ? 'houses' : 'mounts'} yet!`,
        ephemeral: true
      });
      return;
    }
    // Build select menu
    const items = character.collections[type + 's'];
    const select = new StringSelectMenuBuilder()
      .setCustomId(`setactive_${type}`)
      .setPlaceholder(`Select your active ${type}`)
      .addOptions(
        items.map(item => ({
          label: item.name,
          value: item.name,
          description: item.description ? item.description.substring(0, 80) : undefined
        }))
      );
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({
      content: `Choose which ${type} to display on your character sheet:`,
      components: [row],
      ephemeral: true
    });
  },
  // Handler for select menu
  async handleSelect(interaction) {
    const userId = interaction.user.id;
    const [_, type] = interaction.customId.split('_');
    const value = interaction.values[0];
    const character = await getCharacter(userId);
    if (!character || !character.collections || !Array.isArray(character.collections[type + 's'])) {
      await interaction.reply({
        content: `Could not update your ${type}. Please try again.`,
        ephemeral: true
      });
      return;
    }
    if (!character.collections[type + 's'].some(item => item.name === value)) {
      await interaction.reply({
        content: `You do not own that ${type}.`,
        ephemeral: true
      });
      return;
    }
    if (type === 'house') character.activeHouse = value;
    else if (type === 'mount') character.activeMount = value;
    await saveCharacter(userId, character);
    await interaction.update({
      content: `Your active ${type} is now **${value}**!`,
      components: [],
      ephemeral: true
    });
  }
};
