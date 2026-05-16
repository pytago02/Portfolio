/**
 * Cấu hình trung tâm của ứng dụng
 */

const path = require('path');

module.exports = {
  PORT: process.env.PORT || 3000,

  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || '*',

  DB: {
    DIR:  path.join(__dirname, '..', '..', 'data'),
    PATH: path.join(__dirname, '..', '..', 'data', 'portfolio.db'),
  },

  PUBLIC_DIR: path.join(__dirname, '..', '..', 'public'),

  RATE_LIMIT: {
    CONTACT: { windowMs: 15 * 60 * 1000, max: 5 },
    API:     { windowMs: 60 * 1000,       max: 60 },
  },

  CONTACT_STATUSES: ['unread', 'read', 'replied', 'archived'],
};
