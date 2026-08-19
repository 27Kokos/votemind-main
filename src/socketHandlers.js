// src/socketHandlers.js
const roomService = require('./services/roomService');

module.exports = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.request.session?.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`🔌 Пользователь ${userId} подключился`);

    socket.on('join_room', (roomId) => {
      socket.join(`room-${roomId}`);
      console.log(`📥 Пользователь ${userId} присоединился к комнате ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(`room-${roomId}`);
      console.log(`📤 Пользователь ${userId} покинул комнату ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Пользователь ${userId} отключился`);
    });
  });
};