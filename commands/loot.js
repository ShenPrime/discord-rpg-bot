// Centralized loot table for all commands
// Each item can have properties: name, type, rarity, uses (for potions), and statBoosts (for stat potions)

const lootTable = [
  // Gems
  { name: 'Citrine', type: 'Gem', rarity: 'uncommon', price: 55, chance: 0.04 },
  { name: 'Onyx', type: 'Gem', rarity: 'uncommon', price: 70, chance: 0.04 },
  { name: 'Opal', type: 'Gem', rarity: 'uncommon', price: 90, chance: 0.04 },
  { name: 'Topaz', type: 'Gem', rarity: 'uncommon', price: 60, chance: 0.04 },
  { name: 'Amethyst', type: 'Gem', rarity: 'uncommon', price: 80, chance: 0.04 },
  { name: 'Pearl', type: 'Gem', rarity: 'rare', price: 100, chance: 0.02 },
  { name: 'Sapphire', type: 'Gem', rarity: 'rare', price: 110, chance: 0.02 },
  { name: 'Ruby', type: 'Gem', rarity: 'rare', price: 120, chance: 0.02 },
  { name: 'Emerald', type: 'Gem', rarity: 'rare', price: 130, chance: 0.02 },
  { name: 'Diamond', type: 'Gem', rarity: 'epic', price: 300, chance: 0.008 },

  // Weapons
  { name: 'Rusty Sword', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 20, stats: { strength: 1 }, chance: 0.8 },
  { name: 'Spear', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 25, stats: { strength: 1, agility: 1 }, chance: 0.8 },
  { name: 'Axe', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50, stats: { strength: 2 }, chance: 0.04 },
  { name: 'Dagger', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 45, stats: { agility: 2 }, chance: 0.04 },
  { name: 'Warhammer', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 280, stats: { strength: 4 }, chance: 0.02 },
  { name: 'Bow', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 220, stats: { agility: 3 }, chance: 0.02 },
  { name: 'Flaming Sword', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 500, stats: { strength: 5, luck: 1 }, chance: 0.008 },
  { name: 'Shadow Blade', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 600, stats: { agility: 6, luck: 2 }, chance: 0.008 },
  { name: 'Excalibur', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 2000, stats: { strength: 10, luck: 3 }, chance: 0.002 },
  { name: 'Celestial Staff', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 3000, stats: { strength: 5, agility: 5, luck: 5 }, chance: 0.002 },

  // Armor
  { name: 'Leather Armor', type: 'Armor', slot: 'chest', rarity: 'common', price: 50, stats: { defense: 1 }, chance: 0.18 },
  { name: 'Iron Helmet', type: 'Armor', slot: 'head', rarity: 'common', price: 30, stats: { defense: 1 }, chance: 0.18 },
  { name: 'Chainmail', type: 'Armor', slot: 'chest', rarity: 'uncommon', price: 100, stats: { defense: 3 }, chance: 0.04 },
  { name: 'Shield', type: 'Armor', slot: 'arms', rarity: 'uncommon', price: 90, stats: { defense: 2 }, chance: 0.04 },
  { name: 'Boots of Swiftness', type: 'Armor', slot: 'legs', rarity: 'rare', price: 250, stats: { agility: 2 }, chance: 0.02 },
  { name: 'Amulet of Protection', type: 'Armor', slot: 'necklace', rarity: 'epic', price: 600, stats: { defense: 5 }, chance: 0.008 },
  { name: 'Dragon Scale Armor', type: 'Armor', slot: 'chest', rarity: 'epic', price: 800, stats: { defense: 7, luck: 2 }, chance: 0.008 },
  { name: 'Cloak of Invisibility', type: 'Armor', slot: 'chest', rarity: 'legendary', price: 4000, stats: { agility: 5, luck: 5 }, chance: 0.002 },
  { name: 'Ring of Power', type: 'Armor', slot: 'ring', rarity: 'legendary', price: 6000, stats: { strength: 3, defense: 3, agility: 3, luck: 3 }, chance: 0.002 },

  // Potions
  { name: 'Common Strength Potion', type: 'Potion', rarity: 'common', price: 50, uses: 1, stat: 'strength', boost: 2, chance: 0.18 },
  { name: 'Common Agility Potion', type: 'Potion', rarity: 'common', price: 50, uses: 1, stat: 'agility', boost: 2, chance: 0.18 },
  { name: 'Common Defense Potion', type: 'Potion', rarity: 'common', price: 60, uses: 1, stat: 'defense', boost: 2, chance: 0.18 },
  { name: 'Rare Strength Potion', type: 'Potion', rarity: 'rare', price: 150, uses: 2, stat: 'strength', boost: 3, chance: 0.02 },
  { name: 'Rare Agility Potion', type: 'Potion', rarity: 'rare', price: 150, uses: 2, stat: 'agility', boost: 3, chance: 0.02 },
  { name: 'Rare Defense Potion', type: 'Potion', rarity: 'rare', price: 180, uses: 2, stat: 'defense', boost: 3, chance: 0.02 },
  { name: 'Rare Fortune Potion', type: 'Potion', rarity: 'rare', price: 180, uses: 2, stat: 'luck', boost: 2, chance: 0.02 },
  { name: 'Epic Strength Potion', type: 'Potion', rarity: 'epic', price: 400, uses: 4, stat: 'strength', boost: 5, chance: 0.008 },
  { name: 'Epic Agility Potion', type: 'Potion', rarity: 'epic', price: 400, uses: 4, stat: 'agility', boost: 5, chance: 0.008 },
  { name: 'Epic Defense Potion', type: 'Potion', rarity: 'epic', price: 450, uses: 4, stat: 'defense', boost: 5, chance: 0.008 },
  { name: 'Epic Fortune Potion', type: 'Potion', rarity: 'epic', price: 550, uses: 4, stat: 'luck', boost: 4, chance: 0.008 },
  { name: 'Legendary Resurrection Elixir', type: 'Potion', rarity: 'legendary', price: 1500, uses: 1, stat: 'revive', boost: 0, chance: 0.002 },

  // Currency
  { name: '20 Gold', type: 'currency', rarity: 'common', amount: 20, chance: 0.2 },
  { name: '50 Gold', type: 'currency', rarity: 'uncommon', amount: 50, chance: 0.08 },
  { name: '100 Gold', type: 'currency', rarity: 'rare', amount: 100, chance: 0.02 },
  { name: '300 Gold', type: 'currency', rarity: 'epic', amount: 300, chance: 0.008 },
  { name: '600 Gold', type: 'currency', rarity: 'legendary', amount: 600, chance: 0.002 },
];

