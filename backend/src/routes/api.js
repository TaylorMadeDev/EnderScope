import express from 'express';
import { createTask, getTask, cancelTask, updateTask, getTaskStats } from '../lib/task-store.js';
import { getConfig, updateConfig } from '../lib/config-store.js';
import { getLogs, logger } from '../lib/log-store.js';
import { searchShodan } from '../services/shodan-service.js';
import { parseTargets, runBruteforce } from '../services/bruteforce-service.js';
import { notifyDiscord } from '../services/discord-notifier.js';
import { runWhitelistChecks } from '../services/whitelist-service.js';

const router = express.Router();

router.get('/tasks/:taskId', (req, res) => {
  const task = getTask(req.params.taskId);
  if (!task) return res.status(404).json({ detail: 'Task not found' });
  return res.json(task);
});

router.post('/tasks/:taskId/cancel', (req, res) => {
  const task = cancelTask(req.params.taskId);
  if (!task) return res.status(404).json({ detail: 'Task not found' });
  return res.json({ ok: true });
});

router.get('/dashboard/stats', (req, res) => {
  res.json(getTaskStats());
});

router.post('/shodan/search', async (req, res) => {
  const settings = getConfig();
  const apiKey = String(req.body.api_key || settings.shodan_api_key || '').trim();

  if (!apiKey) {
    return res
      .status(400)
      .json({ detail: 'Shodan API key is not configured. Set it in Settings first.' });
  }

  const task = createTask('shodan');
  const version = String(req.body.version || settings.mc_version || '1.20');
  const extraQuery = String(req.body.extra_query || settings.shodan_extra_query || 'smp');
  const maxResults = Number(req.body.max_results || settings.shodan_max_results || 100);

  setImmediate(async () => {
    try {
      const results = await searchShodan({
        apiKey,
        version,
        extraQuery,
        maxResults,
        shouldCancel: () => getTask(task.id)?.status === 'cancelled',
        onProgress: (nextResults) => {
          updateTask(task.id, {
            results: [...nextResults],
            progress: Math.min(Math.floor((nextResults.length / Math.max(maxResults, 1)) * 100), 100),
          });
        },
      });

      updateTask(task.id, {
        status: getTask(task.id)?.status === 'cancelled' ? 'cancelled' : 'completed',
        progress: 100,
        results,
      });
    } catch (error) {
      logger.error('Shodan search error', { error: String(error.message || error) });
      updateTask(task.id, {
        status: 'failed',
        error: String(error.message || error),
      });
    }
  });

  return res.json({ task_id: task.id });
});

router.post('/bruteforce/scan', async (req, res) => {
  const settings = getConfig();
  const targets = parseTargets(String(req.body.targets || ''));
  if (!targets.length) {
    return res.status(400).json({ detail: 'No valid targets provided.' });
  }

  const task = createTask('bruteforce');
  const threads = Number(req.body.threads || settings.max_bruteforce_threads || 50);
  const timeoutSeconds = Number(settings.scan_timeout || 5);
  const results = [];

  setImmediate(async () => {
    try {
      await runBruteforce({
        targets,
        threads,
        timeoutSeconds,
        shouldCancel: () => getTask(task.id)?.status === 'cancelled',
        onResult: (result) => {
          results.push(result);
          updateTask(task.id, { results: [...results] });
        },
        onProgress: (done, total) => {
          updateTask(task.id, { progress: Math.floor((done / Math.max(total, 1)) * 100) });
        },
      });

      updateTask(task.id, {
        status: getTask(task.id)?.status === 'cancelled' ? 'cancelled' : 'completed',
        progress: 100,
      });
    } catch (error) {
      logger.error('Bruteforce scan error', { error: String(error.message || error) });
      updateTask(task.id, {
        status: 'failed',
        error: String(error.message || error),
      });
    }
  });

  return res.json({ task_id: task.id });
});

router.post('/whitelist/check', async (req, res) => {
  const settings = getConfig();
  const rawServers = Array.isArray(req.body.servers) ? req.body.servers : [];
  if (!rawServers.length) {
    return res.status(400).json({ detail: 'No servers provided.' });
  }

  const task = createTask('whitelist');
  const webhookUrl = settings.discord_webhook_url || '';
  const servers = rawServers.map((entry) => {
    const value = String(entry);
    const index = value.lastIndexOf(':');
    if (index === -1) {
      return { ip: value, port: 25565, source: 'whitelist' };
    }
    return {
      ip: value.slice(0, index),
      port: Number(value.slice(index + 1)) || 25565,
      source: 'whitelist',
    };
  });

  const configuredAccounts = Array.isArray(settings.bot_accounts) ? settings.bot_accounts : [];
  const requestAccounts = Array.isArray(req.body.accounts) ? req.body.accounts : [];
  const accounts = requestAccounts.length
    ? requestAccounts
    : configuredAccounts.length
      ? configuredAccounts
      : [{ username: 'Steve', password: '', premium: false }];

  const results = [];

  setImmediate(async () => {
    try {
      await runWhitelistChecks({
        servers,
        accounts,
        threads: Number(settings.whitelist_check_threads || 10),
        timeoutSeconds: Number(settings.scan_timeout || 5),
        shouldCancel: () => getTask(task.id)?.status === 'cancelled',
        onResult: (result) => {
          results.push(result);
          updateTask(task.id, { results: [...results] });
          if (result.whitelist === false && webhookUrl) {
            notifyDiscord(settings, result).catch(() => {
              logger.warn('Discord notification failed for whitelist result');
            });
          }
        },
        onProgress: (done, total) => {
          updateTask(task.id, { progress: Math.floor((done / Math.max(total, 1)) * 100) });
        },
      });

      updateTask(task.id, {
        status: getTask(task.id)?.status === 'cancelled' ? 'cancelled' : 'completed',
        progress: 100,
      });
    } catch (error) {
      logger.error('Whitelist check error', { error: String(error.message || error) });
      updateTask(task.id, {
        status: 'failed',
        error: String(error.message || error),
      });
    }
  });

  return res.json({ task_id: task.id });
});

router.get('/settings', (req, res) => {
  res.json(getConfig());
});

router.put('/settings', (req, res) => {
  const updates = Object.fromEntries(
    Object.entries(req.body || {}).filter(([, value]) => value !== null && value !== undefined)
  );
  const settings = updateConfig(updates);
  res.json({ ok: true, settings });
});

router.post('/settings/test-webhook', async (req, res) => {
  const currentSettings = getConfig();
  const nextSettings = {
    ...currentSettings,
    ...Object.fromEntries(
      Object.entries(req.body || {}).filter(([, value]) => value !== null && value !== undefined)
    ),
  };

  try {
    await notifyDiscord(
      nextSettings,
      {
        ip: 'play.endscope.gg',
        port: 25565,
        version: nextSettings.mc_version || '1.21.11',
        motd: 'A test ping from EnderScope just landed in your webhook channel.',
        players_online: 12,
        players_max: 60,
        whitelist: false,
        source: 'settings-test',
      },
      { testMode: true }
    );

    return res.json({ ok: true });
  } catch (error) {
    logger.warn('Discord test webhook failed', { error: String(error.message || error) });
    return res.status(400).json({
      detail: String(error.message || 'Discord test webhook failed.'),
    });
  }
});

router.get('/logs', (req, res) => {
  res.json({ logs: getLogs() });
});

export default router;
