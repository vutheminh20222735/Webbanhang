require('dotenv').config();
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const applySecurity = require('./middleware/security');

const PORT = process.env.PORT || 5000;

const app = express();
// apply stronger security middlewares (CSP, sanitize, xss)
applySecurity(app);
const allowed = (process.env.CLIENT_URL || 'http://localhost:4200')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowed.includes('*') || allowed.includes(origin)) return cb(null, true);
    return cb(null, allowed[0] || true);
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.use('/api', routes);

app.get('/', (req, res) => res.json({ success: true, message: 'Phone Shop API' }));

app.use(errorHandler);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);

let io;
try {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: corsOptions,
    path: '/socket.io'
  });

  // Make io accessible from req.app.get('io')
  app.set('io', io);

  io.on('connection', (socket) => {
    // Client joins a conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) socket.join(`conv_${conversationId}`);
    });

    // Staff joins staff room to receive all new-conversation notifications
    socket.on('join_staff', (token) => {
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          const role = String(payload.role || '').toUpperCase();
          if (['ADMIN', 'MANAGER', 'STAFF'].includes(role)) {
            socket.join('staff_room');
          }
        } catch (_) { /* ignore */ }
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) socket.leave(`conv_${conversationId}`);
    });
  });
} catch (e) {
  console.warn('socket.io not available, running without realtime:', e.message);
}

connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
