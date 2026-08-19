// src/repositories/roomRepository.js
const db = require('../db');

const roomRepository = {
  findById(id) {
    return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  },
  findByIdWithOwner(id, userId) {
    return db.prepare(`
      SELECT r.*, 
             CASE WHEN r.owner_id = ? THEN 1 ELSE 0 END AS is_owner
      FROM rooms r
      WHERE r.id = ?
    `).get(userId, id);
  },
  findByInviteCode(code) {
    return db.prepare('SELECT id FROM rooms WHERE invite_code = ?').get(code);
  },
  createRoom(name, description, ownerId, inviteCode) {
    const stmt = db.prepare(`
      INSERT INTO rooms (name, description, owner_id, invite_code)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name, description, ownerId, inviteCode);
    return info.lastInsertRowid;
  },
  addMember(roomId, userId) {
    db.prepare('INSERT INTO room_members (room_id, user_id) VALUES (?, ?)').run(roomId, userId);
  },
  isMember(roomId, userId) {
    return db.prepare('SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId);
  },
  getMyRooms(userId) {
    return db.prepare(`
      SELECT r.id, r.name, r.description, r.invite_code,
             CASE WHEN r.owner_id = ? THEN 1 ELSE 0 END AS is_owner
      FROM rooms r
      JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = ?
      ORDER BY r.created_at DESC
    `).all(userId, userId);
  },
  deleteRoom(roomId) {
    // каскадное удаление через foreign keys
    db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
  },
  getOwnerId(roomId) {
    const row = db.prepare('SELECT owner_id FROM rooms WHERE id = ?').get(roomId);
    return row ? row.owner_id : null;
  }
};

module.exports = roomRepository;