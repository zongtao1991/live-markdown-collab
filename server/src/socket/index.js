const { Server } = require('socket.io');
const { setupSocketHandlers } = require('./handlers');

const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5174', 'http://127.0.0.1:5174'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  setupSocketHandlers(io);

  return io;
};

module.exports = { setupSocket };
