/**
 * Entry point — Portfolio Backend
 * Đinh Hoàng Trung Khánh
 */

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const { initDb }          = require('./src/db/init');
const { applyMiddleware } = require('./src/middleware/setup');
const publicRoutes        = require('./src/routes/public');
const adminRoutes         = require('./src/routes/admin');
const { PORT, PUBLIC_DIR } = require('./src/config');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────
applyMiddleware(app);

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api',       publicRoutes);
app.use('/api/admin', adminRoutes);

// ─── SPA fallback ─────────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
  const indexFile = path.join(PUBLIC_DIR, 'index.html');
  fs.existsSync(indexFile)
    ? res.sendFile(indexFile)
    : res.status(404).json({ message: 'Not found' });
});

// ─── Start ────────────────────────────────────────────────────────
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Portfolio:  http://localhost:${PORT}`);
      console.log(`📊 Admin:      http://localhost:${PORT}/admin.html`);
      console.log(`🗄️  Database:   ${require('./src/config').DB.PATH}\n`);
    });
  })
  .catch((err) => {
    console.error('Lỗi khởi động:', err);
    process.exit(1);
  });

module.exports = app;