<?php
/**
 * Database Configuration for CIT Examination & Result Management System
 * 
 * Instructions:
 * 1. DB_HOST: Usually 'localhost' on cPanel / CWP hosting.
 * 2. DB_NAME: Your MySQL database name (as shown in phpMyAdmin, e.g. 'gctbhakk_' or your created DB name).
 * 3. DB_USER: Your MySQL database user created in cPanel / CWP (e.g. 'gctbhakk_admin').
 * 4. DB_PASS: The password assigned to the MySQL database user.
 * 
 * Multi-Tier Failover:
 * - Priority 1: MySQL Database is used when available.
 * - Priority 2: JSON file ('data.json') is automatically used if the database is unreachable or offline.
 * - Both are automatically synchronized during every save so backups are always up-to-date!
 */

// Prevent direct browser URL execution
if (!defined('CIT_API_ENTRY')) {
    http_response_code(403);
    exit('Direct access not permitted.');
}

// MySQL Server Host (typically 'localhost' on cPanel & CWP)
define('DB_HOST', 'localhost');

// MySQL Database Name
define('DB_NAME', 'gctbhakk_examdb');

// MySQL Username
define('DB_USER', 'gctbhakk');

// MySQL Password
define('DB_PASS', 'cit@1234');

// MySQL Port
define('DB_PORT', 3306);

// Character encoding
define('DB_CHARSET', 'utf8mb4');

// Enable database priority (set to false to force JSON-only mode)
define('DB_ENABLED', true);
