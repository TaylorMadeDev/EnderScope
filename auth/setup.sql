-- ServerBuster Auth Database Setup
-- Run this in phpMyAdmin (http://localhost/phpmyadmin) or MySQL CLI

CREATE DATABASE IF NOT EXISTS serverbuster
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE serverbuster;

CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) DEFAULT NULL,
    google_id     VARCHAR(255) DEFAULT NULL UNIQUE,
    avatar        VARCHAR(500) DEFAULT NULL,
    plan          VARCHAR(32)  NOT NULL DEFAULT 'dirt',
    role          VARCHAR(32)  NOT NULL DEFAULT 'member',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google_id (google_id),
    INDEX idx_plan (plan),
    INDEX idx_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_settings (
    user_id       BIGINT PRIMARY KEY,
    settings_json LONGTEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
