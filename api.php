<?php
/**
 * Simple text-file persistence API for CIT Department Academic Portal
 * Used when hosted on PHP/Apache static web server or subdomain.
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/data.json';

// GET request: returns the data.json content
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        echo file_get_contents($dataFile);
    } else {
        echo json_encode(["error" => "data.json not found"]);
    }
    exit;
}

// POST request: saves updated data to data.json
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $decoded = json_decode($rawInput, true);

    if ($decoded === null) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid JSON payload"]);
        exit;
    }

    // Atomic file save
    $tempFile = $dataFile . '.tmp';
    if (file_put_contents($tempFile, json_encode($decoded, JSON_PRETTY_PRINT)) !== false) {
        if (rename($tempFile, $dataFile)) {
            echo json_encode(["status" => "success", "message" => "Saved successfully to data.json"]);
            exit;
        }
    }

    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to write data.json. Check file permissions."]);
    exit;
}
