<?php
require_once __DIR__ . '/db.php';
corsHeaders();
startAuthSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$email || !$password) {
    jsonResponse(['error' => 'Email and password are required.'], 400);
}

$db   = getDB();
$stmt = $db->prepare('SELECT id, username, email, password_hash, avatar FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !$user['password_hash'] || !password_verify($password, $user['password_hash'])) {
    jsonResponse(['error' => 'Invalid email or password.'], 401);
}

$_SESSION['user'] = [
    'id'       => (int) $user['id'],
    'username' => $user['username'],
    'email'    => $user['email'],
    'avatar'   => $user['avatar'],
];

jsonResponse([
    'ok'   => true,
    'user' => $_SESSION['user'],
]);
