<?php
/**
 * One-time deployment force-reset script.
 * IMPORTANT: Delete this file immediately after running it.
 */

// Simple token protection — change this if needed
$token = isset($_GET['token']) ? $_GET['token'] : '';
$expected = 'cit_deploy_2026';

if ($token !== $expected) {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized. Provide ?token=cit_deploy_2026']));
}

$repoPath = '/home/gctbhakk/cit.gctbhakkar.edu.pk';

$commands = [
    "cd {$repoPath} && git fetch origin 2>&1",
    "cd {$repoPath} && git reset --hard origin/main 2>&1",
    "cd {$repoPath} && git status 2>&1",
    "cd {$repoPath} && git log --oneline -5 2>&1",
];

$results = [];
foreach ($commands as $cmd) {
    $output = shell_exec($cmd);
    $results[] = [
        'cmd' => $cmd,
        'output' => $output,
    ];
}

header('Content-Type: application/json');
echo json_encode([
    'status' => 'done',
    'results' => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
