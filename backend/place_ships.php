<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require 'db.php';

$input = json_decode(file_get_contents('php://input'), true);
$game_id = $input['game_id'];
$player_id = $input['player_id'];
$ships = $input['ships']; // Array of ship objects {x, y, orientation, size, type}

if (!$game_id || !$player_id || !$ships) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Clear existing ships for this player in this game (if re-placing)
    $stmt = $pdo->prepare("DELETE FROM ships WHERE game_id = ? AND player_id = ?");
    $stmt->execute([$game_id, $player_id]);

    $stmt = $pdo->prepare("INSERT INTO ships (game_id, player_id, x, y, orientation, size) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($ships as $ship) {
        $stmt->execute([
            $game_id,
            $player_id,
            $ship['x'],
            $ship['y'],
            $ship['orientation'],
            $ship['size']
        ]);
    }

    $pdo->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
