import { logger } from '../lib/log-store.js';

function buildQuery(version, extraQuery) {
  const parts = ['"minecraft"', 'port:25565'];
  if (version) parts.push(`"${version}"`);
  if (extraQuery?.trim()) parts.push(extraQuery.trim());
  return parts.join(' ');
}

function parseMatch(match) {
  const minecraft = match.minecraft || {};
  const description = minecraft.description;

  let motd = '';
  if (typeof description === 'string') {
    motd = description;
  } else if (description && typeof description === 'object') {
    motd = description.text || '';
  }

  return {
    ip: match.ip_str || '',
    port: match.port || 25565,
    version: minecraft.version?.name || '',
    motd,
    players_online: minecraft.players?.online || 0,
    players_max: minecraft.players?.max || 0,
    status: 'open',
    whitelist: null,
    latency_ms: 0,
    discovered_at: new Date().toISOString(),
    source: 'shodan',
    notes: '',
  };
}

export async function searchShodan({
  apiKey,
  version,
  extraQuery,
  maxResults,
  onProgress,
  shouldCancel,
}) {
  const query = buildQuery(version, extraQuery);
  logger.info('Starting Shodan search', { query, maxResults });

  const results = [];
  let page = 1;

  while (results.length < maxResults) {
    if (shouldCancel()) break;

    const url = new URL('https://api.shodan.io/shodan/host/search');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('query', query);
    url.searchParams.set('page', String(page));

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Shodan search failed: ${response.status} ${body}`);
    }

    const data = await response.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];
    if (!matches.length) break;

    for (const match of matches) {
      if (shouldCancel() || results.length >= maxResults) break;
      results.push(parseMatch(match));
      onProgress(results);
    }

    if (matches.length < 100) break;
    page += 1;
  }

  return results;
}
