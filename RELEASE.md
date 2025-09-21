# Release Guide

This document outlines the release process for PTC (Punch the Clock).

## Release Process

### 1. Pre-Release Checklist

- [ ] All tests pass (`npm test`)
- [ ] Code coverage meets threshold (80%)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated
- [ ] Version is bumped in package.json

### 2. Version Bumping

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes (backward compatible)

### 3. Release Methods

#### Automatic Release (Recommended)

1. **Tag Release**: Create a git tag with the version
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions**: The release workflow will automatically:
   - Run all tests
   - Build binaries for all platforms
   - Publish to npm
   - Create GitHub release
   - Upload binaries

#### Manual Release

1. **Build and Test**:
   ```bash
   npm run build
   npm run test:ci
   ```

2. **Build Binaries**:
   ```bash
   npm run build:binary
   ```

3. **Publish to npm**:
   ```bash
   npm publish
   ```

4. **Create GitHub Release**:
   - Go to GitHub releases
   - Create new release with tag
   - Upload binaries from `binaries/` directory

### 4. Release Artifacts

Each release includes:

- **npm package**: `punch-the-clock@version`
- **Linux binary**: `ptc-linux`
- **macOS binary**: `ptc-macos`
- **Windows binary**: `ptc-windows.exe`
- **Source code**: Tagged git commit
- **Documentation**: Updated README and docs

### 5. Post-Release

- [ ] Verify npm package installs correctly
- [ ] Test binaries on target platforms
- [ ] Update documentation if needed
- [ ] Announce release on social media
- [ ] Update any external references

## Binary Distribution

### Building Binaries

```bash
# Install pkg globally
npm install -g pkg

# Build for all platforms
npm run build:binary

# Or build individually
pkg dist/cli.js --targets node18-linux-x64 --output binaries/ptc-linux
pkg dist/cli.js --targets node18-macos-x64 --output binaries/ptc-macos
pkg dist/cli.js --targets node18-win-x64 --output binaries/ptc-windows.exe
```

### Binary Installation

Users can install binaries directly:

```bash
# Linux
curl -L https://github.com/ptc-team/punch-the-clock/releases/latest/download/ptc-linux -o ptc
chmod +x ptc
sudo mv ptc /usr/local/bin/

# macOS
curl -L https://github.com/ptc-team/punch-the-clock/releases/latest/download/ptc-macos -o ptc
chmod +x ptc
sudo mv ptc /usr/local/bin/

# Windows (PowerShell)
Invoke-WebRequest -Uri "https://github.com/ptc-team/punch-the-clock/releases/latest/download/ptc-windows.exe" -OutFile "ptc.exe"
```

## Testing

### Local Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test -- --testPathPattern="services"
npm test -- --testPathPattern="integration"
npm test -- --testPathPattern="performance"
```

### CI Testing

GitHub Actions automatically runs:

- Unit tests on Node.js 16, 18, 20
- Integration tests with MySQL
- Performance tests
- CLI tests
- Security audit
- Linting

## Rollback Procedure

If a release has issues:

1. **npm**: Unpublish the version (if within 24 hours)
2. **GitHub**: Mark release as pre-release
3. **Documentation**: Update installation instructions
4. **Communication**: Notify users of the issue

## Release Notes Template

```markdown
## PTC v{VERSION}

### 🎉 What's New
- Feature 1
- Feature 2

### 🐛 Bug Fixes
- Fix 1
- Fix 2

### 🔧 Improvements
- Improvement 1
- Improvement 2

### 📦 Installation
```bash
npm install -g punch-the-clock@latest
```

### 📚 Documentation
- [README](https://github.com/ptc-team/punch-the-clock#readme)
- [API Docs](https://github.com/ptc-team/punch-the-clock/blob/main/docs/API.md)
- [Troubleshooting](https://github.com/ptc-team/punch-the-clock/blob/main/docs/TROUBLESHOOTING.md)
```

## Security Considerations

- All dependencies are audited before release
- Binaries are built in clean environments
- No sensitive data in source code
- Regular security updates

## Support

For release-related issues:

- Create GitHub issue with `release` label
- Contact maintainers via GitHub discussions
- Check troubleshooting guide

## Release Schedule

- **Major releases**: As needed (breaking changes)
- **Minor releases**: Monthly (new features)
- **Patch releases**: Weekly (bug fixes)
- **Security releases**: Immediately (security issues)
