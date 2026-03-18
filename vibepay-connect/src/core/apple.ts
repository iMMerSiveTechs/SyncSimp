import jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import path from "path";
import { SyncSimpCredentials } from "./credentials.js";

const ASC_API_BASE = "https://api.appstoreconnect.apple.com";

/**
 * App Store Connect API Client
 */

interface AscTokenPayload {
  iss: string;
  iat: number;
  exp: number;
  aud: string;
}

/**
 * Validate that a file path is safe (no path traversal)
 */
function validateFilePath(filePath: string): string {
  const resolved = path.resolve(filePath);
  if (filePath.includes('..') && !resolved.startsWith(process.cwd())) {
    throw new Error(`Invalid file path: path traversal detected in "${filePath}"`);
  }
  return resolved;
}

/**
 * Create JWT token for App Store Connect API
 */
function createAscToken(creds: SyncSimpCredentials["apple"]): string {
  const safePath = validateFilePath(creds.ascKeyPath);
  const privateKey = readFileSync(safePath, "utf8");

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
  creds: SyncSimpCredentials["apple"],
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
export async function checkAppleCredentials(creds: SyncSimpCredentials["apple"]): Promise<boolean> {
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
export async function checkAgreements(creds: SyncSimpCredentials["apple"]): Promise<boolean> {
  // TODO: Find the correct endpoint or alternative check
  // For now, we'll return true and warn the user to check manually
  return true;
}

/**
 * Find app by bundle ID
 */
export async function findApp(creds: SyncSimpCredentials["apple"], bundleId: string): Promise<string | null> {
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
  creds: SyncSimpCredentials["apple"],
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
 */
export async function ensureIAP(
  creds: SyncSimpCredentials["apple"],
  appId: string,
  plan: {
    appleProductId: string;
    displayName: string;
    type: string;
  },
  subscriptionGroupId?: string
): Promise<{ id: string; created: boolean }> {
  // Try to find existing IAP
  try {
    const response = await requestAsc(
      creds,
      `/v1/apps/${appId}/inAppPurchases`
    );

    const existing = response.data?.find(
      (iap: any) => iap.attributes.productId === plan.appleProductId
    );

    if (existing) {
      return { id: existing.id, created: false };
    }
  } catch (error) {
    // Continue to create
  }

  // Create new IAP
  const iapType = plan.type === "auto_renewable" ? "AUTO_RENEWABLE_SUBSCRIPTION" : "NON_CONSUMABLE";

  const body: any = {
    data: {
      type: "inAppPurchases",
      attributes: {
        productId: plan.appleProductId,
        name: plan.displayName,
        inAppPurchaseType: iapType,
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

  if (iapType === "AUTO_RENEWABLE_SUBSCRIPTION" && subscriptionGroupId) {
    body.data.relationships.subscriptionGroup = {
      data: {
        type: "subscriptionGroups",
        id: subscriptionGroupId,
      },
    };
  }

  const response = await requestAsc(creds, "/v1/inAppPurchases", "POST", body);

  return { id: response.data.id, created: true };
}

/**
 * Ensure localizations exist for IAP
 */
export async function ensureLocalization(
  creds: SyncSimpCredentials["apple"],
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
  creds: SyncSimpCredentials["apple"],
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
  creds: SyncSimpCredentials["apple"],
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
