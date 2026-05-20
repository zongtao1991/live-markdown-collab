const db = require('../db/index');

const getVersionsByDocument = (req, res) => {
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
        `SELECT v.*, u.username as created_by_name 
         FROM versions v 
         JOIN users u ON v.created_by = u.id 
         WHERE v.document_id = ? 
         ORDER BY v.created_at DESC`,
        [docId],
        (err, versions) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(versions);
        }
      );
    }
  );
};

const getVersionById = (req, res) => {
  const versionId = req.params.id;
  
  db.get(
    `SELECT v.*, u.username as created_by_name 
     FROM versions v 
     JOIN users u ON v.created_by = u.id 
     WHERE v.id = ?`,
    [versionId],
    (err, version) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }
      res.json(version);
    }
  );
};

module.exports = {
  getVersionsByDocument,
  getVersionById
};
