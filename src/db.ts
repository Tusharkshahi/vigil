import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DATA_DIR = path.resolve('data');
const DB_PATH = path.join(DATA_DIR, 'vigil.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS releases (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      package     TEXT    NOT NULL,
      version     TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      title       TEXT,
      body        TEXT,
      url         TEXT,
      source      TEXT    NOT NULL DEFAULT 'github',
      scraped_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(package, version)
    );

    CREATE TABLE IF NOT EXISTS change_reports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      package     TEXT    NOT NULL,
      version     TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      url         TEXT,
      breaking    TEXT    NOT NULL DEFAULT '[]',
      deprecated  TEXT    NOT NULL DEFAULT '[]',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS heal_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      collector_id  TEXT    NOT NULL,
      prompt        TEXT    NOT NULL,
      timestamp     TEXT    NOT NULL,
      success       INTEGER NOT NULL DEFAULT 0,
      attempt       INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS scraper_status (
      collector_id      TEXT PRIMARY KEY,
      name              TEXT NOT NULL,
      healthy           INTEGER NOT NULL DEFAULT 1,
      last_run          TEXT,
      last_heal         TEXT,
      validation_errors TEXT  NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      packages        TEXT    NOT NULL,
      slack_webhook   TEXT,
      discord_webhook TEXT,
      email           TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
