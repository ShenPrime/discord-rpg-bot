// Internal load test for fightSessionManager session scaling
// Usage: node loadtest.js

// Mock getCharacter and saveCharacter to avoid DB calls during load test
const characterModel = require('./characterModel');
const { lootTable } = require('./commands/loot');
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
// Simulated inventory size for each user
function getRandomInventory(size) {
  // Deep copy random lootTable items
  const inventory = [];
  for (let i = 0; i < size; i++) {
    // Pick a random item from lootTable
    const item = lootTable[getRandomInt(lootTable.length)];
    // Deep copy to avoid reference issues
    inventory.push(JSON.parse(JSON.stringify(item)));
  }
  return inventory;
}
characterModel.getCharacter = async function(userId) {
  // Return a dummy character object with a realistic inventory
  return { userId, inventory: getRandomInventory(40), gold: 0 };
};
characterModel.saveCharacter = async function(character) {
  // No-op for save
  return true;
};

const { createOrUpdateSession, flushIfExists } = require('./fightSessionManager');

const NUM_USERS = 1000; // Number of concurrent simulated sessions
const SESSION_DURATION_MS = 10000; // Duration of each session in ms (10s)

let peakMemory = null;
let startMem = null;
function logMemory(context = '', storePeak = false) {
  const mem = process.memoryUsage();
  if (!startMem) startMem = { ...mem };
  const nowObj = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const now = `${nowObj.getFullYear()}-${pad(nowObj.getMonth()+1)}-${pad(nowObj.getDate())} ${pad(nowObj.getHours())}:${pad(nowObj.getMinutes())}:${pad(nowObj.getSeconds())}`;
  const logStr = `[${now}] [LoadTest] ${context} | RSS ${(mem.rss/1048576).toFixed(2)}MB, Heap ${(mem.heapUsed/1048576).toFixed(2)}/${(mem.heapTotal/1048576).toFixed(2)}MB`;
  console.log(logStr);
  if (storePeak) {
    peakMemory = {
      time: now,
      rss: (mem.rss/1048576).toFixed(2),
      heapUsed: (mem.heapUsed/1048576).toFixed(2),
      heapTotal: (mem.heapTotal/1048576).toFixed(2)
    };
  }
}

async function simulateUserSession(userId) {
  // Start session
  await createOrUpdateSession(userId, { gold: 10, loot: [] });
  // Hold session for SESSION_DURATION_MS
  await new Promise(res => setTimeout(res, SESSION_DURATION_MS));
  // End session
  await flushIfExists(userId);
}

async function main() {
  logMemory('Before test');
  const userIds = Array.from({ length: NUM_USERS }, (_, i) => `testuser_${i}`);
  // Start all sessions nearly simultaneously
  const promises = userIds.map(uid => simulateUserSession(uid));
  // Log memory at peak (when all sessions are running)
  setTimeout(() => logMemory('Peak (all sessions active)', true), SESSION_DURATION_MS / 2);
  await Promise.all(promises);
  logMemory('After all sessions flushed');
  if (peakMemory) {
    console.log(`\n==== PEAK MEMORY USAGE ====`);
    console.log(`Time: ${peakMemory.time}`);
    console.log(`RSS: ${peakMemory.rss}MB`);
    console.log('Memory Usage Report:');
    console.log('----------------------');
    console.log(`Start Heap Used: ${(startMem.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Start Heap Total: ${(startMem.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log('---');
    console.log(`Peak Heap Used: ${(peakMemory.heapUsed)}MB`);
    console.log(`Peak Heap Total: ${(peakMemory.heapTotal)}MB`);
    console.log('==========================\n');
  }
  console.log('Load test complete.');
}

main();
