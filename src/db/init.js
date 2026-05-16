/**
 * Khởi tạo database: tạo bảng, index, admin token và dữ liệu portfolio mặc định.
 */

const fs        = require('fs');
const crypto    = require('crypto');
const initSqlJs = require('sql.js');

const { DB }                             = require('../config');
const { setDb, loadDb, dbRun, dbGet, getDb } = require('./index');
const { now }                            = require('../utils/helpers');
const DEFAULT_CONTENT                    = require('./defaultContent');

async function initDb() {
  if (!fs.existsSync(DB.DIR)) fs.mkdirSync(DB.DIR, { recursive: true });

  const SQL      = await initSqlJs();
  const instance = loadDb(SQL);
  setDb(instance);

  const db = getDb();

  // ─── Bảng contacts ──────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT,
    message    TEXT NOT NULL,
    ip         TEXT,
    user_agent TEXT,
    status     TEXT DEFAULT 'unread',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  // ─── Bảng page_views ────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS page_views (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    page       TEXT NOT NULL,
    referrer   TEXT,
    ip         TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  // ─── Bảng admin_tokens ──────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS admin_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    token      TEXT NOT NULL UNIQUE,
    label      TEXT,
    last_used  TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  // ─── Bảng portfolio_content (key → JSON value) ──────────────────
  // Mỗi row là một section: profile | skills | experience | projects
  db.run(`CREATE TABLE IF NOT EXISTS portfolio_content (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_c_status  ON contacts(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_c_created ON contacts(created_at)`);

  const { saveDb } = require('./index');
  saveDb();

  // ─── Seed nội dung portfolio mặc định nếu chưa có ───────────────
  for (const [key, value] of Object.entries(DEFAULT_CONTENT)) {
    const exists = dbGet('SELECT key FROM portfolio_content WHERE key = ?', [key]);
    if (!exists) {
      dbRun(
        'INSERT INTO portfolio_content (key, value, updated_at) VALUES (?, ?, ?)',
        [key, JSON.stringify(value), now()]
      );
    }
  }

  // ─── Tạo admin token nếu chưa có ────────────────────────────────
  const existing = dbGet('SELECT id FROM admin_tokens LIMIT 1');
  if (!existing) {
    const token = 'admin_' + crypto.randomBytes(24).toString('hex');
    dbRun('INSERT INTO admin_tokens (token, label) VALUES (?, ?)', [token, 'Default Token']);
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  ADMIN TOKEN — Lưu lại ngay, chỉ hiển thị một lần!      ║');
    console.log(`║  ${token}  ║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');
  }
}

module.exports = { initDb };