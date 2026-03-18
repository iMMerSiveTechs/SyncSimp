import { SyncSimpConfig, loadConfig } from "./config.js";
import { loadCredentials } from "./credentials.js";
import * as apple from "./apple.js";
import * as revenuecat from "./revenuecat.js";

export type RunResult = {
  apple: string[];
  revenuecat: string[];
  local: string[];
};

/**
 * Perform idempotent sync of all platforms
 */
export async function performRun(configPath?: string): Promise<{
  config: SyncSimpConfig;
  result: RunResult;
}> {
  const config = loadConfig(configPath);
  const creds = loadCredentials();

  const result: RunResult = {
    apple: [],
    revenuecat: [],
    local: [],
  };

  // === Apple App Store Connect Phase ===

  // Find or verify app
  const appId = await apple.findApp(creds.apple, config.app.bundleId);

  if (!appId) {
    throw new Error(
      `App not found for bundle ID: ${config.app.bundleId}\n\nPlease create the app in App Store Connect first.`
    );
  }

  result.apple.push(`Found app: ${config.app.bundleId}`);

  // Ensure subscription group
  const subGroup = await apple.ensureSubscriptionGroup(
    creds.apple,
    appId,
    config.apple.subscriptionGroup
  );

  result.apple.push(
    `Subscription group '${config.apple.subscriptionGroup.referenceName}' ${
      subGroup.created ? "created" : "found"
    }`
  );

  // Process each plan
  for (const plan of config.plans) {
    const iap = await apple.ensureIAP(
      creds.apple,
      appId,
      {
        appleProductId: plan.appleProductId,
        displayName: plan.displayName,
        type: plan.type,
      },
      plan.type === "auto_renewable" ? subGroup.id : undefined
    );

    result.apple.push(
      `Product '${plan.appleProductId}' ${iap.created ? "created" : "found"}`
    );

    // Localizations
    const locLogs = await apple.ensureLocalization(
      creds.apple,
      iap.id,
      config.apple.locales,
      plan
    );
    result.apple.push(...locLogs);

    // Price schedule
    const priceLogs = await apple.ensurePriceSchedule(
      creds.apple,
      iap.id,
      plan.price,
      plan.introOffer
    );
    result.apple.push(...priceLogs);
  }

  // Server notifications
  const notifUrl =
    config.notifications?.revenuecat?.appleServerNotificationUrl ||
    `https://api.revenuecat.com/v1/projects/${config.revenuecat.projectId}/apple-server-notifications`;

  const notifLogs = await apple.ensureServerNotifications(
    creds.apple,
    appId,
    notifUrl
  );
  result.apple.push(...notifLogs);

  // === RevenueCat Phase ===

  // Ensure entitlements
  const entitlementLogs = await revenuecat.ensureEntitlements(
    creds.revenuecat.apiKey,
    config.entitlements,
    config.revenuecat.projectId
  );
  result.revenuecat.push(...entitlementLogs);

  // Ensure offerings
  const offeringLogs = await revenuecat.ensureOfferings(
    creds.revenuecat.apiKey,
    config.offerings,
    config.revenuecat.projectId
  );
  result.revenuecat.push(...offeringLogs);

  // Map products
  for (const plan of config.plans) {
    const productLogs = await revenuecat.ensureProductMapping(
      creds.revenuecat.apiKey,
      plan,
      config.revenuecat.projectId,
      config.revenuecat.iosAppId
    );
    result.revenuecat.push(...productLogs);
  }

  // === Local Phase ===
  result.local.push("Local Expo configuration is manual for now");
  result.local.push("Ensure react-native-purchases is configured in your app");

  return { config, result };
}
