// Debug utility for modal submissions in sell.js
module.exports = async function debugModal(interaction) {
  let debugInfo = '';
  try {
    debugInfo += `customId: ${interaction.customId}\n`;
    debugInfo += `fields: ${JSON.stringify(interaction.fields ? interaction.fields.fields : null)}\n`;
    debugInfo += `isModalSubmit: ${interaction.isModalSubmit}\n`;
    debugInfo += `user: ${interaction.user ? interaction.user.id : 'none'}\n`;
    debugInfo += `fields.getTextInputValue('quantity'): `;
    try {
      debugInfo += interaction.fields.getTextInputValue('quantity');
    } catch (e) {
      debugInfo += `ERROR: ${e.message}`;
    }
  } catch (e) {
    debugInfo += `Outer error: ${e.message}`;
  }
  await interaction.reply({ content: 'DEBUG INFO:\n' + debugInfo, ephemeral: true });
};
