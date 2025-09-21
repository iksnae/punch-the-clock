# PTC - Punch the Clock

A task-based time tracking CLI tool designed for developers and AI coding agents to measure development velocity.

## Overview

PTC (Punch the Clock) allows you to create projects, attach tasks with numbers, titles, descriptions, states, and tags, then track time using simple start/pause/resume/stop commands. All time calculations are based on timestamps - no actual timers required. Perfect for measuring development velocity and estimation accuracy.

## Features

- Create and manage projects
- Add tasks with metadata (number, title, description, state, tags)
- Optional size and time estimates for velocity tracking
- Time tracking with start/pause/resume/stop functionality
- MySQL database for data persistence
- Generate reports on time spent by task, project, and tags
- Velocity analytics and estimation accuracy metrics
- Simple, fast CLI interface optimized for developers

## Installation

```bash
npm install -g punch-the-clock
```

## Usage

```bash
# Initialize a new project
ptc init my-project

# Add a task with optional estimates
ptc add "Fix login bug" --estimate 2h --size 3

# Start tracking time
ptc start task-1

# Pause, resume, or stop
ptc pause
ptc resume
ptc stop

# Generate velocity reports
ptc report velocity
ptc report estimates
```

## Development

This project follows the constitution defined in `.specify/memory/constitution.md`.
