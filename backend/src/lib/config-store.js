import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const defaults = {
  shodan_api_key: '',
  discord_webhook_url: '',
  discord_webhook_username: 'EnderScope',
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

let state = null;

function ensureLoaded() {
  if (state) return state;

  try {
    const raw = fs.readFileSync(config.paths.configFile, 'utf8');
    state = { ...defaults, ...JSON.parse(raw) };
  } catch {
    state = { ...defaults };
    saveConfig(state);
  }

  return state;
}

export function getConfig() {
  return { ...ensureLoaded() };
}

export function updateConfig(updates) {
  state = { ...ensureLoaded(), ...updates };
  saveConfig(state);
  return { ...state };
}

export function saveConfig(nextState) {
  fs.mkdirSync(path.dirname(config.paths.configFile), { recursive: true });
  fs.writeFileSync(config.paths.configFile, JSON.stringify(nextState, null, 2), 'utf8');
}
