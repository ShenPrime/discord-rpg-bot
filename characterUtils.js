// Utility functions to load and save character data from characters.json
const fs = require('fs');
const path = require('path');
const CHARACTERS_FILE = path.join(__dirname, 'characters.json');

function loadCharacters() {
  if (!fs.existsSync(CHARACTERS_FILE)) return {};
  try {
    const data = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function saveCharacters(characters) {
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));
}

module.exports = {
  loadCharacters,
  saveCharacters
};
