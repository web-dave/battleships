<?php
require 'db.php';

$sql = file_get_contents('schema.sql');

try {
    // Split SQL by semicolon to execute multiple statements if needed, 
    // although PDO might support it directly depending on driver.
    // Safest is to loop.
    $statements = explode(';', $sql);
    foreach ($statements as $statement) {
        if (trim($statement)) {
            $pdo->exec($statement);
        }
    }
    echo "Database and tables created successfully.";
} catch (PDOException $e) {
    echo "Error creating tables: " . $e->getMessage();
}
?>
