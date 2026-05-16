/**
 * Route công khai:
 *   POST /api/contact   — gửi form liên hệ
 *   POST /api/pageview  — ghi nhận lượt xem trang
 */

const express = require('express');
const router  = express.Router();

const { dbRun }                    = require('../db');
const { contactLimiter, apiLimiter } = require('../middleware/limiter');
const { getIP, isEmail, san, now } = require('../utils/helpers');

// ─── POST /api/contact ────────────────────────────────────────────
router.post('/contact', contactLimiter, (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validation
  const errors = {};
  if (!name    || san(name).length < 2)     errors.name    = 'Tên phải có ít nhất 2 ký tự.';
  if (!email   || !isEmail(email))          errors.email   = 'Email không hợp lệ.';
  if (!message || san(message).length < 10) errors.message = 'Tin nhắn phải có ít nhất 10 ký tự.';

  if (Object.keys(errors).length) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    const result = dbRun(
      `INSERT INTO contacts (name, email, subject, message, ip, user_agent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        san(name),
        san(email).toLowerCase(),
        san(subject) || null,
        san(message),
        getIP(req),
        req.headers['user-agent'] || null,
        now(),
        now(),
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã liên hệ! Tôi sẽ phản hồi trong 24–48 giờ.',
      id:      result.lastInsertRowid,
    });
  } catch (err) {
    console.error('[Contact Error]', err);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại.' });
  }
});

// ─── POST /api/pageview ───────────────────────────────────────────
router.post('/pageview', apiLimiter, (req, res) => {
  try {
    dbRun(
      `INSERT INTO page_views (page, referrer, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        san(req.body.page) || '/',
        san(req.body.referrer) || null,
        getIP(req),
        req.headers['user-agent'] || null,
        now(),
      ]
    );
  } catch { /* bỏ qua lỗi ghi page view */ }

  res.json({ success: true });
});

module.exports = router;
