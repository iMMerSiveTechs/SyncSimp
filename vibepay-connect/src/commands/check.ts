import { performCheck } from "../core/check.js";
import * as logger from "../ui/logger.js";
import * as spinners from "../ui/spinners.js";
import { icons } from "../ui/theme.js";

/**
 * Check command - preflight validation
 */
export async function check(): Promise<void> {
  logger.heading("VibePay Connect - Preflight Check");

  let config, result;

  try {
    const checkResult = await spinners.withSpinner("Running diagnostics...", async () => {
      return await performCheck();
    });

    config = checkResult.config;
    result = checkResult.result;
  } catch (error: any) {
    logger.error(error.message);
    process.exit(1);
  }

  // === App Store Connect Section ===
  logger.line();
  logger.heading("App Store Connect");

  if (result.apple.apiKeyValid) {
    logger.success("API key is valid");
  } else {
    logger.error("API key is invalid");
    logger.detail("Check your .vibepay.local.json credentials");
  }

  if (result.apple.appFound) {
    logger.success(`App found: ${config.app.bundleId}`);
  } else {
    logger.error(`App not found: ${config.app.bundleId}`);
    logger.detail("Create the app in App Store Connect before running sync");
  }

  if (result.apple.agreementsComplete) {
    logger.success("Agreements, tax, and banking configured");
  } else {
    logger.warn("Agreements, tax, or banking may not be complete");
    logger.detail("Verify manually in App Store Connect");
  }

  // === RevenueCat Section ===
  logger.line();
  logger.heading("RevenueCat");

  if (result.revenuecat.projectOk) {
    logger.success("Project connection successful");
  } else {
    logger.error("Failed to connect to project");
    logger.detail("Check your API key in .vibepay.local.json");
  }

  if (result.revenuecat.iapKeyPresent) {
    logger.success("In-App Purchase key configured");
  } else {
    logger.warn("In-App Purchase key status unknown");
    logger.detail("Verify IAP key is uploaded in RevenueCat dashboard");
  }

  if (result.revenuecat.ascKeyPresent) {
    logger.success("App Store Connect key configured");
  } else {
    logger.warn("App Store Connect key status unknown");
    logger.detail("Verify ASC key is uploaded in RevenueCat dashboard");
  }

  // === Local Config Section ===
  logger.line();
  logger.heading("Local Configuration");

  if (result.local.configValid) {
    logger.success("vibepay.yml is valid");
  } else {
    logger.error("vibepay.yml has validation errors");
  }

  if (result.local.expoConfigured) {
    logger.success("Expo configuration found");
  } else {
    logger.warn("Expo configuration not detected");
    logger.detail("Ensure app.json or app.config.* exists");
  }

  // === Summary ===
  logger.line();
  logger.divider();

  const hasErrors =
    !result.apple.apiKeyValid ||
    !result.apple.appFound ||
    !result.revenuecat.projectOk ||
    !result.local.configValid;

  if (hasErrors) {
    logger.line();
    logger.error("Checks failed - fix the issues above before running sync");
    logger.line();
    process.exit(1);
  } else {
    logger.line();
    logger.success("All checks passed!");
    logger.line();
    logger.nextSteps(["Run 'vibepay run' to sync your configuration"]);
  }
}
