import net from 'node:net';
import { asyncPool } from '../lib/async-pool.js';

const DEFAULT_PORT = 25565;

function ipToInt(ip) {
  return ip
    .split('.')
    .map((part) => Number(part))
    .reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
}

function intToIp(value) {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join('.');
}

function expandCidr(cidr) {
  const [baseIp, prefixText] = cidr.split('/');
  const prefix = Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return [];

  const base = ipToInt(baseIp);
  const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
  const network = base & mask;
  const size = 2 ** (32 - prefix);
  const maxHosts = Math.min(size, 65536);

  const hosts = [];
  for (let offset = 0; offset < maxHosts; offset += 1) {
    hosts.push([intToIp((network + offset) >>> 0), DEFAULT_PORT]);
  }
  return hosts;
}

export function parseTargets(raw) {
  const targets = [];
  for (const item of raw.replaceAll(',', '\n').split('\n')) {
    const value = item.trim();
    if (!value || value.startsWith('#')) continue;

    if (value.includes('/')) {
      targets.push(...expandCidr(value));
      continue;
    }

    if (value.includes(':')) {
      const index = value.lastIndexOf(':');
      const host = value.slice(0, index);
      const port = Number(value.slice(index + 1));
      if (host && Number.isInteger(port) && port > 0 && port <= 65535) {
        targets.push([host, port]);
      }
      continue;
    }

    targets.push([value, DEFAULT_PORT]);
  }

  return targets;
}

function probeTarget(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () =>
      finish({
        ip: host,
        port,
        version: '',
        motd: '',
        players_online: 0,
        players_max: 0,
        status: 'open',
        whitelist: null,
        latency_ms: Date.now() - start,
        discovered_at: new Date().toISOString(),
        source: 'bruteforce',
        notes: '',
      })
    );
    socket.once('timeout', () => finish(null));
    socket.once('error', () => finish(null));
  });
}

export async function runBruteforce({
  targets,
  threads,
  timeoutSeconds,
  shouldCancel,
  onResult,
  onProgress,
}) {
  let completed = 0;
  const total = targets.length;

  await asyncPool(targets, Math.max(1, threads), async ([host, port]) => {
    if (shouldCancel()) {
      completed += 1;
      onProgress(completed, total);
      return null;
    }

    const result = await probeTarget(host, port, timeoutSeconds * 1000);
    if (result) onResult(result);

    completed += 1;
    onProgress(completed, total);
    return result;
  });
}
