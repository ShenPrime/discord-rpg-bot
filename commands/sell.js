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
    .setName('sell')
    .setDescription('Sell items from your inventory for gold.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to sell from!', ephemeral: true });
      return;
    }
    // Get equipped items for labeling
    const equipped = character.equipment ? Object.values(character.equipment) : [];
    // Build select menu options, skipping gold
    // Pagination for select menu
    const ITEMS_PER_PAGE = 25;
    let page = 0;
    // Try to get page from interaction (for button navigation)
    if (interaction.message && interaction.message.components && interaction.customId && interaction.customId.startsWith('sell_page_')) {
      page = parseInt(interaction.customId.replace('sell_page_', ''), 10) || 0;
    } else if (interaction.options && interaction.options.getInteger && interaction.options.getInteger('page') !== null) {
      page = interaction.options.getInteger('page') - 1;
    }
    // Build options with index
    const allOptions = character.inventory
      .map((item, idx) => {
        let name = typeof item === 'string' ? item : item.name;
        if (/gold/i.test(name)) return null; // skip gold
        if (equipped.includes(name)) return null; // skip equipped
        let label = name;
        // Attempt to get price
        let price = (typeof item === 'object' && item.price) ? item.price : 10; // fallback price
        return {
          label: `${label} - ${price} Gold`,
          value: idx.toString(),
          description: label.length < 90 ? label : label.slice(0, 90)
        };
      })
      .filter(Boolean);
    const totalPages = Math.ceil(allOptions.length / ITEMS_PER_PAGE) || 1;
    if (page < 0) page = 0;
    if (page >= totalPages) page = totalPages - 1;
    const pagedOptions = allOptions.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
    if (pagedOptions.length === 0) {
      await interaction.reply({ content: 'You have nothing to sell on this page!', ephemeral: true });
      return;
    }
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('sell_select')
        .setMinValues(1)
        .setMaxValues(Math.min(pagedOptions.length, 10))
        .setOptions(pagedOptions)
    );
    let buttonRow = null;
    if (totalPages > 1) {
      buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sell_page_' + (page - 1))
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('sell_page_' + (page + 1))
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1)
      );
    }
    await interaction.reply({
      content: `Select items to sell: (Page ${page + 1} of ${totalPages})`,
      components: buttonRow ? [selectRow, buttonRow] : [selectRow],
      ephemeral: true
    });

    // Button collector for pagination
    if (totalPages > 1) {
      const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('sell_page_');
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
      collector.on('collect', async i => {
        let nextPage = parseInt(i.customId.replace('sell_page_', ''), 10);
        if (isNaN(nextPage)) nextPage = 0;
        if (nextPage < 0) nextPage = 0;
        if (nextPage >= totalPages) nextPage = totalPages - 1;
        const pagedOptions = allOptions.slice(nextPage * ITEMS_PER_PAGE, (nextPage + 1) * ITEMS_PER_PAGE);
        const selectRow = new ActionRowBuilder().addComponents({
          type: 3,
          custom_id: 'sell_select',
          min_values: 1,
          max_values: Math.min(pagedOptions.length, 10),
          options: pagedOptions
        });
        let buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('sell_page_' + (nextPage - 1))
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(nextPage === 0),
          new ButtonBuilder()
            .setCustomId('sell_page_' + (nextPage + 1))
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(nextPage === totalPages - 1)
        );
        await i.update({
          content: `Select items to sell: (Page ${nextPage + 1} of ${totalPages})`,
          components: [selectRow, buttonRow],
          ephemeral: true
        });
      });
    }
  },

  async handleSelect(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character || !Array.isArray(character.inventory)) {
      await interaction.reply({ content: 'You have no inventory to sell from!', ephemeral: true });
      return;
    }
    const equipped = character.equipment ? Object.values(character.equipment) : [];
    const selected = interaction.values.map(idx => parseInt(idx, 10)).sort((a, b) => b - a); // sort descending for safe splicing
    let totalGold = 0;
    let soldItems = [];
    for (const idx of selected) {
      const item = character.inventory[idx];
      let name = typeof item === 'string' ? item : item.name;
      if (/gold/i.test(name)) {
        soldItems.push(`⚠️ Cannot sell gold: **${name}**`);
        continue;
      }
      if (equipped.includes(name)) {
        soldItems.push(`❌ **${name}** (equipped, not sold)`);
        continue;
      }
      let price = (typeof item === 'object' && item.price) ? item.price : 10;
      totalGold += price;
      soldItems.push(`✅ Sold **${name}** for ${price} Gold`);
      character.inventory.splice(idx, 1);
    }
    // Add gold as a new inventory item
    if (totalGold > 0) {
      character.inventory.push({ name: `${totalGold} Gold`, rarity: 'common', price: totalGold });
    }
    characters[userId] = character;
    saveCharacters(characters);
    await interaction.update({
      content: soldItems.join('\n') + (totalGold > 0 ? `\nYou received ${totalGold} Gold!` : ''),
      components: [],
      ephemeral: true
    });
  }
};

// Usage: if (interaction.isStringSelectMenu() && interaction.customId === 'sell_select') await sell.handleSelect(interaction);
