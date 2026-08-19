// app.js
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// === Безопасность ===
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      upgradeInsecureRequests: null,
    }
  }
}));

// === Rate Limiting ===
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Слишком много запросов, попробуйте позже.'
});
app.use(limiter);

// === Парсинг тела ===
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// === Middleware авторизации ===
const requireAuth = require('./src/middlewares/auth');

// === Роуты ===
const authRoutes = require('./src/routes/auth');
const roomRoutes = require('./src/routes/rooms');
const pollRoutes = require('./src/routes/polls');
const proposalRoutes = require('./src/routes/proposals');
const notificationRoutes = require('./src/routes/notifications');
const profileRoutes = require('./src/routes/profile');
const apiRoutes = require('./src/routes/api');

// === Сессии ===
const sessionMiddleware = session({
  store: new SQLiteStore({ db: 'sessions.sqlite' }),
  secret: process.env.SESSION_SECRET || 'замени_меня_в_продакшене',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
});
app.use(sessionMiddleware);

// === Регистрируем роуты ===
app.use('/auth', authRoutes);
app.use('/rooms', requireAuth, roomRoutes);
app.use('/polls', requireAuth, pollRoutes);
app.use('/proposals', requireAuth, proposalRoutes);
app.use('/notifications', requireAuth, notificationRoutes);
app.use('/profile', requireAuth, profileRoutes);
app.use('/api', requireAuth, apiRoutes);

// === Статические страницы ===
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/dashboard', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/room/:id', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'views', 'room.html')));
app.get('/profile', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// === Запуск сервера ===
const server = app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});

// === Socket.IO ===
const io = require('socket.io')(server);
io.use((socket, next) => {
  const req = socket.request;
  const res = {};
  sessionMiddleware(req, res, () => next());
});

// Сохраняем io в модуль-синглтон
const ioModule = require('./src/io');
ioModule.setIo(io);

// Подключаем обработчики сокетов (передаём io)
const socketHandlers = require('./src/socketHandlers');
socketHandlers(io);

module.exports = { app, io };