const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/index');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const register = (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        const token = jwt.sign(
          { id: this.lastID, username },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, username }
        });
      }
    );
  });
};

const login = (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username }
    });
  });
};

const getCurrentUser = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getCurrentUser };
