const assert = require('node:assert/strict');
const { getWardrobeSuggestions } = require('./script.js');

const clothingItems = [
  { name: 'Light jacket', weatherTags: ['cool', 'mild', 'rainy'] },
  { name: 'Shorts', weatherTags: ['hot', 'warm'] },
  { name: 'Winter coat', weatherTags: ['cold'] }
];

const result = getWardrobeSuggestions(clothingItems, 18, 'rain');
assert.deepEqual(result.map((item) => item.name), ['Light jacket', 'Shorts']);

console.log('wardrobe tests passed');
