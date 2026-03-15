<?php
require_once __DIR__ . '/db.php';
startAuthSession();

// ─── Validate state (CSRF) ─────────────────────────────────────────
if (!isset($_GET['state'], $_SESSION['oauth_state']) || $_GET['state'] !== $_SESSION['oauth_state']) {
    header('Location: ' . FRONTEND_URL . '/login?error=invalid_state');
    exit;
}
unset($_SESSION['oauth_state']);

if (!isset($_GET['code'])) {
    header('Location: ' . FRONTEND_URL . '/login?error=no_code');
    exit;
}

// ─── Exchange code for access token ─────────────────────────────────
$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS     => http_build_query([
        'code'          => $_GET['code'],
        'client_id'     => GOOGLE_CLIENT_ID,
        'client_secret' => GOOGLE_CLIENT_SECRET,
        'redirect_uri'  => GOOGLE_REDIRECT_URI,
        'grant_type'    => 'authorization_code',
    ]),
]);
$tokenBody = curl_exec($ch);
curl_close($ch);

$tokenData = json_decode($tokenBody, true);
if (!isset($tokenData['access_token'])) {
    header('Location: ' . FRONTEND_URL . '/login?error=token_exchange_failed');
    exit;
}

// ─── Fetch Google user profile ──────────────────────────────────────
$ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $tokenData['access_token']],
]);
$profileBody = curl_exec($ch);
curl_close($ch);

$profile = json_decode($profileBody, true);
if (!isset($profile['email'])) {
    header('Location: ' . FRONTEND_URL . '/login?error=profile_fetch_failed');
    exit;
}

// ─── Find or create user ────────────────────────────────────────────
$db   = getDB();
$stmt = $db->prepare('SELECT id, username, email, avatar FROM users WHERE google_id = ? OR email = ?');
$stmt->execute([$profile['id'], $profile['email']]);
$user = $stmt->fetch();

if ($user) {
    // Update Google ID and avatar if needed
    $update = $db->prepare('UPDATE users SET google_id = ?, avatar = ?, updated_at = NOW() WHERE id = ?');
    $update->execute([$profile['id'], $profile['picture'] ?? null, $user['id']]);
} else {
    // Create new account
    $insert = $db->prepare('INSERT INTO users (username, email, google_id, avatar) VALUES (?, ?, ?, ?)');
    $insert->execute([
        $profile['name'] ?? explode('@', $profile['email'])[0],
        $profile['email'],
        $profile['id'],
        $profile['picture'] ?? null,
    ]);
    $user = [
        'id'       => (int) $db->lastInsertId(),
        'username' => $profile['name'] ?? explode('@', $profile['email'])[0],
        'email'    => $profile['email'],
        'avatar'   => $profile['picture'] ?? null,
    ];
}

$_SESSION['user'] = [
    'id'       => (int) $user['id'],
    'username' => $user['username'],
    'email'    => $user['email'],
    'avatar'   => $user['avatar'] ?? ($profile['picture'] ?? null),
];

header('Location: ' . FRONTEND_URL . '/dashboard');
exit;
