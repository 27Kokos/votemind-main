// src/routes/api.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const analyticsController = require('../controllers/analyticsController');

router.get('/profile', profileController.getProfileData);
router.get('/analytics/stats', analyticsController.getStats);

module.exports = router;