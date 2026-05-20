const db = require('../db/index');

const getCommentsByDocument = (req, res) => {
  const docId = req.params.documentId;
  const userId = req.user.id;
  
  db.get(
    'SELECT * FROM documents WHERE id = ?',
    [docId],
    (err, doc) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      db.all(
        `SELECT c.*, u.username as author_name 
         FROM comments c 
         JOIN users u ON c.author_id = u.id 
         WHERE c.document_id = ? 
         ORDER BY c.created_at ASC`,
        [docId],
        (err, comments) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(comments);
        }
      );
    }
  );
};

const createComment = (req, res) => {
  const docId = req.params.documentId;
  const { content, start_line, end_line, parent_id } = req.body;
  const userId = req.user.id;
  
  if (!content || start_line === undefined || end_line === undefined) {
    return res.status(400).json({ error: 'Content, start_line and end_line are required' });
  }
  
  db.get(
    'SELECT * FROM documents WHERE id = ?',
    [docId],
    (err, doc) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      db.run(
        'INSERT INTO comments (document_id, author_id, parent_id, content, start_line, end_line) VALUES (?, ?, ?, ?, ?, ?)',
        [docId, userId, parent_id || null, content, start_line, end_line],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create comment' });
          }
          
          const commentId = this.lastID;
          db.get(
            `SELECT c.*, u.username as author_name 
             FROM comments c 
             JOIN users u ON c.author_id = u.id 
             WHERE c.id = ?`,
            [commentId],
            (err, comment) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.status(201).json(comment);
            }
          );
        }
      );
    }
  );
};

const deleteComment = (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;
  
  db.get(
    'SELECT * FROM comments WHERE id = ?',
    [commentId],
    (err, comment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      if (comment.author_id !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }
      
      db.run('DELETE FROM comments WHERE id = ?', [commentId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete comment' });
        }
        res.json({ message: 'Comment deleted successfully' });
      });
    }
  );
};

module.exports = {
  getCommentsByDocument,
  createComment,
  deleteComment
};
