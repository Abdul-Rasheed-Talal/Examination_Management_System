<?php
/**
 * One-time deployment force-reset script.
 * IMPORTANT: Delete this file immediately after running it.
 */

$token = isset($_GET['token']) ? $_GET['token'] : '';
if ($token !== 'cit_deploy_2026') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized. Provide ?token=cit_deploy_2026']));
}

$webRoot = '/home/gctbhakk/cit.gctbhakkar.edu.pk';

// Step 1: Find the actual git repo location CWP uses
$findGit = shell_exec("find /home/gctbhakk -name '.git' -type d 2>&1 | head -20");
$findCwpRepos = shell_exec("find /home/gctbhakk -name 'config' -path '*/.git/config' 2>&1 | head -10");
$whoami = shell_exec("whoami 2>&1");
$lsWebRoot = shell_exec("ls -la {$webRoot}/js/ 2>&1 | head -10");

// Step 2: Try common CWP git repo paths
$possibleRepoPaths = [
    '/home/gctbhakk/.git_repos/cit_exam',
    '/home/gctbhakk/.cwp_git/cit_exam',
    '/home/gctbhakk/repositories/cit_exam',
    '/home/gctbhakk/git/cit_exam',
    '/usr/local/cwpsrv/var/git/cit_exam',
    '/root/git/cit_exam',
];

$foundRepo = null;
$repoChecks = [];
foreach ($possibleRepoPaths as $path) {
    $check = shell_exec("ls {$path} 2>&1 | head -3");
    $repoChecks[$path] = $check;
    if (strpos($check, 'fatal') === false && !empty(trim($check))) {
        $foundRepo = $path;
    }
}

// Step 3: If we found the repo, try to rsync/copy files to web root
$syncResult = null;
if ($foundRepo) {
    // Try git reset then rsync
    $gitReset = shell_exec("cd {$foundRepo} && git reset --hard origin/main 2>&1");
    $rsync = shell_exec("rsync -av --exclude='.git' --exclude='deploy.php' {$foundRepo}/ {$webRoot}/ 2>&1 | tail -20");
    $syncResult = ['git_reset' => $gitReset, 'rsync' => $rsync];
}

// Step 4: Check js/app.js date to confirm update
$appJsDate = shell_exec("stat -c '%y %s' {$webRoot}/js/app.js 2>&1");
$appJsHead = shell_exec("head -10 {$webRoot}/js/app.js 2>&1");

header('Content-Type: application/json');
echo json_encode([
    'status' => 'diagnostic',
    'whoami' => trim($whoami),
    'web_root_js' => $lsWebRoot,
    'app_js_date_size' => $appJsDate,
    'app_js_head' => $appJsHead,
    'git_dirs_found' => $findGit,
    'git_configs_found' => $findCwpRepos,
    'repo_path_checks' => $repoChecks,
    'found_repo' => $foundRepo,
    'sync_result' => $syncResult,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
