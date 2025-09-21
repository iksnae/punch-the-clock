# Contributing to PTC

Thank you for your interest in contributing to PTC (Punch the Clock)! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/punch-the-clock.git
   cd punch-the-clock
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/ptc-team/punch-the-clock.git
   ```

## Development Setup

### Prerequisites

- Node.js 16.0.0 or higher
- MySQL 8.0 or higher
- Git

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up the database**:
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE ptc_dev;"
   
   # Set up user (optional)
   mysql -u root -p -e "CREATE USER 'ptc_dev'@'localhost' IDENTIFIED BY 'password';"
   mysql -u root -p -e "GRANT ALL PRIVILEGES ON ptc_dev.* TO 'ptc_dev'@'localhost';"
   ```

3. **Configure environment**:
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=ptc_dev
   DB_PASSWORD=password
   DB_NAME=ptc_dev
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Run tests**:
   ```bash
   npm test
   ```

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **Bug fixes**: Fix issues in existing functionality
- **New features**: Add new functionality to the CLI
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Performance**: Optimize existing code
- **Refactoring**: Improve code structure without changing functionality

### Before You Start

1. **Check existing issues**: Look for existing issues or discussions
2. **Create an issue**: For significant changes, create an issue first
3. **Discuss**: Engage in discussion before starting work
4. **Check the roadmap**: Ensure your contribution aligns with project goals

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write code following our coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a pull request**:
   - Use the pull request template
   - Provide a clear description
   - Link to related issues

## Pull Request Process

### Pull Request Template

When creating a pull request, please include:

- **Description**: Clear description of changes
- **Type**: Bug fix, feature, documentation, etc.
- **Testing**: How you tested the changes
- **Breaking Changes**: Any breaking changes
- **Related Issues**: Link to related issues

### Review Process

1. **Automated checks**: All PRs must pass automated tests and linting
2. **Code review**: At least one maintainer will review your code
3. **Testing**: Ensure all tests pass and coverage is maintained
4. **Documentation**: Update documentation for new features

### Merge Requirements

- [ ] All tests pass
- [ ] Code coverage is maintained or improved
- [ ] Linting passes without errors
- [ ] Documentation is updated
- [ ] Code review approved
- [ ] No breaking changes (or properly documented)

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: OS, Node.js version, MySQL version
- **Screenshots**: If applicable

### Feature Requests

When requesting features, please include:

- **Description**: Clear description of the feature
- **Use case**: Why this feature would be useful
- **Proposed solution**: How you think it should work
- **Alternatives**: Other solutions you've considered

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Use proper error handling

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use trailing commas in objects and arrays
- Use const/let instead of var

### File Organization

- Follow the existing directory structure
- Group related functionality together
- Use descriptive file names
- Keep files focused and not too large

### Error Handling

- Use specific error types
- Provide meaningful error messages
- Handle errors gracefully
- Log errors appropriately

## Testing

### Test Requirements

- **Unit tests**: Test individual functions and methods
- **Integration tests**: Test service interactions
- **End-to-end tests**: Test complete workflows
- **Performance tests**: Test with large datasets

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await component.method(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/services/ProjectService.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage

- Maintain test coverage above 80%
- Aim for 100% coverage on critical paths
- Test error conditions and edge cases
- Mock external dependencies

## Documentation

### Code Documentation

- Add JSDoc comments for all public APIs
- Include parameter types and return types
- Provide usage examples
- Document error conditions

### User Documentation

- Update README.md for new features
- Add examples to quickstart guide
- Update API documentation
- Create troubleshooting guides

### Documentation Standards

- Use clear, concise language
- Provide code examples
- Include screenshots when helpful
- Keep documentation up to date

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update version** in package.json
2. **Update CHANGELOG.md** with new features/fixes
3. **Create release branch** from main
4. **Run full test suite**
5. **Build and test package**
6. **Create GitHub release**
7. **Publish to npm**

### Pre-release Testing

Before each release:

- [ ] All tests pass
- [ ] Linting passes
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Package builds successfully
- [ ] Installation works from npm

## Getting Help

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Pull Requests**: For code contributions

### Resources

- [README.md](../README.md) - Project overview and quick start
- [API.md](./API.md) - API documentation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- GitHub contributors list

Thank you for contributing to PTC! 🎉
