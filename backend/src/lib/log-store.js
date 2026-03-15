import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const MAX_LOGS = 500;
const logBuffer = [];

function writeLog(level, message, meta = null) {
  const line = [
    new Date().toISOString(),
    level.toUpperCase().padEnd(7, ' '),
    message,
    meta ? JSON.stringify(meta) : '',
  ]
    .filter(Boolean)
    .join('  ');

  logBuffer.push(line);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.splice(0, logBuffer.length - MAX_LOGS);
  }

  fs.mkdirSync(path.dirname(config.paths.logFile), { recursive: true });
  fs.appendFileSync(config.paths.logFile, `${line}\n`, 'utf8');
}

export const logger = {
  info(message, meta) {
    writeLog('info', message, meta);
  },
  warn(message, meta) {
    writeLog('warning', message, meta);
  },
  error(message, meta) {
    writeLog('error', message, meta);
  },
  debug(message, meta) {
    writeLog('debug', message, meta);
  },
};

export function getLogs() {
  return [...logBuffer];
}
