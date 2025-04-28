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

  // Level 1-10 Leather Set. Over all stat boost = 30
  { name: 'Copper Sword', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 10000, stats: { strength: 5 }, chance: 0.04 },
  { name: 'Copper Dagger', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 10000, stats: { strength: 5 }, chance: 0.04 },
  { name: 'Copper Axe', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 10000, stats: { strength: 5 }, chance: 0.04 },
  { name: 'Copper Mace', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 10000, stats: { strength: 5 }, chance: 0.04 },
  { name: 'Copper Staff', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 10000, stats: { luck: 5 }, chance: 0.04 },
  { name: 'Copper Wand', type: 'Weapon', slot: 'weapon', rarity: 'common', price: 10000, stats: { luck: 5 }, chance: 0.04 },
  { name: 'Leather Helmet', type: 'Armor', slot: 'head', rarity: 'common', price: 2250, stats: { defense: 6 }, chance: 0.06 },
  { name: 'Leather Chestplate', type: 'Armor', slot: 'chest', rarity: 'common', price: 3000, stats: { defense: 8 }, chance: 0.06 },
  { name: 'Leather Pants', type: 'Armor', slot: 'legs', rarity: 'common', price: 2700, stats: { defense: 6 }, chance: 0.06 },
  { name: 'Basic Ring', type: 'Armor', slot: 'ring', rarity: 'common', price: 525, stats: { luck: 2 }, chance: 0.07 },
  { name: 'Basic Necklace', type: 'Armor', slot: 'necklace', rarity: 'common', price: 525, stats: { luck: 2 }, chance: 0.07 },

  // Level 10-20 Iron Set. Over all stat boost = 50
  { name: 'Iron Sword', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50000, stats: { strength: 10 }, chance: 0.012 },
  { name: 'Iron Dagger', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50000, stats: { strength: 10 }, chance: 0.012 },
  { name: 'Iron Axe', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50000, stats: { strength: 10 }, chance: 0.012 },
  { name: 'Iron Mace', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50000, stats: { strength: 10 }, chance: 0.012 },
  { name: 'Iron Staff', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50000, stats: { luck: 10 }, chance: 0.012 },
  { name: 'Iron Wand', type: 'Weapon', slot: 'weapon', rarity: 'uncommon', price: 50000, stats: { luck: 10 }, chance: 0.012 },
  { name: 'Iron Helmet', type: 'Armor', slot: 'head', rarity: 'uncommon', price: 5000, stats: { defense: 10 }, chance: 0.015 },
  { name: 'Iron Chestplate', type: 'Armor', slot: 'chest', rarity: 'uncommon', price: 7000, stats: { defense: 12 }, chance: 0.015 },
  { name: 'Iron Pants', type: 'Armor', slot: 'legs', rarity: 'uncommon', price: 6000, stats: { defense: 10 }, chance: 0.015 },
  { name: 'Iron Ring', type: 'Armor', slot: 'ring', rarity: 'uncommon', price: 1000, stats: { luck: 4 }, chance: 0.015 },
  { name: 'Iron Necklace', type: 'Armor', slot: 'necklace', rarity: 'uncommon', price: 1200, stats: { luck: 4 }, chance: 0.015 },

  // Level 20-30 Steel Set. Over all stat boost = 70
  { name: 'Steel Sword', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 100000, stats: { strength: 15 }, chance: 0.004 },
  { name: 'Steel Dagger', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 100000, stats: { strength: 15 }, chance: 0.004 },
  { name: 'Steel Axe', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 100000, stats: { strength: 15 }, chance: 0.004 },
  { name: 'Steel Mace', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 100000, stats: { strength: 15 }, chance: 0.004 },
  { name: 'Steel Staff', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 100000, stats: { luck: 15 }, chance: 0.004 },
  { name: 'Steel Wand', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 100000, stats: { luck: 15 }, chance: 0.004 },
  { name: 'Steel Helmet', type: 'Armor', slot: 'head', rarity: 'rare', price: 10000, stats: { defense: 13 }, chance: 0.006 },
  { name: 'Steel Chestplate', type: 'Armor', slot: 'chest', rarity: 'rare', price: 12000, stats: { defense: 17 }, chance: 0.006 },
  { name: 'Steel Pants', type: 'Armor', slot: 'legs', rarity: 'rare', price: 11000, stats: { defense: 15 }, chance: 0.006 },
  { name: 'Steel Ring', type: 'Armor', slot: 'ring', rarity: 'rare', price: 1500, stats: { luck: 5 }, chance: 0.006 },
  { name: 'Steel Necklace', type: 'Armor', slot: 'necklace', rarity: 'rare', price: 1800, stats: { luck: 7 }, chance: 0.006 },

  // Level 30-40 Gold Set. Over all stat boost = 90
  { name: 'Gold Sword', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 1100000, stats: { strength: 20 }, chance: 0.0035 },
  { name: 'Gold Dagger', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 1100000, stats: { strength: 20 }, chance: 0.0035 },
  { name: 'Gold Axe', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 1100000, stats: { strength: 20 }, chance: 0.0035 },
  { name: 'Gold Mace', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 1100000, stats: { strength: 20 }, chance: 0.0035 },
  { name: 'Gold Staff', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 1100000, stats: { luck: 20 }, chance: 0.0035 },
  { name: 'Gold Wand', type: 'Weapon', slot: 'weapon', rarity: 'rare', price: 1100000, stats: { luck: 20 }, chance: 0.0035 },
  { name: 'Gold Helmet', type: 'Armor', slot: 'head', rarity: 'rare', price: 110000, stats: { defense: 14 }, chance: 0.005 },
  { name: 'Gold Chestplate', type: 'Armor', slot: 'chest', rarity: 'rare', price: 132000, stats: { defense: 25 }, chance: 0.005 },
  { name: 'Gold Pants', type: 'Armor', slot: 'legs', rarity: 'rare', price: 121000, stats: { defense: 17 }, chance: 0.005 },
  { name: 'Gold Ring', type: 'Armor', slot: 'ring', rarity: 'rare', price: 16500, stats: { luck: 6 }, chance: 0.005 },
  { name: 'Gold Necklace', type: 'Armor', slot: 'necklace', rarity: 'rare', price: 19800, stats: { luck: 8 }, chance: 0.005 },

  //Level 40-50 Platinum Set. Over all stat boost = 110
  { name: 'Platinum Sword', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 2200000, stats: { strength: 20 }, chance: 0.001 },
  { name: 'Platinum Dagger', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 2200000, stats: { strength: 20 }, chance: 0.001 },
  { name: 'Platinum Axe', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 2200000, stats: { strength: 20 }, chance: 0.001 },
  { name: 'Platinum Mace', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 2200000, stats: { strength: 20 }, chance: 0.001 },
  { name: 'Platinum Staff', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 2200000, stats: { luck: 20 }, chance: 0.001 },
  { name: 'Platinum Wand', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 2200000, stats: { luck: 20 }, chance: 0.001 },
  { name: 'Platinum Helmet', type: 'Armor', slot: 'head', rarity: 'epic', price: 220000, stats: { defense: 14 }, chance: 0.004 },
  { name: 'Platinum Chestplate', type: 'Armor', slot: 'chest', rarity: 'epic', price: 264000, stats: { defense: 16 }, chance: 0.004 },
  { name: 'Platinum Pants', type: 'Armor', slot: 'legs', rarity: 'epic', price: 242000, stats: { defense: 10 }, chance: 0.004 },
  { name: 'Platinum Ring', type: 'Armor', slot: 'ring', rarity: 'epic', price: 33000, stats: { luck: 15 }, chance: 0.004 },
  { name: 'Platinum Necklace', type: 'Armor', slot: 'necklace', rarity: 'epic', price: 39600, stats: { luck: 15 }, chance: 0.004 },
  
  //Level 50-60 Obsidian Set — Overall stat boost ≈ 130
  { name: 'Obsidian Sword', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4500000, stats: { strength: 50 }, chance: 0.0002 },
  { name: 'Obsidian Dagger', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4500000, stats: { strength: 50 }, chance: 0.0002 },
  { name: 'Obsidian Axe', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4500000, stats: { strength: 50 }, chance: 0.0002 },
  { name: 'Obsidian Mace', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4500000, stats: { strength: 50 }, chance: 0.0002 },
  { name: 'Obsidian Staff', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4500000, stats: { luck: 50 }, chance: 0.0002 },
  { name: 'Obsidian Wand', type: 'Weapon', slot: 'weapon', rarity: 'epic', price: 4500000, stats: { luck: 50 }, chance: 0.0002 },
  { name: 'Obsidian Helmet', type: 'Armor', slot: 'head', rarity: 'epic', price: 450000, stats: { defense: 20 }, chance: 0.0003 },
  { name: 'Obsidian Chestplate', type: 'Armor', slot: 'chest', rarity: 'epic', price: 540000, stats: { defense: 25 }, chance: 0.0003 },
  { name: 'Obsidian Pants', type: 'Armor', slot: 'legs', rarity: 'epic', price: 495000, stats: { defense: 15 }, chance: 0.0003 },
  { name: 'Obsidian Ring', type: 'Armor', slot: 'ring', rarity: 'epic', price: 67500, stats: { luck: 10 }, chance: 0.0003 },
  { name: 'Obsidian Necklace', type: 'Armor', slot: 'necklace', rarity: 'epic', price: 81000, stats: { luck: 10 }, chance: 0.0003 },

  //Level 60-70 Mythril Set — Overall stat boost ≈ 150
  { name: 'Mythril Sword', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 9000000, stats: { strength: 55 }, chance: 0.0001 },
  { name: 'Mythril Dagger', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 9000000, stats: { strength: 55 }, chance: 0.0001 },
  { name: 'Mythril Axe', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 9000000, stats: { strength: 55 }, chance: 0.0001 },
  { name: 'Mythril Mace', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 9000000, stats: { strength: 55 }, chance: 0.0001 },
  { name: 'Mythril Staff', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 9000000, stats: { luck: 55 }, chance: 0.0001 },
  { name: 'Mythril Wand', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 9000000, stats: { luck: 55 }, chance: 0.0001 },
  { name: 'Mythril Helmet', type: 'Armor', slot: 'head', rarity: 'legendary', price: 900000, stats: { defense: 20 }, chance: 0.0001 },
  { name: 'Mythril Chestplate', type: 'Armor', slot: 'chest', rarity: 'legendary', price: 1080000, stats: { defense: 25 }, chance: 0.0001 },
  { name: 'Mythril Pants', type: 'Armor', slot: 'legs', rarity: 'legendary', price: 990000, stats: { defense: 20 }, chance: 0.0001 },
  { name: 'Mythril Ring', type: 'Armor', slot: 'ring', rarity: 'legendary', price: 135000, stats: { luck: 10 }, chance: 0.0001 },
  { name: 'Mythril Necklace', type: 'Armor', slot: 'necklace', rarity: 'legendary', price: 162000, stats: { luck: 20 }, chance: 0.0001 },

  //Level 70-80 Adamantite Set — Overall stat boost ≈ 170
  { name: 'Adamantite Sword', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 15000000, stats: { strength: 60 }, chance: 0.001 },
  { name: 'Adamantite Dagger', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 15000000, stats: { strength: 60 }, chance: 0.001 },
  { name: 'Adamantite Axe', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 15000000, stats: { strength: 60 }, chance: 0.001 },
  { name: 'Adamantite Mace', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 15000000, stats: { strength: 60 }, chance: 0.001 },
  { name: 'Adamantite Staff', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 15000000, stats: { luck: 60 }, chance: 0.001 },
  { name: 'Adamantite Wand', type: 'Weapon', slot: 'weapon', rarity: 'legendary', price: 15000000, stats: { luck: 60 }, chance: 0.001 },
  { name: 'Adamantite Helmet', type: 'Armor', slot: 'head', rarity: 'legendary', price: 1500000, stats: { defense: 25 }, chance: 0.001 },
  { name: 'Adamantite Chestplate', type: 'Armor', slot: 'chest', rarity: 'legendary', price: 1800000, stats: { defense: 30 }, chance: 0.001 },
  { name: 'Adamantite Pants', type: 'Armor', slot: 'legs', rarity: 'legendary', price: 1650000, stats: { defense: 30 }, chance: 0.001 },
  { name: 'Adamantite Ring', type: 'Armor', slot: 'ring', rarity: 'legendary', price: 225000, stats: { luck: 15 }, chance: 0.001 },
  { name: 'Adamantite Necklace', type: 'Armor', slot: 'necklace', rarity: 'legendary', price: 270000, stats: { luck: 25 }, chance: 0.001 },

  //Level 80-90 Celestial Set — Overall stat boost ≈ 190
  { name: 'Celestial Blade', type: 'Weapon', slot: 'weapon', rarity: 'mythic', price: 25000000, stats: { strength: 70 }, chance: 0.0005 },
  { name: 'Celestial Dagger', type: 'Weapon', slot: 'weapon', rarity: 'mythic', price: 25000000, stats: { strength: 70 }, chance: 0.0005 },
  { name: 'Celestial Axe', type: 'Weapon', slot: 'weapon', rarity: 'mythic', price: 25000000, stats: { strength: 70 }, chance: 0.0005 },
  { name: 'Celestial Mace', type: 'Weapon', slot: 'weapon', rarity: 'mythic', price: 25000000, stats: { strength: 70 }, chance: 0.0005 },
  { name: 'Celestial Staff', type: 'Weapon', slot: 'weapon', rarity: 'mythic', price: 25000000, stats: { luck: 70 }, chance: 0.0005 },
  { name: 'Celestial Wand', type: 'Weapon', slot: 'weapon', rarity: 'mythic', price: 25000000, stats: { luck: 70 }, chance: 0.0005 },
  { name: 'Celestial Helm', type: 'Armor', slot: 'head', rarity: 'mythic', price: 2500000, stats: { defense: 25 }, chance: 0.0005 },
  { name: 'Celestial Chestguard', type: 'Armor', slot: 'chest', rarity: 'mythic', price: 3000000, stats: { defense: 30 }, chance: 0.0005 },
  { name: 'Celestial Greaves', type: 'Armor', slot: 'legs', rarity: 'mythic', price: 2750000, stats: { defense: 20 }, chance: 0.0005 },
  { name: 'Celestial Band', type: 'Armor', slot: 'ring', rarity: 'mythic', price: 375000, stats: { luck: 25 }, chance: 0.0005 },
  { name: 'Celestial Amulet', type: 'Armor', slot: 'necklace', rarity: 'mythic', price: 450000, stats: { luck: 20 }, chance: 0.0005 },

  //Level 90-100 Divine Set — Overall stat boost ≈ 210
  { name: 'Divine Sword of Eternity', type: 'Weapon', slot: 'weapon', rarity: 'divine', price: 40000000, stats: { strength: 80 }, chance: 0.0001 },
  { name: 'Divine Dagger of Eternity', type: 'Weapon', slot: 'weapon', rarity: 'divine', price: 40000000, stats: { strength: 80 }, chance: 0.0001 },
  { name: 'Divine Axe of Eternity', type: 'Weapon', slot: 'weapon', rarity: 'divine', price: 40000000, stats: { strength: 80 }, chance: 0.0001 },
  { name: 'Divine Mace of Eternity', type: 'Weapon', slot: 'weapon', rarity: 'divine', price: 40000000, stats: { strength: 80 }, chance: 0.0001 },
  { name: 'Divine Staff of Eternity', type: 'Weapon', slot: 'weapon', rarity: 'divine', price: 40000000, stats: { luck: 80 }, chance: 0.0001 },
  { name: 'Divine Wand of Eternity', type: 'Weapon', slot: 'weapon', rarity: 'divine', price: 40000000, stats: { luck: 80 }, chance: 0.0001 },
  { name: 'Divine Crown', type: 'Armor', slot: 'head', rarity: 'divine', price: 4000000, stats: { defense: 40 }, chance: 0.0001 },
  { name: 'Divine Chestplate of Ages', type: 'Armor', slot: 'chest', rarity: 'divine', price: 4800000, stats: { defense: 25 }, chance: 0.0001 },
  { name: 'Divine Leggings', type: 'Armor', slot: 'legs', rarity: 'divine', price: 4400000, stats: { defense: 15 }, chance: 0.0001 },
  { name: 'Divine Signet', type: 'Armor', slot: 'ring', rarity: 'divine', price: 600000, stats: { luck: 25 }, chance: 0.0001 },
  { name: 'Divine Pendant', type: 'Armor', slot: 'necklace', rarity: 'divine', price: 720000, stats: { luck: 25 }, chance: 0.0001 },

  //Currency
  { name: '20 Gold', type: 'currency', rarity: 'common', amount: 20, chance: 0.12 },
  { name: '50 Gold', type: 'currency', rarity: 'uncommon', amount: 50, chance: 0.06 },
  { name: '100 Gold', type: 'currency', rarity: 'rare', amount: 100, chance: 0.08 },
  { name: '150 Gold', type: 'currency', rarity: 'rare', amount: 150, chance: 0.05 },
  { name: '200 Gold', type: 'currency', rarity: 'epic', amount: 200, chance: 0.025 },
  { name: '300 Gold', type: 'currency', rarity: 'epic', amount: 300, chance: 0.02 },
  { name: '500 Gold', type: 'currency', rarity: 'epic', amount: 500, chance: 0.012 },
  { name: '600 Gold', type: 'currency', rarity: 'legendary', amount: 600, chance: 0.008 },
  { name: '800 Gold', type: 'currency', rarity: 'legendary', amount: 800, chance: 0.004 },
  { name: '1,000 Gold', type: 'currency', rarity: 'legendary', amount: 1000, chance: 0.002 },
  { name: '2,000 Gold', type: 'currency', rarity: 'mythic', amount: 2000, chance: 0.001 },
  { name: '5,000 Gold', type: 'currency', rarity: 'mythic', amount: 5000, chance: 0.0005 },
  { name: '10,000 Gold', type: 'currency', rarity: 'divine', amount: 10000, chance: 0.0002 }
];

