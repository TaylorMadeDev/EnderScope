import crypto from 'node:crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../lib/database.js';
import { config } from '../config.js';
import { logger } from '../lib/log-store.js';

const router = express.Router();

function sanitizeUser(user) {
  return {
    id: Number(user.id),
    username: user.username,
    email: user.email,
    avatar: user.avatar || null,
  };
}

function getAuthErrorCode(error) {
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ER_ACCESS_DENIED_ERROR') {
    return 'db_unavailable';
  }

  return 'google_failed';
}

function requireAuth(req, res, next) {
  if (!req.session.user?.id) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  return next();
}

function sanitizeAvatar(value) {
  const avatar = String(value || '').trim();
  if (!avatar) {
    return null;
  }

  if (!/^https?:\/\//i.test(avatar)) {
    return null;
  }

  return avatar.slice(0, 500);
}

function formatAccount(row) {
  return {
    id: Number(row.id),
    username: row.username,
    email: row.email,
    avatar: row.avatar || null,
    hasPassword: Boolean(row.password_hash),
    hasGoogle: Boolean(row.google_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/session', (req, res) => {
  if (req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }

  return res.status(401).json({ authenticated: false });
});

router.get('/account', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute(
      `SELECT id, username, email, avatar, password_hash, google_id, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.session.user.id]
    );

    const user = rows[0];
    if (!user) {
      req.session.destroy(() => {});
      return res.status(404).json({ error: 'Account not found.' });
    }

    req.session.user = sanitizeUser(user);
    return res.json({ ok: true, user: req.session.user, account: formatAccount(user) });
  } catch (error) {
    logger.error('Account fetch failed', { error: String(error.message || error) });
    return res.status(500).json({ error: 'Failed to load account.' });
  }
});

router.put('/account', requireAuth, async (req, res) => {
  const username = String(req.body.username || '').trim();
  const avatar = sanitizeAvatar(req.body.avatar);

  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'Username must be 3-50 characters.' });
  }

  try {
    const db = getDb();
    await db.execute(
      'UPDATE users SET username = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username, avatar, req.session.user.id]
    );

    const [rows] = await db.execute(
      `SELECT id, username, email, avatar, password_hash, google_id, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.session.user.id]
    );

    const user = rows[0];
    req.session.user = sanitizeUser(user);
    return res.json({ ok: true, user: req.session.user, account: formatAccount(user) });
  } catch (error) {
    logger.error('Account update failed', { error: String(error.message || error) });
    return res.status(500).json({ error: 'Failed to update account.' });
  }
});

router.post('/account/password', requireAuth, async (req, res) => {
  const currentPassword = String(req.body.current_password || '');
  const newPassword = String(req.body.new_password || '');

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT id, password_hash FROM users WHERE id = ? LIMIT 1',
      [req.session.user.id]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (user.password_hash && !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await db.execute(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, req.session.user.id]
    );

    return res.json({ ok: true });
  } catch (error) {
    logger.error('Password update failed', { error: String(error.message || error) });
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT id, username, email, password_hash, avatar FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const user = rows[0];

    if (!user?.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.user = sanitizeUser(user);
    return res.json({ ok: true, user: req.session.user });
  } catch (error) {
    logger.error('Login failed', { error: String(error.message || error) });
    return res.status(500).json({ error: 'Login failed.' });
  }
});

router.post('/register', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');

  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'Username must be 3-50 characters.' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const db = getDb();
    const [existingRows] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingRows[0]) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    req.session.user = {
      id: Number(result.insertId),
      username,
      email,
      avatar: null,
    };

    return res.json({ ok: true, user: req.session.user });
  } catch (error) {
    logger.error('Registration failed', { error: String(error.message || error) });
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/google', (req, res) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return res.redirect(`${config.frontendUrl}/login?error=google_not_configured`);
  }

  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

async function handleGoogleCallback(req, res) {
  if (!req.query.state || req.query.state !== req.session.oauthState) {
    return res.redirect(`${config.frontendUrl}/login?error=invalid_state`);
  }

  delete req.session.oauthState;

  if (!req.query.code) {
    return res.redirect(`${config.frontendUrl}/login?error=no_code`);
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(req.query.code),
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.redirect(`${config.frontendUrl}/login?error=token_exchange_failed`);
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();

    if (!profile.email) {
      return res.redirect(`${config.frontendUrl}/login?error=profile_fetch_failed`);
    }

    const db = getDb();
    const [rows] = await db.execute(
      'SELECT id, username, email, avatar FROM users WHERE google_id = ? OR email = ? LIMIT 1',
      [profile.id, profile.email]
    );

    let user = rows[0];

    if (user) {
      await db.execute(
        'UPDATE users SET google_id = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [profile.id, profile.picture || null, user.id]
      );
      user = {
        ...user,
        avatar: profile.picture || user.avatar || null,
      };
    } else {
      const username = profile.name || String(profile.email).split('@')[0];
      const [result] = await db.execute(
        'INSERT INTO users (username, email, google_id, avatar) VALUES (?, ?, ?, ?)',
        [username, profile.email, profile.id, profile.picture || null]
      );
      user = {
        id: Number(result.insertId),
        username,
        email: profile.email,
        avatar: profile.picture || null,
      };
    }

    req.session.user = sanitizeUser(user);
    return res.redirect(`${config.frontendUrl}/dashboard`);
  } catch (error) {
    logger.error('Google auth failed', {
      error: String(error?.message || error),
      code: error?.code || null,
      stack: error?.stack || null,
    });
    return res.redirect(`${config.frontendUrl}/login?error=${getAuthErrorCode(error)}`);
  }
}

router.get('/google-callback', handleGoogleCallback);
router.get('/google/callback', handleGoogleCallback);

export default router;
