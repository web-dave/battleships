<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require 'db.php';

$game_id = isset($_GET['game_id']) ? $_GET['game_id'] : null;
$player_id = isset($_GET['player_id']) ? $_GET['player_id'] : null;

if (!$game_id || !$player_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing game_id or player_id']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM games WHERE id = ?");
    $stmt->execute([$game_id]);
    $game = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$game) {
        http_response_code(404);
        echo json_encode(['error' => 'Game not found']);
        exit;
    }

    $opponent_id = ($game['player1_id'] == $player_id) ? $game['player2_id'] : $game['player1_id'];
    
    // Get shots fired by opponent (to update my board)
    $opponent_shots = [];
    if ($opponent_id) {
        $stmt = $pdo->prepare("SELECT x, y, result, ship_id FROM shots WHERE game_id = ? AND player_id = ?");
        $stmt->execute([$game_id, $opponent_id]);
        $opponent_shots = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get shots fired by me (to update my view of enemy board)
    $stmt = $pdo->prepare("SELECT x, y, result, ship_id FROM shots WHERE game_id = ? AND player_id = ?");
    $stmt->execute([$game_id, $player_id]);
    $my_shots = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get my ships to restore state on reload
    $stmt = $pdo->prepare("SELECT id, x, y, size, orientation, hits, sunk FROM ships WHERE game_id = ? AND player_id = ?");
    $stmt->execute([$game_id, $player_id]);
    $my_ships_raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $my_ships = array_map(function($ship) {
        $ship['id'] = (int)$ship['id'];
        $ship['x'] = (int)$ship['x'];
        $ship['y'] = (int)$ship['y'];
        $ship['size'] = (int)$ship['size'];
        $ship['hits'] = (int)$ship['hits'];
        $ship['sunk'] = (bool)$ship['sunk'];
        return $ship;
    }, $my_ships_raw);

    // Get opponent display name
    $opponent_name = '';
    if ($opponent_id) {
        $stmt = $pdo->prepare("SELECT player_name FROM players WHERE player_id = ?");
        $stmt->execute([$opponent_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $opponent_name = $row ? $row['player_name'] : '';
    }

    echo json_encode([
        'game_status' => $game['status'],
        'current_turn' => $game['current_turn'],
        'opponent_shots' => $opponent_shots,
        'my_shots' => $my_shots,
        'my_ships' => $my_ships,
        'opponent_id' => $opponent_id, // Useful to know if opponent joined
        'opponent_name' => $opponent_name
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