const currencyTable = [
  { name: '20 Gold', type: 'currency', rarity: 'common', amount: 20, chance: 0.12 },
  { name: '50 Gold', type: 'currency', rarity: 'uncommon', amount: 50, chance: 0.06 },
  { name: '100 Gold', type: 'currency', rarity: 'rare', amount: 100, chance: 0.08 },
  { name: '150 Gold', type: 'currency', rarity: 'rare', amount: 150, chance: 0.05 },
  { name: '200 Gold', type: 'currency', rarity: 'epic', amount: 200, chance: 0.025 },
  { name: '300 Gold', type: 'currency', rarity: 'epic', amount: 300, chance: 0.02 },
  { name: '500 Gold', type: 'currency', rarity: 'epic', amount: 500, chance: 0.012 },
  { name: '600 Gold', type: 'currency', rarity: 'legendary', amount: 600, chance: 0.008 },
  { name: '800 Gold', type: 'currency', rarity: 'legendary', amount: 800, chance: 0.004 },
  { name: '1,000 Gold', type: 'currency', rarity: 'legendary', amount: 1000, chance: 0.002 },
  { name: '2,000 Gold', type: 'currency', rarity: 'mythic', amount: 2000, chance: 0.001 },
  { name: '5,000 Gold', type: 'currency', rarity: 'mythic', amount: 5000, chance: 0.0005 },
  { name: '10,000 Gold', type: 'currency', rarity: 'divine', amount: 10000, chance: 0.0002 }
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
  { name: 'Tent', type: 'House', price: 5000, size: 'Tiny', description: 'A simple tent for basic shelter.' },
  { name: 'Shack', type: 'House', price: 10000, size: 'Tiny', description: 'A small wooden shack. Rough but livable.' },
  { name: 'Hut', type: 'House', price: 20000, size: 'Small', description: 'A sturdy hut made of timber and stone.' },
  { name: 'Cottage', type: 'House', price: 50000, size: 'Small', description: 'A cozy cottage. Modest but homey.' },
  { name: 'Cabin', type: 'House', price: 75000, size: 'Small', description: 'A cabin in the woods. Quiet and peaceful.' },
  { name: 'Townhouse', type: 'House', price: 100000, size: 'Medium', description: 'A comfortable townhouse in the city.' },
  { name: 'Farmhouse', type: 'House', price: 125000, size: 'Medium', description: 'A working farmhouse with fields nearby.' },
  { name: 'Beach House', type: 'House', price: 150000, size: 'Medium', description: 'A sunny house by the ocean.' },
  { name: 'Manor', type: 'House', price: 180000, size: 'Large', description: 'A grand manor with rich furnishings.' },
  { name: 'Villa', type: 'House', price: 200000, size: 'Large', description: 'A luxurious villa with gardens.' },
  { name: 'Lodge', type: 'House', price: 250000, size: 'Large', description: 'A rustic lodge perfect for gatherings.' },
  { name: 'Mountain Retreat', type: 'House', price: 300000, size: 'Large', description: 'A secluded house high in the mountains.' },
  { name: 'Penthouse', type: 'House', price: 400000, size: 'Large', description: 'A luxurious penthouse with a city view.' },
  { name: 'Estate', type: 'House', price: 450000, size: 'Huge', description: 'A massive estate with its own grounds.' },
  { name: 'Mansion', type: 'House', price: 500000, size: 'Huge', description: 'A sprawling mansion with many rooms.' },
  { name: 'Sky Palace', type: 'House', price: 750000, size: 'Epic', description: 'A palace suspended high above the clouds.' },
  { name: 'Castle', type: 'House', price: 1000000, size: 'Epic', description: 'A legendary castle fit for a king or queen.' },
  { name: 'Fortress', type: 'House', price: 2000000, size: 'Epic', description: 'An impregnable fortress of stone and steel.' },
  { name: 'Floating Island', type: 'House', price: 5000000, size: 'Legendary', description: 'A magical island floating in the sky.' },
  { name: 'Palace', type: 'House', price: 10000000, size: 'Legendary', description: 'A majestic palace for the truly legendary.' },
  { name: 'Underwater City', type: 'House', price: 15000000, size: 'Legendary', description: 'A city beneath the waves, full of wonder.' },
  { name: 'Island', type: 'House', price: 20000000, size: 'Paradise', description: 'A private island paradise away from all those stinky poor people.' },
  { name: 'World Tree Residence', type: 'House', price: 50000000, size: 'Mythic', description: 'A palace nestled in the branches of the world tree.' },
  { name: 'Astral Citadel', type: 'House', price: 100000000, size: 'Mythic', description: 'A citadel that floats between planes of existence.' }
]


