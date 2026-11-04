<?php
$token = isset($_GET['token']) ? $_GET['token'] : '';
if ($token !== 'cit_deploy_2026') {
    die(json_encode(['error' => 'Unauthorized']));
}

// Define the security constant before requiring db_config.php
define('CIT_API_ENTRY', true);

$target = '/home/gctbhakk/cit.gctbhakkar.edu.pk';

// 1. Run git pull inside the live web root
$gitPull = shell_exec("cd {$target} && git pull origin main 2>&1");
$gitLog = shell_exec("cd {$target} && git log --oneline -3 2>&1");

// 2. Repair marks data in DB
$dbReport = [];
try {
    require_once $target . '/db_config.php';
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
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
            file_put_contents($target . '/data.json', $cleanedJson);
        }
    }
} catch (Exception $e) {
    $dbReport[] = "DB Error: " . $e->getMessage();
}

header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'git_pull' => $gitPull,
    'git_log' => $gitLog,
    'db_report' => $dbReport
], JSON_PRETTY_PRINT);