// Exploration table array
const exploreTable = lootTable.filter(item => (item.type === 'currency' || item.type === 'Gem' || (item.type === 'Weapon' && item.rarity !== 'rare' && item.rarity !== 'epic') || (item.type === 'Armor' && item.rarity !== 'rare' && item.rarity !== 'epic')));

const fightTable = lootTable.filter(item => (item.type === 'currency' || item.type === 'Gem' || (item.type === 'Weapon' && item.rarity === 'rare') || (item.type === 'Armor' && item.rarity === 'rare')));


//shop table array for houses 
const houseTable = [
  { name: 'Cottage', type: 'House', price: 50000, size: 'Small', description: 'A cozy cottage. Modest but homey.' },
  { name: 'Townhouse', type: 'House', price: 100000, size: 'Medium', description: 'A comfortable townhouse in the city.' },
  { name: 'Villa', type: 'House', price: 200000, size: 'Large', description: 'A luxurious villa with gardens.' },
  { name: 'Mansion', type: 'House', price: 500000, size: 'Huge', description: 'A sprawling mansion with many rooms.' },
  { name: 'Castle', type: 'House', price: 1000000, size: 'Epic', description: 'A legendary castle fit for a king or queen.' },
];

// shop table array for mounts
const mountTable = [
  { name: 'Horse', type: 'Mount', price: 10000, description: 'A horse. Fast and reliable.' },
  { name: 'Dragon', type: 'Mount', price: 100000, description: 'A dragon. Fast and powerful.' },
  { name: 'Unicorn', type: 'Mount', price: 500000, description: 'A unicorn. Fast and magical.' },
  { name: 'Phoenix', type: 'Mount', price: 1000000, description: 'A phoenix. Fast and legendary.' },
];

// shop table array for armor
const armorTable = lootTable.filter(item => (item.rarity === 'rare' || item.rarity === 'epic') && item.type === 'Armor');

// shop table array for weapons
const weaponTable = lootTable.filter(item => (item.rarity === 'rare' || item.rarity === 'epic') && item.type === 'Weapon');

// shop table array for potions
const potionTable = lootTable.filter(item => (item.rarity === 'rare' || item.rarity === 'epic') && item.type === 'Potion');

// Export the loot table for use in other commands
module.exports = {
  lootTable,
  houseTable,
  mountTable,
  armorTable,
  weaponTable,
  potionTable,
  exploreTable,
  fightTable,
};