// shop table array for mounts
const mountTable = [
  { name: 'Pony', type: 'Mount', price: 5000, description: 'A small, sturdy pony. Not very fast, but dependable.' },
  { name: 'Horse', type: 'Mount', price: 10000, description: 'A horse. Fast and reliable.' },
  { name: 'Boar', type: 'Mount', price: 12000, description: 'A wild boar. Tough and relentless.' },
  { name: 'Wolf', type: 'Mount', price: 15000, description: 'A large wolf. Agile and fierce.' },
  { name: 'Deer', type: 'Mount', price: 18000, description: 'A swift deer. Very fast but fragile.' },
  { name: 'Battle Ram', type: 'Mount', price: 20000, description: 'A ram bred for battle. Powerful and stubborn.' },
  { name: 'Panther', type: 'Mount', price: 25000, description: 'A sleek panther. Silent and fast.' },
  { name: 'Lion', type: 'Mount', price: 50000, description: 'A lion. Fast and fierce.' },
  { name: 'Bear', type: 'Mount', price: 60000, description: 'A massive bear. Powerful and enduring.' },
  { name: 'Dire Wolf', type: 'Mount', price: 75000, description: 'A huge, ancient wolf. Deadly and loyal.' },
  { name: 'Saber-Tooth Cat', type: 'Mount', price: 85000, description: 'A prehistoric beast. Ferocious and intimidating.' },
  { name: 'Thunder Elk', type: 'Mount', price: 90000, description: 'An elk that channels storms. Swift and majestic.' },
  { name: 'Dragon', type: 'Mount', price: 100000, description: 'A dragon. Fast and powerful.' },
  { name: 'Griffon', type: 'Mount', price: 120000, description: 'Half-lion, half-eagle. A master of air and land.' },
  { name: 'Wyvern', type: 'Mount', price: 150000, description: 'A vicious flying dragonkin. Fierce and untamed.' },
  { name: 'Pegasus', type: 'Mount', price: 175000, description: 'A winged horse. Graceful and swift.' },
  { name: 'Roc', type: 'Mount', price: 200000, description: 'A giant bird said to carry elephants away.' },
  { name: 'Frost Wyrm', type: 'Mount', price: 225000, description: 'An ice dragon. Freezing and feral.' },
  { name: 'Shadow Drake', type: 'Mount', price: 250000, description: 'A dark-winged dragon. Fast and elusive.' },
  { name: 'Unicorn', type: 'Mount', price: 500000, description: 'A unicorn. Fast and magical.' },
  { name: 'Celestial Stag', type: 'Mount', price: 550000, description: 'A radiant stag blessed by the stars.' },
  { name: 'Nightmare Steed', type: 'Mount', price: 600000, description: 'A fiery black horse from the underworld.' },
  { name: 'Phoenix', type: 'Mount', price: 1000000, description: 'A phoenix. Fast and legendary.' },
  { name: 'Eclipse Dragon', type: 'Mount', price: 1200000, description: 'A dragon cloaked in shadow and flame.' },
  { name: 'World Serpent', type: 'Mount', price: 1500000, description: 'A colossal serpent that encircles the world.' },
  { name: 'Aurora Whale', type: 'Mount', price: 2000000, description: 'A whale that swims through the skies, trailing light.' },
  { name: 'Golden Kirin', type: 'Mount', price: 2500000, description: 'A mythical creature of purity and grace.' },
  { name: 'Sunborn Roc', type: 'Mount', price: 3000000, description: 'A roc with feathers that glow like the sun.' },
  { name: 'Titan Drake', type: 'Mount', price: 5000000, description: 'An ancient drake said to have fought the gods.' },
  { name: 'Void Leviathan', type: 'Mount', price: 7500000, description: 'A massive beast from the void beyond the stars.' }
]



