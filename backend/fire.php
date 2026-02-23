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
$x = $input['x'];
$y = $input['y'];

if (!$game_id || !$player_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

try {
    // Check turn
    $stmt = $pdo->prepare("SELECT current_turn, player1_id, player2_id FROM games WHERE id = ?");
    $stmt->execute([$game_id]);
    $game = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$game || $game['current_turn'] !== $player_id) {
        echo json_encode(['status' => 'not_your_turn']);
        exit;
    }

    $opponent_id = ($game['player1_id'] === $player_id) ? $game['player2_id'] : $game['player1_id'];

    // Check that opponent has placed their ships before allowing shots
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM ships WHERE game_id = ? AND player_id = ?");
    $stmt->execute([$game_id, $opponent_id]);
    if ((int)$stmt->fetchColumn() === 0) {
        echo json_encode(['status' => 'waiting_for_ships']);
        exit;
    }

    // Check hit
    $hit = false;
    $sunk = false;
    $hit_ship_id = null;

    $stmt = $pdo->prepare("SELECT * FROM ships WHERE game_id = ? AND player_id = ?");
    $stmt->execute([$game_id, $opponent_id]);
    $ships = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($ships as $ship) {
        $shipX = (int)$ship['x'];
        $shipY = (int)$ship['y'];
        $size = (int)$ship['size'];
        $orientation = $ship['orientation'];
        
        $ship_hit = false;
        if ($orientation === 'horizontal') {
            if ($y == $shipY && $x >= $shipX && $x < $shipX + $size) {
                $ship_hit = true;
            }
        } else {
            if ($x == $shipX && $y >= $shipY && $y < $shipY + $size) {
                $ship_hit = true;
            }
        }

        if ($ship_hit) {
            $hit = true;
            $hit_ship_id = $ship['id'];
            // Update hits
            $new_hits = $ship['hits'] + 1;
            $is_sunk = ($new_hits >= $size);
            
            $update_sql = "UPDATE ships SET hits = ? WHERE id = ?";
            if ($is_sunk) {
                $update_sql = "UPDATE ships SET hits = ?, sunk = 1 WHERE id = ?";
                $sunk = true;
            }
            $stmt = $pdo->prepare($update_sql);
            $stmt->execute([$new_hits, $ship['id']]);
            break;
        }
    }

    // Record shot
    $result = $sunk ? 'sunk' : ($hit ? 'hit' : 'miss');
    $stmt = $pdo->prepare("INSERT INTO shots (game_id, player_id, x, y, result, ship_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$game_id, $player_id, $x, $y, $result, $hit_ship_id]);

    // Check if all opponent ships are sunk (game over)
    $game_over = false;
    if ($sunk) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM ships WHERE game_id = ? AND player_id = ? AND sunk = 0");
        $stmt->execute([$game_id, $opponent_id]);
        $remaining = (int)$stmt->fetchColumn();
        if ($remaining === 0) {
            $game_over = true;
            $stmt = $pdo->prepare("UPDATE games SET status = 'finished', winner = ?, current_turn = NULL WHERE id = ?");
            $stmt->execute([$player_id, $game_id]);
        }
    }

    if (!$game_over) {
        // Update turn
        $stmt = $pdo->prepare("UPDATE games SET current_turn = ? WHERE id = ?");
        $stmt->execute([$opponent_id, $game_id]);
    }

    echo json_encode([
        'status' => 'ok',
        'result' => $result,
        'ship_id' => $hit_ship_id,
        'x' => $x,
        'y' => $y,
        'game_over' => $game_over,
        'winner' => $game_over ? $player_id : null
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
