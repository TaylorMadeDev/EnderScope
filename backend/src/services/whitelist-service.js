import net from 'node:net';
import { asyncPool } from '../lib/async-pool.js';

const WHITELIST_KEYWORDS = [
  'whitelist',
  'not whitelisted',
  'not on the whitelist',
  'you are not whitelisted',
  'whitelist only',
];

function encodeVarInt(value) {
  const out = [];
  let current = value >>> 0;
  while (true) {
    let byte = current & 0x7f;
    current >>>= 7;
    if (current !== 0) byte |= 0x80;
    out.push(byte);
    if (current === 0) break;
  }
  return Buffer.from(out);
}

function readVarInt(buffer, offset = 0) {
  let value = 0;
  let shift = 0;
  let index = offset;

  while (index < buffer.length) {
    const byte = buffer[index];
    value |= (byte & 0x7f) << shift;
    index += 1;
    if ((byte & 0x80) === 0) {
      return { value, bytesRead: index - offset };
    }
    shift += 7;
  }

  return null;
}

function framePacket(payload) {
  return Buffer.concat([encodeVarInt(payload.length), payload]);
}

function buildHandshake(host, port) {
  const hostBuffer = Buffer.from(host, 'utf8');
  const portBuffer = Buffer.alloc(2);
  portBuffer.writeUInt16BE(port, 0);

  return framePacket(
    Buffer.concat([
      encodeVarInt(0x00),
      encodeVarInt(763),
      encodeVarInt(hostBuffer.length),
      hostBuffer,
      portBuffer,
      encodeVarInt(2),
    ])
  );
}

function buildLoginStart(username) {
  const nameBuffer = Buffer.from(username, 'utf8');
  return framePacket(Buffer.concat([encodeVarInt(0x00), encodeVarInt(nameBuffer.length), nameBuffer]));
}

function parseDisconnectMessage(packet) {
  const stringInfo = readVarInt(packet, 1);
  if (!stringInfo) return packet.subarray(1).toString('utf8');
  const start = 1 + stringInfo.bytesRead;
  const end = start + stringInfo.value;
  const raw = packet.subarray(start, end).toString('utf8');

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed.text || raw;
    }
  } catch {
    return raw;
  }

  return raw;
}

function sendLogin(host, port, username, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let buffer = Buffer.alloc(0);
    let settled = false;

    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.write(buildHandshake(host, port));
      socket.write(buildLoginStart(username));
    });
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const packetLengthInfo = readVarInt(buffer, 0);
      if (!packetLengthInfo) return;

      const totalLength = packetLengthInfo.value;
      const headerLength = packetLengthInfo.bytesRead;
      if (buffer.length < headerLength + totalLength) return;

      const packet = buffer.subarray(headerLength, headerLength + totalLength);
      const packetId = packet[0];
      if (packetId === 0x00) {
        finish(null, parseDisconnectMessage(packet));
      } else {
        finish(null, null);
      }
    });
    socket.once('timeout', () => finish(null, null));
    socket.once('error', (error) => finish(error));
  });
}

export async function runWhitelistChecks({
  servers,
  accounts,
  threads,
  timeoutSeconds,
  shouldCancel,
  onResult,
  onProgress,
}) {
  const account = accounts[0] || { username: 'Steve', password: '', premium: false };
  let completed = 0;
  const total = servers.length;

  await asyncPool(servers, Math.max(1, threads), async (server) => {
    if (shouldCancel()) {
      completed += 1;
      onProgress(completed, total);
      return null;
    }

    const result = {
      ip: server.ip,
      port: server.port,
      version: '',
      motd: '',
      players_online: 0,
      players_max: 0,
      status: 'unknown',
      whitelist: null,
      latency_ms: 0,
      discovered_at: new Date().toISOString(),
      source: server.source || 'whitelist',
      notes: '',
    };

    try {
      const kickMessage = await sendLogin(
        server.ip,
        server.port,
        account.username || 'Steve',
        timeoutSeconds * 1000
      );

      if (!kickMessage) {
        result.whitelist = false;
        result.status = 'not_whitelisted';
      } else if (WHITELIST_KEYWORDS.some((keyword) => kickMessage.toLowerCase().includes(keyword))) {
        result.whitelist = true;
        result.status = 'whitelisted';
      } else {
        result.whitelist = false;
        result.status = 'not_whitelisted';
        result.notes = kickMessage.slice(0, 120);
      }
    } catch (error) {
      result.status = 'error';
      result.notes = String(error.message || error).slice(0, 120);
    }

    onResult(result);
    completed += 1;
    onProgress(completed, total);
    return result;
  });
}