const familiarTable = [
  { name: 'Dust Bunny', type: 'Familiar', slot: 'familiar', rarity: 'common', chance: 0.06 },
  { name: 'Ember Squirrel', type: 'Familiar', slot: 'familiar', rarity: 'common', chance: 0.06 },
  { name: 'Marsh Frog', type: 'Familiar', slot: 'familiar', rarity: 'common', chance: 0.06 },
  { name: 'Whiskered Mouse', type: 'Familiar', slot: 'familiar', rarity: 'common', chance: 0.06 },
  { name: 'Pebble Turtle', type: 'Familiar', slot: 'familiar', rarity: 'common', chance: 0.06 },
  
  { name: 'Silverwing Finch', type: 'Familiar', slot: 'familiar', rarity: 'uncommon', chance: 0.015 },
  { name: 'Flicker Fox', type: 'Familiar', slot: 'familiar', rarity: 'uncommon', chance: 0.015 },
  { name: 'Verdant Gecko', type: 'Familiar', slot: 'familiar', rarity: 'uncommon', chance: 0.015 },
  { name: 'Howl Pup', type: 'Familiar', slot: 'familiar', rarity: 'uncommon', chance: 0.015 },
  
  { name: 'Gloom Owl', type: 'Familiar', slot: 'familiar', rarity: 'rare', chance: 0.006 },
  { name: 'Glacial Hare', type: 'Familiar', slot: 'familiar', rarity: 'rare', chance: 0.006 },
  { name: 'Storm Lynx', type: 'Familiar', slot: 'familiar', rarity: 'rare', chance: 0.006 },
  { name: 'Warden Tortoise', type: 'Familiar', slot: 'familiar', rarity: 'rare', chance: 0.006 },
  
  { name: 'Flame Wisp', type: 'Familiar', slot: 'familiar', rarity: 'epic', chance: 0.0035 },
  { name: 'Stonebeak Roc', type: 'Familiar', slot: 'familiar', rarity: 'epic', chance: 0.0035 },
  { name: 'Frost Serpent', type: 'Familiar', slot: 'familiar', rarity: 'epic', chance: 0.0035 },
  { name: 'Shadow Kitsune', type: 'Familiar', slot: 'familiar', rarity: 'epic', chance: 0.0035 },
  
  { name: 'Celestial Drake', type: 'Familiar', slot: 'familiar', rarity: 'legendary', chance: 0.001 },
  { name: 'Sunfire Gryphon', type: 'Familiar', slot: 'familiar', rarity: 'legendary', chance: 0.001 },
  { name: 'Astral Unicorn', type: 'Familiar', slot: 'familiar', rarity: 'legendary', chance: 0.001 },
  { name: 'Ghost Wolf', type: 'Familiar', slot: 'familiar', rarity: 'legendary', chance: 0.001 },
  
  { name: 'Phoenix of the Last Dawn', type: 'Familiar', slot: 'familiar', rarity: 'mythic', chance: 0.0005 },
  { name: 'Leviathan Hatchling', type: 'Familiar', slot: 'familiar', rarity: 'mythic', chance: 0.0005 },
  { name: 'Sylvan Treant', type: 'Familiar', slot: 'familiar', rarity: 'mythic', chance: 0.0005 },
  { name: 'Shard Seraph', type: 'Familiar', slot: 'familiar', rarity: 'mythic', chance: 0.0005 },
  
  { name: 'The Worldsnake', type: 'Familiar', slot: 'familiar', rarity: 'divine', chance: 0.0001 },
  { name: 'Celestine, Mother of Stars', type: 'Familiar', slot: 'familiar', rarity: 'divine', chance: 0.0001 },
  { name: 'Auriel\'s First Flame', type: 'Familiar', slot: 'familiar', rarity: 'divine', chance: 0.0001 },
  { name: 'The Voidwalker Sprite', type: 'Familiar', slot: 'familiar', rarity: 'divine', chance: 0.0001 }
]


// shop table array for armor
const armorTable = lootTable.filter(item => item.type === 'Armor');

// shop table array for weapons
const weaponTable = lootTable.filter(item => item.type === 'Weapon');

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
  familiarTable
};
