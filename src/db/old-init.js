/**
 * Khởi tạo database: tạo bảng, index, và admin token mặc định.
 */

const fs     = require('fs');
const crypto = require('crypto');
const initSqlJs = require('sql.js');

const { DB }               = require('../config');
const { setDb, loadDb, dbRun, dbGet, getDb } = require('./index');
const { now }              = require('../utils/helpers');

async function initDb() {
  // Đảm bảo thư mục data tồn tại
  if (!fs.existsSync(DB.DIR)) fs.mkdirSync(DB.DIR, { recursive: true });

  const SQL = await initSqlJs();
  const instance = loadDb(SQL);
  setDb(instance);

  const db = getDb();

  // ─── Tạo bảng ───────────────────────────────────────────────────
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

  db.run(`CREATE TABLE IF NOT EXISTS page_views (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    page       TEXT NOT NULL,
    referrer   TEXT,
    ip         TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admin_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    token      TEXT NOT NULL UNIQUE,
    label      TEXT,
    last_used  TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_c_status  ON contacts(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_c_created ON contacts(created_at)`);

  // Lưu ngay sau khi tạo schema
  const { saveDb } = require('./index');
  saveDb();

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
