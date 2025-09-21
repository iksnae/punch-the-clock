-- PTC Database Indexes
-- Version: 1.0.0
-- Description: Performance optimization indexes

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks(state);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_number ON tasks(number);

-- Task tags table indexes
CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);

-- Time sessions table indexes
CREATE INDEX IF NOT EXISTS idx_time_sessions_task_id ON time_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_started_at ON time_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_time_sessions_stopped_at ON time_sessions(stopped_at);
CREATE INDEX IF NOT EXISTS idx_time_sessions_duration ON time_sessions(duration_seconds);

-- Estimation history table indexes
CREATE INDEX IF NOT EXISTS idx_estimation_history_task_id ON estimation_history(task_id);
CREATE INDEX IF NOT EXISTS idx_estimation_history_changed_at ON estimation_history(changed_at);

-- Configuration table indexes
CREATE INDEX IF NOT EXISTS idx_configuration_key ON configuration(key);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_project_state ON tasks(project_id, state);
CREATE INDEX IF NOT EXISTS idx_time_sessions_task_started ON time_sessions(task_id, started_at);
CREATE INDEX IF NOT EXISTS idx_time_sessions_started_stopped ON time_sessions(started_at, stopped_at);
