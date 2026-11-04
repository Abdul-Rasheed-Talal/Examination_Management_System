<?php
/**
 * Auto-Sync Deployment & Database Repair Script
 * Updates source git repo, cleans corrupted empty array marks in DB, and rsyncs to web root.
 */

$token = isset($_GET['token']) ? $_GET['token'] : '';
if ($token !== 'cit_deploy_2026') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}

$source = '/home/gctbhakk/home/gctbhakk/cit.gctbhakkar.edu.pk';
$target = '/home/gctbhakk/cit.gctbhakkar.edu.pk';

// 1. Pull latest git code in source repo
$gitPull = shell_exec("cd {$source} && git pull origin main 2>&1");
$gitLog  = shell_exec("cd {$source} && git log --oneline -2 2>&1");

// 2. Rsync files to live web root
$rsync = shell_exec("rsync -av --exclude='.git' --exclude='data.json' --exclude='data_backup.json' --exclude='data/' --exclude='db_config.php' {$source}/ {$target}/ 2>&1");

// 3. Repair MySQL database marks structure
$dbCleaned = false;
$cleanedSummary = [];
try {
    require_once 'db_config.php';
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT `data_json` FROM `cit_app_store` WHERE `id` = 1");
    $row = $stmt->fetch();
    if ($row && !empty($row['data_json'])) {
        $data = json_decode($row['data_json'], true);
        if (isset($data['marks']) && is_array($data['marks'])) {
            foreach ($data['marks'] as $dsId => &$subs) {
                if (is_array($subs)) {
                    foreach ($subs as $subCode => &$val) {
                        if (is_array($val) && empty($val)) {
                            $val = (object)[];
                            $dbCleaned = true;
                            $cleanedSummary[] = "{$dsId}::{$subCode} converted from [] to {}";
                        }
                    }
                    unset($val);
                }
            }
            unset($subs);

            if ($dbCleaned) {
                $cleanedJson = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                $upd = $pdo->prepare("UPDATE `cit_app_store` SET `data_json` = :json, `updated_at` = NOW() WHERE `id` = 1");
                $upd->execute([':json' => $cleanedJson]);
                file_put_contents('data.json', $cleanedJson);
            }
        }
    }
} catch (Exception $e) {
    $cleanedSummary[] = "DB Repair Error: " . $e->getMessage();
}

header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'git_pull' => $gitPull,
    'git_log' => $gitLog,
    'db_repaired' => $dbCleaned,
    'repair_details' => $cleanedSummary
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
