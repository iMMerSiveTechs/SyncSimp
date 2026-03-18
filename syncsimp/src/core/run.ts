import { loadConfig, type SyncSimpConfig } from './config.js';
import { loadCredentials } from './credentials.js';
import * as apple from './apple.js';
import * as revenuecat from './revenuecat.js';

export type RunResult = {
  apple: string[];
  revenuecat: string[];
  local: string[];
};

export async function performRun(configPath?: string): Promise<{ config: SyncSimpConfig; result: RunResult }> {
  const config = loadConfig(configPath);
  const creds = loadCredentials();

  const result: RunResult = {
    apple: [],
    revenuecat: [],
    local: []
  };

  // Phase 1: Apple App Store Connect
  const appId = await apple.findApp(creds.apple, config.app.bundleId);
  if (!appId) {
    throw new Error(`App not found in App Store Connect for bundle ID: ${config.app.bundleId}`);
  }
  result.apple.push(`App found: ${config.app.name} (${appId})`);

  // Ensure subscription group
  const subGroup = await apple.ensureSubscriptionGroup(creds.apple, appId, config.apple.subscriptionGroup);
  result.apple.push(`Subscription group "${config.apple.subscriptionGroup.id}" (${subGroup.created ? 'created' : 'found'})`);

  // Ensure each plan
  for (const plan of config.plans) {
    const iap = await apple.ensureIAP(creds.apple, appId, plan);
    result.apple.push(`Plan "${plan.id}" (${iap.created ? 'created' : 'found'})`);

    await apple.ensureLocalization(creds.apple, iap.id, config.apple.locales, plan);
    result.apple.push(`  └─ Localizations (updated)`);

    await apple.ensurePriceSchedule(creds.apple, iap.id, plan.price, plan.introOffer);
    result.apple.push(`  └─ Price schedule (${plan.price.currency} ${plan.price.amount})`);
  }

  // Server notifications
  const notificationUrl = config.notifications?.revenuecat?.appleServerNotificationUrl || 'https://api.revenuecat.com/v1/webhooks/apple';
  await apple.ensureServerNotifications(creds.apple, appId, notificationUrl);
  result.apple.push(`Server notifications (configured)`);

  // Phase 2: RevenueCat
  const entitlementLogs = await revenuecat.ensureEntitlements(creds.revenuecat, config.entitlements, config.revenuecat.projectId);
  result.revenuecat.push(...entitlementLogs);

  const offeringLogs = await revenuecat.ensureOfferings(creds.revenuecat, config.offerings, config.revenuecat.projectId);
  result.revenuecat.push(...offeringLogs);

  for (const plan of config.plans) {
    const log = await revenuecat.ensureProductMapping(
      creds.revenuecat,
      plan,
      config.revenuecat.projectId,
      config.revenuecat.iosAppId
    );
    result.revenuecat.push(log);
  }

  // Phase 3: Local (stub for now)
  result.local.push('Local Expo config (skipped - manual setup required)');
  result.local.push('StoreKit config (skipped - manual generation required)');

  return { config, result };
}
