// src/routes/rooms.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.post('/', roomController.createRoom);
router.post('/join', roomController.joinRoom);
router.get('/my', roomController.getMyRooms);
router.get('/:id', roomController.getRoom);
router.delete('/:id', roomController.deleteRoom);

module.exports = router;