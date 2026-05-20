const db = require('../db/index');
const { verifySocketToken } = require('../middleware/auth');

const socketUsers = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    const token = socket.handshake.auth.token;
    let currentUser = null;

    try {
      currentUser = await verifySocketToken(token);
      socketUsers.set(socket.id, currentUser);
      console.log(`User ${currentUser.username} connected with socket id: ${socket.id}`);
    } catch (err) {
      console.log('Authentication failed for socket connection');
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect();
      return;
    }

    socket.on('join:document', async (documentId) => {
      const room = `document:${documentId}`;
      socket.join(room);
      
      const roomSockets = io.sockets.adapter.rooms.get(room);
      const usersInRoom = [];
      
      if (roomSockets) {
        for (const socketId of roomSockets) {
          const user = socketUsers.get(socketId);
          if (user) {
            usersInRoom.push({ ...user, socketId });
          }
        }
      }
      
      socket.emit('joined:document', { documentId, users: usersInRoom });
      socket.to(room).emit('user:joined', { user: currentUser, socketId: socket.id });
      
      console.log(`User ${currentUser.username} joined document ${documentId}`);
    });

    socket.on('leave:document', (documentId) => {
      const room = `document:${documentId}`;
      socket.leave(room);
      
      socket.emit('left:document', { documentId });
      socket.to(room).emit('user:left', { user: currentUser, socketId: socket.id });
      
      console.log(`User ${currentUser.username} left document ${documentId}`);
    });

    socket.on('content:change', async (data) => {
      const { documentId, delta, content } = data;
      const room = `document:${documentId}`;
      
      try {
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE documents SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [content, documentId],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        
        socket.to(room).emit('content:updated', {
          delta,
          content,
          userId: currentUser.id,
          username: currentUser.username
        });
        
        console.log(`User ${currentUser.username} updated document ${documentId}`);
      } catch (err) {
        console.error('Error updating document content:', err);
        socket.emit('error', { message: 'Failed to update document' });
      }
    });

    socket.on('cursor:move', (data) => {
      const { documentId, position } = data;
      const room = `document:${documentId}`;
      
      socket.to(room).emit('cursor:moved', {
        position,
        userId: currentUser.id,
        username: currentUser.username,
        socketId: socket.id
      });
    });

    socket.on('comment:add', async (data) => {
      const { documentId, content, start_line, end_line, parent_id } = data;
      const room = `document:${documentId}`;
      
      try {
        const result = await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO comments (document_id, author_id, parent_id, content, start_line, end_line) VALUES (?, ?, ?, ?, ?, ?)',
            [documentId, currentUser.id, parent_id || null, content, start_line, end_line],
            function(err) {
              if (err) reject(err);
              else resolve({ lastID: this.lastID });
            }
          );
        });
        
        const comment = await new Promise((resolve, reject) => {
          db.get(
            `SELECT c.*, u.username as author_name 
             FROM comments c 
             JOIN users u ON c.author_id = u.id 
             WHERE c.id = ?`,
            [result.lastID],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });
        
        io.to(room).emit('comment:added', comment);
        
        console.log(`User ${currentUser.username} added comment to document ${documentId}`);
      } catch (err) {
        console.error('Error adding comment:', err);
        socket.emit('error', { message: 'Failed to add comment' });
      }
    });

    socket.on('version:save', async (data) => {
      const { documentId, content } = data;
      const room = `document:${documentId}`;
      
      try {
        const result = await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO versions (document_id, content, created_by) VALUES (?, ?, ?)',
            [documentId, content, currentUser.id],
            function(err) {
              if (err) reject(err);
              else resolve({ lastID: this.lastID });
            }
          );
        });
        
        const version = await new Promise((resolve, reject) => {
          db.get(
            `SELECT v.*, u.username as created_by_name 
             FROM versions v 
             JOIN users u ON v.created_by = u.id 
             WHERE v.id = ?`,
            [result.lastID],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });
        
        io.to(room).emit('version:saved', version);
        
        console.log(`User ${currentUser.username} saved version for document ${documentId}`);
      } catch (err) {
        console.error('Error saving version:', err);
        socket.emit('error', { message: 'Failed to save version' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${currentUser?.username} disconnected`);
      socketUsers.delete(socket.id);
    });
  });
};

module.exports = { setupSocketHandlers };
