/**
 * Các hàm tiện ích dùng chung
 */

/** Lấy IP thực của client (hỗ trợ proxy) */
const getIP = (req) =>
  (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();

/** Kiểm tra định dạng email hợp lệ */
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Sanitize chuỗi: trim + xoá HTML tag */
const san = (s) => (s ? String(s).trim().replace(/<[^>]*>/g, '') : '');

/** Trả về timestamp hiện tại dạng "YYYY-MM-DD HH:mm:ss" */
const now = () =>
  new Date().toISOString().replace('T', ' ').slice(0, 19);

module.exports = { getIP, isEmail, san, now };
