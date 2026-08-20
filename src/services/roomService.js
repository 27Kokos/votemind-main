// src/services/roomService.js
const roomRepository = require('../repositories/roomRepository');
const { generateInviteCode } = require('../utils/helpers');

class RoomService {
  createRoom(name, description, ownerId) {
    if (!name) throw new Error('Название комнаты обязательно');
    const inviteCode = generateInviteCode();
    const roomId = roomRepository.createRoom(name, description, ownerId, inviteCode);
    roomRepository.addMember(roomId, ownerId);
    return roomId;
  }

  joinRoom(inviteCode, userId) {
    const room = roomRepository.findByInviteCode(inviteCode);
    if (!room) throw new Error('Комната не найдена');
    if (roomRepository.isMember(room.id, userId)) {
      throw new Error('Вы уже участник');
    }
    roomRepository.addMember(room.id, userId);
    return room.id;
  }

  getMyRooms(userId) {
    return roomRepository.getMyRooms(userId);
  }

  getRoomDetails(roomId, userId) {
    const room = roomRepository.findByIdWithOwner(roomId, userId);
    if (!room) throw new Error('Комната не найдена');
    return room;
  }

  deleteRoom(roomId, userId) {
    const ownerId = roomRepository.getOwnerId(roomId);
    if (!ownerId) throw new Error('Комната не найдена');
    if (ownerId !== userId) throw new Error('Только владелец может удалить');
    roomRepository.deleteRoom(roomId);
  }

  isMember(roomId, userId) {
    return !!roomRepository.isMember(roomId, userId);
  }

  isOwner(roomId, userId) {
    const ownerId = roomRepository.getOwnerId(roomId);
    return ownerId === userId;
  }
  // src/services/roomService.js

getMyRoomsPaginated(userId, page = 1, limit = 5) {
  const offset = (page - 1) * limit;
  const items = roomRepository.getMyRoomsPaginated(userId, offset, limit);
  const total = roomRepository.getMyRoomsCount(userId);
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
}

module.exports = new RoomService();