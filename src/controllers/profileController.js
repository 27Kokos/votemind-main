// src/controllers/profileController.js
const profileService = require('../services/profileService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/avatars';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.session.userId;
    const ext = path.extname(file.originalname);
    cb(null, `user_${userId}${ext}`);
  }
});
const upload = multer({ storage });

const profileController = {
  getProfilePage(req, res) {
    res.sendFile(path.join(__dirname, '../../public/profile.html'));
  },

  async getProfileData(req, res) {
    try {
      const userId = req.session.userId;
      const data = profileService.getProfile(userId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  uploadAvatar: [upload.single('avatar'), (req, res) => {
    try {
      const userId = req.session.userId;
      const avatarUrl = profileService.updateAvatar(userId, req.file);
      req.session.avatarUrl = avatarUrl;
      res.redirect('/profile');
    } catch (err) {
      res.status(400).send(err.message);
    }
  }],

  toggleNotifications(req, res) {
    try {
      const { enabled } = req.body;
      const userId = req.session.userId;
      profileService.toggleNotifications(userId, enabled);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = profileController;