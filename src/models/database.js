// src/models/database.js
// Uses the "sqlite3" package — pure JavaScript, no C++ compilation needed.
// Wraps the callback-based sqlite3 API in Promises for clean async/await usage.

const sqlite3 = require("sqlite3").verbose();
const path    = require("path");

const DB_PATH = process.env.DB_PATH || "./finance.db";

let db;

function getDB() {
  if (!db) {
    db = new sqlite3.Database(path.resolve(DB_PATH), (err) => {
      if (err) throw new Error("Could not open database: " + err.message);
    });
    db.serialize(() => {
      db.run("PRAGMA journal_mode = WAL");
      db.run("PRAGMA foreign_keys = ON");
    });
  }
  return db;
}

// ─── Promise Wrappers ────────────────────────────────────────────────────────
// sqlite3 uses callbacks; these wrappers let us use async/await throughout.

/** Run INSERT / UPDATE / DELETE — resolves with { lastID, changes } */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDB().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/** Fetch one row — resolves with the row object or undefined */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDB().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

/** Fetch all matching rows — resolves with an array */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/** Execute a multi-statement SQL string (used for schema setup) */
function exec(sql) {
  return new Promise((resolve, reject) => {
    getDB().exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// ─── Schema Initialization ───────────────────────────────────────────────────

async function initializeSchema() {
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'viewer'
                          CHECK(role IN ('admin', 'analyst', 'viewer')),
      status      TEXT    NOT NULL DEFAULT 'active'
                          CHECK(status IN ('active', 'inactive')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount      REAL    NOT NULL CHECK(amount > 0),
      type        TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
      category    TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      notes       TEXT,
      is_deleted  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_records_user_id  ON financial_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_records_type     ON financial_records(type);
    CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category);
    CREATE INDEX IF NOT EXISTS idx_records_date     ON financial_records(date);
  `);
}

module.exports = { getDB, run, get, all, exec, initializeSchema };
