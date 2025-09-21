-- Migration: 001_initial_schema.sql
-- Version: 1.0.0
-- Description: Initial database schema creation

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    state ENUM('pending', 'in-progress', 'completed', 'blocked') DEFAULT 'pending',
    size_estimate DECIMAL(10,2),
    time_estimate_hours DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_task_number (project_id, number),
    INDEX idx_project_id (project_id),
    INDEX idx_state (state),
    INDEX idx_created_at (created_at)
);

-- Task Tags Table
CREATE TABLE IF NOT EXISTS task_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_task_tag (task_id, tag),
    INDEX idx_tag (tag)
);

-- Time Sessions Table
CREATE TABLE IF NOT EXISTS time_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    paused_at TIMESTAMP NULL,
    resumed_at TIMESTAMP NULL,
    stopped_at TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_started_at (started_at),
    INDEX idx_stopped_at (stopped_at)
);

-- Estimation History Table
CREATE TABLE IF NOT EXISTS estimation_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    size_estimate DECIMAL(10,2),
    time_estimate_hours DECIMAL(10,2),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_changed_at (changed_at)
);

-- Configuration Table
CREATE TABLE IF NOT EXISTS configuration (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (key)
);

-- Insert default configuration
INSERT IGNORE INTO configuration (key, value) VALUES 
('database_version', '1.0.0'),
('default_timezone', 'UTC'),
('default_time_format', 'HH:mm:ss'),
('default_date_format', 'YYYY-MM-DD');
