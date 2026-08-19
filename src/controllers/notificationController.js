// src/controllers/notificationController.js
const notificationService = require('../services/notificationService');

const notificationController = {
  getNotifications(req, res) {
    try {
      const userId = req.session.userId;
      const roomId = req.query.roomId ? parseInt(req.query.roomId) : null;
      const notifications = notificationService.getNotifications(userId, roomId);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  markAsRead(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.session.userId;
      notificationService.markAsRead(notificationId, userId);
      res.sendStatus(200);
    } catch (err) {
      res.status(403).send(err.message);
    }
  },

  markAllRead(req, res) {
    try {
      const userId = req.session.userId;
      notificationService.markAllRead(userId);
      res.sendStatus(200);
    } catch (err) {
      res.status(500).send(err.message);
    }
  }
};

module.exports = notificationController;