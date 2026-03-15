<?php
require_once __DIR__ . '/db.php';
startAuthSession();

if (!GOOGLE_CLIENT_ID) {
    jsonResponse(['error' => 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID in auth/config.php.'], 500);
}

// Generate CSRF token
$_SESSION['oauth_state'] = bin2hex(random_bytes(16));

$params = http_build_query([
    'client_id'     => GOOGLE_CLIENT_ID,
    'redirect_uri'  => GOOGLE_REDIRECT_URI,
    'response_type' => 'code',
    'scope'         => 'openid email profile',
    'state'         => $_SESSION['oauth_state'],
    'access_type'   => 'online',
    'prompt'        => 'select_account',
]);

header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . $params);
exit;
