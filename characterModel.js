// MongoDB Character Model for Discord RPG Bot
const { ObjectId } = require('mongodb');
const { connect } = require('./db');

const COLLECTION = 'characters';

async function getCharacter(userId) {
  const db = await connect();
  return db.collection(COLLECTION).findOne({ userId });
}

async function saveCharacter(userId, character) {
  const db = await connect();
  await db.collection(COLLECTION).updateOne(
    { userId },
    { $set: { ...character, userId } },
    { upsert: true }
  );
}

async function getAllCharacters() {
  const db = await connect();
  return db.collection(COLLECTION).find({}).toArray();
}

async function deleteCharacter(userId) {
  const db = await connect();
  return db.collection(COLLECTION).deleteOne({ userId });
}

module.exports = {
  getCharacter,
  saveCharacter,
  getAllCharacters,
  deleteCharacter
};
