# PTC - Punch the Clock

[![npm version](https://badge.fury.io/js/punch-the-clock.svg)](https://badge.fury.io/js/punch-the-clock)
[![npm downloads](https://img.shields.io/npm/dm/punch-the-clock.svg)](https://www.npmjs.com/package/punch-the-clock)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/punch-the-clock.svg)](https://nodejs.org/)
[![Build Status](https://github.com/ptc-team/punch-the-clock/workflows/CI/badge.svg)](https://github.com/ptc-team/punch-the-clock/actions)

A task-based time tracking CLI tool designed for developers and AI coding agents to measure development velocity.

## Overview

PTC (Punch the Clock) allows you to create projects, attach tasks with numbers, titles, descriptions, states, and tags, then track time using simple start/pause/resume/stop commands. All time calculations are based on timestamps - no actual timers required. Perfect for measuring development velocity and estimation accuracy.

## 📦 Available on npm

PTC is now available as a global npm package! Install it once and use the `ptc` command from anywhere:

```bash
npm install -g punch-the-clock
ptc --help
```

[![npm package](https://img.shields.io/badge/npm-punch--the--clock-blue.svg)](https://www.npmjs.com/package/punch-the-clock)

## Features

- ✅ **Project Management**: Create, list, and switch between projects
- ✅ **Task Management**: Add, update, and track tasks with metadata
- ✅ **Time Tracking**: Start, pause, resume, and stop time tracking sessions
- ✅ **Estimation Tracking**: Track size and time estimates for velocity analysis
- ✅ **Reporting**: Generate time, velocity, and estimation accuracy reports
- ✅ **Database Integration**: MySQL database with connection pooling
- ✅ **Performance**: Optimized for large datasets (1000+ tasks)
- ✅ **CLI Interface**: Simple, intuitive command-line interface
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Configuration**: Flexible configuration management

## Installation

### 🚀 Quick Install (Recommended)

```bash
npm install -g punch-the-clock
```

After installation, you can use the `ptc` command anywhere:

```bash
ptc --help
```

### 📦 Alternative Installation Methods

**Via Binary Download:**
- Download from [GitHub Releases](https://github.com/ptc-team/punch-the-clock/releases)
- Extract and add to your PATH

**Via Source:**
```bash
git clone https://github.com/ptc-team/punch-the-clock.git
cd punch-the-clock
npm install
npm run build
npm link
```

### Prerequisites

- Node.js 16.0.0 or higher (for npm installation)
- MySQL 8.0 or higher (local or remote)

## Quick Start

```bash
# Initialize a new project
ptc init my-project

# Add a task with optional estimates
ptc add "Fix login bug" --estimate 2h --size 3

# Start tracking time
ptc start 1

# Pause, resume, or stop
ptc pause
ptc resume
ptc stop

# Generate velocity reports
ptc report velocity
ptc report estimates
```

## Commands

### Project Management
```bash
ptc init <project-name>          # Create a new project
ptc list projects                # List all projects
ptc project <project-name>       # Switch to a project
```

### Task Management
```bash
ptc add <title>                  # Add a new task
ptc list tasks                   # List tasks in current project
ptc task <task-id>               # Show task details
ptc update <task-id>             # Update task properties
```

### Time Tracking
```bash
ptc start <task-id>              # Start time tracking
ptc pause                        # Pause current tracking
ptc resume                       # Resume paused tracking
ptc stop                         # Stop time tracking
```

### Reporting
```bash
ptc report time                  # Show time tracking reports
ptc report velocity              # Show velocity metrics
ptc report estimates             # Show estimation accuracy
```

### Configuration
```bash
ptc config show                  # Show current configuration
ptc config set <key> <value>     # Set configuration value
```

## Database Setup

PTC will automatically create the database schema on first run. You can also set it up manually:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE ptc;"

# Set up user (optional)
mysql -u root -p -e "CREATE USER 'ptc'@'localhost' IDENTIFIED BY 'password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON ptc.* TO 'ptc'@'localhost';"
```

## Configuration

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

## Performance

- CLI commands respond within 100ms
- Optimized for large datasets (1000+ tasks)
- Memory usage optimized
- Concurrent operation support
- Performance monitoring and metrics

## Development

```bash
# Clone the repository
git clone https://github.com/ptc-team/punch-the-clock.git
cd punch-the-clock

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/ptc-team/punch-the-clock#readme)
- 🐛 [Report Issues](https://github.com/ptc-team/punch-the-clock/issues)
- 💬 [Discussions](https://github.com/ptc-team/punch-the-clock/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.
