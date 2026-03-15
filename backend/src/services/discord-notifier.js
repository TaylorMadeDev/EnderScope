const defaults = {
  username: 'EnderScope',
  message: 'Potential open server detected.',
  mentions: '',
  title: 'New Server Found: {ip}:{port}',
  description:
    '{motd}\nVersion: {version}\nPlayers: {players_online}/{players_max}\nWhitelist: {whitelist}\nSource: {source}',
  color: '#8b5cf6',
};

function normalizeWebhookUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  try {
    const url = new URL(raw);
    const allowedHosts = new Set([
      'discord.com',
      'www.discord.com',
      'ptb.discord.com',
      'canary.discord.com',
      'discordapp.com',
      'www.discordapp.com',
    ]);

    if (!allowedHosts.has(url.hostname.toLowerCase())) {
      return '';
    }

    if (!url.pathname.startsWith('/api/webhooks/')) {
      return '';
    }

    return url.toString();
  } catch {
    return '';
  }
}

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

function buildAllowedMentions(mentionsText) {
  const text = String(mentionsText || '');
  const users = [...text.matchAll(/<@!?(\d+)>/g)].map((match) => match[1]);
  const roles = [...text.matchAll(/<@&(\d+)>/g)].map((match) => match[1]);
  const parse = [];

  if (/@everyone|@here/.test(text)) {
    parse.push('everyone');
  }

  return {
    parse,
    users: [...new Set(users)],
    roles: [...new Set(roles)],
  };
}

function buildContent(settings, server, options = {}) {
  const mentions = String(settings?.discord_webhook_mentions ?? defaults.mentions).trim();
  const messageTemplate =
    settings?.discord_webhook_message === undefined
      ? defaults.message
      : String(settings.discord_webhook_message || '');
  const renderedMessage = applyTemplate(messageTemplate, server).trim();

  const lines = [];
  if (mentions) {
    lines.push(mentions);
  }
  if (renderedMessage) {
    lines.push(renderedMessage);
  } else if (options.testMode) {
    lines.push('EnderScope test notification');
  }

  return lines.join('\n').slice(0, 2000);
}

export async function notifyDiscord(settings, server, options = {}) {
  const webhookUrl = normalizeWebhookUrl(
    typeof settings === 'string' ? settings : settings?.discord_webhook_url
  );

  if (!webhookUrl) {
    throw new Error('Discord webhook URL is not configured.');
  }

  const whitelistValue =
    server.whitelist === false ? 'Open' : server.whitelist ? 'Whitelisted' : 'Unknown';
  const content = buildContent(settings, server, options);
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
        footer: options.testMode ? { text: 'EnderScope webhook test' } : undefined,
      },
    ],
  };

  if (content) {
    payload.content = content;
    payload.allowed_mentions = buildAllowedMentions(
      settings?.discord_webhook_mentions ?? defaults.mentions
    );
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || `Discord webhook request failed with ${response.status}.`);
  }

  return true;
}
