<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require 'db.php';

$input = json_decode(file_get_contents('php://input'), true);

// If using GET for easy testing or POST for secure
$player_id = isset($input['player_id']) ? $input['player_id'] : (isset($_GET['player_id']) ? $_GET['player_id'] : uniqid());
$action = isset($input['action']) ? $input['action'] : (isset($_GET['action']) ? $_GET['action'] : 'start');

try {
    if ($action === 'start') {
        // Check for open games
        $stmt = $pdo->prepare("SELECT id FROM games WHERE status = 'waiting' AND player1_id != ? LIMIT 1");
        $stmt->execute([$player_id]);
        $game = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($game) {
            // Join existing game
            $stmt = $pdo->prepare("UPDATE games SET player2_id = ?, status = 'active' WHERE id = ?");
            $stmt->execute([$player_id, $game['id']]);
            echo json_encode([
                'game_id' => $game['id'], 
                'player_id' => $player_id, 
                'role' => 'player2',
                'message' => 'Joined existing game'
            ]);
        } else {
            // Create new game
            $stmt = $pdo->prepare("INSERT INTO games (player1_id, status, current_turn) VALUES (?, 'waiting', ?)");
            $stmt->execute([$player_id, $player_id]); // Creator starts first? Or randomize? Let's say creator starts.
            echo json_encode([
                'game_id' => $pdo->lastInsertId(), 
                'player_id' => $player_id, 
                'role' => 'player1',
                'message' => 'Created new game'
            ]);
        }
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
