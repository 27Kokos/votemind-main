// src/controllers/pollController.js
const pollService = require('../services/pollService');

const pollController = {
  getPolls(req, res) {
    try {
      const roomId = parseInt(req.params.roomId);
      const polls = pollService.getPolls(roomId);
      res.json(polls);
    } catch (err) {
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
      res.send('Голосование обновлено');
    } catch (err) {
      res.status(403).send(err.message);
    }
  }
};

module.exports = pollController;