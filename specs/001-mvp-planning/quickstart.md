# PTC Quick Start Guide

## Installation

### Prerequisites
- Node.js 16.0.0 or higher
- MySQL 8.0 or higher (local or remote)

### Install PTC
```bash
npm install -g punch-the-clock
```

### Database Setup
PTC will automatically create the database schema on first run. You can also set it up manually:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE ptc;"

# Set up user (optional)
mysql -u root -p -e "CREATE USER 'ptc'@'localhost' IDENTIFIED BY 'password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON ptc.* TO 'ptc'@'localhost';"
```

## First Steps

### 1. Initialize Your First Project
```bash
ptc init my-first-project
```

### 2. Add Your First Task
```bash
ptc add "Set up development environment" --estimate 2h --size 3
```

### 3. Start Time Tracking
```bash
ptc start 1
```

### 4. Stop Time Tracking
```bash
ptc stop
```

### 5. View Your Time
```bash
ptc report time
```

## Basic Commands

### Project Management
```bash
# Create a new project
ptc init <project-name>

# List all projects
ptc list projects

# Switch to a project
ptc project <project-name>
```

### Task Management
```bash
# Add a new task
ptc add "Task title" [--estimate 2h] [--size 3]

# List tasks in current project
ptc list tasks

# Show task details
ptc task <task-id>

# Update task
ptc update <task-id> --state completed
```

### Time Tracking
```bash
# Start tracking time for a task
ptc start <task-id>

# Pause current time tracking
ptc pause

# Resume paused time tracking
ptc resume

# Stop time tracking
ptc stop
```

### Reporting
```bash
# Show time spent by task/project
ptc report time

# Show velocity metrics
ptc report velocity

# Show estimation accuracy
ptc report estimates
```

## Common Workflows

### Daily Time Tracking
```bash
# Morning: Start your day
ptc project my-project
ptc start 1  # Start working on task 1

# Break: Pause tracking
ptc pause

# Back to work: Resume
ptc resume

# End of day: Stop tracking
ptc stop
```

### Sprint Planning
```bash
# Create sprint project
ptc init sprint-2024-01

# Add sprint tasks with estimates
ptc add "Implement user authentication" --estimate 8h --size 5
ptc add "Add password reset" --estimate 4h --size 3
ptc add "Write unit tests" --estimate 6h --size 2

# Track time during sprint
ptc start 1
# ... work ...
ptc stop
```

### Velocity Analysis
```bash
# After completing tasks, check velocity
ptc report velocity

# Check estimation accuracy
ptc report estimates

# See time breakdown
ptc report time --by project
ptc report time --by tags
```

## Configuration

### Database Connection
Create a `.ptcrc` file in your home directory:

```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "ptc",
    "password": "password",
    "database": "ptc"
  }
}
```

### Default Settings
```json
{
  "defaults": {
    "timezone": "UTC",
    "dateFormat": "YYYY-MM-DD",
    "timeFormat": "HH:mm:ss"
  }
}
```

## Tips and Best Practices

### Task Organization
- Use descriptive task titles
- Add size estimates in story points (1, 2, 3, 5, 8, 13)
- Add time estimates in hours
- Use tags to categorize tasks

### Time Tracking
- Start tracking when you begin working
- Pause for breaks and interruptions
- Stop when you're done for the day
- Be consistent with your tracking

### Estimation
- Start with rough estimates
- Review and adjust based on actual time
- Use velocity reports to improve accuracy
- Track estimation accuracy over time

### Reporting
- Check velocity weekly
- Review estimation accuracy monthly
- Use reports for sprint planning
- Export data for external analysis

## Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify connection settings
ptc config show
```

#### Command Not Found
```bash
# Reinstall globally
npm uninstall -g punch-the-clock
npm install -g punch-the-clock
```

#### Permission Errors
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

### Getting Help
```bash
# Show help for any command
ptc --help
ptc add --help

# Show version
ptc --version
```

## Next Steps

- Explore advanced reporting features
- Set up automated backups
- Integrate with your development workflow
- Share velocity reports with your team
- Contribute to the project on GitHub
