/**
 * Cấu hình rate limiter cho các nhóm route khác nhau.
 */

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config');

/** Giới hạn gửi form liên hệ: 5 lần / 15 phút */
const contactLimiter = rateLimit({
  windowMs: RATE_LIMIT.CONTACT.windowMs,
  max:      RATE_LIMIT.CONTACT.max,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.',
  },
});

/** Giới hạn chung cho API: 60 lần / phút */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.API.windowMs,
  max:      RATE_LIMIT.API.max,
});

module.exports = { contactLimiter, apiLimiter };
