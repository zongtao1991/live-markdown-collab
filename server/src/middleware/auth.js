const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const verifySocketToken = (token) => {
  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(new Error('Token required'));
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return reject(err);
      }
      resolve(user);
    });
  });
};

module.exports = { authenticateToken, verifySocketToken };
