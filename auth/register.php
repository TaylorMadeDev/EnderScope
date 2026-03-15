<?php
require_once __DIR__ . '/db.php';
corsHeaders();
startAuthSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// ─── Validation ─────────────────────────────────────────────────────
if (strlen($username) < 3 || strlen($username) > 50) {
    jsonResponse(['error' => 'Username must be 3–50 characters.'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Invalid email address.'], 400);
}
if (strlen($password) < 8) {
    jsonResponse(['error' => 'Password must be at least 8 characters.'], 400);
}

$db = getDB();

// Check duplicate email
$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonResponse(['error' => 'An account with this email already exists.'], 409);
}

// Create user
$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $db->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$username, $email, $hash]);

$userId = (int) $db->lastInsertId();

$_SESSION['user'] = [
    'id'       => $userId,
    'username' => $username,
    'email'    => $email,
    'avatar'   => null,
];

jsonResponse([
    'ok'   => true,
    'user' => $_SESSION['user'],
]);
