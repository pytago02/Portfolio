/**
 * Content routes:
 *   GET  /api/content              — public: lấy toàn bộ nội dung portfolio
 *   GET  /api/content/:key         — public: lấy 1 section
 *   GET  /api/admin/content        — admin: lấy toàn bộ (giống public)
 *   PUT  /api/admin/content/:key   — admin: cập nhật 1 section
 *   POST /api/admin/content/reset/:key — admin: reset về mặc định
 */

const express = require('express');
const router  = express.Router();

const { dbGet, dbRun, dbAll } = require('../db');
const { requireAdmin }        = require('../middleware/auth');
const { now }                 = require('../utils/helpers');
const DEFAULT_CONTENT         = require('../db/defaultContent');

const VALID_KEYS = ['profile', 'skills', 'experience', 'projects'];

// ─── Helper: đọc tất cả content từ DB ────────────────────────────
function getAllContent() {
  const rows = dbAll('SELECT key, value FROM portfolio_content');
  const result = {};
  for (const row of rows) {
    try { result[row.key] = JSON.parse(row.value); }
    catch { result[row.key] = row.value; }
  }
  return result;
}

// ─── PUBLIC: GET /api/content ─────────────────────────────────────
router.get('/', (req, res) => {
  res.json({ success: true, data: getAllContent() });
});

// ─── PUBLIC: GET /api/content/:key ───────────────────────────────
router.get('/:key', (req, res) => {
  if (!VALID_KEYS.includes(req.params.key)) {
    return res.status(404).json({ success: false, message: 'Section not found.' });
  }
  const row = dbGet('SELECT value FROM portfolio_content WHERE key = ?', [req.params.key]);
  if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
  try {
    res.json({ success: true, data: JSON.parse(row.value) });
  } catch {
    res.json({ success: true, data: row.value });
  }
});

// ─── ADMIN: GET /api/admin/content ───────────────────────────────
router.get('/admin/all', requireAdmin, (req, res) => {
  res.json({ success: true, data: getAllContent() });
});

// ─── ADMIN: PUT /api/admin/content/:key ──────────────────────────
router.put('/admin/:key', requireAdmin, (req, res) => {
  const { key } = req.params;
  if (!VALID_KEYS.includes(key)) {
    return res.status(400).json({ success: false, message: `Key không hợp lệ. Chỉ chấp nhận: ${VALID_KEYS.join(', ')}` });
  }

  const value = req.body.value;
  if (value === undefined) {
    return res.status(400).json({ success: false, message: 'Thiếu trường "value".' });
  }

  // Validate cơ bản theo từng section
  try {
    const err = validateSection(key, value);
    if (err) return res.status(400).json({ success: false, message: err });
  } catch {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
  }

  const jsonStr = JSON.stringify(value);
  const exists  = dbGet('SELECT key FROM portfolio_content WHERE key = ?', [key]);

  if (exists) {
    dbRun('UPDATE portfolio_content SET value = ?, updated_at = ? WHERE key = ?', [jsonStr, now(), key]);
  } else {
    dbRun('INSERT INTO portfolio_content (key, value, updated_at) VALUES (?, ?, ?)', [key, jsonStr, now()]);
  }

  res.json({ success: true, message: `Section "${key}" đã được cập nhật.`, data: value });
});

// ─── ADMIN: POST /api/admin/content/reset/:key ───────────────────
router.post('/admin/reset/:key', requireAdmin, (req, res) => {
  const { key } = req.params;
  if (!VALID_KEYS.includes(key)) {
    return res.status(400).json({ success: false, message: 'Key không hợp lệ.' });
  }

  const defaultValue = DEFAULT_CONTENT[key];
  dbRun('UPDATE portfolio_content SET value = ?, updated_at = ? WHERE key = ?',
    [JSON.stringify(defaultValue), now(), key]);

  res.json({ success: true, message: `Section "${key}" đã được reset về mặc định.`, data: defaultValue });
});

// ─── Validation ───────────────────────────────────────────────────
function validateSection(key, value) {
  if (key === 'profile') {
    if (typeof value !== 'object' || Array.isArray(value)) return 'profile phải là object.';
    if (!value.name) return 'Thiếu trường "name".';
    if (!value.email) return 'Thiếu trường "email".';
  }
  if (key === 'skills' || key === 'experience' || key === 'projects') {
    if (!Array.isArray(value)) return `${key} phải là array.`;
    if (value.length === 0) return `${key} không được rỗng.`;
  }
  return null;
}

module.exports = router;