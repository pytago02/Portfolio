/**
 * Middleware xác thực admin qua Bearer token.
 */

const { dbGet, dbRun } = require('../db');
const { now }          = require('../utils/helpers');

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '')
    .replace('Bearer ', '')
    .trim();

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token required.' });
  }

  const row = dbGet('SELECT id FROM admin_tokens WHERE token = ?', [token]);
  if (!row) {
    return res.status(403).json({ success: false, message: 'Invalid token.' });
  }

  // Cập nhật lần dùng gần nhất
  dbRun('UPDATE admin_tokens SET last_used = ? WHERE id = ?', [now(), row.id]);

  next();
}

module.exports = { requireAdmin };
