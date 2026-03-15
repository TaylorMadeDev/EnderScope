import fs from 'node:fs';
import { getDb } from './database.js';
import { config } from '../config.js';

export const defaults = {
  shodan_api_key: '',
  discord_webhook_url: '',
  discord_webhook_username: 'EnderScope',
  discord_webhook_message: 'Potential open server detected.',
  discord_webhook_mentions: '',
  discord_webhook_title: 'New Server Found: {ip}:{port}',
  discord_webhook_description:
    '{motd}\nVersion: {version}\nPlayers: {players_online}/{players_max}\nWhitelist: {whitelist}\nSource: {source}',
  discord_webhook_color: '#8b5cf6',
  mc_version: '1.20',
  shodan_extra_query: 'smp',
  shodan_max_results: 100,
  scan_timeout: 5,
  proxy_list: [],
  bot_accounts: [],
  output_dir: 'backend/data/output',
  theme: 'dark',
  auto_notify_discord: false,
  max_bruteforce_threads: 50,
  whitelist_check_threads: 10,
};

let legacyTemplate = null;
let migrationChecked = false;

function readLegacyTemplate() {
  if (legacyTemplate) {
    return { ...legacyTemplate };
  }

  try {
    const raw = fs.readFileSync(config.paths.configFile, 'utf8');
    legacyTemplate = sanitizeSettings(JSON.parse(raw));
  } catch {
    legacyTemplate = { ...defaults };
  }

  return { ...legacyTemplate };
}

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBotAccount(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const username = String(entry.username || '').trim();
  if (!username) {
    return null;
  }

  return {
    username: username.slice(0, 64),
    password: String(entry.password || '').slice(0, 255),
    premium: Boolean(entry.premium),
  };
}

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .slice(0, 500);
}

export function sanitizeSettings(raw = {}) {
  const next = { ...defaults, ...(raw && typeof raw === 'object' ? raw : {}) };

  return {
    shodan_api_key: String(next.shodan_api_key || '').trim(),
    discord_webhook_url: String(next.discord_webhook_url || '').trim(),
    discord_webhook_username: String(next.discord_webhook_username || defaults.discord_webhook_username).trim().slice(0, 80),
    discord_webhook_message: String(next.discord_webhook_message || '').slice(0, 2000),
    discord_webhook_mentions: String(next.discord_webhook_mentions || '').slice(0, 1000),
    discord_webhook_title: String(next.discord_webhook_title || defaults.discord_webhook_title).slice(0, 256),
    discord_webhook_description: String(next.discord_webhook_description || defaults.discord_webhook_description).slice(0, 4096),
    discord_webhook_color: String(next.discord_webhook_color || defaults.discord_webhook_color).trim(),
    mc_version: String(next.mc_version || defaults.mc_version).trim(),
    shodan_extra_query: String(next.shodan_extra_query || defaults.shodan_extra_query).trim().slice(0, 255),
    shodan_max_results: Math.max(1, Math.min(5000, Math.round(toFiniteNumber(next.shodan_max_results, defaults.shodan_max_results)))),
    scan_timeout: Math.max(1, Math.min(120, Math.round(toFiniteNumber(next.scan_timeout, defaults.scan_timeout)))),
    proxy_list: sanitizeStringArray(next.proxy_list),
    bot_accounts: (Array.isArray(next.bot_accounts) ? next.bot_accounts : [])
      .map(normalizeBotAccount)
      .filter(Boolean)
      .slice(0, 200),
    output_dir: String(next.output_dir || defaults.output_dir).trim().slice(0, 255),
    theme: String(next.theme || defaults.theme).trim(),
    auto_notify_discord: Boolean(next.auto_notify_discord),
    max_bruteforce_threads: Math.max(1, Math.min(500, Math.round(toFiniteNumber(next.max_bruteforce_threads, defaults.max_bruteforce_threads)))),
    whitelist_check_threads: Math.max(1, Math.min(200, Math.round(toFiniteNumber(next.whitelist_check_threads, defaults.whitelist_check_threads)))),
  };
}

async function createSettingsRow(userId, baseSettings) {
  const db = getDb();
  const merged = sanitizeSettings(baseSettings);

  await db.execute(
    `INSERT INTO user_settings (user_id, settings_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE settings_json = settings_json`,
    [userId, JSON.stringify(merged)]
  );

  return merged;
}

async function migrateLegacyConfigIfNeeded() {
  if (migrationChecked) {
    return;
  }

  const db = getDb();
  const [[settingsCount]] = await db.execute(
    'SELECT COUNT(*) AS total FROM user_settings'
  );

  if (Number(settingsCount?.total || 0) > 0) {
    migrationChecked = true;
    return;
  }

  const [[userCount]] = await db.execute('SELECT COUNT(*) AS total FROM users');
  if (Number(userCount?.total || 0) === 0) {
    migrationChecked = true;
    return;
  }

  if (!fs.existsSync(config.paths.configFile)) {
    migrationChecked = true;
    return;
  }

  const template = readLegacyTemplate();
  const [users] = await db.execute('SELECT id FROM users');

  if (Array.isArray(users) && users.length > 0) {
    const payload = JSON.stringify(template);
    await Promise.all(
      users.map((user) =>
        db.execute(
          `INSERT INTO user_settings (user_id, settings_json)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE settings_json = settings_json`,
          [user.id, payload]
        )
      )
    );
  }

  migrationChecked = true;
}

export async function getConfig(userId) {
  await migrateLegacyConfigIfNeeded();

  const db = getDb();
  const [rows] = await db.execute(
    'SELECT settings_json FROM user_settings WHERE user_id = ? LIMIT 1',
    [userId]
  );

  const row = rows[0];
  if (!row) {
    return createSettingsRow(userId, defaults);
  }

  try {
    return sanitizeSettings(JSON.parse(row.settings_json || '{}'));
  } catch {
    return createSettingsRow(userId, defaults);
  }
}

export async function updateConfig(userId, updates) {
  const current = await getConfig(userId);
  const next = sanitizeSettings({
    ...current,
    ...Object.fromEntries(
      Object.entries(updates || {}).filter(([, value]) => value !== null && value !== undefined)
    ),
  });

  const db = getDb();
  await db.execute(
    `INSERT INTO user_settings (user_id, settings_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json), updated_at = CURRENT_TIMESTAMP`,
    [userId, JSON.stringify(next)]
  );

  return next;
}
