const db = require('../db');

const analyticsController = {
  getStats(req, res) {
    try {
      const userId = req.session.userId;

      // Общая статистика
      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
      const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get()?.count || 0;
      const totalPolls = db.prepare('SELECT COUNT(*) as count FROM polls').get()?.count || 0;
      const totalVotes = db.prepare('SELECT COUNT(*) as count FROM votes').get()?.count || 0;

      // Топ-5 комнат по голосованиям (исправлено: COUNT(*) вместо v.id)
      const topRooms = db.prepare(`
        SELECT 
          r.name,
          COUNT(*) as votes_count
        FROM rooms r
        LEFT JOIN polls p ON r.id = p.room_id
        LEFT JOIN votes v ON p.id = v.poll_id
        GROUP BY r.id
        ORDER BY votes_count DESC
        LIMIT 5
      `).all() || [];

      // Активность по дням (последние 7 дней) - работает
      const activityByDay = db.prepare(`
        SELECT DATE(voted_at) as date, COUNT(*) as count
        FROM votes
        WHERE voted_at >= DATE('now', '-7 days')
        GROUP BY DATE(voted_at)
        ORDER BY date ASC
      `).all() || [];

      // Комнаты пользователя с голосами (исправлено: COUNT(*) вместо v.id)
      const userRoomsStats = db.prepare(`
        SELECT 
          r.id,
          r.name,
          COUNT(*) as votes_count
        FROM rooms r
        JOIN room_members rm ON r.id = rm.room_id
        LEFT JOIN polls p ON r.id = p.room_id
        LEFT JOIN votes v ON p.id = v.poll_id
        WHERE rm.user_id = ?
        GROUP BY r.id
        ORDER BY votes_count DESC
      `).all(userId) || [];

      // Если данных нет, подставляем заглушку
      const finalTopRooms = topRooms.length > 0 ? topRooms : [{ name: 'Нет голосов', votes_count: 0 }];
      const finalUserRooms = userRoomsStats.length > 0 ? userRoomsStats : [{ name: 'Нет голосов', votes_count: 0 }];
      const finalActivity = activityByDay.length > 0 ? activityByDay : [{ date: new Date().toISOString().split('T')[0], count: 0 }];

      res.json({
        totalUsers,
        totalRooms,
        totalPolls,
        totalVotes,
        topRooms: finalTopRooms,
        activityByDay: finalActivity,
        userRoomsStats: finalUserRooms
      });
    } catch (err) {
      console.error('❌ Ошибка в analytics:', err);
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = analyticsController;