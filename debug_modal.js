// Debug utility for modal submissions in sell.js
module.exports = async function debugModal(interaction) {
  let debugInfo = '';
  try {
    debugInfo += `customId: ${interaction.customId}\n`;
    // Show both object and array field structures
    let fieldObj = interaction.fields && interaction.fields.fields;
    let fieldArr = null;
    // Discord.js v14+ sometimes provides fields.fields as an array (as seen in your debug)
    if (Array.isArray(fieldObj)) {
      fieldArr = fieldObj;
    } else if (Array.isArray(interaction.fields)) {
      fieldArr = interaction.fields;
    }
    debugInfo += `fields (object): ${JSON.stringify(fieldObj)}\n`;
    debugInfo += `fields (array): ${JSON.stringify(fieldArr)}\n`;
    if (fieldArr) {
      debugInfo += `all field customIds: ${fieldArr.map(f => f.customId).join(', ')}\n`;
      debugInfo += `all field values: ${fieldArr.map(f => `${f.customId}: ${f.value}`).join(', ')}\n`;
    } else if (fieldObj && typeof fieldObj === 'object') {
      debugInfo += `all field customIds: ${Object.keys(fieldObj).join(', ')}\n`;
      debugInfo += `all field values: ${Object.entries(fieldObj).map(([k, v]) => `${k}: ${v.value}`).join(', ')}\n`;
    } else {
      debugInfo += `all field customIds: none\n`;
      debugInfo += `all field values: none\n`;
    }
    debugInfo += `isModalSubmit: ${typeof interaction.isModalSubmit === 'function' ? interaction.isModalSubmit() : interaction.isModalSubmit}\n`;
    debugInfo += `user: ${interaction.user ? interaction.user.id : 'none'}\n`;
  } catch (e) {
    debugInfo += `Outer error: ${e.message}`;
  }
  await interaction.reply({ content: 'DEBUG INFO:\n' + debugInfo, ephemeral: true });
};
