<?php
$db = new SQLite3('cfpmanager.sqlite');
$db->exec('CREATE TABLE IF NOT EXISTS syncdata (fields TEXT, lists TEXT, synced INT)');

if (isset($_POST['fields']) && isset($_POST['lists'])) {
    $stmt = $db->prepare('INSERT INTO syncdata (fields, lists, synced) VALUES (:fields, :lists, :synced)');
    $stmt->bindValue(':fields', $_POST['fields']);
    $stmt->bindValue(':lists', $_POST['lists']);
    $stmt->bindValue(':synced', time());
    $stmt->execute();
}

$dataStmt = $db->prepare('SELECT * FROM syncdata ORDER BY synced DESC LIMIT 0,1');
$dataResult = $dataStmt->execute();
echo json_encode($dataResult->fetchArray());
