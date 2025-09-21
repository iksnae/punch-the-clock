# PTC Development Guide

This guide provides detailed information for developers working on PTC (Punch the Clock).

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Design](#api-design)
- [Testing Strategy](#testing-strategy)
- [Performance Considerations](#performance-considerations)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [Monitoring and Logging](#monitoring-and-logging)

## Architecture Overview

PTC follows a layered architecture pattern:

```
┌─────────────────────────────────────┐
│           CLI Interface             │
│         (Commander.js)              │
├─────────────────────────────────────┤
│         Business Logic              │
│        (Services Layer)             │
├─────────────────────────────────────┤
│         Data Access                 │
│       (Repository Layer)            │
├─────────────────────────────────────┤
│         Database                    │
│          (MySQL)                    │
└─────────────────────────────────────┘
```

### Key Components

1. **CLI Interface**: Command-line interface using Commander.js
2. **Business Logic**: Service classes handling business rules
3. **Data Access**: Repository classes for database operations
4. **Database**: MySQL database with connection pooling
5. **Configuration**: Configuration management system
6. **Error Handling**: Centralized error handling and logging

## Development Environment

### Prerequisites

- Node.js 16.0.0 or higher
- MySQL 8.0 or higher
- Git
- VS Code (recommended) or your preferred editor

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ptc-team/punch-the-clock.git
   cd punch-the-clock
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database settings
   ```

4. **Set up database**:
   ```bash
   mysql -u root -p -e "CREATE DATABASE ptc_dev;"
   mysql -u root -p -e "CREATE USER 'ptc_dev'@'localhost' IDENTIFIED BY 'password';"
   mysql -u root -p -e "GRANT ALL PRIVILEGES ON ptc_dev.* TO 'ptc_dev'@'localhost';"
   ```

5. **Build and test**:
   ```bash
   npm run build
   npm test
   ```

### VS Code Configuration

Recommended VS Code extensions:

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Jest
- MySQL
- GitLens

## Project Structure

```
punch-the-clock/
├── src/                          # Source code
│   ├── cli/                      # CLI interface
│   │   ├── index.ts             # Main CLI application
│   │   ├── commands/            # Command implementations
│   │   └── utils/               # CLI utilities
│   ├── database/                # Database layer
│   │   ├── connection.ts        # Database connection
│   │   ├── config.ts           # Database configuration
│   │   ├── migrator.ts         # Database migrations
│   │   └── optimization/       # Performance optimizations
│   ├── models/                  # Data models
│   ├── repositories/            # Data access layer
│   ├── services/                # Business logic layer
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   ├── validation/              # Input validation
│   └── errors/                  # Custom error types
├── tests/                       # Test files
│   ├── services/               # Service tests
│   ├── cli/                    # CLI tests
│   ├── integration/            # Integration tests
│   ├── performance/            # Performance tests
│   └── e2e/                    # End-to-end tests
├── docs/                       # Documentation
├── dist/                       # Compiled JavaScript
├── package.json                # Package configuration
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest configuration
├── .eslintrc.js               # ESLint configuration
└── README.md                  # Project documentation
```

## Database Schema

### Tables

1. **projects**: Project information
2. **tasks**: Task information
3. **task_tags**: Task tags (many-to-many)
4. **time_sessions**: Time tracking sessions
5. **estimation_history**: Estimation change history
6. **configuration**: System configuration

### Relationships

- Projects → Tasks (1:N)
- Tasks → Tags (N:M)
- Tasks → Time Sessions (1:N)
- Tasks → Estimation History (1:N)

### Indexes

- Primary keys on all tables
- Foreign key indexes
- Performance indexes on frequently queried fields
- Composite indexes for complex queries

## API Design

### Service Layer

Services implement business logic and coordinate between repositories:

```typescript
export class ProjectService {
  private repository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    this.repository = repository;
  }

  public async createProject(name: string, description?: string): Promise<Project> {
    // Business logic here
    const data: CreateProjectData = { name, description };
    const project = await this.repository.create(data);
    return project.toJSON();
  }
}
```

### Repository Layer

Repositories handle data access and database operations:

```typescript
export class ProjectRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  public async create(data: CreateProjectData): Promise<ProjectModel> {
    const sql = 'INSERT INTO projects (name, description) VALUES (?, ?)';
    const result = await this.db.executeQuery(sql, [data.name, data.description]);
    return new ProjectModel(result[0]);
  }
}
```

### Error Handling

Custom error types for different scenarios:

```typescript
export class ProjectNotFoundError extends Error {
  constructor(projectId: number) {
    super(`Project with ID ${projectId} not found`);
    this.name = 'ProjectNotFoundError';
  }
}
```

## Testing Strategy

### Test Types

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test service interactions
3. **End-to-End Tests**: Test complete workflows
4. **Performance Tests**: Test with large datasets

### Test Structure

```typescript
describe('ProjectService', () => {
  let service: ProjectService;
  let mockRepository: jest.Mocked<ProjectRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new ProjectService(mockRepository);
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      // Arrange
      const name = 'test-project';
      const description = 'test description';
      
      // Act
      const result = await service.createProject(name, description);
      
      // Assert
      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
    });
  });
});
```

### Test Coverage

- Maintain test coverage above 80%
- Test error conditions and edge cases
- Mock external dependencies
- Use test fixtures for consistent data

## Performance Considerations

### Database Optimization

1. **Connection Pooling**: Use connection pooling for database connections
2. **Query Optimization**: Optimize queries for performance
3. **Indexing**: Use appropriate indexes for frequently queried fields
4. **Pagination**: Implement pagination for large result sets

### Memory Management

1. **Connection Limits**: Set appropriate connection limits
2. **Memory Monitoring**: Monitor memory usage
3. **Garbage Collection**: Ensure proper cleanup of resources
4. **Caching**: Implement caching where appropriate

### Performance Monitoring

```typescript
import { performanceMonitor } from '../utils/performance';

