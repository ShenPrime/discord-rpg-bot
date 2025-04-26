const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCharacter } = require('../characterModel');

const ITEMS_PER_PAGE = 10;
const CATEGORIES = [
  { label: 'Houses', value: 'houses' },
  { label: 'Mounts', value: 'mounts' },
  { label: 'Weapons', value: 'weapons' },
  { label: 'Armor', value: 'armor' },
  { label: 'Everything', value: 'everything' }
];

function filterEpicLegendary(items) {
  return (items || []).filter(i => i.rarity === 'epic' || i.rarity === 'legendary');
}

function formatItem(item, icon) {
  let statsStr = '';
  if (item.stats && typeof item.stats === 'object' && Object.keys(item.stats).length > 0) {
    statsStr = '\nStats: ' + Object.entries(item.stats)
      .map(([stat, val]) => `${val > 0 ? '+' : ''}${val} ${stat.charAt(0).toUpperCase() + stat.slice(1)}`)
      .join(', ');
  }
  let countStr = item.count && item.count > 1 ? ` x${item.count}` : '';
  return `${icon} **${item.name}**${countStr}${item.size ? ` (${item.size})` : ''}${item.price ? ` — 💰${item.price} Gold` : ''}${item.rarity ? `\nRarity: ${item.rarity}` : ''}${statsStr}${item.description ? `\n${item.description}` : ''}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collections')
    .setDescription('Show off your RPG collections (houses, mounts, epic/legendary weapons & armor)!'),
  async execute(interaction) {
    let category = 'houses';
    let page = 0;
    if (interaction.isStringSelectMenu && interaction.isStringSelectMenu() && interaction.customId.startsWith('collections_cat')) {
      category = interaction.values[0];
      const match = interaction.customId.match(/collections_cat_(\d+)/);
      if (match) page = parseInt(match[1], 10) || 0;
    } else if (interaction.options && interaction.options.getString('category')) {
      category = interaction.options.getString('category');
    }
    if (interaction.isButton && interaction.isButton()) {
      const match = interaction.customId.match(/collections_(\w+)_(\d+)/);
      if (match) {
        category = match[1];
        page = parseInt(match[2], 10) || 0;
      }
    }
    const userId = interaction.user.id;
    const character = await getCharacter(userId);
    if (!character || !character.collections) {
      await interaction.reply({
        content: "You don't own any collections yet!",
        ephemeral: false
      });
      return;
    }
    // Gather items by category
    const houses = character.collections.houses || [];
    const mounts = character.collections.mounts || [];
    const weapons = filterEpicLegendary(character.collections.weapons);
    const armor = filterEpicLegendary(character.collections.armor);
    let items = [];
    if (category === 'houses') {
      items = houses.map(h => formatItem(h, '🏠'));
    } else if (category === 'mounts') {
      items = mounts.map(m => formatItem(m, '🐎'));
    } else if (category === 'weapons') {
      items = weapons.map(w => formatItem(w, '🗡️'));
    } else if (category === 'armor') {
      items = armor.map(a => formatItem(a, '🛡️'));
    } else if (category === 'everything') {
      items = [
        ...houses.map(h => formatItem(h, '🏠')),
        ...mounts.map(m => formatItem(m, '🐎')),
        ...weapons.map(w => formatItem(w, '🗡️')),
        ...armor.map(a => formatItem(a, '🛡️'))
      ];
    }
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    if (page < 0) page = 0;
    if (page >= totalPages) page = totalPages - 1;
    const pagedItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
    const embed = new EmbedBuilder()
      .setTitle(`${character.name}'s Collections — ${CATEGORIES.find(c => c.value === category).label}`)
      .setColor(0x8e44ad)
      .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
      .setDescription(pagedItems.length ? pagedItems.join('\n\n') : 'No items in this category.');
    // Category select
    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`collections_cat_${page}`)
        .setPlaceholder('Select category')
        .addOptions(CATEGORIES.map(c => ({ label: c.label, value: c.value, default: c.value === category })))
    );
    // Pagination buttons
    const buttonRow = new ActionRowBuilder();
    buttonRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`collections_${category}_${page - 1}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId(`collections_${category}_${page + 1}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages - 1)
    );
    // Respond or update
    if (interaction.isButton && interaction.isButton()) {
      await interaction.update({ embeds: [embed], components: [selectRow, buttonRow] });
    } else if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
      await interaction.update({ embeds: [embed], components: [selectRow, buttonRow] });
    } else {
      await interaction.reply({ embeds: [embed], components: [selectRow, buttonRow] });
    }
  }
};
