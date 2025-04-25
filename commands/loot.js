// Centralized loot table for all commands
// Each item can have properties: name, type, rarity, uses (for potions), and statBoosts (for stat potions)

const lootTable = [
  // Gems
  { name: 'Citrine', type: 'Gem', rarity: 'uncommon', price: 55, chance: 0.5 },
  { name: 'Onyx', type: 'Gem', rarity: 'uncommon', price: 70, chance: 0.07 },
  { name: 'Opal', type: 'Gem', rarity: 'uncommon', price: 90, chance: 0.07 },
  { name: 'Topaz', type: 'Gem', rarity: 'uncommon', price: 60, chance: 0.07 },
  { name: 'Amethyst', type: 'Gem', rarity: 'uncommon', price: 80, chance: 0.07 },
  { name: 'Pearl', type: 'Gem', rarity: 'rare', price: 100, chance: 0.015 },
  { name: 'Sapphire', type: 'Gem', rarity: 'rare', price: 110, chance: 0.015 },
  { name: 'Ruby', type: 'Gem', rarity: 'rare', price: 120, chance: 0.03 },
  { name: 'Emerald', type: 'Gem', rarity: 'rare', price: 130, chance: 0.03 },
  { name: 'Diamond', type: 'Gem', rarity: 'epic', price: 1000, chance: 0.001 },


  // Weapons
  { name: 'Bronze Sword', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 15, stats: { strength: 1 }, chance: 0.25 },
  { name: 'Bronze Spear', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 20, stats: { strength: 1, agility: 1 }, chance: 0.22 },
  { name: 'Bronze Axe', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 18, stats: { strength: 1 }, chance: 0.22 },
  { name: 'Bronze Dagger', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 12, stats: { agility: 1 }, chance: 0.22 },

  { name: 'Iron Axe', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50, stats: { strength: 2 }, chance: 0.04 },
  { name: 'Iron Dagger', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 45, stats: { agility: 2 }, chance: 0.012 },
  { name: 'Iron Sword', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 55, stats: { strength: 2 }, chance: 0.012 },
  { name: 'Iron Mace', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 60, stats: { strength: 3 }, chance: 0.012 },

  { name: 'Warhammer', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 280, stats: { strength: 4 }, chance: 0.007 },
  { name: 'Bow', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 220, stats: { agility: 3 }, chance: 0.007 },
  { name: 'Steel Axe', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 300, stats: { strength: 5 }, chance: 0.007 },
  { name: 'Steel Dagger', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 250, stats: { agility: 4 }, chance: 0.007 },
  { name: 'Steel Sword', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 320, stats: { strength: 5 }, chance: 0.007 },
  { name: 'Steel Mace', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 340, stats: { strength: 5 }, chance: 0.007 },

  { name: 'Flaming Sword', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 2000, stats: { strength: 7, luck: 2 }, chance: 0.002 },
  { name: 'Shadow Blade', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 3000, stats: { agility: 8, luck: 1 }, chance: 0.002 },
  { name: 'Dragon Mace', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4000, stats: { strength: 9, defense: 2 }, chance: 0.002 },
  { name: 'Dragon Axe', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4500, stats: { strength: 7, agility: 5 }, chance: 0.002 },
  { name: 'Dragon Dagger', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 5000, stats: { agility: 9, luck: 2 }, chance: 0.002 },
  { name: 'Dragon Sword', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 5500, stats: { strength: 6, agility: 6 }, chance: 0.002 },

  { name: 'Excalibur', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 10000, stats: { strength: 10, luck: 3 }, chance: 0.0002 },
  { name: 'Celestial Staff', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 15000, stats: { strength: 5, agility: 5, luck: 5 }, chance: 0.0002 },


  // Armor
  { name: 'Leather Armor', type: 'Armor', slot: 'chest', rarity: 'common', price: 50, stats: { defense: 1 }, chance: 0.18 },
  { name: 'Leather Helmet', type: 'Armor', slot: 'head', rarity: 'common', price: 30, stats: { defense: 1 }, chance: 0.16 },
  { name: 'Leather Boots', type: 'Armor', slot: 'legs', rarity: 'common', price: 30, stats: { agility: 1 }, chance: 0.16 },
  { name: 'Leather Cape', type: 'Armor', slot: 'necklace', rarity: 'common', price: 20, stats: { defense: 1 }, chance: 0.13 },
  { name: 'Iron Ring', type: 'Armor', slot: 'ring', rarity: 'common', price: 15, stats: { strength: 1 }, chance: 0.13 },

  { name: 'Iron Chainmail', type: 'Armor', slot: 'chest', rarity: 'uncommon', price: 100, stats: { defense: 3 }, chance: 0.025 },
  { name: 'Iron Shield', type: 'Armor', slot: 'arms', rarity: 'uncommon', price: 90, stats: { defense: 2 }, chance: 0.025 },
  { name: 'Iron Gauntlets', type: 'Armor', slot: 'arms', rarity: 'uncommon', price: 70, stats: { strength: 2 }, chance: 0.025 },
  { name: 'Iron Leggings', type: 'Armor', slot: 'legs', rarity: 'uncommon', price: 80, stats: { agility: 2 }, chance: 0.025 },
  { name: 'Gold Necklace', type: 'Armor', slot: 'necklace', rarity: 'uncommon', price: 50, stats: { luck: 1 }, chance: 0.025 },
  { name: 'Silver Ring', type: 'Armor', slot: 'ring', rarity: 'uncommon', price: 30, stats: { agility: 1 }, chance: 0.025 },

  { name: 'Steel Leggings', type: 'Armor', slot: 'legs', rarity: 'rare', price: 1500, stats: { agility: 2 }, chance: 0.006 },
  { name: 'Steel Boots', type: 'Armor', slot: 'legs', rarity: 'rare', price: 1800, stats: { agility: 3 }, chance: 0.006 },
  { name: 'Steel Gauntlets', type: 'Armor', slot: 'arms', rarity: 'rare', price: 2000, stats: { strength: 3 }, chance: 0.006 },
  { name: 'Steel Armor', type: 'Armor', slot: 'chest', rarity: 'rare', price: 2200, stats: { defense: 4 }, chance: 0.006 },
  { name: 'Emerald Ring', type: 'Armor', slot: 'ring', rarity: 'rare', price: 1500, stats: { agility: 2 }, chance: 0.006 },
  { name: 'Ruby Necklace', type: 'Armor', slot: 'necklace', rarity: 'rare', price: 1500, stats: { agility: 2 }, chance: 0.006 },

  { name: 'Amulet of Vigor', type: 'Armor', slot: 'necklace', rarity: 'epic', price: 15000, stats: { defense: 5 }, chance: 0.002 },
  { name: 'Dragon Scale Breastplate', type: 'Armor', slot: 'chest', rarity: 'epic', price: 25000, stats: { defense: 7, luck: 2 }, chance: 0.002 },
  { name: 'Heroic Plate Helmet', type: 'Armor', slot: 'head', rarity: 'epic', price: 20000, stats: { defense: 5 }, chance: 0.002 },
  { name: 'Heroic Plate Greaves', type: 'Armor', slot: 'legs', rarity: 'epic', price: 20000, stats: { defense: 5 }, chance: 0.002 },

  { name: 'Cloak of Invisibility', type: 'Armor', slot: 'necklace', rarity: 'legendary', price: 100000, stats: { agility: 5, luck: 5 }, chance: 0.0002 },
  { name: 'Ring of Power', type: 'Armor', slot: 'ring', rarity: 'legendary', price: 6000, stats: { strength: 3, defense: 3, agility: 3, luck: 3 }, chance: 0.0002 },


  // Potions
  { name: 'Common Strength Potion', type: 'Potion', rarity: 'common', price: 2500, uses: 1, stat: 'strength', boost: 2, chance: 0.12 },
  { name: 'Common Agility Potion', type: 'Potion', rarity: 'common', price: 2500, uses: 1, stat: 'agility', boost: 2, chance: 0.12 },
  { name: 'Common Defense Potion', type: 'Potion', rarity: 'common', price: 3000, uses: 1, stat: 'defense', boost: 2, chance: 0.12 },

  { name: 'Rare Strength Potion', type: 'Potion', rarity: 'rare', price: 15000, uses: 2, stat: 'strength', boost: 3, chance: 0.006 },
  { name: 'Rare Agility Potion', type: 'Potion', rarity: 'rare', price: 15000, uses: 2, stat: 'agility', boost: 3, chance: 0.006 },
  { name: 'Rare Defense Potion', type: 'Potion', rarity: 'rare', price: 18000, uses: 2, stat: 'defense', boost: 3, chance: 0.006 },
  { name: 'Rare Fortune Potion', type: 'Potion', rarity: 'rare', price: 18000, uses: 2, stat: 'luck', boost: 2, chance: 0.006 },

  { name: 'Epic Strength Potion', type: 'Potion', rarity: 'epic', price: 40000, uses: 4, stat: 'strength', boost: 5, chance: 0.001 },
  { name: 'Epic Agility Potion', type: 'Potion', rarity: 'epic', price: 40000, uses: 4, stat: 'agility', boost: 5, chance: 0.001 },
  { name: 'Epic Defense Potion', type: 'Potion', rarity: 'epic', price: 45000, uses: 4, stat: 'defense', boost: 5, chance: 0.001 },
  { name: 'Epic Fortune Potion', type: 'Potion', rarity: 'epic', price: 55000, uses: 4, stat: 'luck', boost: 4, chance: 0.001 },

  { name: 'Legendary Resurrection Elixir', type: 'Potion', rarity: 'legendary', price: 1500, uses: 1, stat: 'revive', boost: 0, chance: 0.0002 },


  // Currency
  { name: '20 Gold', type: 'currency', rarity: 'common', amount: 20, chance: 0.12 },
  { name: '50 Gold', type: 'currency', rarity: 'uncommon', amount: 50, chance: 0.06 },
  { name: '100 Gold', type: 'currency', rarity: 'rare', amount: 100, chance: 0.008 },
  { name: '300 Gold', type: 'currency', rarity: 'epic', amount: 300, chance: 0.002 },
  { name: '600 Gold', type: 'currency', rarity: 'legendary', amount: 600, chance: 0.001 },
];

// Exploration table array
const exploreTable = lootTable.filter(item => (
  item.type === 'currency' ||
  (item.type === 'Gem' && (item.rarity === 'common' || item.rarity === 'uncommon')) ||
  ((item.type === 'Weapon' || item.type === 'Armor') && (item.rarity === 'common' || item.rarity === 'uncommon'))
));

const fightTable = lootTable.filter(item => (
  item.type === 'currency' ||
  item.type === 'Gem' ||
  ((item.type === 'Weapon' || item.type === 'Armor') && (item.rarity === 'common' || item.rarity === 'uncommon' || item.rarity === 'rare'))
));


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
