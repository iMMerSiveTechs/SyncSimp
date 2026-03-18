import { performCheck } from '../core/check.js';
import * as logger from '../ui/logger.js';
import { icons } from '../ui/theme.js';

export async function checkCommand(configPath?: string): Promise<void> {
  logger.heading('Running Preflight Checks');

  try {
    const { config, result } = await performCheck(configPath);

    logger.blank();

    // Apple App Store Connect section
    logger.section('App Store Connect');
    logger.listItem(
      'API key valid',
      result.apple.apiKeyValid ? 'success' : 'error'
    );
    logger.listItem(
      `App found (${config.app.bundleId})`,
      result.apple.appFound ? 'success' : 'error'
    );
    logger.listItem(
      'Agreements/Tax/Banking complete',
      result.apple.agreementsComplete ? 'success' : 'warn'
    );

    // RevenueCat section
    logger.blank();
    logger.section('RevenueCat');
    logger.listItem(
      'Project connection',
      result.revenuecat.projectOk ? 'success' : 'error'
    );
    logger.listItem(
      'In-App Purchase key uploaded',
      result.revenuecat.iapKeyPresent ? 'success' : 'warn'
    );
    logger.listItem(
      'App Store Connect key registered',
      result.revenuecat.ascKeyPresent ? 'success' : 'warn'
    );

    // Local config section
    logger.blank();
    logger.section('Local Configuration');
    logger.listItem(
      'syncsimp.yml valid',
      result.local.configValid ? 'success' : 'error'
    );
    logger.listItem(
      'Expo config has RevenueCat plugin',
      result.local.expoConfigured ? 'success' : 'warn'
    );

    // Summary
    logger.blank();

    const hasErrors = !result.apple.apiKeyValid ||
                     !result.apple.appFound ||
                     !result.revenuecat.projectOk ||
                     !result.local.configValid;

    const hasWarnings = !result.apple.agreementsComplete ||
                       !result.revenuecat.iapKeyPresent ||
                       !result.revenuecat.ascKeyPresent ||
                       !result.local.expoConfigured;

    if (hasErrors) {
      logger.error('Critical issues found. Please fix the errors above before running sync.');
      logger.nextSteps([
        'Fix all 🚫 errors shown above',
        'Address ⚠️ warnings (recommended but not blocking)',
        'Run `syncsimp check` again to verify'
      ]);
      process.exit(1);
    } else if (hasWarnings) {
      logger.warn('All critical checks passed, but some warnings were found.');
      logger.nextSteps([
        'Address ⚠️ warnings for best results (optional)',
        'Run `syncsimp run` to start syncing'
      ]);
    } else {
      logger.success('All checks passed!');
      logger.nextSteps([
        'Run `syncsimp run` to sync your configuration with Apple and RevenueCat'
      ]);
    }
  } catch (error) {
    logger.error((error as Error).message);
    process.exit(1);
  }
}
