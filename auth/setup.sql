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
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
) ENGINE=InnoDB;