export class ProjectService {
  public async createProject(name: string, description?: string): Promise<Project> {
    return await performanceMonitor.measureAsync('ProjectService.createProject', async () => {
      // Implementation
    });
  }
}
```

## Security Considerations

### Input Validation

1. **SQL Injection Prevention**: Use parameterized queries
2. **Input Sanitization**: Sanitize all user inputs
3. **Validation**: Validate input data types and ranges
4. **Error Handling**: Don't expose sensitive information in errors

### Database Security

1. **Connection Security**: Use SSL for remote connections
2. **User Permissions**: Use minimal required permissions
3. **Password Security**: Store passwords securely
4. **Access Control**: Implement proper access control

### Configuration Security

1. **Environment Variables**: Use environment variables for sensitive data
2. **Configuration Files**: Secure configuration files
3. **Secrets Management**: Don't commit secrets to version control
4. **Access Control**: Restrict access to configuration files

## Deployment

### Build Process

1. **TypeScript Compilation**: Compile TypeScript to JavaScript
2. **Testing**: Run all tests
3. **Linting**: Check code quality
4. **Packaging**: Create npm package

### Package Configuration

```json
{
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "prepare": "npm run build",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

### Publishing

1. **Version Management**: Use semantic versioning
2. **Changelog**: Update CHANGELOG.md
3. **Testing**: Test package installation
4. **Publishing**: Publish to npm registry

## Monitoring and Logging

### Logging Strategy

1. **Log Levels**: Use appropriate log levels
2. **Structured Logging**: Use structured log format
3. **Log Rotation**: Implement log rotation
4. **Log Aggregation**: Aggregate logs for analysis

### Performance Monitoring

1. **Metrics Collection**: Collect performance metrics
2. **Alerting**: Set up alerts for performance issues
3. **Dashboards**: Create performance dashboards
4. **Analysis**: Analyze performance trends

### Error Monitoring

1. **Error Tracking**: Track and categorize errors
2. **Error Reporting**: Report errors to monitoring system
3. **Error Analysis**: Analyze error patterns
4. **Error Resolution**: Track error resolution

## Development Workflow

### Git Workflow

1. **Feature Branches**: Create feature branches for new features
2. **Pull Requests**: Use pull requests for code review
3. **Code Review**: Review all code changes
4. **Testing**: Ensure all tests pass before merging

### Code Quality

1. **Linting**: Use ESLint for code quality
2. **Formatting**: Use Prettier for code formatting
3. **Type Checking**: Use TypeScript for type safety
4. **Testing**: Maintain high test coverage

### Documentation

1. **Code Documentation**: Document all public APIs
2. **README Updates**: Keep README up to date
3. **API Documentation**: Maintain API documentation
4. **User Guides**: Create user guides for new features

## Best Practices

### Code Organization

1. **Single Responsibility**: Each class should have a single responsibility
2. **Dependency Injection**: Use dependency injection for testability
3. **Interface Segregation**: Use interfaces for abstraction
4. **Open/Closed Principle**: Open for extension, closed for modification

### Error Handling

1. **Specific Errors**: Use specific error types
2. **Error Context**: Provide context in error messages
3. **Error Recovery**: Implement error recovery where possible
4. **Error Logging**: Log errors appropriately

### Performance

1. **Lazy Loading**: Use lazy loading where appropriate
2. **Caching**: Implement caching for expensive operations
3. **Optimization**: Optimize critical paths
4. **Monitoring**: Monitor performance continuously

### Security

1. **Input Validation**: Validate all inputs
2. **Output Encoding**: Encode outputs appropriately
3. **Authentication**: Implement proper authentication
4. **Authorization**: Implement proper authorization

## Troubleshooting

### Common Issues

1. **Database Connection**: Check database connection settings
2. **Memory Issues**: Monitor memory usage
3. **Performance Issues**: Profile performance bottlenecks
4. **Configuration Issues**: Validate configuration

### Debugging

1. **Logging**: Use appropriate logging levels
2. **Debugging Tools**: Use debugging tools
3. **Error Tracking**: Track and analyze errors
4. **Performance Profiling**: Profile performance issues

### Support

1. **Documentation**: Maintain comprehensive documentation
2. **Issue Tracking**: Use issue tracking system
3. **Community Support**: Provide community support
4. **Professional Support**: Offer professional support options

This development guide provides a comprehensive overview of PTC's architecture, development practices, and best practices. Follow these guidelines to ensure consistent, high-quality development.
