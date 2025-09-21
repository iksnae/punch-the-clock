# PTC Data Model

## Database Schema

### Projects Table
```sql
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
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
```

### Task Tags Table
```sql
CREATE TABLE task_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_task_tag (task_id, tag),
    INDEX idx_tag (tag)
);
```

### Time Sessions Table
```sql
CREATE TABLE time_sessions (
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
```

### Estimation History Table
```sql
CREATE TABLE estimation_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    size_estimate DECIMAL(10,2),
    time_estimate_hours DECIMAL(10,2),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_changed_at (changed_at)
);
```

### Configuration Table
```sql
CREATE TABLE configuration (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (key)
);
```

## Data Relationships

### Entity Relationship Diagram
```
Projects (1) -----> (N) Tasks
Tasks (1) -----> (N) Task Tags
Tasks (1) -----> (N) Time Sessions
Tasks (1) -----> (N) Estimation History
```

### Key Relationships
- **Projects to Tasks**: One-to-many (a project has many tasks)
- **Tasks to Tags**: Many-to-many (a task can have multiple tags)
- **Tasks to Time Sessions**: One-to-many (a task can have multiple time sessions)
- **Tasks to Estimation History**: One-to-many (track estimate changes over time)

## Data Validation Rules

### Projects
- Name must be unique across all projects
- Name cannot be empty or contain only whitespace
- Name length limited to 255 characters

### Tasks
- Task number must be unique within a project
- Title cannot be empty
- State must be one of: pending, in-progress, completed, blocked
- Size estimate must be positive if provided
- Time estimate must be positive if provided

### Time Sessions
- Started_at must be before paused_at (if provided)
- Paused_at must be before resumed_at (if provided)
- Resumed_at must be before stopped_at (if provided)
- Duration_seconds calculated automatically from timestamps

### Tags
- Tag names cannot be empty
- Tag names limited to 100 characters
- Case-insensitive uniqueness per task

## Indexing Strategy

### Primary Indexes
- **Projects**: Primary key on id, unique index on name
- **Tasks**: Primary key on id, composite unique index on (project_id, number)
- **Time Sessions**: Primary key on id, indexes on task_id and timestamps
- **Tags**: Primary key on id, composite unique index on (task_id, tag)

### Performance Indexes
- **Created/Updated timestamps**: For sorting and filtering
- **Task state**: For filtering by status
- **Tag names**: For tag-based queries
- **Time session timestamps**: For time-based reporting

## Data Migration Strategy

### Version 1.0 Schema
- Initial schema with all core tables
- Basic indexes for performance
- Foreign key constraints for data integrity

### Future Migrations
- Add indexes based on usage patterns
- Add new tables for advanced features
- Modify existing tables with ALTER statements
- Maintain backward compatibility where possible

## Backup and Recovery

### Backup Strategy
- **Full Backup**: Daily mysqldump of entire database
- **Incremental Backup**: Binary log replay for point-in-time recovery
- **Schema Backup**: Separate backup of schema definitions

### Recovery Procedures
- **Point-in-time Recovery**: Restore from full backup + binary logs
- **Schema Recovery**: Recreate tables from schema definitions
- **Data Validation**: Verify data integrity after recovery

## Performance Considerations

### Query Optimization
- Use EXPLAIN to analyze query performance
- Optimize slow queries with appropriate indexes
- Use LIMIT for pagination in large result sets
- Cache frequently accessed data

### Connection Management
- Use connection pooling for database connections
- Implement connection retry logic
- Set appropriate connection timeouts
- Monitor connection usage

### Data Archiving
- Archive old time sessions (older than 2 years)
- Archive completed tasks (older than 1 year)
- Maintain referential integrity during archiving
- Provide data export before archiving
