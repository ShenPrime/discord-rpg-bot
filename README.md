# Discord Adventure RPG Bot

A Discord bot RPG adventure game using slash commands, built with Node.js and discord.js v14. Create a character, explore, fight, loot, shop, manage inventory, and more—all within Discord!

## Setup
1. Clone/download this repo.
2. Run `npm install` to install dependencies.
3. Create a Discord bot at https://discord.com/developers/applications and copy your bot token.
4. Create a `.env` file with the following variables:
   - `DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE`
   - `CLIENT_ID=YOUR_CLIENT_ID`
   - `GUILD_ID=YOUR_GUILD_ID` (optional, for development/testing)
5. Run `npm start` to launch the bot.

## Features
- Character creation and leveling
- Exploration with random events and loot
- Turn-based combat encounters
- Inventory management (view, use, equip, sell items)
- Equipment system (weapons, armor, accessories)
- Shop for buying items and houses
- Loot system with rarity and stat boosts
- Persistent character data (JSON file)

## Main Commands
- `/ping` — Test if the bot is online.
- `/character [name]` — Create or view your RPG character.
- `/explore` — Explore a mysterious area for loot or encounters.
- `/fight` — Engage in a quick battle for XP and rewards.
- `/inventory` — View your current inventory.
- `/use <item>` — Use a consumable item from your inventory.
- `/equip` — Equip an item to boost your stats.
- `/shop <category>` — Browse the shop (Weapons, Armor, Potions, Houses) and buy items.
- `/sell` — Sell items from your inventory for gold.
- `/deletecharacter` — Delete your character and start over.

## Usage Notes
- Most commands use Discord's slash command interface.
- Some actions use interactive select menus or buttons for multi-step choices (e.g., shopping, equipping, selling).
- All character and inventory data is stored in `characters.json` (persistent between restarts).

## Development
- Commands are auto-registered on bot startup.
- Add new commands by creating a file in the `commands/` directory exporting a `data` (SlashCommandBuilder) and `execute` function.
- The loot table is centralized in `commands/loot.js` for easy expansion.

## Dependencies
- [discord.js](https://discord.js.org/) v14+
- [dotenv](https://www.npmjs.com/package/dotenv)
- [nodemon](https://www.npmjs.com/package/nodemon) (dev)

## License
ISC
