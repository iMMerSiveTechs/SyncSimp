import { SyncSimpConfig, loadConfig } from "./config.js";
import { SyncSimpCredentials, loadCredentials } from "./credentials.js";
import * as apple from "./apple.js";
import * as revenuecat from "./revenuecat.js";
import { existsSync } from "fs";

export type CheckResult = {
  apple: {
    apiKeyValid: boolean;
    appFound: boolean;
    agreementsComplete: boolean;
  };
  revenuecat: {
    projectOk: boolean;
    iapKeyPresent: boolean;
    ascKeyPresent: boolean;
  };
  local: {
    configValid: boolean;
    expoConfigured: boolean;
  };
};

/**
 * Perform comprehensive preflight checks
 */
export async function performCheck(configPath?: string): Promise<{
  config: SyncSimpConfig;
  result: CheckResult;
}> {
  // Load config
  const config = loadConfig(configPath);

  // Load credentials
  const creds = loadCredentials();

  const result: CheckResult = {
    apple: {
      apiKeyValid: false,
      appFound: false,
      agreementsComplete: false,
    },
    revenuecat: {
      projectOk: false,
      iapKeyPresent: false,
      ascKeyPresent: false,
    },
    local: {
      configValid: true, // If we got here, config is valid
      expoConfigured: false,
    },
  };

  // Check Apple
  result.apple.apiKeyValid = await apple.checkAppleCredentials(creds.apple);

  if (result.apple.apiKeyValid) {
    const appId = await apple.findApp(creds.apple, config.app.bundleId);
    result.apple.appFound = appId !== null;
    result.apple.agreementsComplete = await apple.checkAgreements(creds.apple);
  }

  // Check RevenueCat
  result.revenuecat.projectOk = await revenuecat.checkRevenueCatCredentials(creds.revenuecat.apiKey);

  if (result.revenuecat.projectOk) {
    result.revenuecat.iapKeyPresent = await revenuecat.checkIAPKeyPresent(
      creds.revenuecat.apiKey,
      config.revenuecat.iosAppId
    );
    result.revenuecat.ascKeyPresent = await revenuecat.checkAscKeyPresent(
      creds.revenuecat.apiKey,
      config.revenuecat.iosAppId
    );
  }

  // Check local Expo config
  const hasAppConfig =
    existsSync("app.config.ts") ||
    existsSync("app.config.js") ||
    existsSync("app.json");

  result.local.expoConfigured = hasAppConfig;

  return { config, result };
}
