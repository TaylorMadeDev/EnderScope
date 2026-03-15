import mysql from 'mysql2/promise';
import { config } from '../config.js';

let pool = null;

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
