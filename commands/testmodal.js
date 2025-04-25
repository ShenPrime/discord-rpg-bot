const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testmodal')
    .setDescription('Test Discord modal field extraction.'),
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('test_modal')
      .setTitle('Test Modal')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('test_input')
            .setLabel('Test Input')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
  },
  async handleSelect(interaction) {
    // Called on modal submit
    if (interaction.isModalSubmit() && interaction.customId === 'test_modal') {
      let value = null;
      try {
        value = interaction.fields.getTextInputValue('test_input');
      } catch (e) {
        value = `ERROR: ${e.message}`;
      }
      await interaction.reply({ content: `Test input value: ${value}`, ephemeral: true });
    }
  }
};
