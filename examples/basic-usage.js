#!/usr/bin/env node

/**
 * Basic Usage Example for PTC (Punch the Clock)
 * 
 * This example demonstrates how to use PTC for basic time tracking
 * and project management.
 */

const { spawn } = require('child_process');

// Helper function to run PTC commands
function runPTCCommand(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('ptc', args, { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

async function basicUsageExample() {
  console.log('🚀 PTC Basic Usage Example\n');
  
  try {
    // 1. Initialize a project
    console.log('1. Creating a new project...');
    await runPTCCommand(['init', 'example-project', '--description', 'A sample project for demonstration']);
    console.log('✅ Project created successfully\n');
    
    // 2. Add some tasks
    console.log('2. Adding tasks...');
    await runPTCCommand(['add', 'Set up development environment', '--estimate', '2h', '--size', '3', '--tags', 'setup,environment']);
    await runPTCCommand(['add', 'Implement user authentication', '--estimate', '8h', '--size', '5', '--tags', 'backend,security']);
    await runPTCCommand(['add', 'Create user interface', '--estimate', '6h', '--size', '3', '--tags', 'frontend,ui']);
    console.log('✅ Tasks added successfully\n');
    
    // 3. List tasks
    console.log('3. Listing tasks...');
    const tasksOutput = await runPTCCommand(['list', 'tasks']);
    console.log(tasksOutput);
    
    // 4. Start time tracking
    console.log('4. Starting time tracking...');
    await runPTCCommand(['start', '1']);
    console.log('✅ Time tracking started for task 1\n');
    
    // 5. Simulate work (pause and resume)
    console.log('5. Simulating work with pause/resume...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1 second of work
    
    await runPTCCommand(['pause']);
    console.log('⏸️  Time tracking paused');
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate break
    
    await runPTCCommand(['resume']);
    console.log('▶️  Time tracking resumed');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate more work
    
    // 6. Stop time tracking
    console.log('6. Stopping time tracking...');
    await runPTCCommand(['stop']);
    console.log('✅ Time tracking stopped\n');
    
    // 7. Generate reports
    console.log('7. Generating reports...');
    const timeReport = await runPTCCommand(['report', 'time']);
    console.log('Time Report:');
    console.log(timeReport);
    
    const velocityReport = await runPTCCommand(['report', 'velocity']);
    console.log('Velocity Report:');
    console.log(velocityReport);
    
    // 8. Show configuration
    console.log('8. Current configuration:');
    const configOutput = await runPTCCommand(['config', 'show']);
    console.log(configOutput);
    
    console.log('🎉 Basic usage example completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  basicUsageExample();
}

module.exports = { basicUsageExample };
