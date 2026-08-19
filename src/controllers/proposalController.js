// src/controllers/proposalController.js
const proposalService = require('../services/proposalService');

const proposalController = {
  propose(req, res) {
    try {
      const { roomId, question, type, options } = req.body;
      const userId = req.session.userId;
      proposalService.createProposal(roomId, userId, question, type, options);
      res.status(200).json({ success: true, message: 'Предложение отправлено' });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  },

  getRoomProposals(req, res) {
    try {
      const roomId = parseInt(req.params.roomId);
      const ownerId = req.session.userId;
      const proposals = proposalService.getPendingProposals(roomId, ownerId);
      res.json(proposals);
    } catch (err) {
      res.status(403).json({ error: err.message });
    }
  },

  approve(req, res) {
    try {
      const proposalId = parseInt(req.params.id);
      const ownerId = req.session.userId;
      proposalService.approveProposal(proposalId, ownerId);
      res.status(200).json({ success: true, message: 'Предложение одобрено' });
    } catch (err) {
      console.error(err);
      res.status(403).json({ error: err.message });
    }
  },

  reject(req, res) {
    try {
      const proposalId = parseInt(req.params.id);
      const ownerId = req.session.userId;
      proposalService.rejectProposal(proposalId, ownerId);
      res.status(200).json({ success: true, message: 'Предложение отклонено' });
    } catch (err) {
      console.error(err);
      res.status(403).json({ error: err.message });
    }
  }
};

module.exports = proposalController;