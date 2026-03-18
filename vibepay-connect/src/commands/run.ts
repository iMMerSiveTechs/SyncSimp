import { performRun } from "../core/run.js";
import * as logger from "../ui/logger.js";
import { phase } from "../ui/spinners.js";
import { icons } from "../ui/theme.js";

/**
 * Run command - sync everything
 */
export async function run(): Promise<void> {
  logger.line();
  logger.line(`${icons.rocket} Syncing vibepay.yml with Apple and RevenueCat...`);

  let config, result;

  try {
    // Phase 1: Apple
    logger.phase(1, 3, "App Store Connect");
    const spinner1 = phase("Syncing products and subscriptions");
    spinner1.start();

    const runResult = await performRun();
    config = runResult.config;
    result = runResult.result;

    spinner1.succeed("Apple App Store Connect synced");

    result.apple.forEach((log) => logger.detail(log));

    // Phase 2: RevenueCat
    logger.phase(2, 3, "RevenueCat");
    const spinner2 = phase("Configuring entitlements and offerings");
    spinner2.start();

    // RevenueCat logs already in result
    spinner2.succeed("RevenueCat configured");

    result.revenuecat.forEach((log) => logger.detail(log));

    // Phase 3: Local
    logger.phase(3, 3, "Local Project");
    const spinner3 = phase("Updating local configuration");
    spinner3.start();

    spinner3.succeed("Local configuration reviewed");

    result.local.forEach((log) => logger.detail(log));

    // Success summary
    logger.line();
    logger.divider();
    logger.line();
    logger.success(`${icons.sparkle} VibePay Connect sync complete!`);
    logger.line();

    logger.nextSteps([
      "Build a development build with Expo",
      "Test purchases with a Sandbox user",
      "Verify entitlements are granted correctly",
    ]);
  } catch (error: any) {
    logger.line();
    logger.error("Sync failed");
    logger.detail(error.message);
    logger.line();
    process.exit(2);
  }
}
