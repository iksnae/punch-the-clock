import { Command } from 'commander';
import chalk from 'chalk';

export class HelpUtils {
  public static showGeneralHelp(program: Command): void {
    console.log(chalk.blue.bold('PTC - Punch the Clock'));
    console.log(chalk.gray('A task-based time tracking CLI for developers\n'));
    
    console.log(chalk.yellow('USAGE:'));
    console.log('  ptc <command> [options]\n');
    
    console.log(chalk.yellow('COMMANDS:'));
    console.log('  project    Project management commands');
    console.log('  task       Task management commands');
    console.log('  time       Time tracking commands');
    console.log('  report     Reporting commands');
    console.log('  config     Configuration commands');
    console.log('  help       Display help for a command\n');
    
    console.log(chalk.yellow('GLOBAL OPTIONS:'));
    console.log('  -v, --verbose     Enable verbose output');
    console.log('  -q, --quiet       Suppress non-error output');
    console.log('  -c, --config      Use custom config file');
    console.log('  --no-color        Disable colored output');
    console.log('  -h, --help        Display help');
    console.log('  -V, --version     Display version\n');
    
    console.log(chalk.yellow('EXAMPLES:'));
    console.log('  ptc project init my-project');
    console.log('  ptc task add "Implement feature X"');
    console.log('  ptc time start 123');
    console.log('  ptc report time --from 2024-01-01');
    console.log('  ptc config show\n');
    
    console.log(chalk.gray('For more information, visit: https://github.com/your-org/punch-the-clock'));
  }

  public static showCommandHelp(program: Command, commandName: string): void {
    const command = program.commands.find(cmd => cmd.name() === commandName);
    
    if (!command) {
      console.log(chalk.red(`Command "${commandName}" not found`));
      return;
    }

    console.log(chalk.blue.bold(`PTC ${commandName.toUpperCase()} COMMAND`));
    console.log(chalk.gray(command.description() + '\n'));
    
    console.log(chalk.yellow('USAGE:'));
    console.log(`  ptc ${command.usage()}\n`);
    
    if (command.options.length > 0) {
      console.log(chalk.yellow('OPTIONS:'));
      command.options.forEach(option => {
        const flags = option.flags;
        const description = option.description;
        console.log(`  ${flags.padEnd(20)} ${description}`);
      });
      console.log();
    }
    
    if (command.commands.length > 0) {
      console.log(chalk.yellow('SUBCOMMANDS:'));
      command.commands.forEach(subcmd => {
        console.log(`  ${subcmd.name().padEnd(15)} ${subcmd.description()}`);
      });
      console.log();
    }
    
    console.log(chalk.yellow('EXAMPLES:'));
    this.showCommandExamples(commandName);
  }

  private static showCommandExamples(commandName: string): void {
    const examples: Record<string, string[]> = {
      project: [
        'ptc project init my-project --description "My awesome project"',
        'ptc project list --format json',
        'ptc project switch my-project',
        'ptc project show my-project',
        'ptc project delete my-project --force'
      ],
      task: [
        'ptc task add "Fix bug #123" --estimate 2h --tags bug,urgent',
        'ptc task list --state in-progress',
        'ptc task show 123',
        'ptc task update 123 --state completed',
        'ptc task delete 123 --force'
      ],
      time: [
        'ptc time start 123',
        'ptc time pause',
        'ptc time resume',
        'ptc time stop',
        'ptc time status'
      ],
      report: [
        'ptc report time --from 2024-01-01 --to 2024-01-31',
        'ptc report velocity --project my-project --period month',
        'ptc report estimates --from 2024-01-01'
      ],
      config: [
        'ptc config show',
        'ptc config set default_project my-project',
        'ptc config reset'
      ]
    };

    const commandExamples = examples[commandName] || [];
    commandExamples.forEach(example => {
      console.log(`  ${example}`);
    });
    console.log();
  }

  public static showQuickStart(): void {
    console.log(chalk.blue.bold('PTC QUICK START GUIDE'));
    console.log(chalk.gray('Get up and running with PTC in minutes\n'));
    
    console.log(chalk.yellow('1. Initialize a project:'));
    console.log('   ptc project init my-project\n');
    
    console.log(chalk.yellow('2. Switch to your project:'));
    console.log('   ptc project switch my-project\n');
    
    console.log(chalk.yellow('3. Add your first task:'));
    console.log('   ptc task add "Implement user authentication" --estimate 4h\n');
    
    console.log(chalk.yellow('4. Start time tracking:'));
    console.log('   ptc time start 1\n');
    
    console.log(chalk.yellow('5. Stop time tracking:'));
    console.log('   ptc time stop\n');
    
    console.log(chalk.yellow('6. View your time report:'));
    console.log('   ptc report time\n');
    
    console.log(chalk.gray('For more detailed help, run: ptc help <command>'));
  }

  public static showTroubleshooting(): void {
    console.log(chalk.blue.bold('PTC TROUBLESHOOTING'));
    console.log(chalk.gray('Common issues and solutions\n'));
    
    console.log(chalk.yellow('Database Connection Issues:'));
    console.log('  • Check your database configuration: ptc config show');
    console.log('  • Verify MySQL is running and accessible');
    console.log('  • Check connection credentials and database name\n');
    
    console.log(chalk.yellow('Command Not Found:'));
    console.log('  • Make sure you\'re using the correct command syntax');
    console.log('  • Check available commands: ptc help');
    console.log('  • Verify you\'re in the correct project context\n');
    
    console.log(chalk.yellow('Permission Issues:'));
    console.log('  • Ensure you have write permissions to the config directory');
    console.log('  • Check file permissions in your project directory\n');
    
    console.log(chalk.yellow('Performance Issues:'));
    console.log('  • Use --quiet flag to reduce output verbosity');
    console.log('  • Check database indexes and query performance');
    console.log('  • Consider archiving old time sessions\n');
    
    console.log(chalk.gray('For more help, visit: https://github.com/your-org/punch-the-clock/issues'));
  }
}
