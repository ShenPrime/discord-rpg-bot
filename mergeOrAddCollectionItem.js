// Utility function to merge or add an item to a collection (for collections, not inventory)
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  return true;
}

function mergeOrAddCollectionItem(collection, itemObj) {
  if (!Array.isArray(collection)) return;
  // Always treat as stackable for collections
  const existingIdx = collection.findIndex(i => {
    if (i.name !== itemObj.name) return false;
    if ((i.type || null) !== (itemObj.type || null)) return false;
    if ((i.rarity || null) !== (itemObj.rarity || null)) return false;
    if ((i.slot || null) !== (itemObj.slot || null)) return false;
    if (i.stats || itemObj.stats) {
      if (!deepEqual(i.stats || {}, itemObj.stats || {})) return false;
    }
    return true;
  });
  if (existingIdx !== -1) {
    collection[existingIdx].count = (collection[existingIdx].count || 1) + (itemObj.count || 1);
  } else {
    collection.push({ ...itemObj, count: itemObj.count || 1 });
  }
}

module.exports = mergeOrAddCollectionItem;
