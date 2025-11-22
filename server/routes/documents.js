const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const Document = require('../models/document');
const User = require('../models/user');

// Create document
router.post('/', auth, async (req, res) => {
  const { title, content } = req.body;
  try {
    const doc = await Document.create({ title: title||'Untitled', content: content||'', ownerId: req.user.id, collaborators: [] });
    res.json(doc);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// Get all documents for user (owner or collaborator)
router.get('/', auth, async (req, res) => {
  try {
    const docs = await Document.find({ $or: [{ ownerId: req.user.id }, { 'collaborators.userId': req.user.id }] }).sort({ updatedAt: -1 });
    res.json(docs);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// Get single doc (include role info)
router.get('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    let role = 'viewer';
    if (String(doc.ownerId) === req.user.id) role = 'owner';
    else {
      const coll = doc.collaborators.find(c => String(c.userId) === req.user.id);
      if (coll) role = coll.role || 'collaborator';
    }

    res.json({ doc, role });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// Update content (owner or collaborator)
router.put('/:id/content', auth, checkPermission, async (req, res) => {
  try {
    if (req.role === 'viewer') return res.status(403).json({ message: 'No edit permission' });
    req.document.content = req.body.content;
    req.document.lastUpdated = Date.now();
    await req.document.save();
    res.json(req.document);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// Update title (owner only)
router.put('/:id/title', auth, checkPermission, async (req, res) => {
  try {
    if (req.role !== 'owner') return res.status(403).json({ message: 'Only owner can rename document' });
    req.document.title = req.body.title;
    await req.document.save();
    res.json(req.document);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// Add collaborator by email (owner only)
router.post('/:id/collaborators', auth, checkPermission, async (req, res) => {
  try {
    if (req.role !== 'owner') return res.status(403).json({ message: 'Only owner can add collaborators' });
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (String(user._id) === String(req.document.ownerId)) return res.status(400).json({ message: 'Owner cannot be added as collaborator' });

    const exists = req.document.collaborators.find(c => String(c.userId) === String(user._id));
    if (exists) {
      exists.role = role || exists.role;
    } else {
      req.document.collaborators.push({ userId: user._id, role: role || 'collaborator' });
    }
    await req.document.save();
    res.json(req.document);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// Remove collaborator (owner only)
router.delete('/:id/collaborators/:collabId', auth, checkPermission, async (req, res) => {
  try {
    if (req.role !== 'owner') return res.status(403).json({ message: 'Only owner can remove collaborators' });
    const collabId = req.params.collabId;
    req.document.collaborators = req.document.collaborators.filter(c => String(c.userId) !== collabId);
    await req.document.save();
    res.json(req.document);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// Delete (owner only)
router.delete('/:id', auth, checkPermission, async (req, res) => {
  try {
    if (req.role !== 'owner') return res.status(403).json({ message: 'Only owner can delete the document' });
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
