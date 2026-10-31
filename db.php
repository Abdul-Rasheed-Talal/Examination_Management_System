<?php
/**
 * CIT Database Persistence Manager
 * Handles MySQL connection, automatic schema setup, auto-migration from data.json,
 * and high-performance querying with fallback resilience.
 */

if (!defined('CIT_API_ENTRY')) {
    http_response_code(403);
    exit('Direct access not permitted.');
}

class CITDatabase {
    /** @var PDO|null */
    private $pdo = null;
    private $connected = false;
    private $lastError = null;
    private $schemaReady = false;
    private $autoSeeded = false;

    public function __construct() {
        if (!defined('DB_ENABLED') || !DB_ENABLED) {
            $this->lastError = "Database disabled in configuration (DB_ENABLED = false).";
            return;
        }

        // Check if database parameters are empty or unconfigured
        if (empty(DB_NAME) || empty(DB_USER)) {
            $this->lastError = "Database name or username is not set in db_config.php.";
            return;
        }

        $this->connect();
    }

    private $activeUser = null;

    /**
     * Connect to MySQL via PDO with short timeout to prevent slow page loads
     */
    private function connect() {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3, // 3-second connect timeout
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
        ];

        // Primary candidate from db_config.php
        $candidates = [DB_USER];

        // Add common CWP account username variants automatically
        $prefix = 'gctbhakk_';
        $commonVariants = ['gctbhakk', $prefix . 'cit', $prefix . 'admin', $prefix . 'exam', $prefix . 'examuser', $prefix . 'user', 'cit', 'admin'];
        foreach ($commonVariants as $cv) {
            if (!in_array($cv, $candidates)) {
                $candidates[] = $cv;
            }
        }

        $lastEx = null;
        foreach ($candidates as $user) {
            if (empty($user)) continue;
            try {
                $this->pdo = new PDO($dsn, $user, DB_PASS, $options);
                $this->connected = true;
                $this->activeUser = $user;
                $this->lastError = null;

                // Ensure required tables exist and auto-seed if empty
                $this->ensureSchemaAndData();
                return;
            } catch (PDOException $e) {
                $lastEx = $e;
                // If the error is not 'Access denied' (e.g. unknown database, host error), stop trying
                if (strpos($e->getMessage(), 'Access denied') === false && $e->getCode() != 1045) {
                    break;
                }
            }
        }

