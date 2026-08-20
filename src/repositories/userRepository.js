// src/repositories/userRepository.js
const db = require('../db');

const userRepository = {
  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },
  findById(id) {
    return db.prepare('SELECT id, username, email, avatar_url, created_at, notifications_enabled FROM users WHERE id = ?').get(id);
  },
  createUser(username, email, passwordHash) {
    const stmt = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
    const info = stmt.run(username, email, passwordHash);
    return info.lastInsertRowid;
  },
  updateAvatar(userId, avatarUrl) {
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, userId);
  },
  updateNotificationsEnabled(userId, enabled) {
    db.prepare('UPDATE users SET notifications_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, userId);
  },
  getProfileStats(userId) {
    return db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM poll_proposals WHERE proposer_id = ? AND status = 'pending') AS pending_proposals,
        (SELECT COUNT(*) FROM poll_proposals WHERE proposer_id = ? AND status = 'approved') AS approved_proposals,
        (SELECT COUNT(*) FROM poll_proposals WHERE proposer_id = ?) AS total_proposals,
        (SELECT COUNT(*) FROM votes WHERE user_id = ?) AS total_votes,
        (SELECT COUNT(*) FROM room_members WHERE user_id = ?) AS total_rooms
    `).get(userId, userId, userId, userId, userId);
  },
  getActiveRoom(userId) {
    return db.prepare(`
      SELECT r.name, COUNT(v.poll_id) as vote_count
      FROM votes v
      JOIN polls p ON v.poll_id = p.id
      JOIN rooms r ON p.room_id = r.id
      WHERE v.user_id = ?
      GROUP BY r.id
      ORDER BY vote_count DESC
      LIMIT 1
    `).get(userId);
  },
  getActivity(userId, offset, limit) {
    const activity = [];

    // Одобренные предложения (без LIMIT)
    const approved = db.prepare(`
      SELECT n.created_at, r.name AS room_name
      FROM notifications n
      JOIN rooms r ON n.room_id = r.id
      WHERE n.target_user_id = ? AND n.type = 'approved' AND n.read = 1
      ORDER BY n.created_at DESC
    `).all(userId);
    approved.forEach(n => activity.push({
      type: 'approved',
      icon: '✅',
      text: `Ваше предложение одобрено в «${n.room_name}»`,
      time: n.created_at
    }));

    // Предложил голосование (без LIMIT)
    const submitted = db.prepare(`
      SELECT pp.created_at, r.name AS room_name
      FROM poll_proposals pp
      JOIN rooms r ON pp.room_id = r.id
      WHERE pp.proposer_id = ?
      ORDER BY pp.created_at DESC
    `).all(userId);
    submitted.forEach(p => activity.push({
      type: 'submitted',
      icon: '💡',
      text: `Вы предложили голосование в «${p.room_name}»`,
      time: p.created_at
    }));

    // Голосовал (без LIMIT)
    const votes = db.prepare(`
      SELECT v.voted_at, r.name AS room_name
      FROM votes v
      JOIN polls p ON v.poll_id = p.id
      JOIN rooms r ON p.room_id = r.id
      WHERE v.user_id = ?
      ORDER BY v.voted_at DESC
    `).all(userId);
    votes.forEach(v => activity.push({
      type: 'vote',
      icon: '🗳️',
      text: `Вы проголосовали в «${v.room_name}»`,
      time: v.voted_at
    }));

    // Сортируем по времени (от новых к старым)
    activity.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Применяем пагинацию
    return activity.slice(offset, offset + limit);
  },
  getActivityCount(userId) {
    const totalApproved = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE target_user_id = ? AND type = 'approved' AND read = 1
    `).get(userId).count;

    const totalSubmitted = db.prepare(`
      SELECT COUNT(*) as count FROM poll_proposals WHERE proposer_id = ?
    `).get(userId).count;

    const totalVotes = db.prepare(`
      SELECT COUNT(*) as count FROM votes WHERE user_id = ?
    `).get(userId).count;

    return totalApproved + totalSubmitted + totalVotes;
  }
};

module.exports = userRepository;