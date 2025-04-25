// Utility to add gold to a character's inventory, merging with existing gold entry if present.
function addGoldToInventory(inventory, amount) {
  if (!Array.isArray(inventory)) return;
  amount = Number(amount) || 0;
  if (amount <= 0) return;
  let goldIdx = inventory.findIndex(i => typeof i === 'object' && i.name === 'Gold');
  if (goldIdx !== -1) {
    inventory[goldIdx].count = (inventory[goldIdx].count || 0) + amount;
  } else {
    inventory.unshift({ name: 'Gold', count: amount, rarity: 'common', price: 1 });
  }
}

module.exports = addGoldToInventory;
