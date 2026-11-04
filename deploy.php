<?php
// Self-contained deploy & sync script
$token = isset($_GET['token']) ? $_GET['token'] : '';
if ($token !== 'cit_deploy_2026') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}

$target = '/home/gctbhakk/cit.gctbhakkar.edu.pk';

// 1. Run git pull inside the live web root
$gitPull = shell_exec("cd {$target} && git pull origin main 2>&1");
$gitLog  = shell_exec("cd {$target} && git log --oneline -3 2>&1");

// 2. Read database credentials directly without requiring external files
$dbConfigContent = @file_get_contents($target . '/db_config.php');
$dbHost = 'localhost';
$dbName = 'gctbhakk_examdb';
$dbUser = 'gctbhakk';
$dbPass = '';

if ($dbConfigContent) {
    if (preg_match("/define\('DB_HOST',\s*'([^']+)'\)/", $dbConfigContent, $m)) $dbHost = $m[1];
    if (preg_match("/define\('DB_NAME',\s*'([^']+)'\)/", $dbConfigContent, $m)) $dbName = $m[1];
    if (preg_match("/define\('DB_USER',\s*'([^']+)'\)/", $dbConfigContent, $m)) $dbUser = $m[1];
    if (preg_match("/define\('DB_PASS',\s*'([^']*)'\)/", $dbConfigContent, $m)) $dbPass = $m[1];
}

$dbReport = [];
try {
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT `data_json` FROM `cit_app_store` WHERE `id` = 1");
    $row = $stmt->fetch();
    if ($row && !empty($row['data_json'])) {
        $data = json_decode($row['data_json'], true);
        $repaired = false;
        if (isset($data['marks']) && is_array($data['marks'])) {
            foreach ($data['marks'] as $dsId => &$subs) {
                if (is_array($subs)) {
                    foreach ($subs as $subCode => &$marksMap) {
                        if (is_array($marksMap) && empty($marksMap)) {
                            $marksMap = (object)[];
                            $repaired = true;
                            $dbReport[] = "Fixed empty list in {$dsId}::{$subCode}";
                        }
                    }
                    unset($marksMap);
                }
            }
            unset($subs);
        }

        if ($repaired) {
            $cleanedJson = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            $upd = $pdo->prepare("UPDATE `cit_app_store` SET `data_json` = :json, `updated_at` = NOW() WHERE `id` = 1");
            $upd->execute([':json' => $cleanedJson]);
            @file_put_contents($target . '/data.json', $cleanedJson);
        }
    }
} catch (Exception $e) {
    $dbReport[] = "DB Notice: " . $e->getMessage();
}

header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'git_pull' => $gitPull,
    'git_log' => $gitLog,
    'db_report' => $dbReport
], JSON_PRETTY_PRINT);
