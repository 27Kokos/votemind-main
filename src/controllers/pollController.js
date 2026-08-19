// src/controllers/pollController.js
const pollService = require('../services/pollService');
const ioModule = require('../io');

const pollController = {
  getPolls(req, res) {
    try {
      const roomId = parseInt(req.params.roomId);
      console.log('🔍 getPolls: roomId =', roomId);
      const polls = pollService.getPolls(roomId);
      console.log('✅ getPolls: найдено голосований =', polls.length);
      res.json(polls);
    } catch (err) {
      console.error('❌ getPolls ошибка:', err);
      res.status(500).json({ error: err.message });
    }
  },

  getPoll(req, res) {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.session.userId;
      const poll = pollService.getPollDetails(pollId, userId);
      res.json(poll);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  createPoll(req, res) {
    try {
      const { roomId, question, type, options } = req.body;
      const userId = req.session.userId;
      const pollId = pollService.createPoll(roomId, question, type, options, userId);

      const io = ioModule.getIo();
      io.to(`room-${roomId}`).emit('poll_created', {
        id: pollId,
        question,
        type,
        vote_count: 0
      });

      res.status(201).json({ id: pollId });
    } catch (err) {
      console.error(err);
      res.status(400).send(err.message);
    }
  },

  vote(req, res) {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { optionId, ratings } = req.body;
      pollService.vote(pollId, userId, optionId, ratings);

      const updatedPoll = pollService.getPollDetails(pollId, userId);
      const roomId = updatedPoll.room_id;

      const io = ioModule.getIo();
      io.to(`room-${roomId}`).emit('poll_updated', {
        pollId,
        updatedPoll
      });

      res.send('OK');
    } catch (err) {
      res.status(400).send(err.message);
    }
  },

  deletePoll(req, res) {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.session.userId;
      pollService.deletePoll(pollId, userId);
      res.send('Голосование удалено');
    } catch (err) {
      res.status(403).send(err.message);
    }
  },

  updatePoll(req, res) {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { question, options } = req.body;
      pollService.updatePoll(pollId, userId, question, options);

      const updatedPoll = pollService.getPollDetails(pollId, userId);
      const roomId = updatedPoll.room_id;

      const io = ioModule.getIo();
      io.to(`room-${roomId}`).emit('poll_updated', {
        pollId,
        updatedPoll
      });

      res.send('Голосование обновлено');
    } catch (err) {
      res.status(403).send(err.message);
    }
  }
};

module.exports = pollController;