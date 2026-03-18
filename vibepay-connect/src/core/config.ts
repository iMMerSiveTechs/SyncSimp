import { readFileSync } from "fs";
import yaml from "js-yaml";

/**
 * VibePay Connect configuration types
 */

export type SyncSimpConfig = {
  version: 1;
  app: {
    name: string;
    bundleId: string;
    platform: "ios";
  };
  apple: {
    subscriptionGroup: {
      referenceName: string;
      id: string;
    };
    locales: {
      id: string; // e.g. "en-US"
      name: string; // product display name
      subtitle?: string;
      description: string;
    }[];
    review: {
      notes: string;
      supportUrl: string;
      privacyPolicyUrl: string;
    };
  };
  revenuecat: {
    projectId: string;
    iosAppId: string;
  };
  entitlements: {
    id: string;
    displayName: string;
    description: string;
  }[];
  plans: {
    id: string;
    displayName: string;
    store: "ios";
    type: "auto_renewable" | "non_consumable" | "consumable";
    appleProductId: string;
    entitlement: string;
    duration?: string; // ISO 8601: P1M, P1Y
    price: {
      currency: string;
      amount: number;
    };
    introOffer?: {
      type: "free_trial" | "pay_up_front" | "pay_as_you_go";
      duration: string;
    };
    rc: {
      offering: string;
      packageId: string;
    };
  }[];
  offerings: {
    id: string;
    displayName: string;
    description?: string;
    primary?: boolean;
    packages: {
      planId: string;
    }[];
  }[];
  notifications?: {
    revenuecat?: {
      appleServerNotificationUrl?: string;
    };
  };
};

/**
 * Load and validate vibepay.yml configuration
 */
export function loadConfig(configPath: string = "vibepay.yml"): SyncSimpConfig {
  try {
    const fileContent = readFileSync(configPath, "utf8");
    const config = yaml.load(fileContent) as SyncSimpConfig;

    validateConfig(config);

    return config;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error(
        `Config file not found: ${configPath}\n\nRun 'vibepay init' to create a new configuration.`
      );
    }
    throw error;
  }
}

/**
 * Validate configuration
 */
function validateConfig(config: SyncSimpConfig): void {
  const errors: string[] = [];

  // Version check
  if (config.version !== 1) {
    errors.push(`Invalid version: ${config.version}. Expected version 1.`);
  }

  // App validation
  if (!config.app?.bundleId) {
    errors.push("app.bundleId is required");
  }
  if (!config.app?.name) {
    errors.push("app.name is required");
  }
  if (config.app?.platform !== "ios") {
    errors.push("app.platform must be 'ios'");
  }

  // Apple validation
  if (!config.apple?.subscriptionGroup?.referenceName) {
    errors.push("apple.subscriptionGroup.referenceName is required");
  }
  if (!config.apple?.subscriptionGroup?.id) {
    errors.push("apple.subscriptionGroup.id is required");
  }
  if (!config.apple?.locales || config.apple.locales.length === 0) {
    errors.push("apple.locales must have at least one locale");
  }

  // RevenueCat validation
  if (!config.revenuecat?.projectId) {
    errors.push("revenuecat.projectId is required");
  }
  if (!config.revenuecat?.iosAppId) {
    errors.push("revenuecat.iosAppId is required");
  }

  // Entitlements validation
  if (!config.entitlements || config.entitlements.length === 0) {
    errors.push("At least one entitlement is required");
  }
  const entitlementIds = new Set(config.entitlements?.map((e) => e.id) || []);

  // Plans validation
  if (!config.plans || config.plans.length === 0) {
    errors.push("At least one plan is required");
  }

  config.plans?.forEach((plan, i) => {
    if (!entitlementIds.has(plan.entitlement)) {
      errors.push(
        `plans[${i}] (${plan.id}): entitlement '${plan.entitlement}' not found in entitlements`
      );
    }

    if (plan.type === "auto_renewable" && !plan.duration) {
      errors.push(`plans[${i}] (${plan.id}): duration is required for auto_renewable subscriptions`);
    }
  });

  // Offerings validation
  if (!config.offerings || config.offerings.length === 0) {
    errors.push("At least one offering is required");
  }

  const primaryOfferings = config.offerings?.filter((o) => o.primary) || [];
  if (primaryOfferings.length !== 1) {
    errors.push(`Exactly one offering must be marked as primary (found ${primaryOfferings.length})`);
  }

  const planIds = new Set(config.plans?.map((p) => p.id) || []);
  const offeringIds = new Set(config.offerings?.map((o) => o.id) || []);

  config.offerings?.forEach((offering, i) => {
    offering.packages?.forEach((pkg, j) => {
      if (!planIds.has(pkg.planId)) {
        errors.push(
          `offerings[${i}].packages[${j}]: planId '${pkg.planId}' not found in plans`
        );
      }
    });
  });

  config.plans?.forEach((plan, i) => {
    if (!offeringIds.has(plan.rc.offering)) {
      errors.push(
        `plans[${i}] (${plan.id}): rc.offering '${plan.rc.offering}' not found in offerings`
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n\n${errors.map((e) => `  • ${e}`).join("\n")}\n\nPlease fix these issues in your vibepay.yml file.`
    );
  }
}
