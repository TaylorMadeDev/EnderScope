const defaults = {
  username: 'EnderScope',
  title: 'New Server Found: {ip}:{port}',
  description:
    '{motd}\nVersion: {version}\nPlayers: {players_online}/{players_max}\nWhitelist: {whitelist}\nSource: {source}',
  color: '#8b5cf6',
};

function normalizeColor(value) {
  const raw = String(value || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return parseInt(raw, 16);
  }
  return parseInt(defaults.color.replace('#', ''), 16);
}

function getTemplateContext(server) {
  const whitelist =
    server.whitelist === false ? 'Open' : server.whitelist ? 'Whitelisted' : 'Unknown';

  return {
    ip: server.ip || 'unknown',
    port: String(server.port || 25565),
    version: server.version || 'unknown',
    motd: server.motd || '-',
    players_online: String(server.players_online || 0),
    players_max: String(server.players_max || 0),
    whitelist,
    source: server.source || 'unknown',
  };
}

function applyTemplate(template, server) {
  const context = getTemplateContext(server);
  return String(template || '').replace(/\{([a-z_]+)\}/gi, (_, token) => context[token] ?? '');
}

export async function notifyDiscord(settings, server) {
  const webhookUrl =
    typeof settings === 'string' ? settings : String(settings?.discord_webhook_url || '');

  if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return false;
  }

  const whitelistValue =
    server.whitelist === false ? 'Open' : server.whitelist ? 'Whitelisted' : 'Unknown';

  const payload = {
    username: String(settings?.discord_webhook_username ?? defaults.username).slice(0, 80),
    embeds: [
      {
        title: applyTemplate(settings?.discord_webhook_title ?? defaults.title, server).slice(0, 256),
        description: applyTemplate(
          settings?.discord_webhook_description ?? defaults.description,
          server
        ).slice(0, 4096),
        color: normalizeColor(settings?.discord_webhook_color),
        fields: [
          { name: 'IP:Port', value: `${server.ip}:${server.port}`, inline: true },
          { name: 'Version', value: server.version || 'unknown', inline: true },
          {
            name: 'Players',
            value: `${server.players_online || 0}/${server.players_max || 0}`,
            inline: true,
          },
          { name: 'Whitelist', value: whitelistValue, inline: true },
          { name: 'Source', value: server.source || 'unknown', inline: true },
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.ok;
}
