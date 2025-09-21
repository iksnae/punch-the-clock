#!/usr/bin/env node

/**
 * Advanced Usage Example for PTC (Punch the Clock)
 * 
 * This example demonstrates advanced features like:
 * - Multiple projects
 * - Complex task management
 * - Time tracking with estimates
 * - Velocity analysis
 * - Estimation accuracy tracking
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

async function advancedUsageExample() {
  console.log('🚀 PTC Advanced Usage Example\n');
  
  try {
    // 1. Create multiple projects
    console.log('1. Creating multiple projects...');
    await runPTCCommand(['init', 'web-app', '--description', 'Web application development']);
    await runPTCCommand(['init', 'mobile-app', '--description', 'Mobile application development']);
    await runPTCCommand(['init', 'api-service', '--description', 'Backend API service']);
    console.log('✅ Multiple projects created\n');
    
    // 2. Switch to web-app project and add tasks
    console.log('2. Working with web-app project...');
    await runPTCCommand(['project', 'web-app']);
    
    const webAppTasks = [
      { title: 'Set up project structure', estimate: '2h', size: '2', tags: 'setup,structure' },
      { title: 'Implement user authentication', estimate: '8h', size: '5', tags: 'backend,security' },
      { title: 'Create user dashboard', estimate: '6h', size: '3', tags: 'frontend,dashboard' },
      { title: 'Add user profile management', estimate: '4h', size: '3', tags: 'frontend,profile' },
      { title: 'Implement data visualization', estimate: '10h', size: '8', tags: 'frontend,charts' },
      { title: 'Add search functionality', estimate: '6h', size: '4', tags: 'frontend,search' },
      { title: 'Write unit tests', estimate: '8h', size: '3', tags: 'testing,quality' },
      { title: 'Performance optimization', estimate: '4h', size: '2', tags: 'performance,optimization' }
    ];
    
    for (const task of webAppTasks) {
      await runPTCCommand(['add', task.title, '--estimate', task.estimate, '--size', task.size, '--tags', task.tags]);
    }
    console.log('✅ Web app tasks added\n');
    
    // 3. Track time for multiple tasks
    console.log('3. Tracking time for multiple tasks...');
    
    // Task 1: Set up project structure
    await runPTCCommand(['start', '1']);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2 seconds of work
    await runPTCCommand(['stop']);
    await runPTCCommand(['update', '1', '--state', 'completed']);
    console.log('✅ Task 1 completed');
    
    // Task 2: Implement user authentication
    await runPTCCommand(['start', '2']);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate 3 seconds of work
    await runPTCCommand(['pause']);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate break
    await runPTCCommand(['resume']);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate more work
    await runPTCCommand(['stop']);
    await runPTCCommand(['update', '2', '--state', 'completed']);
    console.log('✅ Task 2 completed');
    
    // Task 3: Create user dashboard
    await runPTCCommand(['start', '3']);
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate 2.5 seconds of work
    await runPTCCommand(['stop']);
    await runPTCCommand(['update', '3', '--state', 'completed']);
    console.log('✅ Task 3 completed');
    
    // 4. Switch to mobile-app project
    console.log('4. Working with mobile-app project...');
    await runPTCCommand(['project', 'mobile-app']);
    
    const mobileAppTasks = [
      { title: 'Set up React Native project', estimate: '3h', size: '2', tags: 'setup,react-native' },
      { title: 'Implement navigation', estimate: '6h', size: '4', tags: 'frontend,navigation' },
      { title: 'Create user interface', estimate: '8h', size: '5', tags: 'frontend,ui' },
      { title: 'Integrate with API', estimate: '4h', size: '3', tags: 'integration,api' },
      { title: 'Add offline support', estimate: '6h', size: '4', tags: 'offline,storage' }
    ];
    
    for (const task of mobileAppTasks) {
      await runPTCCommand(['add', task.title, '--estimate', task.estimate, '--size', task.size, '--tags', task.tags]);
    }
    console.log('✅ Mobile app tasks added\n');
    
    // 5. Track time for mobile app tasks
    console.log('5. Tracking time for mobile app tasks...');
    
    // Task 1: Set up React Native project
    await runPTCCommand(['start', '1']);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate 1.5 seconds of work
    await runPTCCommand(['stop']);
    await runPTCCommand(['update', '1', '--state', 'completed']);
    console.log('✅ Mobile task 1 completed');
    
    // Task 2: Implement navigation
    await runPTCCommand(['start', '2']);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2 seconds of work
    await runPTCCommand(['stop']);
    await runPTCCommand(['update', '2', '--state', 'completed']);
    console.log('✅ Mobile task 2 completed');
    
    // 6. Generate comprehensive reports
    console.log('6. Generating comprehensive reports...');
    
    // Time report for all projects
    console.log('Time Report (All Projects):');
    const timeReport = await runPTCCommand(['report', 'time', '--format', 'json']);
    console.log(timeReport);
    
    // Velocity report for web-app
    await runPTCCommand(['project', 'web-app']);
    console.log('Velocity Report (Web App):');
    const velocityReport = await runPTCCommand(['report', 'velocity', '--period', 'week']);
    console.log(velocityReport);
    
    // Estimation accuracy report
    console.log('Estimation Accuracy Report:');
    const estimationReport = await runPTCCommand(['report', 'estimates']);
    console.log(estimationReport);
    
    // 7. Advanced task management
    console.log('7. Advanced task management...');
    
    // Update task with new estimates
    await runPTCCommand(['update', '4', '--estimate', '6h', '--add-tags', 'priority']);
    console.log('✅ Task 4 updated with new estimate and priority tag');
    
    // List tasks by state
    console.log('Completed tasks:');
    const completedTasks = await runPTCCommand(['list', 'tasks', '--state', 'completed']);
    console.log(completedTasks);
    
    // List tasks by tag
    console.log('Frontend tasks:');
    const frontendTasks = await runPTCCommand(['list', 'tasks', '--tags', 'frontend']);
    console.log(frontendTasks);
    
    // 8. Project management
    console.log('8. Project management...');
    
    // List all projects
    console.log('All projects:');
    const allProjects = await runPTCCommand(['list', 'projects']);
    console.log(allProjects);
    
    // Show current project
    console.log('Current project:');
    const currentProject = await runPTCCommand(['config', 'show']);
    console.log(currentProject);
    
    // 9. Performance analysis
    console.log('9. Performance analysis...');
    
    // Show task statistics
    console.log('Task statistics:');
    const taskStats = await runPTCCommand(['list', 'tasks', '--format', 'json']);
    console.log(taskStats);
    
    console.log('🎉 Advanced usage example completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Created 3 projects');
    console.log('- Added 13 tasks across projects');
    console.log('- Tracked time for 5 tasks');
    console.log('- Generated comprehensive reports');
    console.log('- Demonstrated advanced features');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  advancedUsageExample();
}

module.exports = { advancedUsageExample };
