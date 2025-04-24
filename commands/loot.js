// Centralized loot table for all commands
// Each item can have properties: name, type, rarity, uses (for potions), and statBoosts (for stat potions)

const lootTable = [
  // Gems
  { name: 'Ruby', type: 'Gem', rarity: 'rare', price: 120, chance: 0.02 },
  { name: 'Sapphire', type: 'Gem', rarity: 'rare', price: 110, chance: 0.02 },
  { name: 'Emerald', type: 'Gem', rarity: 'rare', price: 130, chance: 0.02 },
  { name: 'Diamond', type: 'Gem', rarity: 'epic', price: 300, chance: 0.008 },
  { name: 'Amethyst', type: 'Gem', rarity: 'uncommon', price: 80, chance: 0.04 },
  { name: 'Topaz', type: 'Gem', rarity: 'uncommon', price: 60, chance: 0.04 },
  { name: 'Opal', type: 'Gem', rarity: 'uncommon', price: 90, chance: 0.04 },
  { name: 'Onyx', type: 'Gem', rarity: 'uncommon', price: 70, chance: 0.04 },
  { name: 'Pearl', type: 'Gem', rarity: 'rare', price: 100, chance: 0.02 },
  { name: 'Citrine', type: 'Gem', rarity: 'uncommon', price: 55, chance: 0.04 },

  // Weapons
  { name: 'Rusty Sword', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 20, stats: { strength: 1 }, chance: 0.18 },
  { name: 'Axe', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50, stats: { strength: 2 }, chance: 0.04 },
  { name: 'Dagger', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 45, stats: { agility: 2 }, chance: 0.04 },
  { name: 'Bow', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 120, stats: { agility: 3 }, chance: 0.02 },
  { name: 'Flaming Sword', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 350, stats: { strength: 5, luck: 1 }, chance: 0.008 },
  { name: 'Excalibur', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 2000, stats: { strength: 10, luck: 3 }, chance: 0.002 },
  { name: 'Spear', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 25, stats: { strength: 1, agility: 1 }, chance: 0.18 },
  { name: 'Warhammer', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 180, stats: { strength: 4 }, chance: 0.02 },
  { name: 'Shadow Blade', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 400, stats: { agility: 6, luck: 2 }, chance: 0.008 },
  { name: 'Celestial Staff', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 3000, stats: { strength: 5, agility: 5, luck: 5 }, chance: 0.002 },

  // Armor
  { name: 'Leather Armor', type: 'Armor', slot: 'chest', rarity: 'common', price: 30, stats: { defense: 1 }, chance: 0.18 },
  { name: 'Chainmail', type: 'Armor', slot: 'chest', rarity: 'uncommon', price: 60, stats: { defense: 3 }, chance: 0.04 },
  { name: 'Shield', type: 'Armor', slot: 'arms', rarity: 'uncommon', price: 55, stats: { defense: 2 }, chance: 0.04 },
  { name: 'Dragon Scale Armor', type: 'Armor', slot: 'chest', rarity: 'epic', price: 500, stats: { defense: 7, luck: 2 }, chance: 0.008 },
  { name: 'Cloak of Invisibility', type: 'Armor', slot: 'chest', rarity: 'legendary', price: 2500, stats: { agility: 5, luck: 5 }, chance: 0.002 },
  { name: 'Iron Helmet', type: 'Armor', slot: 'head', rarity: 'common', price: 20, stats: { defense: 1 }, chance: 0.18 },
  { name: 'Boots of Swiftness', type: 'Armor', slot: 'legs', rarity: 'rare', price: 150, stats: { agility: 2 }, chance: 0.02 },
  { name: 'Amulet of Protection', type: 'Armor', slot: 'necklace', rarity: 'epic', price: 350, stats: { defense: 5 }, chance: 0.008 },
  { name: 'Ring of Power', type: 'Armor', slot: 'ring', rarity: 'legendary', price: 4000, stats: { strength: 3, defense: 3, agility: 3, luck: 3 }, chance: 0.002 },

  // Potions
  { name: 'Potion of Strength', type: 'Potion', rarity: 'common', price: 40, uses: 1, stat: 'strength', boost: 2, chance: 0.18 },
  { name: 'Potion of Strength', type: 'Potion', rarity: 'rare', price: 110, uses: 2, stat: 'strength', boost: 3, chance: 0.02 },
  { name: 'Potion of Strength', type: 'Potion', rarity: 'epic', price: 300, uses: 4, stat: 'strength', boost: 5, chance: 0.008 },
  { name: 'Potion of Agility', type: 'Potion', rarity: 'common', price: 40, uses: 1, stat: 'agility', boost: 2, chance: 0.18 },
  { name: 'Potion of Agility', type: 'Potion', rarity: 'rare', price: 110, uses: 2, stat: 'agility', boost: 3, chance: 0.02 },
  { name: 'Potion of Agility', type: 'Potion', rarity: 'epic', price: 300, uses: 4, stat: 'agility', boost: 5, chance: 0.008 },
  { name: 'Potion of Defense', type: 'Potion', rarity: 'common', price: 45, uses: 1, stat: 'defense', boost: 2, chance: 0.18 },
  { name: 'Potion of Defense', type: 'Potion', rarity: 'rare', price: 120, uses: 2, stat: 'defense', boost: 3, chance: 0.02 },
  { name: 'Potion of Defense', type: 'Potion', rarity: 'epic', price: 320, uses: 4, stat: 'defense', boost: 5, chance: 0.008 },
  { name: 'Potion of Fortune', type: 'Potion', rarity: 'rare', price: 100, uses: 2, stat: 'luck', boost: 2, chance: 0.02 },
  { name: 'Potion of Fortune', type: 'Potion', rarity: 'epic', price: 400, uses: 4, stat: 'luck', boost: 4, chance: 0.008 },
  { name: 'Resurrection Elixir', type: 'Potion', rarity: 'legendary', price: 1200, uses: 1, stat: 'revive', boost: 0, chance: 0.002 },

  // Currency
  { name: '100 Gold', type: 'currency', rarity: 'common', price: 10, amount: 10, chance: 0.25 },
  { name: '200 Gold', type: 'currency', rarity: 'uncommon', price: 25, amount: 25, chance: 0.08 },
  { name: '300 Gold', type: 'currency', rarity: 'rare', price: 50, amount: 50, chance: 0.02 },
  { name: '1000 Gold', type: 'currency', rarity: 'epic', price: 100, amount: 100, chance: 0.008 },
  { name: '2000 Gold', type: 'currency', rarity: 'legendary', price: 250, amount: 250, chance: 0.002 },
];

// Export the loot table for use in other commands
module.exports = {
  lootTable,
};
