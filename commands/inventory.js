// commands/inventory.js
const { SlashCommandBuilder } = require('discord.js');

// Utility functions to load/save characters (shared with character.js)
function loadCharacters() {
  const fs = require('fs');
  const path = require('path');
  const CHARACTERS_FILE = path.join(__dirname, '../characters.json');
  if (!fs.existsSync(CHARACTERS_FILE)) return {};
  try {
    const data = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}
function saveCharacters(characters) {
  const fs = require('fs');
  const path = require('path');
  const CHARACTERS_FILE = path.join(__dirname, '../characters.json');
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Check your inventory.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    let characters = loadCharacters();
    let character = characters[userId];
    if (!character) {
      await interaction.reply({ content: 'You do not have a character yet. Use /character to create one!', ephemeral: true });
      return;
    }
    // Ensure inventory exists
    if (!Array.isArray(character.inventory)) {
      character.inventory = [];
      characters[userId] = character;
      saveCharacters(characters);
    }
    if (character.inventory.length === 0) {
      await interaction.reply({ content: 'Your inventory is empty.', ephemeral: true });
    } else {
      // Rich formatting: numbered, grouped with icons
      const typeIcons = {
        Weapon: '⚔️',
        Potion: '🧪',
        Gold: '💰',
        Armor: '🛡️',
        Default: '🎒'
      };
      // Helper to guess item type
      function getItemType(item) {
        if (/sword|axe|dagger|bow/i.test(item)) return 'Weapon';
        if (/potion/i.test(item)) return 'Potion';
        if (/gold/i.test(item)) return 'Gold';
        if (/armor|shield|chainmail/i.test(item)) return 'Armor';
        return 'Default';
      }
      // Aggregate gold and count unique items
      let goldTotal = 0;
      const itemCounts = {};
      for (const item of character.inventory) {
        let itemName = typeof item === 'string' ? item : item.name;
        // Handle gold
        if (itemName && /(\d+) Gold/i.test(itemName)) {
          const goldMatch = itemName.match(/(\d+) Gold/i);
          if (goldMatch) {
            goldTotal += parseInt(goldMatch[1], 10);
            continue;
          }
        }
        itemCounts[itemName] = itemCounts[itemName] || { count: 0, data: item };
        itemCounts[itemName].count++;
      }
      const uniqueItems = Object.keys(itemCounts);
      let inventoryItems = [];
      if (goldTotal > 0) {
        inventoryItems.push({
          name: `${typeIcons.Gold} Gold`,
          value: `${goldTotal} Gold`,
          inline: false
        });
      }
      inventoryItems = inventoryItems.concat(uniqueItems.map((itemName) => {
        const entry = itemCounts[itemName];
        const type = getItemType(itemName);
        const icon = typeIcons[type] || typeIcons.Default;
        const count = entry.count;
        let value = '';
        if (typeof entry.data === 'object' && entry.data !== null) {
          if (entry.data.rarity) value += `Rarity: ${entry.data.rarity}\n`;
          if (entry.data.price) value += `Price: ${entry.data.price} Gold\n`;
          if (character.equipment) {
            // Show new slot names in a friendly order
            const slotOrder = ['head', 'arms', 'chest', 'legs', 'necklace', 'ring1', 'ring2', 'weapon'];
            let equipStr = slotOrder
              .map(slot => character.equipment[slot] ? `${slot}: ${character.equipment[slot]}` : null)
              .filter(Boolean)
              .join(', ');
            value += `\nEquipped: ${equipStr}`;
          }
          if (entry.data.stats) {
            const stats = Object.entries(entry.data.stats).map(([k, v]) => `${k.slice(0,3).toUpperCase()}: +${v}`).join(', ');
            if (stats) value += `Stats: ${stats}\n`;
          }
          if (entry.data.uses) value += `Uses: ${entry.data.uses}\n`;
          if (entry.data.boost) value += `Boost: +${entry.data.boost} ${entry.data.stat || ''}\n`;
        }
        if (count > 1) value += `Count: ${count}`;
        return {
          name: `${icon} ${itemName}`,
          value: value.trim() || '—',
          inline: false
        };
      }));

      // Pagination logic
      const ITEMS_PER_PAGE = 10;
      let page = 0;
      if (interaction.options && interaction.options.getInteger && interaction.options.getInteger('page') !== null) {
        page = interaction.options.getInteger('page') - 1;
      }
      const totalPages = Math.ceil(inventoryItems.length / ITEMS_PER_PAGE) || 1;
      if (page < 0) page = 0;
      if (page >= totalPages) page = totalPages - 1;
      const pagedItems = inventoryItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

      const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s Inventory`)
        .setColor(0xffd700)
        .setFooter({ text: `Page ${page + 1} of ${totalPages}` });
      pagedItems.forEach(item => embed.addFields(item));

      const row = new ActionRowBuilder();
      if (totalPages > 1) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('inv_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('inv_next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages - 1)
        );
      }
      await interaction.reply({
        embeds: [embed],
        components: totalPages > 1 ? [row] : [],
        ephemeral: true
      });

      // Button interaction handler (collector)
      if (totalPages > 1) {
        const filter = i => i.user.id === interaction.user.id && (i.customId === 'inv_next' || i.customId === 'inv_prev');
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        collector.on('collect', async i => {
          if (i.customId === 'inv_next') page++;
          if (i.customId === 'inv_prev') page--;
          if (page < 0) page = 0;
          if (page >= totalPages) page = totalPages - 1;
          const pagedItems = inventoryItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
          const newEmbed = EmbedBuilder.from(embed).setFields([]).setFooter({ text: `Page ${page + 1} of ${totalPages}` });
          pagedItems.forEach(item => newEmbed.addFields(item));

          // Rebuild the button row to update disabled state
          const newRow = new ActionRowBuilder();
          newRow.addComponents(
            new ButtonBuilder()
              .setCustomId('inv_prev')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('inv_next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === totalPages - 1)
          );

          await i.update({ embeds: [newEmbed], components: [newRow], ephemeral: true });
        });
      }
    }
  }
};
