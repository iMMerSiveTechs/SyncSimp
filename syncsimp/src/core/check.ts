import { loadConfig, type SyncSimpConfig } from './config.js';
import { loadCredentials } from './credentials.js';
import * as apple from './apple.js';
import * as revenuecat from './revenuecat.js';
import { existsSync } from 'fs';

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

export async function performCheck(configPath?: string): Promise<{ config: SyncSimpConfig; result: CheckResult }> {
  // Load and validate config
  const config = loadConfig(configPath);
  const creds = loadCredentials();

  const result: CheckResult = {
    apple: {
      apiKeyValid: false,
      appFound: false,
      agreementsComplete: false
    },
    revenuecat: {
      projectOk: false,
      iapKeyPresent: false,
      ascKeyPresent: false
    },
    local: {
      configValid: true, // If we got here, config is valid
      expoConfigured: false
    }
  };

  // Check Apple credentials
  result.apple.apiKeyValid = await apple.checkAppleCredentials(creds.apple);

  if (result.apple.apiKeyValid) {
    const appId = await apple.findApp(creds.apple, config.app.bundleId);
    result.apple.appFound = appId !== null;
    result.apple.agreementsComplete = await apple.checkAgreements(creds.apple);
  }

  // Check RevenueCat
  result.revenuecat.projectOk = await revenuecat.checkRevenueCatCredentials(creds.revenuecat);

  if (result.revenuecat.projectOk) {
    result.revenuecat.iapKeyPresent = await revenuecat.checkIAPKeyPresent(creds.revenuecat, config.revenuecat.iosAppId);
    result.revenuecat.ascKeyPresent = await revenuecat.checkAscKeyPresent(creds.revenuecat, config.revenuecat.iosAppId);
  }

  // Check local Expo config
  result.local.expoConfigured = checkExpoConfig();

  return { config, result };
}

function checkExpoConfig(): boolean {
  // Check if app.json, app.config.js, or app.config.ts exists
  const configFiles = ['app.json', 'app.config.js', 'app.config.ts'];

  for (const file of configFiles) {
    if (existsSync(file)) {
      // TODO: Parse file and check for react-native-purchases plugin
      return true;
    }
  }

  return false;
}
