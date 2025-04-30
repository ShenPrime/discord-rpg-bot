const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getAllCharacters } = require('../characterModel');
const fightSessionManager = require('../fightSessionManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('exo_leaderboard')
    .setDescription('Show the top 10 players by level.'),
  async execute(interaction) {
    // Load all characters from MongoDB
    let characters;
    try {
      characters = await getAllCharacters();
    } catch (e) {
      await interaction.reply({ content: 'Could not load character data.', flags: MessageFlags.Ephemeral });
      return;
    }
    // Sort by level (desc), then XP (desc)
    characters.sort((a, b) => {
      if ((b.level || 0) !== (a.level || 0)) return (b.level || 0) - (a.level || 0);
      return (b.xp || 0) - (a.xp || 0);
    });
    // Top 10
    const top = characters.slice(0, 10);
    // Fancy formatting: emojis, columns, and embed
    const rankEmojis = [
      '🥇', '🥈', '🥉', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅'
    ];
    // Class icons
    const classIcons = {
      'Adventurer': '🧑‍🌾',
      'Warrior': '🗡️',
      'Veteran': '🦾',
      'Elite Warrior': '⚔️',
      'Master Knight': '🛡️',
      'Legendary Hero': '🦸',
      'Mythic Champion': '🐉',
      'Divine Hero': '👼',
      'Transcendent': '🌌',
      'Divine Avatar': '👑',
      'Diety': '☀️',
      'Supreme': '💎',
      'Supreme Celestial': '🌠',
      'Cosmic Supreme': '🪐'
    };
    let leaderboardRows = top.map((c, i) => {
      const emoji = rankEmojis[i] || `#${i+1}`;
      const classIcon = classIcons[c.class] || '✨';
      const name = c.name ? `**${c.name}**` : 'Unknown';
      const className = c.class ? `*${c.class}*` : '*Adventurer*';
      const level = c.level || 1;
      // Mention if possible
      const mention = c.id ? `<@${c.id}>` : '';
      return `${emoji} ${classIcon} ${name} ${mention} — ${className} — **Level ${level}**`;
    });
    if (leaderboardRows.length === 0) leaderboardRows = ['No players found.'];
    // Flush any pending fight session for this user before leaderboard action
    const userId = interaction.user.id;
    await fightSessionManager.flushIfExists(userId);
    // Use embed for modern look
    await interaction.reply({
      embeds: [{
        title: '🏆 Exo Leaderboard — Top 10 Players',
        description: leaderboardRows.join('\n'),
        color: 0xFFD700,
        footer: { text: 'Ranked by Level (XP breaks ties)' }
      }],
      ephemeral: false
    });
  }
};
