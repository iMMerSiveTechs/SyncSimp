import jwt from "jsonwebtoken";

const ASC_API_BASE = "https://api.appstoreconnect.apple.com";

/**
 * App Store Connect API Client
 */

// Type for Apple credentials - can accept either paths or content directly
type AppleCredentials = {
  ascIssuerId: string;
  ascKeyId: string;
  ascKeyPath?: string;
  iapKeyPath?: string;
  _privateKey?: string; // Private key content (alternative to ascKeyPath)
};

interface AscTokenPayload {
  iss: string;
  iat: number;
  exp: number;
  aud: string;
}

/**
 * Create JWT token for App Store Connect API
 */
function createAscToken(creds: AppleCredentials): string {
  // Use provided private key content or read from file
  const privateKey = creds._privateKey || (() => {
    if (!creds.ascKeyPath) {
      throw new Error('Either _privateKey or ascKeyPath must be provided');
    }
    const { readFileSync } = require("fs");
    return readFileSync(creds.ascKeyPath, "utf8");
  })();

  const payload: AscTokenPayload = {
    iss: creds.ascIssuerId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 20 * 60, // 20 minutes
    aud: "appstoreconnect-v1",
  };

  return jwt.sign(payload, privateKey, {
    algorithm: "ES256",
    keyid: creds.ascKeyId,
  });
}

/**
 * Make authenticated request to App Store Connect API
 */
