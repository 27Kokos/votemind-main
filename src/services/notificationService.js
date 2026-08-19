// src/services/notificationService.js
const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  getNotifications(userId, roomId = null) {
    return notificationRepository.getForUser(userId, roomId);
  }

  markAsRead(notificationId, userId) {
    notificationRepository.markAsRead(notificationId, userId);
  }

  markAllRead(userId) {
    notificationRepository.markAllRead(userId);
  }

  getUnreadCount(userId) {
    return notificationRepository.getUnreadCount(userId);
  }
}

module.exports = new NotificationService();