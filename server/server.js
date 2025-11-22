const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/documents');
const Document = require('./models/document');
const { verifySocketJWT } = require('./utils/socketAuth');

const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/realtime_collab';
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_secret';

mongoose.connect(MONGO_URI).then(()=>console.log('Mongo connected')).catch(e=>console.error(e));

const docRooms = {};

io.use(async (socket, next) => {
  try {
    await verifySocketJWT(socket, JWT_SECRET);
    next();
  } catch (err) {
    console.log('Socket auth error', err.message);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  console.log('socket connected', socket.id, 'user', user && user.username);

  socket.on('join-document', async ({ docId }) => {
    if (!docId) return;
    try {
      const doc = await Document.findById(docId);
      if (!doc) {
        socket.emit('error', { message: 'Document not found' });
        return;
      }

      let role = 'viewer';
      if (String(doc.ownerId) === user.id) role = 'owner';
      else {
        const coll = doc.collaborators.find(c => String(c.userId) === user.id);
        if (coll) role = coll.role || 'collaborator';
      }

      socket.join(docId);
      docRooms[docId] = docRooms[docId] || {};
      docRooms[docId][socket.id] = { userId: user.id, username: user.username, role };

      socket.roleMap = socket.roleMap || {};
      socket.roleMap[docId] = role;

      socket.emit('document-load', { content: doc.content, title: doc.title, ownerId: doc.ownerId, collaborators: doc.collaborators });

      io.to(docId).emit('active-users', Object.values(docRooms[docId]));
    } catch (e) { console.error(e); socket.emit('error', { message: 'Server error' }); }
  });

  socket.on('leave-document', ({ docId }) => {
    socket.leave(docId);
    if (docId && docRooms[docId]) {
      delete docRooms[docId][socket.id];
      io.to(docId).emit('active-users', Object.values(docRooms[docId]));
    }
    if (socket.roleMap) delete socket.roleMap[docId];
  });

  socket.on('content-change', async ({ docId, content }) => {
    try {
      const role = socket.roleMap && socket.roleMap[docId];
      if (!role) return;
      if (role === 'viewer') return;
      socket.to(docId).emit('content-change', { content, user: socket.user.username });
    } catch (e) { console.error(e); }
  });

  socket.on('save-document', async ({ docId, content }) => {
    try {
      const role = socket.roleMap && socket.roleMap[docId];
      if (!role) return;
      if (role === 'viewer') return;
      const updated = await Document.findByIdAndUpdate(docId, { content, lastUpdated: Date.now() }, { new: true });
      io.to(docId).emit('document-saved', { docId, lastUpdated: updated.lastUpdated });
    } catch (e) { console.error(e); }
  });

  socket.on('disconnecting', () => {
    const rooms = Object.keys(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach((docId) => {
      if (docRooms[docId]) {
        delete docRooms[docId][socket.id];
        io.to(docId).emit('active-users', Object.values(docRooms[docId]));
      }
    });
  });

});

const PORT = process.env.PORT || 4000;
server.listen(PORT, ()=>console.log('Server running on', PORT));
