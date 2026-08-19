// src/routes/proposals.js
const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

router.post('/propose', proposalController.propose);
router.get('/room/:roomId', proposalController.getRoomProposals);
router.post('/approve/:id', proposalController.approve);
router.post('/reject/:id', proposalController.reject);

module.exports = router;