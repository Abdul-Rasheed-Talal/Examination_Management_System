<?php
/**
 * Central Cloud Persistence API for CIT Academic & Result Management System
 * Supports multi-user concurrent access from any device over the internet.
 * Compatible with cPanel, Apache, and standard PHP 7.4 / 8.x hosting.
 */

// Strict UTF-8 and JSON headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cache-Control, Pragma');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/data.json';
$backupFile = __DIR__ . '/data_backup.json';

// Helper: Check file writability
function checkWritable($file) {
    if (file_exists($file)) {
        return is_writable($file);
    }
    return is_writable(dirname($file));
}

// Action: Server Health and Diagnostics Check
if (isset($_GET['action']) && $_GET['action'] === 'health') {
    $exists = file_exists($dataFile);
    $writable = checkWritable($dataFile);
    
    echo json_encode([
        "status" => "online",
        "service" => "CIT Examination Cloud API",
        "file_exists" => $exists,
        "file_writable" => $writable,
        "file_size_bytes" => $exists ? filesize($dataFile) : 0,
        "server_time" => date('Y-m-d H:i:s'),
        "php_version" => phpversion()
    ], JSON_PRETTY_PRINT);
    exit;
}

// GET: Read and return live data.json
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        if ($content !== false && !empty(trim($content))) {
            echo $content;
            exit;
        }
    }

    http_response_code(404);
    echo json_encode([
        "status" => "error",
        "message" => "data.json not found on server.",
        "writable" => checkWritable($dataFile),
        "hint" => "Please upload data.json to this directory or ensure directory permissions allow creating files."
    ]);
    exit;
}

// POST: Save data atomically with file locking and backup protection
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $decoded = json_decode($rawInput, true);

    if ($decoded === null || !is_array($decoded)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error", 
            "message" => "Invalid JSON payload received."
        ]);
        exit;
    }

    // Create a rolling backup copy if data.json already exists
    if (file_exists($dataFile) && filesize($dataFile) > 100) {
        @copy($dataFile, $backupFile);
    }

    // Open with 'c+' mode and exclusive file lock to prevent race conditions
    $fp = @fopen($dataFile, 'c+');
    if (!$fp) {
        http_response_code(500);
        echo json_encode([
            "status" => "error", 
            "message" => "Permission denied opening data.json for writing. In cPanel File Manager, please set data.json permissions to 664 or 666."
        ]);
        exit;
    }

    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        $jsonString = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $written = fwrite($fp, $jsonString);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        if ($written !== false) {
            echo json_encode([
                "status" => "success", 
                "message" => "Saved successfully to cloud server", 
                "bytes_written" => $written,
                "timestamp" => date('Y-m-d H:i:s')
            ]);
            exit;
        }
    } else {
        fclose($fp);
    }

    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Failed to acquire lock or write to data.json. Check cPanel disk space and directory permissions."
    ]);
    exit;
}
