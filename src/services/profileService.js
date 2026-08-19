// src/services/profileService.js
const userRepository = require('../repositories/userRepository');
const fs = require('fs');
const path = require('path');

class ProfileService {
  getProfile(userId) {
    const user = userRepository.findById(userId);
    if (!user) throw new Error('Пользователь не найден');
    const stats = userRepository.getProfileStats(userId);
    const activeRoom = userRepository.getActiveRoom(userId);
    const activity = userRepository.getActivity(userId);

    return {
      ...user,
      notifications_enabled: user.notifications_enabled === 1,
      stats: {
        ...stats,
        approval_rate: stats.total_proposals > 0
          ? Math.round((stats.approved_proposals / stats.total_proposals) * 100)
          : 0,
        active_room: activeRoom ? activeRoom.name : '—'
      },
      activity
    };
  }

  updateAvatar(userId, file) {
    if (!file) throw new Error('Файл не загружен');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    userRepository.updateAvatar(userId, avatarUrl);
    return avatarUrl;
  }

  toggleNotifications(userId, enabled) {
    userRepository.updateNotificationsEnabled(userId, enabled);
  }
}

module.exports = new ProfileService();