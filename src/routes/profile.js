// src/routes/profile.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getProfilePage);
router.get('/data', profileController.getProfileData);
router.post('/avatar', profileController.uploadAvatar);
router.post('/toggle-notifications', profileController.toggleNotifications);

module.exports = router;