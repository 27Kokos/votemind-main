// src/io.js
let ioInstance = null;

module.exports = {
  setIo(io) {
    ioInstance = io;
  },
  getIo() {
    if (!ioInstance) {
      throw new Error('Socket.IO не инициализирован!');
    }
    return ioInstance;
  }
};