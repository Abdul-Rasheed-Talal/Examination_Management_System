<?php
/**
 * Central Cloud Persistence API for CIT Academic & Result Management System
 * Supports multi-user concurrent access from any device over the internet.
 * 
 * Multi-Tier High-Availability Architecture:
 * - Priority 1: MySQL Database (MariaDB / cPanel / CWP)
 * - Priority 2: JSON File ('data.json') automatic fallback
 * 
 * Auto-Synchronization:
 * Every save operation synchronizes to MySQL and keeps 'data.json' updated as a hot standby.
 * If the database goes offline, 'data.json' seamlessly handles reads and writes without data loss.
 */

define('CIT_API_ENTRY', true);

// Strict UTF-8 and JSON headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Cache-Control, Pragma, X-Requested-With');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load Database Configuration and Database Manager
$dbConfigFile = __DIR__ . '/db_config.php';
$dbClassFile = __DIR__ . '/db.php';
$dataFile = __DIR__ . '/data.json';
$backupFile = __DIR__ . '/data_backup.json';

if (file_exists($dbConfigFile)) {
    require_once $dbConfigFile;
}
if (file_exists($dbClassFile)) {
    require_once $dbClassFile;
}

// Initialize Database Instance (handles connection failure gracefully)
$db = null;
if (class_exists('CITDatabase')) {
    $db = new CITDatabase();
}

// Helper: Check file writability
function checkWritable($file) {
    if (file_exists($file)) {
        return is_writable($file);
    }
    return is_writable(dirname($file));
}

// Helper: Save to data.json with file locking and backup protection
function writeToJsonFile($dataFile, $backupFile, array $data) {
    // Create rolling backup copy
    if (file_exists($dataFile) && filesize($dataFile) > 100) {
        @copy($dataFile, $backupFile);
    }

    $fp = @fopen($dataFile, 'c+');
    if (!$fp) {
        return [
            "success" => false, 
            "error" => "Permission denied opening data.json for writing. Check file permissions (664 / 666)."
        ];
    }

    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        $jsonString = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $written = fwrite($fp, $jsonString);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        if ($written !== false) {
            return ["success" => true, "bytes" => $written];
        }
    } else {
        fclose($fp);
    }

    return ["success" => false, "error" => "Failed to acquire lock or write to data.json."];
}

// Action: Server Health and Diagnostics Check
if (isset($_GET['action']) && $_GET['action'] === 'health') {
    $jsonExists = file_exists($dataFile);
    $jsonWritable = checkWritable($dataFile);
    $dbConnected = ($db && $db->isConnected());
    $dbStats = ($db) ? $db->getStats() : ["connected" => false, "error" => "CITDatabase class missing"];

    echo json_encode([
        "status" => "online",
        "service" => "CIT Examination Cloud API",
        "active_storage" => $dbConnected ? "MySQL Database (Priority 1)" : "JSON File Fallback (Priority 2)",
        "database" => [
            "configured" => defined('DB_NAME') && defined('DB_USER') && !empty(DB_NAME),
            "connected" => $dbConnected,
            "host" => defined('DB_HOST') ? DB_HOST : 'localhost',
            "database_name" => defined('DB_NAME') ? DB_NAME : '',
            "user" => ($db && method_exists($db, 'getActiveUser')) ? $db->getActiveUser() : (defined('DB_USER') ? DB_USER : ''),
            "auto_seeded" => ($db && $db->wasAutoSeeded()),
            "stats" => $dbStats,
            "error" => ($db) ? $db->getLastError() : null
        ],
        "json_storage" => [
            "exists" => $jsonExists,
            "writable" => $jsonWritable,
            "size_bytes" => $jsonExists ? filesize($dataFile) : 0,
            "backup_exists" => file_exists($backupFile)
        ],
        "server_time" => date('Y-m-d H:i:s'),
        "php_version" => phpversion()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Action: Quick Test of Database Connection
if (isset($_GET['action']) && $_GET['action'] === 'test_connect') {
    $testUser = isset($_GET['user']) ? trim($_GET['user']) : (defined('DB_USER') ? DB_USER : 'gctbhakk');
    $testPass = isset($_GET['pass']) ? trim($_GET['pass']) : (defined('DB_PASS') ? DB_PASS : '');
    $testDb = isset($_GET['db']) ? trim($_GET['db']) : (defined('DB_NAME') ? DB_NAME : 'gctbhakk_examdb');
    $testHost = defined('DB_HOST') ? DB_HOST : 'localhost';

    $result = [
        "tested_host" => $testHost,
        "tested_database" => $testDb,
        "tested_user" => $testUser,
        "has_password" => !empty($testPass),
        "success" => false,
        "message" => ""
    ];

    try {
        $dsn = "mysql:host=$testHost;dbname=$testDb;charset=utf8mb4";
        $testPdo = new PDO($dsn, $testUser, $testPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3
        ]);
        $result["success"] = true;
        $result["message"] = "Connected successfully to MySQL database!";
        
        $tables = $testPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        $result["existing_tables"] = $tables;
    } catch (PDOException $e) {
        $result["success"] = false;
        $result["error_code"] = $e->getCode();
        $result["error_message"] = $e->getMessage();
    }

    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Action: Explicit Migration of data.json into Database
if (isset($_GET['action']) && $_GET['action'] === 'migrate_to_db') {
    if (!$db || !$db->isConnected()) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Database is not connected. Check db_config.php credentials.",
            "db_error" => $db ? $db->getLastError() : 'DB class missing'
        ]);
        exit;
    }

    if (!file_exists($dataFile)) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "data.json not found to migrate."]);
        exit;
    }

    $jsonContent = file_get_contents($dataFile);
    $data = json_decode($jsonContent, true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid JSON in data.json."]);
        exit;
    }

    $saved = $db->saveData($data);
    if ($saved) {
        echo json_encode([
            "status" => "success",
            "message" => "Successfully migrated all data from data.json into MySQL database!",
            "stats" => $db->getStats()
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Migration failed: " . $db->getLastError()
        ]);
    }
    exit;
}

