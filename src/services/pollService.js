// src/services/pollService.js
const pollRepository = require('../repositories/pollRepository');
const roomService = require('./roomService');
const { validatePollType, validateOptions } = require('../middlewares/validation');

class PollService {
  createPoll(roomId, question, type, options, userId) {
    if (!roomService.isMember(roomId, userId)) throw new Error('Вы не участник комнаты');
    if (!question) throw new Error('Вопрос обязателен');
    if (!validatePollType(type)) throw new Error('Неверный тип голосования');
    if (!validateOptions(options)) throw new Error('Нужно минимум 2 варианта');

    const pollId = pollRepository.createPoll(roomId, question, type, userId);
    options.forEach(opt => pollRepository.addOption(pollId, opt));
    return pollId;
  }

  getPolls(roomId) {
    return pollRepository.findByRoomId(roomId);
  }

  getPollDetails(pollId, userId) {
    const poll = pollRepository.findByIdWithOwner(pollId, userId);
    if (!poll) throw new Error('Голосование не найдено');
    const hasVoted = !!pollRepository.hasUserVoted(pollId, userId);
    poll.user_vote = hasVoted;

    if (poll.type === 'rated_options') {
      poll.options = pollRepository.getOptionsWithVotes(pollId, userId);
    } else {
      poll.options = pollRepository.getOptionsWithSimpleVotes(pollId);
    }
    return poll;
  }

  vote(pollId, userId, optionId, ratings = null) {
    const poll = pollRepository.findById(pollId);
    if (!poll) throw new Error('Голосование не найдено');
    if (pollRepository.hasUserVoted(pollId, userId)) {
      throw new Error('Вы уже проголосовали');
    }

    if (poll.type === 'rated_options') {
      if (!ratings || typeof ratings !== 'object') throw new Error('Неверные данные');
      const options = pollRepository.getOptions(pollId);
      for (const opt of options) {
        const rating = ratings[opt.id];
        if (!rating || rating < 1 || rating > 5) throw new Error('Оцените каждый вариант от 1 до 5');
        pollRepository.insertVote(pollId, userId, opt.id, rating);
      }
    } else {
      if (!optionId) throw new Error('Выберите вариант');
      pollRepository.insertVote(pollId, userId, optionId);
    }
  }

  deletePoll(pollId, userId) {
    if (!pollRepository.isOwner(pollId, userId)) throw new Error('Нет прав на удаление');
    pollRepository.deletePoll(pollId);
  }

  updatePoll(pollId, userId, question, options) {
    if (!pollRepository.isOwner(pollId, userId)) throw new Error('Нет прав на редактирование');
    if (question) pollRepository.updatePollQuestion(pollId, question);
    if (options && Array.isArray(options)) {
      for (const opt of options) {
        if (opt.id) {
          pollRepository.updateOptionText(opt.id, opt.text, pollId);
        } else {
          pollRepository.insertOption(pollId, opt.text);
        }
      }
    }
  }
}

module.exports = new PollService();