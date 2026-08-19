// src/routes/polls.js
const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');

router.get('/room/:roomId', pollController.getPolls);
router.post('/', pollController.createPoll);
router.get('/:id', pollController.getPoll);
router.post('/:id/vote', pollController.vote);
router.delete('/:id', pollController.deletePoll);
router.patch('/:id', pollController.updatePoll);

module.exports = router;