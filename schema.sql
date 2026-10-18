-- ====================================================================
-- CivicFix - Database Schema & Initial Seed
-- Smart Civic Issue & Road Hazard Tracker
-- ====================================================================

CREATE DATABASE IF NOT EXISTS civicfix
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE civicfix;

-- Disable foreign key checks while setting up tables
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- 1. Table: users
-- Stores registered citizens and administrators
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('CITIZEN', 'ADMIN') NOT NULL DEFAULT 'CITIZEN',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_photo VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table: email_verifications
-- Stores OTP codes for email verification and password reset flows
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS email_verifications;
CREATE TABLE email_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp VARCHAR(50) NOT NULL,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_verification_user (user_id),
    INDEX idx_verification_otp (otp),
    CONSTRAINT fk_verifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Table: issues
-- Stores reported civic issues and road hazards with geotagging
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS issues;
CREATE TABLE issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM(
        'ROAD_DAMAGE',
        'POTHOLE',
        'STREETLIGHT',
        'GARBAGE',
        'DRAINAGE',
        'WATER_LEAK',
        'OTHER'
    ) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(11, 7) NOT NULL,
    address VARCHAR(500) NOT NULL,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    upvote_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_issue_status (status),
    INDEX idx_issue_category (category),
    INDEX idx_issue_user (user_id),
    INDEX idx_issue_location (latitude, longitude),
    CONSTRAINT fk_issues_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Table: issue_images
-- Stores uploaded photo proofs associated with civic issues
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS issue_images;
CREATE TABLE issue_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_image_issue (issue_id),
    CONSTRAINT fk_images_issue
        FOREIGN KEY (issue_id) REFERENCES issues(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. Table: issue_upvotes
-- Tracks unique upvotes per citizen per issue
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS issue_upvotes;
CREATE TABLE issue_upvotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_issue_user (issue_id, user_id),
    INDEX idx_upvote_issue (issue_id),
    INDEX idx_upvote_user (user_id),
    CONSTRAINT fk_upvotes_issue
        FOREIGN KEY (issue_id) REFERENCES issues(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_upvotes_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. Table: issue_comments
-- Citizen and administrator comments/updates on issues
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS issue_comments;
CREATE TABLE issue_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_comment_issue (issue_id),
    INDEX idx_comment_user (user_id),
    CONSTRAINT fk_comments_issue
        FOREIGN KEY (issue_id) REFERENCES issues(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SEED DATA (Default Accounts & Demo Data)
-- Passwords:
--   Admin:   Admin@123   (Hash: $2b$10$wcEeeXQbCeUXIUaxjbynled3VHHyo/CK0EO3JYl9WdtMsSxD9kSR6)
--   Citizen: Citizen@123 (Hash: $2b$10$wcEeeXQbCeUXIUaxjbynled3VHHyo/CK0EO3JYl9WdtMsSxD9kSR6)
-- ====================================================================

INSERT INTO users (id, name, email, password, role, email_verified)
VALUES
(
    1,
    'Municipal Admin',
    'admin@civicfix.com',
    '$2b$10$wcEeeXQbCeUXIUaxjbynled3VHHyo/CK0EO3JYl9WdtMsSxD9kSR6',
    'ADMIN',
    TRUE
),
(
    2,
    'Priyanshu (Citizen)',
    'citizen@civicfix.com',
    '$2b$10$wcEeeXQbCeUXIUaxjbynled3VHHyo/CK0EO3JYl9WdtMsSxD9kSR6',
    'CITIZEN',
    TRUE
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Sample Demo Issue
INSERT INTO issues (id, user_id, category, title, description, severity, latitude, longitude, address, status, upvote_count)
VALUES
(
    1,
    2,
    'POTHOLE',
    'Deep dangerous pothole near campus main gate',
    'Large pothole on Doddaballapur Main Road causing vehicle damage and traffic bottlenecks.',
    'HIGH',
    13.13374340,
    77.56817410,
    'BMS Institute of Technology and Management, Doddaballapur Main Road, Avalahalli, Yelahanka, Bengaluru, Karnataka 560064',
    'IN_PROGRESS',
    3
)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Sample Comment
INSERT INTO issue_comments (id, issue_id, user_id, comment)
VALUES
(
    1,
    1,
    1,
    'Our municipal road inspection team has surveyed the site and repair works are scheduled for this week.'
)
ON DUPLICATE KEY UPDATE comment = VALUES(comment);
