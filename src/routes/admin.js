/**
 * Route admin (yêu cầu Bearer token):
 *   GET    /api/admin/contacts        — danh sách contacts (lọc, phân trang, tìm kiếm)
 *   GET    /api/admin/contacts/:id    — chi tiết 1 contact (tự đánh dấu "read")
 *   PATCH  /api/admin/contacts/:id    — cập nhật status
 *   DELETE /api/admin/contacts/:id    — xoá contact
 *   GET    /api/admin/stats           — thống kê tổng quan
 *   GET    /api/admin/export          — xuất toàn bộ contacts ra CSV
 */

const express = require('express');
const router  = express.Router();

const { dbRun, dbGet, dbAll } = require('../db');
const { requireAdmin }        = require('../middleware/auth');
const { now }                 = require('../utils/helpers');
const { CONTACT_STATUSES }    = require('../config');

// Áp dụng auth cho toàn bộ admin router
router.use(requireAdmin);

// ─── GET /api/admin/contacts ──────────────────────────────────────
router.get('/contacts', (req, res) => {
  const { status, page = 1, limit = 20, q } = req.query;

  let where = 'WHERE 1=1';
  const params = [];
  const countParams = [];

  if (status && CONTACT_STATUSES.includes(status)) {
    where += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }

  if (q) {
    where += ' AND (name LIKE ? OR email LIKE ? OR message LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
    countParams.push(like, like, like);
  }

  const offset     = (parseInt(page) - 1) * parseInt(limit);
  const total      = dbGet(`SELECT COUNT(*) as n FROM contacts ${where}`, countParams)?.n || 0;
  const rows       = dbAll(
    `SELECT id, name, email, subject, message, status, created_at
     FROM contacts ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const unreadCount = dbGet(`SELECT COUNT(*) as n FROM contacts WHERE status = 'unread'`)?.n || 0;

  res.json({
    success: true,
    data:    rows,
    pagination: {
      total,
      page:  parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
    unreadCount,
  });
});

// ─── GET /api/admin/contacts/:id ─────────────────────────────────
router.get('/contacts/:id', (req, res) => {
  const row = dbGet('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ success: false, message: 'Not found.' });

  // Tự đánh dấu "read" khi admin mở lần đầu
  if (row.status === 'unread') {
    dbRun(`UPDATE contacts SET status = 'read', updated_at = ? WHERE id = ?`, [now(), row.id]);
    row.status = 'read';
  }

  res.json({ success: true, data: row });
});

// ─── PATCH /api/admin/contacts/:id ───────────────────────────────
router.patch('/contacts/:id', (req, res) => {
  const { status } = req.body;

  if (!CONTACT_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  if (!dbGet('SELECT id FROM contacts WHERE id = ?', [req.params.id])) {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }

  dbRun(
    `UPDATE contacts SET status = ?, updated_at = ? WHERE id = ?`,
    [status, now(), req.params.id]
  );

  res.json({ success: true, message: `Status updated to "${status}".` });
});

// ─── DELETE /api/admin/contacts/:id ──────────────────────────────
router.delete('/contacts/:id', (req, res) => {
  if (!dbGet('SELECT id FROM contacts WHERE id = ?', [req.params.id])) {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }

  dbRun('DELETE FROM contacts WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Deleted.' });
});

// ─── GET /api/admin/stats ─────────────────────────────────────────
router.get('/stats', (req, res) => {
  const today  = now().slice(0, 10);
  const week7  = new Date(Date.now() - 7  * 864e5).toISOString().slice(0, 10);
  const day30  = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  const contacts = {
    total:    dbGet(`SELECT COUNT(*) as n FROM contacts`)?.n || 0,
    unread:   dbGet(`SELECT COUNT(*) as n FROM contacts WHERE status = 'unread'`)?.n || 0,
    read:     dbGet(`SELECT COUNT(*) as n FROM contacts WHERE status = 'read'`)?.n || 0,
    replied:  dbGet(`SELECT COUNT(*) as n FROM contacts WHERE status = 'replied'`)?.n || 0,
    archived: dbGet(`SELECT COUNT(*) as n FROM contacts WHERE status = 'archived'`)?.n || 0,
    today:    dbGet(`SELECT COUNT(*) as n FROM contacts WHERE created_at >= ?`, [today + ' 00:00:00'])?.n || 0,
    thisWeek: dbGet(`SELECT COUNT(*) as n FROM contacts WHERE created_at >= ?`, [week7 + ' 00:00:00'])?.n || 0,
  };

  const views = {
    total:    dbGet(`SELECT COUNT(*) as n FROM page_views`)?.n || 0,
    today:    dbGet(`SELECT COUNT(*) as n FROM page_views WHERE created_at >= ?`, [today + ' 00:00:00'])?.n || 0,
    thisWeek: dbGet(`SELECT COUNT(*) as n FROM page_views WHERE created_at >= ?`, [week7 + ' 00:00:00'])?.n || 0,
  };

  const viewsChart = dbAll(
    `SELECT substr(created_at, 1, 10) as date, COUNT(*) as views
     FROM page_views
     WHERE created_at >= ?
     GROUP BY substr(created_at, 1, 10)
     ORDER BY date ASC`,
    [day30 + ' 00:00:00']
  );

  const recentContacts = dbAll(
    `SELECT id, name, email, subject, status, created_at
     FROM contacts
     ORDER BY created_at DESC
     LIMIT 5`
  );

  res.json({
    success: true,
    data:    { contacts, views, viewsChart, recentContacts },
  });
});

// ─── GET /api/admin/export ────────────────────────────────────────
router.get('/export', (req, res) => {
  const rows = dbAll(
    `SELECT id, name, email, subject, message, status, ip, created_at
     FROM contacts
     ORDER BY created_at DESC`
  );

  const escape = (val) =>
    `"${String(val || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

  const csv = [
    'ID,Name,Email,Subject,Message,Status,IP,Created At',
    ...rows.map((r) =>
      [r.id, escape(r.name), escape(r.email), escape(r.subject), escape(r.message),
       r.status, r.ip || '', r.created_at].join(',')
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
  res.send('\uFEFF' + csv); // BOM cho Excel đọc đúng UTF-8
});

module.exports = router;
