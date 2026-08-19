// src/repositories/notificationRepository.js
const db = require('../db');

const notificationRepository = {
  create(roomId, targetUserId, actorId, type, title) {
    db.prepare(`
      INSERT INTO notifications (room_id, target_user_id, actor_id, type, title)
      VALUES (?, ?, ?, ?, ?)
    `).run(roomId, targetUserId, actorId, type, title);
  },
  getForUser(userId, roomId = null) {
    let query = `
      SELECT n.*, u.username, r.name AS room_name
      FROM notifications n
      JOIN users u ON n.actor_id = u.id
      JOIN rooms r ON n.room_id = r.id
      WHERE n.target_user_id = ?
    `;
    const params = [userId];
    if (roomId) {
      query += ' AND n.room_id = ?';
      params.push(roomId);
    }
    query += ' ORDER BY n.created_at DESC LIMIT 20';
    return db.prepare(query).all(...params);
  },
  markAsRead(notificationId, userId) {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND target_user_id = ?')
      .run(notificationId, userId);
  },
  markAllRead(userId) {
    db.prepare('UPDATE notifications SET read = 1 WHERE target_user_id = ? AND read = 0')
      .run(userId);
  },
  getUnreadCount(userId) {
    const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE target_user_id = ? AND read = 0')
      .get(userId);
    return row.count;
  }
};

module.exports = notificationRepository;