/**
 * Lớp truy cập database (sql.js wrapper)
 * Cung cấp: dbRun / dbGet / dbAll + save tự động
 */

const fs   = require('fs');
const { DB } = require('../config');

let db; // instance sql.js Database — được gán sau khi initDb() chạy

// ─── Persist ──────────────────────────────────────────────────────

function saveDb() {
  fs.writeFileSync(DB.PATH, Buffer.from(db.export()));
}

function loadDb(SQL) {
  if (fs.existsSync(DB.PATH)) {
    return new SQL.Database(fs.readFileSync(DB.PATH));
  }
  return new SQL.Database();
}

// ─── Query helpers ────────────────────────────────────────────────

/**
 * Chạy câu lệnh INSERT / UPDATE / DELETE, tự lưu DB.
 * @returns {{ lastInsertRowid: number }}
 */
function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDb();
  const r = db.exec('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: r[0]?.values[0][0] };
}

/**
 * Trả về một hàng duy nhất hoặc undefined nếu không tìm thấy.
 */
function dbGet(sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length || !result[0].values.length) return undefined;
  const cols = result[0].columns;
  return Object.fromEntries(cols.map((c, i) => [c, result[0].values[0][i]]));
}

/**
 * Trả về mảng tất cả các hàng.
 */
function dbAll(sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) =>
    Object.fromEntries(cols.map((c, i) => [c, row[i]]))
  );
}

/** Gán instance db từ bên ngoài (dùng sau initDb) */
function setDb(instance) {
  db = instance;
}

/** Lấy instance db hiện tại */
function getDb() {
  return db;
}

module.exports = { dbRun, dbGet, dbAll, setDb, getDb, loadDb, saveDb };
