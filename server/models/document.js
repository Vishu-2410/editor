const mongoose = require('mongoose');
const { Schema } = mongoose;

const collaboratorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['owner','collaborator','viewer'], default: 'collaborator' }
}, { _id: false });

const docSchema = new Schema({
  title: { type: String, default: 'Untitled Document' },
  content: { type: String, default: '' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [collaboratorSchema],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Document', docSchema);
