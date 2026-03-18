/**
 * RevenueCat Product Configuration
 *
 * Defines all products, entitlements, and offerings for SyncSimp App
 *
 * Product Types:
 * - monthly: Monthly subscription
 * - yearly: Annual subscription
 * - lifetime: One-time lifetime purchase
 * - consumable: Consumable credits/tokens
 */

export const ENTITLEMENTS = {
  PRO: "SyncSimp App Pro",
} as const;

export const PRODUCT_IDENTIFIERS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
  LIFETIME: "lifetime",
  CONSUMABLE: "consumable",
} as const;

export const PACKAGE_IDENTIFIERS = {
  MONTHLY: "$rc_monthly",
  YEARLY: "$rc_annual",
  LIFETIME: "$rc_lifetime",
  CONSUMABLE: "$rc_custom_consumable",
} as const;

export type ProductType = keyof typeof PRODUCT_IDENTIFIERS;

export interface ProductConfig {
  identifier: string;
  packageIdentifier: string;
  displayName: string;
  description: string;
  entitlement?: string;
  isSubscription: boolean;
  isConsumable: boolean;
}

export const PRODUCTS: Record<ProductType, ProductConfig> = {
  MONTHLY: {
    identifier: PRODUCT_IDENTIFIERS.MONTHLY,
    packageIdentifier: PACKAGE_IDENTIFIERS.MONTHLY,
    displayName: "Monthly Subscription",
    description: "Full access to SyncSimp App Pro features, billed monthly",
    entitlement: ENTITLEMENTS.PRO,
    isSubscription: true,
    isConsumable: false,
  },
  YEARLY: {
    identifier: PRODUCT_IDENTIFIERS.YEARLY,
    packageIdentifier: PACKAGE_IDENTIFIERS.YEARLY,
    displayName: "Annual Subscription",
    description: "Full access to SyncSimp App Pro features, billed annually with savings",
    entitlement: ENTITLEMENTS.PRO,
    isSubscription: true,
    isConsumable: false,
  },
  LIFETIME: {
    identifier: PRODUCT_IDENTIFIERS.LIFETIME,
    packageIdentifier: PACKAGE_IDENTIFIERS.LIFETIME,
    displayName: "Lifetime Access",
    description: "One-time purchase for permanent access to SyncSimp App Pro",
    entitlement: ENTITLEMENTS.PRO,
    isSubscription: false,
    isConsumable: false,
  },
  CONSUMABLE: {
    identifier: PRODUCT_IDENTIFIERS.CONSUMABLE,
    packageIdentifier: PACKAGE_IDENTIFIERS.CONSUMABLE,
    displayName: "Sync Credits",
    description: "Purchase individual sync credits as needed",
    isSubscription: false,
    isConsumable: true,
  },
};

/**
 * Get product configuration by identifier
 */
export const getProductConfig = (identifier: string): ProductConfig | undefined => {
  return Object.values(PRODUCTS).find(
    (product) =>
      product.identifier === identifier ||
      product.packageIdentifier === identifier
  );
};

/**
 * Get all subscription products
 */
export const getSubscriptionProducts = (): ProductConfig[] => {
  return Object.values(PRODUCTS).filter((product) => product.isSubscription);
};

/**
 * Get all non-subscription products
 */
export const getNonSubscriptionProducts = (): ProductConfig[] => {
  return Object.values(PRODUCTS).filter((product) => !product.isSubscription);
};
