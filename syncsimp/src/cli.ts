#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { checkCommand } from './commands/check.js';
import { runCommand } from './commands/run.js';

const program = new Command();

program
  .name('syncsimp')
  .description('✨ SyncSimp – Sync simple: calm engineering for in-app purchases')
  .version('0.1.0');

program
  .command('init')
  .description('Interactive setup wizard to initialize SyncSimp')
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Run preflight diagnostics and validate your setup')
  .option('-c, --config <path>', 'Path to syncsimp.yml', 'syncsimp.yml')
  .action(async (options) => {
    try {
      await checkCommand(options.config);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Sync your configuration with Apple and RevenueCat')
  .option('-c, --config <path>', 'Path to syncsimp.yml', 'syncsimp.yml')
  .action(async (options) => {
    try {
      await runCommand(options.config);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
