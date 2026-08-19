// src/services/authService.js
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

class AuthService {
  async register(username, email, password) {
    if (!username || !email || !password) throw new Error('Все поля обязательны');
    if (password.length < 6) throw new Error('Пароль должен быть не менее 6 символов');
    if (!email.includes('@')) throw new Error('Некорректный email');

    const existingUsername = userRepository.findByUsername(username);
    if (existingUsername) throw new Error('Пользователь с таким именем уже существует');
    const existingEmail = userRepository.findByEmail(email);
    if (existingEmail) throw new Error('Пользователь с таким email уже существует');

    const hash = await bcrypt.hash(password, 10);
    const userId = userRepository.createUser(username, email, hash);
    return userId;
  }

  async login(username, password) {
    const user = userRepository.findByUsername(username);
    if (!user) throw new Error('Пользователь не найден');
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new Error('Неверный пароль');
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      notifications_enabled: user.notifications_enabled
    };
  }
}

module.exports = new AuthService();