import { readFileSync } from 'fs';
import yaml from 'js-yaml';

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
      id: string;
      name: string;
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
    duration?: string;
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

export function loadConfig(configPath = "syncsimp.yml"): SyncSimpConfig {
  try {
    const fileContent = readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContent) as SyncSimpConfig;

    // Validate version
    if (config.version !== 1) {
      throw new Error(`Unsupported config version: ${config.version}. Expected version 1.`);
    }

    // Validate required fields
    if (!config.app?.bundleId) {
      throw new Error('Missing required field: app.bundleId');
    }

    if (!config.apple?.subscriptionGroup) {
      throw new Error('Missing required field: apple.subscriptionGroup');
    }

    if (!config.entitlements || config.entitlements.length === 0) {
      throw new Error('At least one entitlement is required');
    }

    if (!config.plans || config.plans.length === 0) {
      throw new Error('At least one plan is required');
    }

    if (!config.offerings || config.offerings.length === 0) {
      throw new Error('At least one offering is required');
    }

    // Validate cross-references
    const entitlementIds = new Set(config.entitlements.map(e => e.id));
    const planIds = new Set(config.plans.map(p => p.id));
    const offeringIds = new Set(config.offerings.map(o => o.id));

    // Check all plans reference valid entitlements
    for (const plan of config.plans) {
      if (!entitlementIds.has(plan.entitlement)) {
        throw new Error(
          `Plan "${plan.id}" references unknown entitlement "${plan.entitlement}". ` +
          `Available entitlements: ${Array.from(entitlementIds).join(', ')}`
        );
      }

      // Check all plans reference valid offerings
      if (!offeringIds.has(plan.rc.offering)) {
        throw new Error(
          `Plan "${plan.id}" references unknown offering "${plan.rc.offering}". ` +
          `Available offerings: ${Array.from(offeringIds).join(', ')}`
        );
      }

      // Validate auto_renewable has duration
      if (plan.type === 'auto_renewable' && !plan.duration) {
        throw new Error(`Plan "${plan.id}" is auto_renewable but missing duration field`);
      }
    }

    // Check all offerings reference valid plans
    for (const offering of config.offerings) {
      for (const pkg of offering.packages) {
        if (!planIds.has(pkg.planId)) {
          throw new Error(
            `Offering "${offering.id}" package references unknown plan "${pkg.planId}". ` +
            `Available plans: ${Array.from(planIds).join(', ')}`
          );
        }
      }
    }

    // Check exactly one primary offering
    const primaryOfferings = config.offerings.filter(o => o.primary === true);
    if (primaryOfferings.length === 0) {
      throw new Error('Exactly one offering must be marked as primary: true');
    }
    if (primaryOfferings.length > 1) {
      throw new Error(
        `Multiple offerings marked as primary: ${primaryOfferings.map(o => o.id).join(', ')}. ` +
        'Only one offering can be primary.'
      );
    }

    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Config file not found: ${configPath}`);
    }
    throw error;
  }
}

export function generateStarterConfig(bundleId: string, appName: string, subscriptionGroupId: string): SyncSimpConfig {
  return {
    version: 1,
    app: {
      name: appName,
      bundleId,
      platform: "ios"
    },
    apple: {
      subscriptionGroup: {
        referenceName: subscriptionGroupId,
        id: subscriptionGroupId
      },
      locales: [
        {
          id: "en-US",
          name: "Premium Access",
          description: "Full access to all premium features"
        }
      ],
      review: {
        notes: "Standard subscription offering",
        supportUrl: `https://${bundleId}/support`,
        privacyPolicyUrl: `https://${bundleId}/privacy`
      }
    },
    revenuecat: {
      projectId: "your-project-id",
      iosAppId: "app1234567890"
    },
    entitlements: [
      {
        id: "premium",
        displayName: "Premium",
        description: "Full access to all features"
      }
    ],
    plans: [
      {
        id: "pro_monthly",
        displayName: "Pro Monthly",
        store: "ios",
        type: "auto_renewable",
        appleProductId: `${bundleId}.pro.monthly`,
        entitlement: "premium",
        duration: "P1M",
        price: {
          currency: "USD",
          amount: 9.99
        },
        introOffer: {
          type: "free_trial",
          duration: "P7D"
        },
        rc: {
          offering: "default",
          packageId: "monthly"
        }
      }
    ],
    offerings: [
      {
        id: "default",
        displayName: "Default Offering",
        description: "Main subscription offering",
        primary: true,
        packages: [
          {
            planId: "pro_monthly"
          }
        ]
      }
    ]
  };
}
