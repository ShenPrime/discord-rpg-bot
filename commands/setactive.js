const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
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
          { name: 'Mount', value: 'mount' },
          { name: 'Familiar', value: 'familiar' }
        )
    ),
  async execute(interaction) {
    // Flush fight session if it exists (unified logic)
    const fightSessionManager = require('../fightSessionManager');
    const userId = interaction.user.id;
    await fightSessionManager.flushIfExists(userId);
    const type = interaction.options.getString('type');
    const character = await getCharacter(userId);
    if (!character || !character.collections || !Array.isArray(character.collections[type + 's']) || character.collections[type + 's'].length === 0) {
      let noneMsg = `You don't own any ${type}s yet!`;
      if (type === 'familiar') noneMsg = `You don't own any familiars yet!`;
      else if (type === 'house') noneMsg = `You don't own any houses yet!`;
      else if (type === 'mount') noneMsg = `You don't own any mounts yet!`;
      await interaction.reply({
        content: noneMsg,
        flags: MessageFlags.Ephemeral
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
          label: item.count && item.count > 1 ? `${item.name} (x${item.count})` : item.name,
          value: item.name,
          description: item.description ? item.description.substring(0, 80) : undefined
        }))
      );
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({
      content: `Choose which ${type} to display on your character sheet:`,
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  },
  // Handler for select menu
  async handleSelect(interaction) {
    // Flush fight session if it exists (unified logic)
    const fightSessionManager = require('../fightSessionManager');
    const userId = interaction.user.id;
    await fightSessionManager.flushIfExists(userId);
    const [_, type] = interaction.customId.split('_');
    const value = interaction.values[0];
    const character = await getCharacter(userId);
    if (!character || !character.collections || !Array.isArray(character.collections[type + 's'])) {
      await interaction.reply({
        content: `Could not update your ${type}. Please try again.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    if (!character.collections[type + 's'].some(item => item.name === value)) {
      await interaction.reply({
        content: `You do not own that ${type}.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    if (type === 'house') character.activeHouse = value;
    else if (type === 'mount') character.activeMount = value;
    else if (type === 'familiar') character.activeFamiliar = value;
    await saveCharacter(userId, character);
    await interaction.update({
      content: `Your active ${type} is now **${value}**!`,
      components: [],
      flags: MessageFlags.Ephemeral
    });
  }
};
