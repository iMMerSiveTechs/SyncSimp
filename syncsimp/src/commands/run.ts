import { performRun } from '../core/run.js';
import * as logger from '../ui/logger.js';
import { phase } from '../ui/spinners.js';
import { icons } from '../ui/theme.js';

export async function runCommand(configPath?: string): Promise<void> {
  logger.summaryBox([
    `${icons.rocket} Syncing your in-app purchases...`,
    '',
    'This will sync your syncsimp.yml configuration with:',
    '  • Apple App Store Connect',
    '  • RevenueCat'
  ]);

  try {
    const { config, result } = await performRun(configPath);

    // Phase 1: Apple App Store Connect
    logger.blank();
    const appleSpinner = phase('[ 1/3 ] Syncing App Store Connect...');
    appleSpinner.start();

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work

    appleSpinner.succeed('[ 1/3 ] App Store Connect synced');
    result.apple.forEach(log => logger.listItem(log));

    // Phase 2: RevenueCat
    logger.blank();
    const rcSpinner = phase('[ 2/3 ] Syncing RevenueCat...');
    rcSpinner.start();

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work

    rcSpinner.succeed('[ 2/3 ] RevenueCat synced');
    result.revenuecat.forEach(log => logger.listItem(log));

    // Phase 3: Local
    logger.blank();
    const localSpinner = phase('[ 3/3 ] Updating local project...');
    localSpinner.start();

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work

    localSpinner.succeed('[ 3/3 ] Local project updated');
    result.local.forEach(log => logger.listItem(log));

    // Success summary
    logger.blank();
    logger.summaryBox([
      `${icons.sparkle} SyncSimp sync complete!`,
      '',
      `✓ ${result.apple.length} Apple operations`,
      `✓ ${result.revenuecat.length} RevenueCat operations`,
      `✓ ${result.local.length} Local operations`
    ]);

    logger.nextSteps([
      'Build a dev build of your app with expo-dev-client',
      'Test purchases with an App Store Sandbox user',
      'Verify entitlements are granted correctly in your app'
    ]);
  } catch (error) {
    logger.error((error as Error).message);
    logger.blank();
    logger.nextSteps([
      'Check your syncsimp.yml configuration',
      'Verify your credentials in .syncsimp.local.json',
      'Run `syncsimp check` to diagnose issues'
    ]);
    process.exit(2);
  }
}
