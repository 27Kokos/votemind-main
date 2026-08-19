// src/repositories/pollRepository.js
const db = require('../db');

const pollRepository = {
findByRoomId(roomId) {
  console.log('🔍 findByRoomId: roomId =', roomId);
  try {
    const result = db.prepare(`
      SELECT p.id, p.question, p.type, p.created_by,
             (SELECT COUNT(*) FROM votes v WHERE v.poll_id = p.id) AS vote_count
      FROM polls p
      WHERE p.room_id = ?
      ORDER BY p.created_at DESC
    `).all(roomId);
    console.log('✅ findByRoomId: результат =', result);
    return result;
  } catch (err) {
    console.error('❌ findByRoomId SQL ошибка:', err);
    throw err;
  }
},
  findById(id) {
    return db.prepare('SELECT * FROM polls WHERE id = ?').get(id);
  },
  findByIdWithOwner(id, userId) {
    return db.prepare(`
      SELECT p.*, 
             CASE WHEN r.owner_id = ? THEN 1 ELSE 0 END AS is_owner
      FROM polls p
      JOIN rooms r ON p.room_id = r.id
      WHERE p.id = ?
    `).get(userId, id);
  },
  createPoll(roomId, question, type, createdBy) {
    const stmt = db.prepare(`
      INSERT INTO polls (room_id, question, type, created_by)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(roomId, question, type, createdBy);
    return info.lastInsertRowid;
  },
  addOption(pollId, text) {
    db.prepare('INSERT INTO poll_options (poll_id, text) VALUES (?, ?)').run(pollId, text);
  },
  getOptions(pollId) {
    return db.prepare('SELECT id, text FROM poll_options WHERE poll_id = ?').all(pollId);
  },
  getOptionsWithVotes(pollId, userId) {
    // Для голосования с рейтингом
    return db.prepare(`
      SELECT o.id, o.text,
             COALESCE(AVG(v.rating), 0) AS average_rating,
             COUNT(v.option_id) AS vote_count
      FROM poll_options o
      LEFT JOIN votes v ON o.id = v.option_id AND v.poll_id = ?
      WHERE o.poll_id = ?
      GROUP BY o.id
    `).all(pollId, pollId);
  },
  getOptionsWithSimpleVotes(pollId) {
    return db.prepare(`
      SELECT o.id, o.text,
             (SELECT COUNT(*) FROM votes v WHERE v.option_id = o.id) AS votes
      FROM poll_options o
      WHERE o.poll_id = ?
    `).all(pollId);
  },
  hasUserVoted(pollId, userId) {
    return db.prepare('SELECT 1 FROM votes WHERE poll_id = ? AND user_id = ?').get(pollId, userId);
  },
  insertVote(pollId, userId, optionId, rating = null) {
    if (rating !== null) {
      db.prepare('INSERT INTO votes (poll_id, user_id, option_id, rating) VALUES (?, ?, ?, ?)')
        .run(pollId, userId, optionId, rating);
    } else {
      db.prepare('INSERT INTO votes (poll_id, user_id, option_id) VALUES (?, ?, ?)')
        .run(pollId, userId, optionId);
    }
  },
  deletePoll(pollId) {
    db.prepare('DELETE FROM polls WHERE id = ?').run(pollId);
  },
  updatePollQuestion(pollId, question) {
    db.prepare('UPDATE polls SET question = ? WHERE id = ?').run(question, pollId);
  },
  updateOptionText(optionId, text, pollId) {
    db.prepare('UPDATE poll_options SET text = ? WHERE id = ? AND poll_id = ?').run(text, optionId, pollId);
  },
  insertOption(pollId, text) {
    db.prepare('INSERT INTO poll_options (poll_id, text) VALUES (?, ?)').run(pollId, text);
  },
  isOwner(pollId, userId) {
    const row = db.prepare(`
      SELECT 1 FROM polls p
      JOIN rooms r ON p.room_id = r.id
      WHERE p.id = ? AND r.owner_id = ?
    `).get(pollId, userId);
    return !!row;
  }
};

module.exports = pollRepository;