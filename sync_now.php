<?php
/**
 * CIT System - Live Server Synchronization & Database Repair Script
 */

// 1. Secret authorization check
$token = isset($_GET['token']) ? $_GET['token'] : '';
if ($token !== 'cit_sync_2026') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized. Provide ?token=cit_sync_2026']));
}

$webRoot = '/home/gctbhakk/cit.gctbhakkar.edu.pk';

// 2. Git Synchronization: fetch & hard reset to origin/main
$gitCommands = [
    "cd {$webRoot} && git config --global --add safe.directory {$webRoot} 2>&1",
    "cd {$webRoot} && git fetch origin 2>&1",
    "cd {$webRoot} && git reset --hard origin/main 2>&1",
    "cd {$webRoot} && git status 2>&1",
    "cd {$webRoot} && git log --oneline -3 2>&1",
];

$gitResults = [];
foreach ($gitCommands as $cmd) {
    $out = shell_exec($cmd);
    $gitResults[] = [
        'cmd' => $cmd,
        'output' => trim((string)$out)
    ];
}

// 3. Database Marks Repair: Convert all empty list [] subject marks into objects {}
$dbCleanReport = [];
$dbConfigFile = $webRoot . '/db_config.php';
if (file_exists($dbConfigFile)) {
    $cfg = file_get_contents($dbConfigFile);
    $dbHost = 'localhost';
    $dbName = 'gctbhakk_examdb';
    $dbUser = 'gctbhakk';
    $dbPass = '';

    if (preg_match("/define\('DB_HOST',\s*'([^']+)'\)/", $cfg, $m)) $dbHost = $m[1];
    if (preg_match("/define\('DB_NAME',\s*'([^']+)'\)/", $cfg, $m)) $dbName = $m[1];
    if (preg_match("/define\('DB_USER',\s*'([^']+)'\)/", $cfg, $m)) $dbUser = $m[1];
    if (preg_match("/define\('DB_PASS',\s*'([^']*)'\)/", $cfg, $m)) $dbPass = $m[1];

    try {
        $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        $stmt = $pdo->query("SELECT `data_json` FROM `cit_app_store` WHERE `id` = 1");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row && !empty($row['data_json'])) {
            $data = json_decode($row['data_json'], true);
            $changed = false;

            if (isset($data['marks']) && is_array($data['marks'])) {
                foreach ($data['marks'] as $dsId => &$subs) {
                    if (is_array($subs)) {
                        foreach ($subs as $subCode => &$mMap) {
                            if (is_array($mMap) && empty($mMap)) {
                                $mMap = (object)[];
                                $changed = true;
                                $dbCleanReport[] = "Fixed empty list in {$dsId} -> {$subCode}";
                            }
                        }
                        unset($mMap);
                    }
                }
                unset($subs);
            }

            if ($changed) {
                $cleanedJson = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                $upd = $pdo->prepare("UPDATE `cit_app_store` SET `data_json` = :json, `updated_at` = NOW() WHERE `id` = 1");
                $upd->execute([':json' => $cleanedJson]);
                @file_put_contents($webRoot . '/data.json', $cleanedJson);
                $dbCleanReport[] = "Successfully saved cleaned JSON back to MySQL and data.json";
            } else {
                $dbCleanReport[] = "No corrupted empty list marks found in database";
            }
        }
    } catch (Exception $e) {
        $dbCleanReport[] = "DB Notice: " . $e->getMessage();
    }
}

// 4. Return complete status
header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'git_results' => $gitResults,
    'db_repair' => $dbCleanReport,
    'active_app_js_sample' => trim((string)shell_exec("head -15 {$webRoot}/js/app.js 2>&1")),
    'active_state_js_check' => strpos((string)@file_get_contents($webRoot . '/js/core/state.js'), 'clean objects, never arrays') !== false ? 'Updated' : 'Old'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

