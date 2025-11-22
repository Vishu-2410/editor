const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_secret';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'No token' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
module.exports = auth;
