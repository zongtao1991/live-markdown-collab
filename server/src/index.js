require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { createTables } = require('./db/schema');
const { setupSocket } = require('./socket');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const versionRoutes = require('./routes/versions');
const commentRoutes = require('./routes/comments');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 7891;

app.use(cors({
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true
}));

app.use(express.json());

createTables();

setupSocket(server);

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/comments', commentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO server ready`);
});
