CREATE DATABASE IF NOT EXISTS battleship_db;
USE battleship_db;

CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player1_id VARCHAR(50),
    player2_id VARCHAR(50),
    current_turn VARCHAR(50),
    status ENUM('waiting', 'active', 'finished') DEFAULT 'waiting',
    winner VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT,
    player_id VARCHAR(50),
    size INT,
    x INT,
    y INT,
    orientation VARCHAR(10), -- 'horizontal' or 'vertical'
    hits INT DEFAULT 0,
    sunk BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT,
    player_id VARCHAR(50), -- who fired the shot
    x INT,
    y INT,
    result ENUM('hit', 'miss', 'sunk'),
    ship_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS players (
    player_id VARCHAR(50) PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
