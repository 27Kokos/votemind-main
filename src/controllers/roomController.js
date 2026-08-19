// src/controllers/roomController.js
const roomService = require('../services/roomService');

const roomController = {
  createRoom(req, res) {
    try {
      const { name, description } = req.body;
      const userId = req.session.userId;
      roomService.createRoom(name, description, userId);
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      res.status(400).send(err.message);
    }
  },

  joinRoom(req, res) {
    try {
      const { inviteCode } = req.body;
      const userId = req.session.userId;
      roomService.joinRoom(inviteCode, userId);
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      res.status(400).send(err.message);
    }
  },

  getMyRooms(req, res) {
    try {
      const rooms = roomService.getMyRooms(req.session.userId);
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getRoom(req, res) {
    try {
      const roomId = parseInt(req.params.id);
      const room = roomService.getRoomDetails(roomId, req.session.userId);
      res.json(room);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  deleteRoom(req, res) {
    try {
      const roomId = parseInt(req.params.id);
      const userId = req.session.userId;
      roomService.deleteRoom(roomId, userId);
      res.status(200).send('Комната удалена');
    } catch (err) {
      res.status(403).send(err.message);
    }
  }
};

module.exports = roomController;