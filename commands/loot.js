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
  { name: 'Bronze Spear', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 20, stats: { strength: 1 }, chance: 0.22 },
  { name: 'Bronze Axe', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 18, stats: { strength: 1 }, chance: 0.22 },
  { name: 'Bronze Dagger', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 12, stats: { strength: 1 }, chance: 0.22 },

  { name: 'Iron Axe', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50, stats: { strength: 2 }, chance: 0.04 },
  { name: 'Iron Dagger', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 45, stats: { strength: 2 }, chance: 0.012 },
  { name: 'Iron Sword', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 55, stats: { strength: 2 }, chance: 0.012 },
  { name: 'Iron Mace', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 60, stats: { strength: 3 }, chance: 0.012 },
  { name: 'Warhammer', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 440, stats: { strength: 3 }, chance: 0.007 },
  { name: 'Bow', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 500, stats: { strength: 4 }, chance: 0.007 },
  { name: 'Steel Axe', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 600, stats: { strength: 5 }, chance: 0.007 },
  { name: 'Steel Dagger', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 640, stats: { strength: 5 }, chance: 0.007 },
  { name: 'Steel Sword', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 680, stats: { strength: 6 }, chance: 0.007 },
  { name: 'Steel Mace', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 720, stats: { strength: 6 }, chance: 0.007 },

  { name: 'Flaming Sword', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 2000, stats: { strength: 10, luck: 4 }, chance: 0.002 },
  { name: 'Shadow Blade', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 3000, stats: { strength: 12, luck: 4 }, chance: 0.002 },
  { name: 'Dragon Mace', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4000, stats: { strength: 15, defense: 5 }, chance: 0.002 },
  { name: 'Dragon Axe', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4500, stats: { strength: 16, defense: 5 }, chance: 0.002 },
  { name: 'Dragon Dagger', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 5000, stats: { luck: 12, strength: 5 }, chance: 0.002 },
  { name: 'Dragon Sword', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 5500, stats: { strength: 15, defense: 5 }, chance: 0.002 },
  { name: 'Dragon Staff', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 6000, stats: { strength: 16, defense: 5 }, chance: 0.002 },

  { name: 'Excalibur', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 100000, stats: { strength: 18, defense: 3, luck: 8 }, chance: 0.0002 },
  { name: 'Celestial Staff', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 150000, stats: { strength: 12, defense: 8, luck: 8 }, chance: 0.0002 },
  { name: 'Dragon Tooth', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 200000, stats: { strength: 20, defense: 10, luck: 12 }, chance: 0.0002 },
  { name: 'Fang of the Ancients', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 250000, stats: { strength: 22, defense: 12, luck: 15 }, chance: 0.0002 },
  { name: 'Darkstar Bow', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 300000, stats: { strength: 25, defense: 15, luck: 18 }, chance: 0.0002 },
  { name: 'Aurora Sword', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 350000, stats: { strength: 28, defense: 18, luck: 20 }, chance: 0.0002 },


  // Armor
  { name: 'Leather Armor', type: 'Armor', slot: 'chest', rarity: 'common', price: 50, stats: { defense: 1 }, chance: 0.18 },
  { name: 'Leather Helmet', type: 'Armor', slot: 'head', rarity: 'common', price: 30, stats: { defense: 1 }, chance: 0.16 },
  { name: 'Leather Boots', type: 'Armor', slot: 'legs', rarity: 'common', price: 30, stats: { strength: 1 }, chance: 0.16 },
  { name: 'Leather Cape', type: 'Armor', slot: 'necklace', rarity: 'common', price: 20, stats: { defense: 1 }, chance: 0.13 },
  { name: 'Iron Ring', type: 'Armor', slot: 'ring', rarity: 'common', price: 15, stats: { strength: 1 }, chance: 0.13 },

  { name: 'Iron Chainmail', type: 'Armor', slot: 'chest', rarity: 'uncommon', price: 100, stats: { defense: 3 }, chance: 0.025 },
  { name: 'Iron Shield', type: 'Armor', slot: 'arms', rarity: 'uncommon', price: 90, stats: { defense: 2 }, chance: 0.025 },
  { name: 'Iron Gauntlets', type: 'Armor', slot: 'arms', rarity: 'uncommon', price: 70, stats: { strength: 2 }, chance: 0.025 },
  { name: 'Iron Leggings', type: 'Armor', slot: 'legs', rarity: 'uncommon', price: 80, stats: { defense: 2 }, chance: 0.025 },
  { name: 'Gold Necklace', type: 'Armor', slot: 'necklace', rarity: 'uncommon', price: 50, stats: { luck: 3 }, chance: 0.025 },
  { name: 'Silver Ring', type: 'Armor', slot: 'ring', rarity: 'uncommon', price: 30, stats: { luck: 3 }, chance: 0.025 },

  { name: 'Steel Leggings', type: 'Armor', slot: 'legs', rarity: 'rare', price: 1500, stats: { strength: 6 }, chance: 0.006 },
  { name: 'Steel Boots', type: 'Armor', slot: 'legs', rarity: 'rare', price: 1800, stats: { strength: 7 }, chance: 0.006 },
  { name: 'Steel Gauntlets', type: 'Armor', slot: 'arms', rarity: 'rare', price: 2000, stats: { strength: 7 }, chance: 0.006 },
  { name: 'Steel Armor', type: 'Armor', slot: 'chest', rarity: 'rare', price: 2200, stats: { defense: 7 }, chance: 0.006 },
  { name: 'Emerald Ring', type: 'Armor', slot: 'ring', rarity: 'rare', price: 1500, stats: { luck: 5 }, chance: 0.006 },
  { name: 'Ruby Necklace', type: 'Armor', slot: 'necklace', rarity: 'rare', price: 1500, stats: { luck: 5 }, chance: 0.006 },

  { name: 'Amulet of Vigor', type: 'Armor', slot: 'necklace', rarity: 'epic', price: 15000, stats: { defense: 15 }, chance: 0.002 },
  { name: 'Dragon Scale Breastplate', type: 'Armor', slot: 'chest', rarity: 'epic', price: 25000, stats: { defense: 20, luck: 7 }, chance: 0.002 },
  { name: 'Heroic Plate Helmet', type: 'Armor', slot: 'head', rarity: 'epic', price: 20000, stats: { defense: 15 }, chance: 0.002 },
  { name: 'Heroic Plate Greaves', type: 'Armor', slot: 'legs', rarity: 'epic', price: 20000, stats: { defense: 15 }, chance: 0.002 },
  { name: 'Astral Cape', type: 'Armor', slot: 'necklace', rarity: 'epic', price: 12000, stats: { luck: 10 }, chance: 0.002 },
  { name: 'Storm Boots', type: 'Armor', slot: 'legs', rarity: 'epic', price: 10000, stats: { strength: 10 }, chance: 0.002 },
  { name: 'Warrior Gauntlets', type: 'Armor', slot: 'arms', rarity: 'epic', price: 15000, stats: { strength: 12 }, chance: 0.002 },
  { name: 'Ring of the Elements', type: 'Armor', slot: 'ring', rarity: 'epic', price: 12000, stats: { luck: 10 }, chance: 0.002 },

  { name: 'Cloak of Invisibility', type: 'Armor', slot: 'necklace', rarity: 'legendary', price: 500000, stats: { luck: 15 }, chance: 0.0002 },
  { name: 'Ring of Power', type: 'Armor', slot: 'ring', rarity: 'legendary', price: 2000000, stats: { strength: 8, defense: 10 , luck: 10 }, chance: 0.0002 },
  { name: 'Amulet of Reflection', type: 'Armor', slot: 'necklace', rarity: 'legendary', price: 500000, stats: { defense: 10 }, chance: 0.0002 },
  { name: 'Boots of Apolo', type: 'Armor', slot: 'legs', rarity: 'legendary', price: 1000000, stats: { strength: 8 }, chance: 0.0002 },
  { name: 'Shield of the Gods', type: 'Armor', slot: 'arms', rarity: 'legendary', price: 2000000, stats: { defense: 12 }, chance: 0.0002 },
  { name: 'Cape of the Elements', type: 'Armor', slot: 'necklace', rarity: 'legendary', price: 1500000, stats: { luck: 8 }, chance: 0.0002 },
  { name: 'Titanic Gauntlets', type: 'Armor', slot: 'arms', rarity: 'legendary', price: 3000000, stats: { strength: 10, defense: 12 }, chance: 0.0002 },
  { name: 'Ring of the Ancients', type: 'Armor', slot: 'ring', rarity: 'legendary', price: 5000000, stats: { strength: 12, defense: 15, luck: 12 }, chance: 0.0002 },
  { name: 'Amulet of the Ancients', type: 'Armor', slot: 'necklace', rarity: 'legendary', price: 5000000, stats: { strength: 12, defense: 15, luck: 12 }, chance: 0.0002 },
  { name: 'Chest of the Elements', type: 'Armor', slot: 'chest', rarity: 'legendary', price: 8000000, stats: { strength: 14, defense: 16, luck: 14 }, chance: 0.0002 },
  { name: 'Chest of the Ancients', type: 'Armor', slot: 'chest', rarity: 'legendary', price: 10000000, stats: { strength: 16, defense: 20, luck: 16 }, chance: 0.0002 },
  { name: 'Helmet of the Ancients', type: 'Armor', slot: 'head', rarity: 'legendary', price: 10000000, stats: { strength: 16, defense: 20, luck: 16 }, chance: 0.0002 },


  // Potions
  { name: 'Common Strength Potion', type: 'Potion', rarity: 'common', price: 2500, uses: 1, stat: 'strength', boost: 2, chance: 0.12 },
  { name: 'Common Defense Potion', type: 'Potion', rarity: 'common', price: 3000, uses: 1, stat: 'defense', boost: 2, chance: 0.12 },

  { name: 'Rare Strength Potion', type: 'Potion', rarity: 'rare', price: 15000, uses: 2, stat: 'strength', boost: 5, chance: 0.006 },
  { name: 'Rare Defense Potion', type: 'Potion', rarity: 'rare', price: 18000, uses: 2, stat: 'defense', boost: 6, chance: 0.006 },
  { name: 'Rare Fortune Potion', type: 'Potion', rarity: 'rare', price: 18000, uses: 2, stat: 'luck', boost: 4, chance: 0.006 },

  { name: 'Epic Strength Potion', type: 'Potion', rarity: 'epic', price: 40000, uses: 4, stat: 'strength', boost: 10, chance: 0.001 },
  { name: 'Epic Defense Potion', type: 'Potion', rarity: 'epic', price: 45000, uses: 4, stat: 'defense', boost: 12, chance: 0.001 },
  { name: 'Epic Fortune Potion', type: 'Potion', rarity: 'epic', price: 55000, uses: 4, stat: 'luck', boost: 10, chance: 0.001 },

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
const armorTable = lootTable.filter(item => (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary') && item.type === 'Armor');

// shop table array for weapons
const weaponTable = lootTable.filter(item => (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary') && item.type === 'Weapon');

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
