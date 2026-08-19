// src/middlewares/validation.js
// Простые валидаторы, можно расширить
function validatePollType(type) {
  return ['single', 'multiple', 'rated_options'].includes(type);
}

function validateOptions(options) {
  return Array.isArray(options) && options.length >= 2 && options.every(o => o && o.trim());
}

module.exports = { validatePollType, validateOptions };