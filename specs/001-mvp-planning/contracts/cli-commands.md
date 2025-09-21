# PTC CLI Commands Contract

## Command Structure

All PTC commands follow the pattern: `ptc <command> [options] [arguments]`

## Project Commands

### `ptc init <project-name>`
**Purpose**: Create a new project
**Arguments**:
- `project-name` (required): Name of the project to create

**Options**:
- `--description <text>`: Project description
- `--force`: Overwrite existing project

**Examples**:
```bash
ptc init my-project
ptc init "My Awesome Project" --description "A project for awesome things"
```

**Output**: Success message with project details

### `ptc list projects`
**Purpose**: List all projects
**Options**:
- `--format <table|json>`: Output format (default: table)

**Examples**:
```bash
ptc list projects
ptc list projects --format json
```

**Output**: Table or JSON list of projects with creation dates

### `ptc project <project-name>`
**Purpose**: Switch to a project context
**Arguments**:
- `project-name` (required): Name of the project to switch to

**Examples**:
```bash
ptc project my-project
```

**Output**: Confirmation message and current project context

## Task Commands

### `ptc add <title>`
**Purpose**: Add a new task to the current project
**Arguments**:
- `title` (required): Task title

**Options**:
- `--description <text>`: Task description
- `--estimate <time>`: Time estimate (e.g., "2h", "30m", "1d")
- `--size <number>`: Size estimate in story points
- `--tags <tag1,tag2>`: Comma-separated tags
- `--state <state>`: Initial state (pending, in-progress, completed, blocked)

**Examples**:
```bash
ptc add "Fix login bug"
ptc add "Implement feature" --estimate 4h --size 5 --tags "frontend,urgent"
```

**Output**: Task created message with task ID

### `ptc list tasks`
**Purpose**: List tasks in the current project
**Options**:
- `--state <state>`: Filter by state
- `--tags <tag>`: Filter by tag
- `--format <table|json>`: Output format

**Examples**:
```bash
ptc list tasks
ptc list tasks --state in-progress
ptc list tasks --tags frontend
```

**Output**: Table or JSON list of tasks

### `ptc task <task-id>`
**Purpose**: Show detailed information about a task
**Arguments**:
- `task-id` (required): Task ID or number

**Examples**:
```bash
ptc task 1
ptc task TASK-123
```

**Output**: Detailed task information including time tracking history

### `ptc update <task-id>`
**Purpose**: Update task properties
**Arguments**:
- `task-id` (required): Task ID or number

**Options**:
- `--title <text>`: Update title
- `--description <text>`: Update description
- `--state <state>`: Update state
- `--estimate <time>`: Update time estimate
- `--size <number>`: Update size estimate
- `--add-tags <tag1,tag2>`: Add tags
- `--remove-tags <tag1,tag2>`: Remove tags

**Examples**:
```bash
ptc update 1 --state completed
ptc update 1 --estimate 6h --add-tags "backend"
```

**Output**: Task updated message

## Time Tracking Commands

### `ptc start <task-id>`
**Purpose**: Start time tracking for a task
**Arguments**:
- `task-id` (required): Task ID or number

**Options**:
- `--at <time>`: Start time (default: now)

**Examples**:
```bash
ptc start 1
ptc start 1 --at "09:00"
```

**Output**: Time tracking started message

### `ptc pause`
**Purpose**: Pause current time tracking
**Options**:
- `--at <time>`: Pause time (default: now)

**Examples**:
```bash
ptc pause
ptc pause --at "12:00"
```

**Output**: Time tracking paused message

### `ptc resume`
**Purpose**: Resume paused time tracking
**Options**:
- `--at <time>`: Resume time (default: now)

**Examples**:
```bash
ptc resume
ptc resume --at "13:00"
```

**Output**: Time tracking resumed message

### `ptc stop`
**Purpose**: Stop current time tracking
**Options**:
- `--at <time>`: Stop time (default: now)

**Examples**:
```bash
ptc stop
ptc stop --at "17:00"
```

**Output**: Time tracking stopped message with session summary

## Reporting Commands

### `ptc report time`
**Purpose**: Show time tracking reports
**Options**:
- `--project <name>`: Filter by project
- `--task <id>`: Filter by task
- `--tags <tag>`: Filter by tags
- `--from <date>`: Start date (YYYY-MM-DD)
- `--to <date>`: End date (YYYY-MM-DD)
- `--by <project|task|tags>`: Group by field
- `--format <table|json>`: Output format

**Examples**:
```bash
ptc report time
ptc report time --from 2024-01-01 --to 2024-01-31
ptc report time --by tags --format json
```

**Output**: Time tracking summary with totals

### `ptc report velocity`
**Purpose**: Show velocity metrics
**Options**:
- `--project <name>`: Filter by project
- `--from <date>`: Start date
- `--to <date>`: End date
- `--period <week|month>`: Time period for velocity calculation

**Examples**:
```bash
ptc report velocity
ptc report velocity --project my-project --period week
```

**Output**: Velocity metrics including story points per period

### `ptc report estimates`
**Purpose**: Show estimation accuracy reports
**Options**:
- `--project <name>`: Filter by project
- `--from <date>`: Start date
- `--to <date>`: End date

**Examples**:
```bash
ptc report estimates
ptc report estimates --project my-project
```

**Output**: Estimation accuracy metrics and trends

## Configuration Commands

### `ptc config show`
**Purpose**: Show current configuration
**Output**: Current configuration settings

### `ptc config set <key> <value>`
**Purpose**: Set configuration value
**Arguments**:
- `key` (required): Configuration key
- `value` (required): Configuration value

**Examples**:
```bash
ptc config set database.host localhost
ptc config set defaults.timezone UTC
```

**Output**: Configuration updated message

## Global Options

All commands support these global options:
- `--help`: Show help for the command
- `--version`: Show version information
- `--verbose`: Enable verbose output
- `--quiet`: Suppress non-error output
- `--config <file>`: Use custom config file

## Error Handling

### Common Error Scenarios
1. **No current project**: Commands requiring project context
2. **Task not found**: Invalid task ID
3. **Database connection**: MySQL unavailable
4. **Invalid arguments**: Malformed command arguments
5. **Permission errors**: Database access issues

### Error Response Format
```json
{
  "error": true,
  "code": "TASK_NOT_FOUND",
  "message": "Task with ID 999 not found",
  "suggestion": "Use 'ptc list tasks' to see available tasks"
}
```

## Exit Codes

- `0`: Success
- `1`: General error
- `2`: Invalid arguments
- `3`: Database error
- `4`: Configuration error
- `5`: Permission error
