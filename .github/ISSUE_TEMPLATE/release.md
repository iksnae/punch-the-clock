---
name: Release Request
about: Request a new release of PTC
title: 'Release v{VERSION}'
labels: 'release'
assignees: ''
---

## Release Information

**Version**: v{VERSION}
**Type**: [ ] Major [ ] Minor [ ] Patch [ ] Security

## Release Checklist

### Pre-Release
- [ ] All tests pass
- [ ] Code coverage meets threshold (80%)
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated
- [ ] Version is bumped in package.json

### Release
- [ ] Create git tag
- [ ] Push tag to trigger release workflow
- [ ] Verify npm package publishes
- [ ] Verify GitHub release is created
- [ ] Verify binaries are uploaded

### Post-Release
- [ ] Test npm installation
- [ ] Test binary downloads
- [ ] Update documentation if needed
- [ ] Announce release

## Changes in this Release

### 🎉 New Features
- 

### 🐛 Bug Fixes
- 

### 🔧 Improvements
- 

### 📚 Documentation
- 

### 🧪 Testing
- 

## Breaking Changes

<!-- List any breaking changes or migration steps -->

## Migration Guide

<!-- If there are breaking changes, provide migration steps -->

## Testing Instructions

<!-- How to test this release -->

## Additional Notes

<!-- Any additional information about this release -->
