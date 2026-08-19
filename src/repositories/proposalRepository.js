// src/repositories/proposalRepository.js
const db = require('../db');

const proposalRepository = {
  createProposal(roomId, proposerId, question, type, options) {
    const stmt = db.prepare(`
      INSERT INTO poll_proposals (room_id, proposer_id, question, type, options)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(roomId, proposerId, question, type, JSON.stringify(options));
    return info.lastInsertRowid;
  },
  findByRoomId(roomId) {
    return db.prepare(`
      SELECT pp.*, u.username, r.name AS room_name
      FROM poll_proposals pp
      JOIN users u ON pp.proposer_id = u.id
      JOIN rooms r ON pp.room_id = r.id
      WHERE pp.room_id = ? AND pp.status = 'pending'
      ORDER BY pp.created_at DESC
    `).all(roomId);
  },
  findById(id) {
    return db.prepare('SELECT * FROM poll_proposals WHERE id = ?').get(id);
  },
  findByIdWithOwner(id, ownerId) {
    return db.prepare(`
      SELECT pp.*, r.owner_id
      FROM poll_proposals pp
      JOIN rooms r ON pp.room_id = r.id
      WHERE pp.id = ? AND r.owner_id = ?
    `).get(id, ownerId);
  },
  approve(id) {
    db.prepare("UPDATE poll_proposals SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  },
  reject(id) {
    db.prepare("UPDATE poll_proposals SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  },
  isPending(id) {
    const row = db.prepare('SELECT status FROM poll_proposals WHERE id = ?').get(id);
    return row && row.status === 'pending';
  }
};

module.exports = proposalRepository;