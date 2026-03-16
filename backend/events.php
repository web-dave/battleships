<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Credentials: true'); // Sometimes needed for SSE

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require 'db.php';

$game_id = isset($_GET['game_id']) ? $_GET['game_id'] : null;
$player_id = isset($_GET['player_id']) ? $_GET['player_id'] : null;

if (!$game_id || !$player_id) {
    http_response_code(400);
    echo "data: " . json_encode(['error' => 'Missing params']) . "\n\n";
    exit;
}

// Disable time limit for long polling / SSE
set_time_limit(0);

// Helper function to send SSE data
function sendMsg($data) {
    echo "data: " . json_encode($data) . "\n\n";
    @ob_flush();
    flush();
}

$last_state_hash = '';

$max_execution_time = 25; // 25 seconds max to avoid 504 Gateway Timeout
$start_time = time();

echo "retry: 1000\n\n"; // Reconnect after 1s
@ob_flush();
flush();

try {
    while (true) {
        if (time() - $start_time > $max_execution_time) {
            break; // Exit cleanly so client reconnects
        }

        $stmt = $pdo->prepare("SELECT * FROM games WHERE id = ?");
        $stmt->execute([$game_id]);
        $game = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$game) {
            sendMsg(['error' => 'Game not found']);
            break;
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
            $ship['orientation'] = (string)$ship['orientation'];
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

        // Check if opponent has placed their ships
        $opponent_ships_placed = false;
        if ($opponent_id) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM ships WHERE game_id = ? AND player_id = ?");
            $stmt->execute([$game_id, $opponent_id]);
            $opponent_ships_placed = (int)$stmt->fetchColumn() > 0;
        }

        $current_data = [
            'game_status' => $game['status'],
            'current_turn' => $game['current_turn'],
            'winner' => $game['winner'],
            'opponent_shots' => $opponent_shots,
            'my_shots' => $my_shots,
            'my_ships' => $my_ships,
            'opponent_id' => $opponent_id,
            'opponent_name' => $opponent_name,
            'opponent_ships_placed' => $opponent_ships_placed,
        ];

        $current_hash = md5(json_encode($current_data));

        if ($current_hash !== $last_state_hash) {
            sendMsg($current_data);
            $last_state_hash = $current_hash;
        } else {
            echo ": keep-alive\n\n";
            @ob_flush();
            flush();
        }

        if (connection_aborted()) break;

        sleep(1);
    }
} catch (Exception $e) {
    sendMsg(['error' => $e->getMessage()]);
}
?>
