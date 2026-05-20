const db = require('../db/index');

const createDocument = (req, res) => {
  const { title } = req.body;
  const userId = req.user.id;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  db.run(
    'INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)',
    [title, '', userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create document' });
      }
      
      const docId = this.lastID;
      db.get(
        `SELECT d.*, u.username as owner_name 
         FROM documents d 
         JOIN users u ON d.owner_id = u.id 
         WHERE d.id = ?`,
        [docId],
        (err, doc) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json(doc);
        }
      );
    }
  );
};

const getDocuments = (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT d.*, u.username as owner_name 
     FROM documents d 
     JOIN users u ON d.owner_id = u.id 
     WHERE d.owner_id = ? 
     ORDER BY d.updated_at DESC`,
    [userId],
    (err, docs) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(docs);
    }
  );
};

const getDocumentById = (req, res) => {
  const docId = req.params.id;
  
  db.get(
    `SELECT d.*, u.username as owner_name 
     FROM documents d 
     JOIN users u ON d.owner_id = u.id 
     WHERE d.id = ?`,
    [docId],
    (err, doc) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json(doc);
    }
  );
};

const updateDocument = (req, res) => {
  const docId = req.params.id;
  const { title, content } = req.body;
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
      if (doc.owner_id !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this document' });
      }
      
      const newTitle = title !== undefined ? title : doc.title;
      const newContent = content !== undefined ? content : doc.content;
      
      db.run(
        'UPDATE documents SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newTitle, newContent, docId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update document' });
          }
          
          db.get(
            `SELECT d.*, u.username as owner_name 
             FROM documents d 
             JOIN users u ON d.owner_id = u.id 
             WHERE d.id = ?`,
            [docId],
            (err, updatedDoc) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.json(updatedDoc);
            }
          );
        }
      );
    }
  );
};

const deleteDocument = (req, res) => {
  const docId = req.params.id;
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
      if (doc.owner_id !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this document' });
      }
      
      db.run('DELETE FROM documents WHERE id = ?', [docId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete document' });
        }
        res.json({ message: 'Document deleted successfully' });
      });
    }
  );
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
};
