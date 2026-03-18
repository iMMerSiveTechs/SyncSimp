import { SyncSimpCredentials } from "./credentials.js";

const RC_API_BASE = "https://api.revenuecat.com/v2";

/**
 * RevenueCat API Client
 */

/**
 * Make authenticated request to RevenueCat API
 */
async function requestRc(
  apiKey: string,
  path: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const url = `${RC_API_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
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
      `RevenueCat API error (${response.status}): ${errorText}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Check if RevenueCat credentials are valid
 * IMPORTANT: Requires a SECRET API key (V2) with Read & Write access
 * - Must start with sk_ (NOT appl_, goog_, or amzn_)
 * - Must have "Read and Write" permission selected when creating the key
 */
export async function checkRevenueCatCredentials(apiKey: string): Promise<boolean> {
  // First, check if this is the wrong key type
  if (apiKey.startsWith('appl_') || apiKey.startsWith('goog_') || apiKey.startsWith('amzn_')) {
    console.log('[RevenueCat] ============================================');
    console.log('[RevenueCat] ERROR: WRONG KEY TYPE!');
    console.log('[RevenueCat] ============================================');
    console.log('[RevenueCat] You provided a PUBLIC SDK key (starts with appl_, goog_, or amzn_)');
    console.log('[RevenueCat] SyncSimp needs a SECRET API key (V2) with Read & Write access');
    console.log('[RevenueCat] ');
    console.log('[RevenueCat] To get the correct key:');
    console.log('[RevenueCat]   1. Go to app.revenuecat.com');
    console.log('[RevenueCat]   2. Select your project');
    console.log('[RevenueCat]   3. Click gear icon → Project Settings → API Keys');
    console.log('[RevenueCat]   4. Scroll DOWN past "SDK API keys" section');
    console.log('[RevenueCat]   5. Find "Secret API keys" section');
    console.log('[RevenueCat]   6. Click "+ New secret API key"');
    console.log('[RevenueCat]   7. Name it "SyncSimp"');
    console.log('[RevenueCat]   8. Select "Read and Write" access level');
    console.log('[RevenueCat]   9. Copy the key that starts with sk_');
    console.log('[RevenueCat] ============================================');
    return false;
  }

  try {
    // v2 API requires a valid secret key - test with /v2/projects endpoint
    const response = await fetch("https://api.revenuecat.com/v2/projects", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    console.log('[RevenueCat] API response status:', response.status);

    if (response.status === 401) {
      console.log('[RevenueCat] ============================================');
      console.log('[RevenueCat] 401 Unauthorized - API key rejected');
      console.log('[RevenueCat] ============================================');
      console.log('[RevenueCat] Possible causes:');
      console.log('[RevenueCat]   1. Key is invalid or expired');
      console.log('[RevenueCat]   2. Key does not have "Read and Write" access');
      console.log('[RevenueCat]   3. Key was revoked');
      console.log('[RevenueCat] ');
      console.log('[RevenueCat] Solution: Create a new SECRET API key with Read & Write access');
      console.log('[RevenueCat] ============================================');
      return false;
    }

    if (response.status === 403) {
      console.log('[RevenueCat] ============================================');
      console.log('[RevenueCat] 403 Forbidden - Insufficient permissions');
      console.log('[RevenueCat] ============================================');
      console.log('[RevenueCat] Your key does not have "Read and Write" access');
      console.log('[RevenueCat] Create a new SECRET API key and select "Read and Write"');
      console.log('[RevenueCat] ============================================');
      return false;
    }

    // 200 = valid key, 404 = valid key but no projects (still valid!)
    return response.status === 200 || response.status === 404;
  } catch (error) {
    console.log('[RevenueCat] Network error checking credentials:', error);
    return false;
  }
}

/**
 * Check if IAP key is present
 * Note: This may not be directly accessible via API
 */
export async function checkIAPKeyPresent(apiKey: string, iosAppId: string): Promise<boolean> {
  // TODO: Find if there's an API endpoint to check this
  // For now, return true and assume user has configured it
  return true;
}

/**
 * Check if ASC key is present
 */
export async function checkAscKeyPresent(apiKey: string, iosAppId: string): Promise<boolean> {
  // TODO: Find if there's an API endpoint to check this
  return true;
}

/**
 * Ensure entitlements exist
 */
export async function ensureEntitlements(
  apiKey: string,
  entitlements: { id: string; displayName: string; description: string }[],
  projectId: string
): Promise<string[]> {
  const logs: string[] = [];

  for (const entitlement of entitlements) {
    try {
      // Try to get existing entitlement
      const existing = await requestRc(
        apiKey,
        `/projects/${projectId}/entitlements/${entitlement.id}`
      ).catch(() => null);

      if (existing) {
        logs.push(`Entitlement '${entitlement.id}' already exists`);
        continue;
      }

      // Create entitlement
      await requestRc(
        apiKey,
        `/projects/${projectId}/entitlements`,
        "POST",
        {
          lookup_key: entitlement.id,
          display_name: entitlement.displayName,
        }
      );

      logs.push(`Created entitlement '${entitlement.id}'`);
    } catch (error: any) {
      logs.push(`Error with entitlement '${entitlement.id}': ${error.message}`);
    }
  }

  return logs;
}

/**
 * Ensure offerings exist
 */
export async function ensureOfferings(
  apiKey: string,
  offerings: {
    id: string;
    displayName: string;
    description?: string;
    primary?: boolean;
  }[],
  projectId: string
): Promise<string[]> {
  const logs: string[] = [];

  for (const offering of offerings) {
    try {
      // Try to get existing offering
      const existing = await requestRc(
        apiKey,
        `/projects/${projectId}/offerings/${offering.id}`
      ).catch(() => null);

      if (existing) {
        logs.push(`Offering '${offering.id}' already exists`);
        continue;
      }

      // Create offering
      await requestRc(
        apiKey,
        `/projects/${projectId}/offerings`,
        "POST",
        {
          lookup_key: offering.id,
          display_name: offering.displayName,
          description: offering.description || "",
          is_current: offering.primary || false,
        }
      );

      logs.push(`Created offering '${offering.id}'`);
    } catch (error: any) {
      logs.push(`Error with offering '${offering.id}': ${error.message}`);
    }
  }

  return logs;
}

/**
 * Ensure product mapping exists
 */
export async function ensureProductMapping(
  apiKey: string,
  plan: {
    id: string;
    appleProductId: string;
    entitlement: string;
    rc: {
      offering: string;
      packageId: string;
    };
  },
  projectId: string,
  iosAppId: string
): Promise<string[]> {
  const logs: string[] = [];

  try {
    // Create or update product
    await requestRc(
      apiKey,
      `/projects/${projectId}/apps/${iosAppId}/products`,
      "POST",
      {
        store_product_id: plan.appleProductId,
        store: "app_store",
      }
    );

    logs.push(`Configured product '${plan.appleProductId}'`);

    // Attach to package
    await requestRc(
      apiKey,
      `/projects/${projectId}/offerings/${plan.rc.offering}/packages`,
      "POST",
      {
        lookup_key: plan.rc.packageId,
        display_name: plan.id,
        position: 0,
        products: [
          {
            store_product_id: plan.appleProductId,
            store: "app_store",
          },
        ],
      }
    );

    logs.push(`Attached '${plan.appleProductId}' to package '${plan.rc.packageId}'`);

    // Attach entitlement
    await requestRc(
      apiKey,
      `/projects/${projectId}/products/${plan.appleProductId}/entitlements`,
      "POST",
      {
        entitlement: plan.entitlement,
      }
    );

    logs.push(`Attached entitlement '${plan.entitlement}' to product`);
  } catch (error: any) {
    logs.push(`Error mapping product '${plan.id}': ${error.message}`);
  }

  return logs;
}