        $this->pdo = null;
        $this->connected = false;
        $this->lastError = $lastEx ? $lastEx->getMessage() : "Could not connect with configured credentials.";
    }

    public function getActiveUser() {
        return $this->activeUser ?: (defined('DB_USER') ? DB_USER : '');
    }

    public function isConnected() {
        return $this->connected && $this->pdo !== null;
    }

    public function getLastError() {
        return $this->lastError;
    }

    public function wasAutoSeeded() {
        return $this->autoSeeded;
    }

    /**
     * Auto-create required tables if they do not exist
     */
    public function ensureSchemaAndData() {
        if (!$this->isConnected()) return false;

        try {
            // 1. Primary Full-Fidelity State Store
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `cit_app_store` (
                    `id` INT NOT NULL PRIMARY KEY,
                    `data_json` LONGTEXT NOT NULL,
                    `version` VARCHAR(50) DEFAULT 'v5',
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 2. Relational Table: Students (for direct querying and phpMyAdmin inspection)
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `cit_students` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `roll` VARCHAR(50) NOT NULL UNIQUE,
                    `name` VARCHAR(150) NOT NULL,
                    `class_id` VARCHAR(20) NOT NULL,
                    `session` VARCHAR(30) NOT NULL,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_class_session` (`class_id`, `session`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 3. Relational Table: Date Sheets
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `cit_datesheets` (
                    `id` VARCHAR(100) NOT NULL PRIMARY KEY,
                    `class_id` VARCHAR(20) NOT NULL,
                    `exam_type` VARCHAR(50) NOT NULL,
                    `exam_title` VARCHAR(150) NOT NULL,
                    `session` VARCHAR(30) NOT NULL,
                    `created_at` VARCHAR(50) NULL,
                    `items_json` LONGTEXT NULL,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_class_exam` (`class_id`, `exam_type`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 4. Relational Table: Marks
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `cit_marks` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `datesheet_id` VARCHAR(100) NOT NULL,
                    `subject_code` VARCHAR(50) NOT NULL,
                    `roll` VARCHAR(50) NOT NULL,
                    `marks` VARCHAR(20) NOT NULL,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY `uniq_ds_sub_roll` (`datesheet_id`, `subject_code`, `roll`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 5. Relational Table: Settings
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `cit_settings` (
                    `setting_key` VARCHAR(50) NOT NULL PRIMARY KEY,
                    `setting_value` TEXT NOT NULL,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 6. Relational Table: Teachers
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `cit_teachers` (
                    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
                    `name` VARCHAR(150) NOT NULL,
                    `username` VARCHAR(80) NOT NULL UNIQUE,
                    `password` VARCHAR(255) NOT NULL,
                    `assigned_classes` TEXT NULL,
                    `assigned_subjects` LONGTEXT NULL,
                    `created_at` VARCHAR(50) NULL,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_username` (`username`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 7. Relational Table: Sheet Locks
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `cit_sheet_locks` (
                    `lock_key` VARCHAR(150) NOT NULL PRIMARY KEY,
                    `datesheet_id` VARCHAR(100) NOT NULL,
                    `subject_code` VARCHAR(50) NOT NULL,
                    `is_locked` TINYINT(1) DEFAULT 1,
                    `locked_by` VARCHAR(150) NULL,
                    `locked_at` VARCHAR(50) NULL,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_lock_ds` (`datesheet_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 8. Relational Table: Edit Requests
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `cit_edit_requests` (
                    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
                    `datesheet_id` VARCHAR(100) NOT NULL,
                    `subject_code` VARCHAR(50) NOT NULL,
                    `class_id` VARCHAR(20) NOT NULL,
                    `teacher_username` VARCHAR(80) NOT NULL,
                    `teacher_name` VARCHAR(150) NULL,
                    `reason` TEXT NOT NULL,
                    `status` VARCHAR(20) DEFAULT 'pending',
                    `created_at` VARCHAR(50) NULL,
                    `reviewed_at` VARCHAR(50) NULL,
                    `reviewed_by` VARCHAR(80) NULL,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_req_status` (`status`),
                    INDEX `idx_req_teacher` (`teacher_username`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $this->schemaReady = true;

            // Check if database is empty. If empty, auto-migrate existing data.json into MySQL!
            $stmt = $this->pdo->query("SELECT COUNT(*) as cnt FROM `cit_app_store` WHERE `id` = 1");
            $row = $stmt->fetch();
            $hasData = ($row && intval($row['cnt']) > 0);

            if (!$hasData) {
                $jsonFile = __DIR__ . '/data.json';
                if (file_exists($jsonFile)) {
                    $jsonContent = @file_get_contents($jsonFile);
                    if ($jsonContent) {
                        $decoded = json_decode($jsonContent, true);
                        if (is_array($decoded) && isset($decoded['classes'])) {
                            $this->saveData($decoded, true);
                            $this->autoSeeded = true;
                        }
                    }
                }
            }

            return true;
        } catch (PDOException $e) {
            $this->lastError = "Schema setup error: " . $e->getMessage();
            return false;
        }
    }

    /**
     * Read full application payload from MySQL
     * Returns JSON string directly to save memory and decoding overhead
     */
    public function getRawDataJson() {
        if (!$this->isConnected()) return null;

        try {
            $stmt = $this->pdo->prepare("SELECT `data_json` FROM `cit_app_store` WHERE `id` = 1 LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch();
            if ($row && !empty($row['data_json'])) {
                return $row['data_json'];
            }
        } catch (PDOException $e) {
            $this->lastError = "DB Read Error: " . $e->getMessage();
        }

        return null;
    }

    /**
     * Read application data as decoded associative array
     */
    public function getData() {
        $raw = $this->getRawDataJson();
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
        return null;
    }

    /**
     * Persist application data to MySQL
     * Updates cit_app_store and synchronizes relational tables
     */
    public function saveData(array $data, $isInitialSeed = false) {
        if (!$this->isConnected()) return false;

        try {
            $jsonString = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            if (!$jsonString) {
                $this->lastError = "Failed to encode data to JSON.";
                return false;
            }

            // Begin transaction for database integrity
            $this->pdo->beginTransaction();

            // 1. Save canonical full payload in cit_app_store
            $stmt = $this->pdo->prepare("
                INSERT INTO `cit_app_store` (`id`, `data_json`, `version`, `updated_at`)
                VALUES (1, :json_data, 'v5', NOW())
                ON DUPLICATE KEY UPDATE 
                    `data_json` = VALUES(`data_json`),
                    `version` = VALUES(`version`),
                    `updated_at` = NOW()
            ");
            $stmt->execute([':json_data' => $jsonString]);

            // 2. Synchronize relational students table
            if (isset($data['students']) && is_array($data['students'])) {
                $studentStmt = $this->pdo->prepare("
                    INSERT INTO `cit_students` (`roll`, `name`, `class_id`, `session`)
                    VALUES (:roll, :name, :class_id, :session)
                    ON DUPLICATE KEY UPDATE 
                        `name` = VALUES(`name`),
                        `class_id` = VALUES(`class_id`),
                        `session` = VALUES(`session`),
                        `updated_at` = NOW()
                ");

                foreach ($data['students'] as $classId => $studentList) {
                    if (is_array($studentList)) {
                        foreach ($studentList as $student) {
                            if (!empty($student['roll']) && !empty($student['name'])) {
                                $studentStmt->execute([
                                    ':roll' => trim($student['roll']),
                                    ':name' => trim($student['name']),
                                    ':class_id' => $classId,
                                    ':session' => isset($student['session']) ? $student['session'] : (isset($data['currentSession']) ? $data['currentSession'] : '')
                                ]);
                            }
                        }
                    }
                }
            }

            // 3. Synchronize datesheets table
            if (isset($data['datesheets']) && is_array($data['datesheets'])) {
                $dsStmt = $this->pdo->prepare("
                    INSERT INTO `cit_datesheets` (`id`, `class_id`, `exam_type`, `exam_title`, `session`, `created_at`, `items_json`)
                    VALUES (:id, :class_id, :exam_type, :exam_title, :session, :created_at, :items_json)
                    ON DUPLICATE KEY UPDATE 
                        `class_id` = VALUES(`class_id`),
                        `exam_type` = VALUES(`exam_type`),
                        `exam_title` = VALUES(`exam_title`),
                        `session` = VALUES(`session`),
                        `created_at` = VALUES(`created_at`),
                        `items_json` = VALUES(`items_json`),
                        `updated_at` = NOW()
                ");

                foreach ($data['datesheets'] as $ds) {
                    if (!empty($ds['id'])) {
                        $dsStmt->execute([
                            ':id' => $ds['id'],
                            ':class_id' => isset($ds['classId']) ? $ds['classId'] : '',
                            ':exam_type' => isset($ds['examType']) ? $ds['examType'] : '',
                            ':exam_title' => isset($ds['title']) ? $ds['title'] : (isset($ds['examTypeName']) ? $ds['examTypeName'] : ''),
                            ':session' => isset($ds['session']) ? $ds['session'] : '',
                            ':created_at' => isset($ds['createdAt']) ? $ds['createdAt'] : date('Y-m-d'),
                            ':items_json' => isset($ds['items']) ? json_encode($ds['items'], JSON_UNESCAPED_UNICODE) : '[]'
                        ]);
                    }
                }
            }

            // 4. Synchronize marks table
            if (isset($data['marks']) && is_array($data['marks'])) {
                $markStmt = $this->pdo->prepare("
                    INSERT INTO `cit_marks` (`datesheet_id`, `subject_code`, `roll`, `marks`)
                    VALUES (:datesheet_id, :subject_code, :roll, :marks)
                    ON DUPLICATE KEY UPDATE 
                        `marks` = VALUES(`marks`),
                        `updated_at` = NOW()
                ");

                foreach ($data['marks'] as $dsId => $subjects) {
                    if (is_array($subjects)) {
                        foreach ($subjects as $subCode => $rollMarks) {
                            if (is_array($rollMarks)) {
                                foreach ($rollMarks as $roll => $val) {
                                    $markStmt->execute([
                                        ':datesheet_id' => $dsId,
                                        ':subject_code' => $subCode,
                                        ':roll' => $roll,
                                        ':marks' => (string)$val
                                    ]);
                                }
                            }
                        }
                    }
                }
            }

            // 5. Synchronize core settings table
            $settingStmt = $this->pdo->prepare("
                INSERT INTO `cit_settings` (`setting_key`, `setting_value`)
                VALUES (:key, :val)
                ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`), `updated_at` = NOW()
            ");

            if (isset($data['institution'])) {
                $settingStmt->execute([':key' => 'institution', ':val' => json_encode($data['institution'], JSON_UNESCAPED_UNICODE)]);
            }
            if (isset($data['currentSession'])) {
                $settingStmt->execute([':key' => 'currentSession', ':val' => (string)$data['currentSession']]);
            }
            if (isset($data['passwords'])) {
                $settingStmt->execute([':key' => 'passwords', ':val' => json_encode($data['passwords'], JSON_UNESCAPED_UNICODE)]);
            }

            // 6. Synchronize teachers table
            if (isset($data['teachers']) && is_array($data['teachers'])) {
                $teacherStmt = $this->pdo->prepare("
                    INSERT INTO `cit_teachers` (`id`, `name`, `username`, `password`, `assigned_classes`, `assigned_subjects`, `created_at`)
                    VALUES (:id, :name, :username, :password, :classes, :subjects, :created_at)
                    ON DUPLICATE KEY UPDATE
                        `name` = VALUES(`name`),
                        `password` = VALUES(`password`),
                        `assigned_classes` = VALUES(`assigned_classes`),
                        `assigned_subjects` = VALUES(`assigned_subjects`),
                        `updated_at` = NOW()
                ");

                foreach ($data['teachers'] as $tch) {
                    if (!empty($tch['id']) && !empty($tch['username'])) {
                        $teacherStmt->execute([
                            ':id' => $tch['id'],
                            ':name' => isset($tch['name']) ? $tch['name'] : $tch['username'],
                            ':username' => trim($tch['username']),
                            ':password' => isset($tch['password']) ? $tch['password'] : '',
                            ':classes' => isset($tch['assignedClasses']) ? json_encode($tch['assignedClasses'], JSON_UNESCAPED_UNICODE) : '[]',
                            ':subjects' => isset($tch['assignedSubjects']) ? json_encode($tch['assignedSubjects'], JSON_UNESCAPED_UNICODE) : '{}',
                            ':created_at' => isset($tch['createdAt']) ? $tch['createdAt'] : date('Y-m-d H:i:s')
                        ]);
                    }
                }
            }

            // 7. Synchronize sheet locks table
            if (isset($data['sheetLocks']) && is_array($data['sheetLocks'])) {
                $lockStmt = $this->pdo->prepare("
                    INSERT INTO `cit_sheet_locks` (`lock_key`, `datesheet_id`, `subject_code`, `is_locked`, `locked_by`, `locked_at`)
                    VALUES (:lock_key, :datesheet_id, :subject_code, :is_locked, :locked_by, :locked_at)
                    ON DUPLICATE KEY UPDATE
                        `is_locked` = VALUES(`is_locked`),
                        `locked_by` = VALUES(`locked_by`),
                        `locked_at` = VALUES(`locked_at`),
                        `updated_at` = NOW()
                ");

                foreach ($data['sheetLocks'] as $key => $lockInfo) {
                    if (is_array($lockInfo) && isset($lockInfo['locked'])) {
                        $parts = explode('_', $key, 2);
                        $dsId = isset($lockInfo['dsId']) ? $lockInfo['dsId'] : (isset($parts[0]) ? $parts[0] : '');
                        $subCode = isset($lockInfo['subCode']) ? $lockInfo['subCode'] : (isset($parts[1]) ? $parts[1] : '');
                        $lockStmt->execute([
                            ':lock_key' => $key,
                            ':datesheet_id' => $dsId,
                            ':subject_code' => $subCode,
                            ':is_locked' => $lockInfo['locked'] ? 1 : 0,
                            ':locked_by' => isset($lockInfo['lockedBy']) ? $lockInfo['lockedBy'] : '',
                            ':locked_at' => isset($lockInfo['lockedAt']) ? $lockInfo['lockedAt'] : date('Y-m-d H:i:s')
                        ]);
                    }
                }
            }

            // 8. Synchronize edit requests table
            if (isset($data['editRequests']) && is_array($data['editRequests'])) {
                $reqStmt = $this->pdo->prepare("
                    INSERT INTO `cit_edit_requests` (`id`, `datesheet_id`, `subject_code`, `class_id`, `teacher_username`, `teacher_name`, `reason`, `status`, `created_at`, `reviewed_at`, `reviewed_by`)
                    VALUES (:id, :datesheet_id, :subject_code, :class_id, :teacher_username, :teacher_name, :reason, :status, :created_at, :reviewed_at, :reviewed_by)
                    ON DUPLICATE KEY UPDATE
                        `status` = VALUES(`status`),
                        `reviewed_at` = VALUES(`reviewed_at`),
                        `reviewed_by` = VALUES(`reviewed_by`),
                        `updated_at` = NOW()
                ");

                foreach ($data['editRequests'] as $req) {
                    if (!empty($req['id'])) {
                        $reqStmt->execute([
                            ':id' => $req['id'],
                            ':datesheet_id' => isset($req['dsId']) ? $req['dsId'] : '',
                            ':subject_code' => isset($req['subCode']) ? $req['subCode'] : '',
                            ':class_id' => isset($req['classId']) ? $req['classId'] : '',
                            ':teacher_username' => isset($req['teacherUsername']) ? $req['teacherUsername'] : '',
                            ':teacher_name' => isset($req['teacherName']) ? $req['teacherName'] : '',
                            ':reason' => isset($req['reason']) ? $req['reason'] : '',
                            ':status' => isset($req['status']) ? $req['status'] : 'pending',
                            ':created_at' => isset($req['createdAt']) ? $req['createdAt'] : date('Y-m-d H:i:s'),
                            ':reviewed_at' => isset($req['reviewedAt']) ? $req['reviewedAt'] : null,
                            ':reviewed_by' => isset($req['reviewedBy']) ? $req['reviewedBy'] : null
                        ]);
                    }
                }
            }

            $this->pdo->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->pdo && $this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            $this->lastError = "DB Write Error: " . $e->getMessage();
            return false;
        }
    }

    /**
     * Get system statistics and table health
     */
    public function getStats() {
        if (!$this->isConnected()) {
            return [
                "connected" => false,
                "error" => $this->lastError
            ];
        }

        $stats = [
            "connected" => true,
            "database" => DB_NAME,
            "host" => DB_HOST,
            "user" => DB_USER,
            "schema_ready" => $this->schemaReady,
            "auto_seeded" => $this->autoSeeded,
            "counts" => [
                "students" => 0,
                "datesheets" => 0,
                "marks_records" => 0
            ],
            "last_updated" => null
        ];

        try {
            // Count students
            $q1 = $this->pdo->query("SELECT COUNT(*) as c FROM `cit_students`");
            if ($q1) $stats['counts']['students'] = (int)$q1->fetch()['c'];

            // Count datesheets
            $q2 = $this->pdo->query("SELECT COUNT(*) as c FROM `cit_datesheets`");
            if ($q2) $stats['counts']['datesheets'] = (int)$q2->fetch()['c'];

            // Count marks
            $q3 = $this->pdo->query("SELECT COUNT(*) as c FROM `cit_marks`");
            if ($q3) $stats['counts']['marks_records'] = (int)$q3->fetch()['c'];

            // Count teachers
            $qTeacher = $this->pdo->query("SELECT COUNT(*) as c FROM `cit_teachers`");
            if ($qTeacher) $stats['counts']['teachers'] = (int)$qTeacher->fetch()['c'];

            // Count pending edit requests
            $qReq = $this->pdo->query("SELECT COUNT(*) as c FROM `cit_edit_requests` WHERE `status` = 'pending'");
            if ($qReq) $stats['counts']['pending_edit_requests'] = (int)$qReq->fetch()['c'];

            // Last updated timestamp
            $q4 = $this->pdo->query("SELECT `updated_at` FROM `cit_app_store` WHERE `id` = 1");
            if ($q4 && $row = $q4->fetch()) {
                $stats['last_updated'] = $row['updated_at'];
            }
        } catch (PDOException $e) {
            $stats['query_error'] = $e->getMessage();
        }

        return $stats;
    }
}
