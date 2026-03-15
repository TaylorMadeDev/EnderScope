import mysql from 'mysql2/promise';
import { config } from '../config.js';

let pool = null;

function getDatabaseName() {
  if (config.db.url) {
    const url = new URL(config.db.url);
    return url.pathname.replace(/^\//, '');
  }

  return config.db.name;
}

function getSslConfig() {
  const mode = String(config.db.ssl || '').toLowerCase();

  if (!mode || mode === 'false' || mode === 'off' || mode === '0') {
    return undefined;
  }

  if (mode === 'skip-verify') {
    return { minVersion: 'TLSv1.2', rejectUnauthorized: false };
  }

  if (config.db.ca) {
    return {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
      ca: config.db.ca,
    };
  }

  return { minVersion: 'TLSv1.2', rejectUnauthorized: true };
}

function buildPoolOptions() {
  const ssl = getSslConfig();

  if (config.db.url) {
    const url = new URL(config.db.url);
    const options = {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      connectTimeout: 10000,
    };

    if (ssl) {
      options.ssl = ssl;
    }

    return options;
  }

  const options = {
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.pass,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    connectTimeout: 10000,
  };

  if (ssl) {
    options.ssl = ssl;
  }

  return options;
}

export function getDb() {
  if (!pool) {
    pool = mysql.createPool(buildPoolOptions());
  }

  return pool;
}

export async function initializeDatabase() {
  const db = getDb();
  const databaseName = getDatabaseName();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) DEFAULT NULL,
      google_id VARCHAR(255) DEFAULT NULL UNIQUE,
      avatar VARCHAR(500) DEFAULT NULL,
      plan VARCHAR(32) NOT NULL DEFAULT 'dirt',
      role VARCHAR(32) NOT NULL DEFAULT 'member',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_google_id (google_id),
      INDEX idx_plan (plan),
      INDEX idx_role (role)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id BIGINT PRIMARY KEY,
      settings_json LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [planColumnRows] = await db.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME IN ('plan', 'role')`,
    [databaseName]
  );

  const existingColumns = new Set(planColumnRows.map((row) => row.COLUMN_NAME));

  if (!existingColumns.has('plan')) {
    await db.execute(
      "ALTER TABLE users ADD COLUMN plan VARCHAR(32) NOT NULL DEFAULT 'dirt' AFTER avatar"
    );
    await db.execute('CREATE INDEX idx_plan ON users (plan)');
  }

  if (!existingColumns.has('role')) {
    await db.execute(
      "ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'member' AFTER plan"
    );
    await db.execute('CREATE INDEX idx_role ON users (role)');
  }

  await db.execute(
    "UPDATE users SET plan = 'dirt' WHERE plan IS NULL OR plan = ''"
  );
  await db.execute(
    "UPDATE users SET role = 'member' WHERE role IS NULL OR role = ''"
  );

  const [adminRows] = await db.execute(
    "SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1"
  );

  if (!adminRows[0]) {
    await db.execute(
      "UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP ORDER BY created_at ASC LIMIT 1"
    );
  }
}
