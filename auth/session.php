<?php
require_once __DIR__ . '/db.php';
corsHeaders();
startAuthSession();

if (isset($_SESSION['user'])) {
    jsonResponse([
        'authenticated' => true,
        'user'          => $_SESSION['user'],
    ]);
} else {
    jsonResponse(['authenticated' => false], 401);
}
