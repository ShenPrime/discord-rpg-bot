// MongoDB connection utility for RPG bot
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URL;
const dbName = process.env.MONGODB_DB || 'discord_rpg_bot';

let client;
let db;

async function connect() {
  if (!client || !db) {
    client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { connect, close };
