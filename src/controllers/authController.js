// src/controllers/authController.js
const authService = require('../services/authService');

const authController = {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;
      await authService.register(username, email, password);
      res.redirect('/login');
    } catch (err) {
      console.error('Registration error:', err.message);
      res.status(400).send(err.message);
    }
  },

  async login(req, res) {
    try {
      const { username, password } = req.body;
      const user = await authService.login(username, password);
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.avatarUrl = user.avatar_url;
      res.redirect('/dashboard');
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(401).send(err.message);
    }
  },

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err);
      res.redirect('/login');
    });
  }
};

module.exports = authController;