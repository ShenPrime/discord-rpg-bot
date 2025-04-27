// commands/saleSummary.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const ITEMS_PER_PAGE = 10;

/**
 * Generates a paginated sale summary embed and navigation buttons.
 * @param {Object[]} soldItems - Array of objects: { name: string, count: number, gold: number }
 * @param {number} totalGold - Total gold gained from the sale
 * @param {number} page - Current page (0-indexed)
 * @returns {Object} { embed, components, totalPages }
 */
function getSaleSummaryEmbed(soldItems, totalGold, page = 0) {
  // Sort by gold descending
  soldItems = [...soldItems].sort((a, b) => b.gold - a.gold);
  const totalPages = Math.max(1, Math.ceil(soldItems.length / ITEMS_PER_PAGE));
  if (page < 0) page = 0;
  if (page >= totalPages) page = totalPages - 1;
  const pagedItems = soldItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const description = pagedItems.length
    ? pagedItems.map(item => `• **${item.count}x** ${item.name} — +${item.gold} gold`).join('\n')
    : 'No items were sold.';

  const embed = new EmbedBuilder()
    .setTitle('Sale Summary')
    .setColor(0x43b581)
    .setDescription(description)
    .setFooter({ text: `Page ${page + 1} of ${totalPages} • Total Gold: ${totalGold}` });

  // Pagination buttons
  const prevButton = new ButtonBuilder()
    .setCustomId(`sale_summary_prev_${page - 1}`)
    .setLabel('Previous')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page === 0);
  const nextButton = new ButtonBuilder()
    .setCustomId(`sale_summary_next_${page + 1}`)
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page === totalPages - 1);

  const buttonRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

  return {
    embed,
    components: [buttonRow],
    totalPages
  };
}

module.exports = { getSaleSummaryEmbed };