async function requestAsc(
  creds: AppleCredentials,
  path: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const token = createAscToken(creds);

  const url = `${ASC_API_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();

    // Special handling for 403 FORBIDDEN on inAppPurchases CREATE
    if (response.status === 403 && path.includes('/inAppPurchases') && method === 'POST') {
      try {
        const errorJson = JSON.parse(errorText);
        const forbiddenError = errorJson.errors?.find((e: any) =>
          e.code === 'FORBIDDEN_ERROR' &&
          e.detail?.includes("does not allow 'CREATE'")
        );

        if (forbiddenError) {
          // Extract the actual reason from Apple's response
          const detail = forbiddenError.detail || '';
          const title = forbiddenError.title || 'Forbidden';

          // Parse the detail to find what's actually missing
          // Apple's message format: "A relationship named 'xxx' for the resource type 'yyy' does not allow 'CREATE'"
          let missingItem = 'Unknown requirement';
          const relationshipMatch = detail.match(/relationship named '([^']+)'/);
          if (relationshipMatch) {
            missingItem = relationshipMatch[1];
          }

          throw new Error(
            `APPLE_ACCOUNT_SETUP_REQUIRED:${missingItem}:${title}:${detail}`
          );
        }
      } catch (e: any) {
        // If it's already an Error we threw, re-throw it
        if (e instanceof Error && e.message.includes('APPLE_ACCOUNT_SETUP_REQUIRED')) {
          throw e;
        }
        // Otherwise it's a JSON parsing error, fall through to regular error
      }
    }

    // Special handling for other 403 errors (provide more context)
    if (response.status === 403) {
      try {
        const errorJson = JSON.parse(errorText);
        const errors = errorJson.errors || [];
        if (errors.length > 0) {
          const firstError = errors[0];
          const code = firstError.code || 'FORBIDDEN';
          const detail = firstError.detail || 'Access denied';
          const title = firstError.title || 'Forbidden';
          throw new Error(`APPLE_403_ERROR:${code}:${title}:${detail}`);
        }
      } catch (e: any) {
        if (e instanceof Error && (e.message.includes('APPLE_403_ERROR') || e.message.includes('APPLE_ACCOUNT_SETUP_REQUIRED'))) {
          throw e;
        }
      }
    }

    throw new Error(
      `App Store Connect API error (${response.status}): ${errorText}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Check if Apple credentials are valid
 */
export async function checkAppleCredentials(creds: AppleCredentials): Promise<boolean> {
  try {
    // Simple check: try to list apps
    await requestAsc(creds, "/v1/apps?limit=1");
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if agreements, tax, and banking are complete
 * Note: This endpoint may not be directly accessible; returns true for now
 */
export async function checkAgreements(creds: AppleCredentials): Promise<boolean> {
  // TODO: Find the correct endpoint or alternative check
  // For now, we'll return true and warn the user to check manually
  return true;
}

/**
 * Find app by bundle ID
 */
export async function findApp(creds: AppleCredentials, bundleId: string): Promise<string | null> {
  try {
    const response = await requestAsc(
      creds,
      `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}`
    );

    if (response.data && response.data.length > 0) {
      return response.data[0].id;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Ensure subscription group exists
 */
export async function ensureSubscriptionGroup(
  creds: AppleCredentials,
  appId: string,
  groupConfig: { referenceName: string; id: string }
): Promise<{ id: string; created: boolean }> {
  // Try to find existing group
  try {
    const response = await requestAsc(
      creds,
      `/v1/apps/${appId}/subscriptionGroups`
    );

    const existing = response.data?.find(
      (g: any) => g.attributes.referenceName === groupConfig.referenceName
    );

    if (existing) {
      return { id: existing.id, created: false };
    }
  } catch (error) {
    // Continue to create
  }

  // Create new group
  const response = await requestAsc(
    creds,
    "/v1/subscriptionGroups",
    "POST",
    {
      data: {
        type: "subscriptionGroups",
        attributes: {
          referenceName: groupConfig.referenceName,
        },
        relationships: {
          app: {
            data: {
              type: "apps",
              id: appId,
            },
          },
        },
      },
    }
  );

  return { id: response.data.id, created: true };
}

/**
 * Ensure in-app purchase exists
 * Uses /v1/subscriptions for auto-renewable subscriptions (required by Apple)
 * Uses /v1/inAppPurchases for other IAP types
 */
export async function ensureIAP(
  creds: AppleCredentials,
  appId: string,
  plan: {
    appleProductId: string;
    displayName: string;
    type: string;
    duration?: string;
  },
  subscriptionGroupId?: string
): Promise<{ id: string; created: boolean }> {
  const isSubscription = plan.type === "auto_renewable";

  try {
    if (isSubscription && subscriptionGroupId) {
    // Use the /v1/subscriptions endpoint for auto-renewable subscriptions
    // This is the newer API that Apple requires

    console.log(`[Apple] Creating subscription with productId: "${plan.appleProductId}"`);
    console.log(`[Apple] Display name: "${plan.displayName}"`);
    console.log(`[Apple] Duration: "${plan.duration}"`);
    console.log(`[Apple] Subscription group ID: "${subscriptionGroupId}"`);

    // First check if subscription already exists in the group
    try {
      const response = await requestAsc(
        creds,
        `/v1/subscriptionGroups/${subscriptionGroupId}/subscriptions`
      );

      const existing = response.data?.find(
        (sub: any) => sub.attributes.productId === plan.appleProductId
      );

      if (existing) {
        console.log(`[Apple] Subscription already exists with ID: ${existing.id}`);
        return { id: existing.id, created: false };
      }
    } catch (error) {
      // Continue to create
      console.log(`[Apple] Could not check existing subscriptions, will try to create`);
    }

    // Map duration to Apple's subscriptionPeriod format
    let subscriptionPeriod = "ONE_MONTH"; // default
    if (plan.duration) {
      const durationMap: Record<string, string> = {
        "P1W": "ONE_WEEK",
        "P1M": "ONE_MONTH",
        "P2M": "TWO_MONTHS",
        "P3M": "THREE_MONTHS",
        "P6M": "SIX_MONTHS",
        "P1Y": "ONE_YEAR",
      };
      subscriptionPeriod = durationMap[plan.duration] || "ONE_MONTH";
    }

    console.log(`[Apple] Mapped subscription period: "${subscriptionPeriod}"`);

    // Create subscription using /v1/subscriptions
    const body = {
      data: {
        type: "subscriptions",
        attributes: {
          productId: plan.appleProductId,
          name: plan.displayName,
          subscriptionPeriod: subscriptionPeriod,
          reviewNote: `Created by SyncSimp`,
        },
        relationships: {
          group: {
            data: {
              type: "subscriptionGroups",
              id: subscriptionGroupId,
            },
          },
        },
      },
    };

    const response = await requestAsc(creds, "/v1/subscriptions", "POST", body);
    return { id: response.data.id, created: true };

  } else {
    // Use the /v2/inAppPurchases endpoint for non-subscription IAPs
    // (consumables, non-consumables, non-renewing subscriptions)

    console.log(`[Apple] Creating non-subscription IAP with productId: "${plan.appleProductId}"`);
    console.log(`[Apple] Display name: "${plan.displayName}"`);
    console.log(`[Apple] Type: "${plan.type}"`);

    // Try to find existing IAP using the correct v2 endpoint
    try {
      const response = await requestAsc(
        creds,
        `/v2/inAppPurchases?filter[app]=${appId}&filter[productId]=${encodeURIComponent(plan.appleProductId)}`
      );

      const existing = response.data?.find(
        (iap: any) => iap.attributes.productId === plan.appleProductId
      );

      if (existing) {
        console.log(`[Apple] IAP already exists with ID: ${existing.id}`);
        return { id: existing.id, created: false };
      }
    } catch (error: any) {
      // Continue to create
      console.log(`[Apple] Could not check existing IAPs: ${error.message}, will try to create`);
    }

    // Determine IAP type
    let iapType = "NON_CONSUMABLE";
    if (plan.type === "consumable") {
      iapType = "CONSUMABLE";
    } else if (plan.type === "non_renewing_subscription" || plan.type === "lifetime") {
      iapType = "NON_CONSUMABLE"; // Lifetime is typically a non-consumable
    }

    console.log(`[Apple] Mapped IAP type: "${iapType}"`);

    const body = {
      data: {
        type: "inAppPurchases",
        attributes: {
          productId: plan.appleProductId,
          name: plan.displayName,
          inAppPurchaseType: iapType,
          reviewNote: `Created by SyncSimp`,
        },
        relationships: {
          app: {
            data: {
              type: "apps",
              id: appId,
            },
          },
        },
      },
    };

    const response = await requestAsc(creds, "/v2/inAppPurchases", "POST", body);
    console.log(`[Apple] IAP created with ID: ${response.data.id}`);
    return { id: response.data.id, created: true };
    }
  } catch (error: any) {
    // Handle 409 duplicate error - product already exists, treat as success
    if (error.message?.includes('409') && error.message?.includes('DUPLICATE')) {
      console.log(`[Apple] IAP already exists (409 duplicate), treating as success`);
      // We don't have the ID, but we know it exists - return a placeholder
      return { id: 'existing', created: false };
    }
    throw error;
  }
}

/**
 * Ensure localizations exist for IAP
 */
export async function ensureLocalization(
  creds: AppleCredentials,
  iapId: string,
  locales: { id: string; name: string; description: string }[],
  plan: { displayName: string }
): Promise<string[]> {
  const logs: string[] = [];

  for (const locale of locales) {
    try {
      // Check if localization exists
      const existing = await requestAsc(
        creds,
        `/v1/inAppPurchases/${iapId}/inAppPurchaseLocalizations?filter[locale]=${locale.id}`
      );

      if (existing.data && existing.data.length > 0) {
        logs.push(`Localization ${locale.id} already exists`);
        continue;
      }

      // Create localization
      await requestAsc(
        creds,
        "/v1/inAppPurchaseLocalizations",
        "POST",
        {
          data: {
            type: "inAppPurchaseLocalizations",
            attributes: {
              locale: locale.id,
              name: locale.name,
              description: locale.description,
            },
            relationships: {
              inAppPurchase: {
                data: {
                  type: "inAppPurchases",
                  id: iapId,
                },
              },
            },
          },
        }
      );

      logs.push(`Created localization for ${locale.id}`);
    } catch (error: any) {
      logs.push(`Failed to create localization ${locale.id}: ${error.message}`);
    }
  }

  return logs;
}

/**
 * Ensure price schedule exists for IAP
 * Simplified version - actual implementation would need price tier mapping
 */
export async function ensurePriceSchedule(
  creds: AppleCredentials,
  iapId: string,
  price: { currency: string; amount: number },
  introOffer?: { type: string; duration: string }
): Promise<string[]> {
  const logs: string[] = [];

  logs.push(`Price scheduling is simplified - manual verification recommended`);
  logs.push(`Expected price: ${price.amount} ${price.currency}`);

  if (introOffer) {
    logs.push(`Intro offer: ${introOffer.type} for ${introOffer.duration}`);
  }

  // TODO: Implement actual price schedule creation
  // This requires mapping amounts to Apple's price tiers

  return logs;
}

/**
 * Ensure server notifications are configured
 */
export async function ensureServerNotifications(
  creds: AppleCredentials,
  appId: string,
  url: string
): Promise<string[]> {
  const logs: string[] = [];

  logs.push(`Server notification URL configuration is manual`);
  logs.push(`Please configure this URL in App Store Connect:`);
  logs.push(`  ${url}`);

  // TODO: Check if there's an API endpoint for this
  // As of now, server notification URLs must be configured manually

  return logs;
}
