-- ==============================================================
-- CIT Department Examination & Result Management System
-- Database Schema for MySQL / MariaDB (cPanel / CWP phpMyAdmin)
-- ==============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
-- 1. Table structure for cit_app_store (Primary State Store)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cit_app_store` (
  `id` INT NOT NULL PRIMARY KEY,
  `data_json` LONGTEXT NOT NULL COMMENT 'Full JSON application state tree',
  `version` VARCHAR(50) DEFAULT 'v5',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Core reactive state for multi-user sync';

-- -------------------------------------------------------------
-- 2. Table structure for cit_students (Relational Students View)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cit_students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `roll` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Student Roll Number, e.g. 26-CIT-101',
  `name` VARCHAR(150) NOT NULL COMMENT 'Student Full Name',
  `class_id` VARCHAR(20) NOT NULL COMMENT 'cit1, cit2, or cit3',
  `session` VARCHAR(30) NOT NULL COMMENT 'Session, e.g. 2026-2027',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_class_session` (`class_id`, `session`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Department registered students';

-- -------------------------------------------------------------
-- 3. Table structure for cit_datesheets (Date Sheets & Schedules)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cit_datesheets` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY COMMENT 'Unique datesheet ID',
  `class_id` VARCHAR(20) NOT NULL COMMENT 'cit1, cit2, or cit3',
  `exam_type` VARCHAR(50) NOT NULL COMMENT 'monthly, midterm, or sendup',
  `exam_title` VARCHAR(150) NOT NULL COMMENT 'Exam display title',
  `session` VARCHAR(30) NOT NULL COMMENT 'Academic session',
  `created_at` VARCHAR(50) NULL COMMENT 'Creation date string',
  `items_json` LONGTEXT NULL COMMENT 'Subject schedules with dates and time slots',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_class_exam` (`class_id`, `exam_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Official examination date sheets';

-- -------------------------------------------------------------
-- 4. Table structure for cit_marks (Individual Student Marks)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cit_marks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `datesheet_id` VARCHAR(100) NOT NULL COMMENT 'References datesheet',
  `subject_code` VARCHAR(50) NOT NULL COMMENT 'Subject code, e.g. GEN-111, Math-123-A',
  `roll` VARCHAR(50) NOT NULL COMMENT 'Student Roll Number',
  `marks` VARCHAR(20) NOT NULL COMMENT 'Marks scored or ABS',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_ds_sub_roll` (`datesheet_id`, `subject_code`, `roll`),
  INDEX `idx_ds` (`datesheet_id`),
  INDEX `idx_roll` (`roll`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Subject examination marks';

-- -------------------------------------------------------------
-- 5. Table structure for cit_settings (App & Institution Settings)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cit_settings` (
  `setting_key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuration settings and metadata';

-- -------------------------------------------------------------
-- 6. Table structure for cit_teachers (Teacher Accounts & Assignments)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cit_teachers` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL COMMENT 'Teacher Full Name',
  `username` VARCHAR(80) NOT NULL UNIQUE COMMENT 'Teacher Login Username',
  `password` VARCHAR(255) NOT NULL COMMENT 'Teacher Login Password',
  `assigned_classes` TEXT NULL COMMENT 'JSON array of class IDs, e.g. ["cit1","cit2"]',
  `assigned_subjects` LONGTEXT NULL COMMENT 'JSON object of class-to-subject mappings',
  `created_at` VARCHAR(50) NULL COMMENT 'Account creation date',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Department teacher accounts & subject assignments';

-- -------------------------------------------------------------
-- 7. Table structure for cit_sheet_locks (Marks Sheet Lock Status)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cit_sheet_locks` (
  `lock_key` VARCHAR(150) NOT NULL PRIMARY KEY COMMENT 'Composite key: datesheet_id + _ + subject_code',
  `datesheet_id` VARCHAR(100) NOT NULL,
  `subject_code` VARCHAR(50) NOT NULL,
  `is_locked` TINYINT(1) DEFAULT 1 COMMENT '1 = locked, 0 = unlocked',
  `locked_by` VARCHAR(150) NULL COMMENT 'Teacher or admin who locked the sheet',
  `locked_at` VARCHAR(50) NULL COMMENT 'Lock timestamp string',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_lock_ds` (`datesheet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Subject marksheet lock status';

-- -------------------------------------------------------------
-- 8. Table structure for cit_edit_requests (Marks Edit Unlock Requests)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cit_edit_requests` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `datesheet_id` VARCHAR(100) NOT NULL,
  `subject_code` VARCHAR(50) NOT NULL,
  `class_id` VARCHAR(20) NOT NULL,
  `teacher_username` VARCHAR(80) NOT NULL,
  `teacher_name` VARCHAR(150) NULL,
  `reason` TEXT NOT NULL COMMENT 'Teacher reason for editing locked marks',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, approved, rejected, completed',
  `created_at` VARCHAR(50) NULL,
  `reviewed_at` VARCHAR(50) NULL,
  `reviewed_by` VARCHAR(80) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_req_status` (`status`),
  INDEX `idx_req_teacher` (`teacher_username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Marks edit permission requests submitted to administrator';

SET FOREIGN_KEY_CHECKS = 1;
