# PTC Troubleshooting Guide

This guide helps you resolve common issues when using PTC (Punch the Clock).

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Connection Issues](#database-connection-issues)
- [Command Not Found](#command-not-found)
- [Permission Errors](#permission-errors)
- [Performance Issues](#performance-issues)
- [Data Issues](#data-issues)
- [Configuration Issues](#configuration-issues)
- [Getting Help](#getting-help)

## Installation Issues

### npm install fails

**Problem**: `npm install -g punch-the-clock` fails with errors.

**Solutions**:
1. **Check Node.js version**:
   ```bash
   node --version
   ```
   Ensure you have Node.js 16.0.0 or higher.

2. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

3. **Try with sudo** (Linux/macOS):
   ```bash
   sudo npm install -g punch-the-clock
   ```

4. **Use npx instead**:
   ```bash
   npx punch-the-clock --help
   ```

### Package not found

**Problem**: `npm install -g punch-the-clock` returns "package not found".

**Solutions**:
1. **Check package name**: Ensure you're using the correct package name
2. **Check npm registry**: Ensure you're using the default npm registry
3. **Try alternative installation**:
   ```bash
   npm install -g @ptc-team/punch-the-clock
   ```

## Database Connection Issues

### MySQL connection failed

**Problem**: `Error: Database connection failed`

**Solutions**:
1. **Check MySQL is running**:
   ```bash
   # Linux/macOS
   sudo systemctl status mysql
   # or
   brew services list | grep mysql
   
   # Windows
   services.msc
   ```

2. **Test MySQL connection**:
   ```bash
   mysql -u root -p -e "SELECT 1;"
   ```

3. **Check connection settings**:
   ```bash
   ptc config show
   ```

4. **Create database manually**:
   ```bash
   mysql -u root -p -e "CREATE DATABASE ptc;"
   ```

5. **Set up user permissions**:
   ```bash
   mysql -u root -p -e "CREATE USER 'ptc'@'localhost' IDENTIFIED BY 'password';"
   mysql -u root -p -e "GRANT ALL PRIVILEGES ON ptc.* TO 'ptc'@'localhost';"
   mysql -u root -p -e "FLUSH PRIVILEGES;"
   ```

### SSL connection issues

**Problem**: SSL connection errors when connecting to remote MySQL.

**Solutions**:
1. **Disable SSL** (for local development):
   ```json
   {
     "database": {
       "ssl": false
     }
   }
   ```

2. **Configure SSL properly** (for production):
   ```json
   {
     "database": {
       "ssl": true,
       "ssl_ca": "/path/to/ca-cert.pem",
       "ssl_cert": "/path/to/client-cert.pem",
       "ssl_key": "/path/to/client-key.pem"
     }
   }
   ```

### Connection timeout

**Problem**: Database connection times out.

**Solutions**:
1. **Increase timeout settings**:
   ```json
   {
     "database": {
       "acquireTimeout": 30000,
       "timeout": 30000
     }
   }
   ```

2. **Check network connectivity**:
   ```bash
   ping your-database-host
   telnet your-database-host 3306
   ```

3. **Check firewall settings**: Ensure port 3306 is open

## Command Not Found

### ptc command not found

**Problem**: `ptc: command not found`

**Solutions**:
1. **Check installation**:
   ```bash
   npm list -g punch-the-clock
   ```

2. **Check PATH**:
   ```bash
   echo $PATH
   npm config get prefix
   ```

3. **Reinstall globally**:
   ```bash
   npm uninstall -g punch-the-clock
   npm install -g punch-the-clock
   ```

4. **Use npx**:
   ```bash
   npx punch-the-clock --help
   ```

5. **Add npm global bin to PATH**:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export PATH="$PATH:$(npm config get prefix)/bin"
   ```

## Permission Errors

### Permission denied errors

**Problem**: Permission errors when running commands.

**Solutions**:
1. **Fix npm permissions**:
   ```bash
   sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
   ```

2. **Use npx instead**:
   ```bash
   npx punch-the-clock init my-project
   ```

3. **Run with sudo** (not recommended):
   ```bash
   sudo ptc init my-project
   ```

### Database permission errors

**Problem**: Database permission denied errors.

**Solutions**:
1. **Check user permissions**:
   ```bash
   mysql -u root -p -e "SHOW GRANTS FOR 'ptc'@'localhost';"
   ```

2. **Grant necessary permissions**:
   ```bash
   mysql -u root -p -e "GRANT ALL PRIVILEGES ON ptc.* TO 'ptc'@'localhost';"
   mysql -u root -p -e "FLUSH PRIVILEGES;"
   ```

3. **Use root user** (for development only):
   ```json
   {
     "database": {
       "user": "root",
       "password": "your-root-password"
     }
   }
   ```

## Performance Issues

### Slow command execution

**Problem**: Commands take too long to execute.

**Solutions**:
1. **Check database performance**:
   ```bash
   mysql -u root -p -e "SHOW PROCESSLIST;"
   ```

2. **Optimize database**:
   ```bash
   mysql -u root -p -e "OPTIMIZE TABLE ptc.projects, ptc.tasks, ptc.time_sessions;"
   ```

3. **Check system resources**:
   ```bash
   top
   htop
   ```

4. **Increase connection limits**:
   ```json
   {
     "database": {
       "connectionLimit": 20
     }
   }
   ```

### Memory usage issues

**Problem**: High memory usage or out of memory errors.

**Solutions**:
1. **Check memory usage**:
   ```bash
   ps aux | grep node
   ```

2. **Restart the application**:
   ```bash
   # Kill any running ptc processes
   pkill -f ptc
   ```

3. **Check for memory leaks**:
   ```bash
   node --inspect dist/cli.js
   ```

## Data Issues

### Data corruption

**Problem**: Data appears corrupted or inconsistent.

**Solutions**:
1. **Check database integrity**:
   ```bash
   mysql -u root -p -e "CHECK TABLE ptc.projects, ptc.tasks, ptc.time_sessions;"
   ```

2. **Repair tables**:
   ```bash
   mysql -u root -p -e "REPAIR TABLE ptc.projects, ptc.tasks, ptc.time_sessions;"
   ```

3. **Restore from backup**:
   ```bash
   mysql -u root -p ptc < backup.sql
   ```

### Missing data

**Problem**: Data is missing or not showing up.

**Solutions**:
1. **Check current project**:
   ```bash
   ptc config show
   ```

2. **List all projects**:
   ```bash
   ptc list projects
   ```

3. **Switch to correct project**:
   ```bash
   ptc project your-project-name
   ```

4. **Check database directly**:
   ```bash
   mysql -u root -p -e "SELECT * FROM ptc.projects;"
   mysql -u root -p -e "SELECT * FROM ptc.tasks;"
   ```

## Configuration Issues

### Configuration not loading

**Problem**: Configuration changes are not being applied.

**Solutions**:
1. **Check config file location**:
   ```bash
   ls -la ~/.ptc/
   ```

2. **Verify config file format**:
   ```bash
   cat ~/.ptc/config.json | jq .
   ```

3. **Reset configuration**:
   ```bash
   rm ~/.ptc/config.json
   ptc config show
   ```

4. **Check file permissions**:
   ```bash
   ls -la ~/.ptc/config.json
   ```

### Invalid configuration

**Problem**: Configuration validation errors.

**Solutions**:
1. **Check configuration syntax**:
   ```bash
   ptc config show
   ```

2. **Validate JSON format**:
   ```bash
   cat ~/.ptc/config.json | python -m json.tool
   ```

3. **Reset to defaults**:
   ```bash
   rm ~/.ptc/config.json
   ptc config show
   ```

## Getting Help

### Debug Mode

Enable debug mode for more detailed output:

```bash
ptc --verbose <command>
```

### Log Files

Check for log files in:
- `~/.ptc/logs/`
- System logs: `/var/log/` (Linux) or `~/Library/Logs/` (macOS)

### System Information

When reporting issues, include:

```bash
# System information
uname -a
node --version
npm --version
mysql --version

# PTC information
ptc --version
ptc config show

# Database information
mysql -u root -p -e "SELECT VERSION();"
mysql -u root -p -e "SHOW VARIABLES LIKE 'version%';"
```

### Common Error Messages

#### "No current project set"
```bash
# Solution: Set a current project
ptc project your-project-name
```

#### "Task not found"
```bash
# Solution: Check available tasks
ptc list tasks
```

#### "Another time session is already active"
```bash
# Solution: Stop current session
ptc stop
```

#### "Database not connected"
```bash
# Solution: Check database connection
ptc config show
mysql -u root -p -e "SELECT 1;"
```

### Support Channels

- **GitHub Issues**: [Report bugs and request features](https://github.com/ptc-team/punch-the-clock/issues)
- **GitHub Discussions**: [Ask questions and get help](https://github.com/ptc-team/punch-the-clock/discussions)
- **Documentation**: [Read the full documentation](https://github.com/ptc-team/punch-the-clock#readme)

### Before Reporting Issues

1. **Check this troubleshooting guide**
2. **Search existing issues** on GitHub
3. **Try the latest version**
4. **Gather system information**
5. **Include error messages and logs**
6. **Describe steps to reproduce**

### Issue Template

When reporting issues, please include:

```markdown
**Environment:**
- OS: [e.g., macOS 13.0, Ubuntu 22.04]
- Node.js version: [e.g., 18.17.0]
- MySQL version: [e.g., 8.0.33]
- PTC version: [e.g., 0.1.0]

**Problem:**
[Describe the problem]

**Steps to reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected behavior:**
[What you expected to happen]

**Actual behavior:**
[What actually happened]

**Error messages:**
[Include any error messages]

**Additional context:**
[Any other relevant information]
```

## Prevention Tips

1. **Regular backups**: Backup your database regularly
2. **Keep updated**: Use the latest version of PTC
3. **Monitor resources**: Keep an eye on system resources
4. **Test changes**: Test configuration changes in a safe environment
5. **Document setup**: Keep notes of your configuration and setup

## Recovery Procedures

### Complete Reset

If all else fails, you can reset PTC completely:

```bash
# Stop any running processes
pkill -f ptc

# Remove configuration
rm -rf ~/.ptc/

# Reinstall
npm uninstall -g punch-the-clock
npm install -g punch-the-clock

# Reconfigure
ptc config show
```

### Data Recovery

To recover from data loss:

1. **Check backups**: Look for database backups
2. **Check git history**: If using version control
3. **Check system backups**: Look for system-level backups
4. **Contact support**: If data is critical

Remember: Prevention is better than cure. Regular backups and proper configuration management can prevent most issues.
