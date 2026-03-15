-- EnderScope auth database schema
-- Works with MySQL-compatible databases such as TiDB Cloud.

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) DEFAULT NULL,
    google_id     VARCHAR(255) DEFAULT NULL UNIQUE,
    avatar        VARCHAR(500) DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
);
