const Document = require('../models/document');

module.exports = async function checkPermission(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    let role = 'viewer';
    if (String(doc.ownerId) === userId) role = 'owner';
    else {
      const coll = doc.collaborators.find(c => String(c.userId) === userId);
      if (coll) role = coll.role || 'collaborator';
    }

    req.role = role;
    req.document = doc;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
