// src/utils/helpers.js
const db = require('../db');

function generateInviteCode() {
  const chars = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789';
  const stmt = db.prepare('SELECT 1 FROM rooms WHERE invite_code = ?');
  let code, attempts = 0;
  while (!code && attempts < 50) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (stmt.get(code)) code = null;
    attempts++;
  }
  if (!code) throw new Error('Не удалось сгенерировать уникальный код');
  return code;
}

module.exports = { generateInviteCode };