// fightSessionManager.js
const { getCharacter, saveCharacter } = require('./characterModel');
const fightSessions = new Map();
const INACTIVITY_TIMEOUT = 10000; // 10 seconds

function getMemoryUsageStats() {
  const mem = process.memoryUsage();
  return {
    rss: mem.rss,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers
  };
}

function logActiveSessions(context = '') {
  const count = fightSessions.size;
  const mem = getMemoryUsageStats();
  console.log(`[SessionMonitor] Active sessions: ${count}${context ? ' | ' + context : ''} | Memory: RSS ${(mem.rss/1048576).toFixed(2)}MB, Heap ${(mem.heapUsed/1048576).toFixed(2)}/${(mem.heapTotal/1048576).toFixed(2)}MB`);
}

function getActiveSessionCount() {
  return fightSessions.size;
}

function getSession(userId) {
  return fightSessions.get(userId);
}

async function createOrUpdateSession(userId, delta) {
  let session = fightSessions.get(userId);
  if (!session) {
    // On session creation, also snapshot the character state
    const { getCharacter } = require('./characterModel');
    const character = await getCharacter(userId);
    session = {
      userId,
      gold: 0,
      xp: 0,
      loot: [],
      collections: {
        houses: [],
        mounts: [],
        weapons: [],
        armor: [],
        familiars: [],
      },
      // Store a snapshot of the character's state for in-session use
      character: character ? JSON.parse(JSON.stringify(character)) : null,
      timer: null,
      lastActivity: Date.now(),
    };
    fightSessions.set(userId, session);
    logActiveSessions('after session creation');
  }
  session.gold += delta.gold || 0;
  session.xp += delta.xp || 0;
  if (delta.loot) session.loot.push(...delta.loot);
  // Always update the character snapshot for in-session use
  if (session.character) {
    session.character.gold = (session.character.gold || 0) + (delta.gold || 0);
    session.character.xp = (session.character.xp || 0) + (delta.xp || 0);
    // You may also want to update inventory, collections, etc, as needed for in-session preview
  }
  // Merge collections
  if (delta.collections) {
    for (const cat of Object.keys(session.collections)) {
      if (Array.isArray(delta.collections[cat])) {
        for (const item of delta.collections[cat]) {
          const existing = session.collections[cat].find(i => i.name === item.name);
          if (existing) {
            existing.count = (existing.count || 1) + (item.count || 1);
          } else {
            session.collections[cat].push({ ...item, count: item.count || 1 });
          }
        }
      }
    }
  }
  session.lastActivity = Date.now();
  // Reset inactivity timer
  if (session.timer) clearTimeout(session.timer);
  session.timer = setTimeout(() => flushSession(userId), INACTIVITY_TIMEOUT);
}

async function flushSession(userId) {
  const session = fightSessions.get(userId);
  if (!session) return;
  const character = await getCharacter(userId);
  if (!character) return;
  // Apply gold/xp using inventory merge logic (no top-level gold)
  if (!character.inventory) character.inventory = [];
  // Use inventory utilities for merging gold and loot
  const mergeOrAddInventoryItem = require('./mergeOrAddInventoryItem');
  const addGoldToInventory = require('./addGoldToInventory');

  // Remove all gold from inventory and sum up
  let goldTotal = session.gold || 0;
  let cleanedInventory = [];
  for (const item of character.inventory) {
    if (typeof item === 'object' && item.name === 'Gold') {
      goldTotal += (item.count || 0);
    } else if (typeof item === 'string' && /^(\d+) Gold/i.test(item)) {
      const goldMatch = item.match(/(\d+) Gold/i);
      if (goldMatch) goldTotal += parseInt(goldMatch[1], 10);
    } else {
      cleanedInventory.push(item);
    }
  }
  // Start with inventory minus gold
  character.inventory = cleanedInventory;
  // Add merged gold
  if (goldTotal > 0) {
    addGoldToInventory(character.inventory, goldTotal);
  }
  // Merge loot items using utility
  const lootToMerge = Array.isArray(session.loot) ? session.loot : [];
  for (const lootItem of lootToMerge) {
    mergeOrAddInventoryItem(character.inventory, lootItem);
  }
  character.xp = (character.xp || 0) + session.xp;
  // Level up logic: ensure XP is always 'since last level'
  const { getXpForNextLevel, getClassForLevel } = require('./characterUtils');
  let leveledUp = false;
  let levelUpCount = 0;
  let levelUpMsgs = [];
  while (character.xp >= getXpForNextLevel(character.level || 1)) {
    character.xp -= getXpForNextLevel(character.level || 1);
    character.level = (character.level || 1) + 1;
    if (!character.stats) {
      character.stats = { strength: 1, defense: 0, luck: 0 };
    }
    character.stats.strength += 1;
    character.class = getClassForLevel(character.level);
    leveledUp = true;
    levelUpCount++;
    levelUpMsgs.push(`🎉 You leveled up! You are now level ${character.level}! Stats gained: STR +1`);
  }
  // (Loot already merged above, do not push again)
  // Merge collections
  if (!character.collections) character.collections = { houses: [], mounts: [], weapons: [], armor: [], familiars: [] };
  for (const cat of Object.keys(session.collections)) {
    if (!Array.isArray(character.collections[cat])) character.collections[cat] = [];
    for (const item of session.collections[cat]) {
      if (!character.collections[cat].some(i => i.name === item.name)) {
        character.collections[cat].push(item);
      }
    }
  }
  await saveCharacter(userId, character);
  //console.log('[Session FLUSHED]', { userId, flushed: session });
  // Reset session.character snapshot after flush
  if (session.character) session.character = null;
  fightSessions.delete(userId);
  logActiveSessions('after session flush/delete');
}

async function flushOnLevelUp(userId) {
  await flushSession(userId);
}

async function flushIfExists(userId) {
  if (fightSessions.has(userId)) {
    await flushSession(userId);
  }
}

module.exports = {
  getSession,
  createOrUpdateSession,
  flushSession,
  flushOnLevelUp,
  flushIfExists,
  getActiveSessionCount,
  getMemoryUsageStats,
};
