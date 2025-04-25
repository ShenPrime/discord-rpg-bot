// Utility for paginating a select menu with navigation buttons (Discord.js v14+)
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Paginate a select menu with navigation buttons.
 * @param {Object} options
 * @param {Array} options.choices - Array of select menu options (label, value, description, etc).
 * @param {number} options.page - Current page (0-indexed).
 * @param {string} options.selectCustomId - Custom ID for the select menu.
 * @param {string} options.buttonCustomIdPrefix - Prefix for page nav button custom IDs (e.g. 'shop_page_').
 * @param {string} options.placeholder - Placeholder text for the select menu.
 * @param {number} [options.minValues=1] - Minimum values selectable.
 * @param {number} [options.maxValues=1] - Maximum values selectable.
 * @param {string} [options.contentPrefix] - Optional prefix for the message content.
 * @returns {{components: Array, currentPage: number, totalPages: number, pagedChoices: Array}}
 */
function paginateSelectMenu({
  choices,
  page = 0,
  selectCustomId,
  buttonCustomIdPrefix,
  placeholder,
  minValues = 1,
  maxValues = 1,
  contentPrefix = '',
  disableButtons = false
}) {
  const pageSize = 25;
  const totalPages = Math.ceil(choices.length / pageSize);
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));
  const pagedChoices = choices.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(selectCustomId)
    .setPlaceholder(placeholder)
    .setMinValues(minValues)
    .setMaxValues(Math.min(pagedChoices.length, maxValues))
    .addOptions(pagedChoices);
  const selectRow = new ActionRowBuilder().addComponents(selectMenu);
  let components = [selectRow];
  if (totalPages > 1) {
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${buttonCustomIdPrefix}${currentPage - 1}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableButtons || currentPage === 0),
      new ButtonBuilder()
        .setCustomId(`${buttonCustomIdPrefix}${currentPage + 1}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableButtons || currentPage === totalPages - 1)
    );
    components.push(buttonRow);
  }
  return {
    components,
    currentPage,
    totalPages,
    pagedChoices,
    content: `${contentPrefix}${totalPages > 1 ? ` (Page ${currentPage + 1} of ${totalPages})` : ''}`
  };
}

module.exports = paginateSelectMenu;
