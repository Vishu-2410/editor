const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_secret';

async function verifySocketJWT(socket, jwtSecret) {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) throw new Error('No token');
  const decoded = jwt.verify(token, jwtSecret || JWT_SECRET);
  socket.user = { id: decoded.id, username: decoded.username };
}

module.exports = { verifySocketJWT };
