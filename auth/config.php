<?php
/**
 * ServerBuster Auth Configuration
 * 
 * 1. Create the database: run auth/setup.sql in phpMyAdmin or MySQL CLI
 * 2. Google OAuth: https://console.cloud.google.com/apis/credentials
 *    - Create OAuth 2.0 Client ID (Web application)
 *    - Add redirect URI: http://localhost:5173/auth/google-callback.php
 *    - Paste Client ID and Secret below
 */

// ─── Database (XAMPP MySQL defaults) ────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'serverbuster');
define('DB_USER', 'root');
define('DB_PASS', '');

// ─── Google OAuth 2.0 ──────────────────────────────────────────────
define('GOOGLE_CLIENT_ID',     ''); // Paste your Client ID
define('GOOGLE_CLIENT_SECRET', ''); // Paste your Client Secret
define('GOOGLE_REDIRECT_URI',  'http://localhost:5173/auth/google-callback.php');

// ─── Frontend URL (Vite dev server) ────────────────────────────────
define('FRONTEND_URL', 'http://localhost:5173');
