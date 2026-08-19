// src/services/proposalService.js
const proposalRepository = require('../repositories/proposalRepository');
const notificationRepository = require('../repositories/notificationRepository');
const roomService = require('./roomService');
const pollService = require('./pollService');

class ProposalService {
  createProposal(roomId, proposerId, question, type, options) {
    if (!roomService.isMember(roomId, proposerId)) throw new Error('Вы не участник комнаты');
    if (!question || !['single','multiple','rated_options'].includes(type)) throw new Error('Неверные данные');
    if (!Array.isArray(options) || options.length < 2) throw new Error('Минимум 2 варианта');

    const proposalId = proposalRepository.createProposal(roomId, proposerId, question, type, options);
    // Уведомление владельцу
    const ownerId = roomService.getRoomDetails(roomId, proposerId).owner_id;
    notificationRepository.create(roomId, ownerId, proposerId, 'new_proposal', '💡 Новое предложение в комнату');
    return proposalId;
  }

  getPendingProposals(roomId, ownerId) {
    // Проверяем, что пользователь владелец
    const room = roomService.getRoomDetails(roomId, ownerId);
    if (room.owner_id !== ownerId) throw new Error('Только владелец');
    return proposalRepository.findByRoomId(roomId);
  }

  approveProposal(proposalId, ownerId) {
    const proposal = proposalRepository.findByIdWithOwner(proposalId, ownerId);
    if (!proposal) throw new Error('Предложение не найдено или нет прав');
    if (proposal.status !== 'pending') throw new Error('Уже обработано');

    const options = JSON.parse(proposal.options);
    const pollId = pollService.createPoll(
      proposal.room_id,
      proposal.question,
      proposal.type,
      options,
      ownerId
    );
    proposalRepository.approve(proposalId);
    // Уведомить автора
    notificationRepository.create(
      proposal.room_id,
      proposal.proposer_id,
      ownerId,
      'approved',
      '✅ Ваше предложение одобрено!'
    );
    return pollId;
  }

  rejectProposal(proposalId, ownerId) {
    const proposal = proposalRepository.findByIdWithOwner(proposalId, ownerId);
    if (!proposal) throw new Error('Предложение не найдено или нет прав');
    if (proposal.status !== 'pending') throw new Error('Уже обработано');
    proposalRepository.reject(proposalId);
  }
}

module.exports = new ProposalService();