// -------------------------------------------------------------
// GET: Read and return live application state
// Priority 1: MySQL Database -> Priority 2: data.json file
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 1. Primary: Try reading from MySQL Database
    if ($db && $db->isConnected()) {
        $rawJson = $db->getRawDataJson();
        if ($rawJson !== null && !empty(trim($rawJson))) {
            header('X-Storage-Source: MySQL-Database');
            header('X-Storage-Database: ' . (defined('DB_NAME') ? DB_NAME : 'unknown'));
            echo $rawJson;
            exit;
        }
    }

    // 2. Secondary Fallback: Read from data.json file
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        if ($content !== false && !empty(trim($content))) {
            header('X-Storage-Source: JSON-File-Fallback');
            if ($db && $db->getLastError()) {
                header('X-Database-Fallback-Reason: ' . substr(preg_replace('/\s+/', ' ', $db->getLastError()), 0, 120));
            }
            echo $content;
            exit;
        }
    }

    // Neither storage has valid data
    http_response_code(404);
    echo json_encode([
        "status" => "error",
        "message" => "No application data found in database or data.json.",
        "db_connected" => ($db && $db->isConnected()),
        "db_error" => ($db) ? $db->getLastError() : "DB not initialized",
        "json_writable" => checkWritable($dataFile)
    ]);
    exit;
}

// -------------------------------------------------------------
// POST: Save data atomically with dual-tier synchronization
// -------------------------------------------------------------
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

    $dbSaved = false;
    $dbError = null;

    // 1. Priority 1: Save to MySQL Database
    if ($db && $db->isConnected()) {
        $dbSaved = $db->saveData($decoded);
        if (!$dbSaved) {
            $dbError = $db->getLastError();
        }
    } else if ($db) {
        $dbError = $db->getLastError() ?: "Database connection offline.";
    }

    // 2. Dual-Sync & Fallback: Save to data.json file
    // Always mirror to data.json so data.json stays as a ready hot-standby!
    $jsonResult = writeToJsonFile($dataFile, $backupFile, $decoded);

    // Return response based on results
    if ($dbSaved) {
        echo json_encode([
            "status" => "success",
            "storage" => "database",
            "db_synced" => true,
            "json_backup_synced" => $jsonResult["success"],
            "message" => "Saved successfully to MySQL database (" . DB_NAME . ")" . ($jsonResult["success"] ? " and synchronized data.json backup." : "."),
            "timestamp" => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    // If Database save failed, but JSON file succeeded (Priority 2 Fallback)
    if ($jsonResult["success"]) {
        echo json_encode([
            "status" => "success",
            "storage" => "json_fallback",
            "db_synced" => false,
            "db_error" => $dbError,
            "json_backup_synced" => true,
            "message" => "Saved successfully to cloud file storage (Database offline fallback).",
            "timestamp" => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    // Both Database and File failed
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to save data to both Database and data.json.",
        "db_error" => $dbError,
        "json_error" => isset($jsonResult["error"]) ? $jsonResult["error"] : "Unknown file error."
    ]);
    exit;
}
