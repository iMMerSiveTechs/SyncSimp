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
 * Check if RevenueCat credentials are valid by fetching the user's own data
 */
export async function checkRevenueCatCredentials(apiKey: string): Promise<boolean> {
  try {
    // v2 API requires a valid secret key - test with /v2/projects endpoint
    // This endpoint requires authentication and will return 401 if key is invalid
    const response = await fetch("https://api.revenuecat.com/v2/projects", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // 200 = valid key, 401 = invalid key, 404 = valid key but no projects (still valid!)
    return response.status === 200 || response.status === 404;
  } catch (error) {
    return false;
  }
}

/**
 * Check if IAP Shared Secret is configured for the app in RevenueCat
 * Queries the app details to verify App Store shared secret is present
 */
export async function checkIAPKeyPresent(apiKey: string, iosAppId: string): Promise<boolean> {
  try {
    // List projects to find the one containing our app
    const projectsResponse = await fetch("https://api.revenuecat.com/v2/projects", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!projectsResponse.ok) return false;

    const projectsData = await projectsResponse.json();
    const projects = projectsData.items || [];

    // Check each project for the iOS app
    for (const project of projects) {
      const appsResponse = await fetch(
        `https://api.revenuecat.com/v2/projects/${project.id}/apps`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!appsResponse.ok) continue;

      const appsData = await appsResponse.json();
      const app = (appsData.items || []).find((a: any) => a.id === iosAppId);

      if (app) {
        // Check if shared_secret is configured (RevenueCat masks it but shows if present)
        return app.app_store_shared_secret !== null && app.app_store_shared_secret !== undefined;
      }
    }

    return false;
  } catch (error) {
    console.error("[RevenueCat] Error checking IAP key:", error);
    return false;
  }
}

/**
 * Check if App Store Connect API key is configured for the app in RevenueCat
 */
export async function checkAscKeyPresent(apiKey: string, iosAppId: string): Promise<boolean> {
  try {
    const projectsResponse = await fetch("https://api.revenuecat.com/v2/projects", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!projectsResponse.ok) return false;

    const projectsData = await projectsResponse.json();
    const projects = projectsData.items || [];

    for (const project of projects) {
      const appsResponse = await fetch(
        `https://api.revenuecat.com/v2/projects/${project.id}/apps`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!appsResponse.ok) continue;

      const appsData = await appsResponse.json();
      const app = (appsData.items || []).find((a: any) => a.id === iosAppId);

      if (app) {
        // Check if ASC API key fields are configured
        return app.app_store_connect_api_key_id !== null && app.app_store_connect_api_key_id !== undefined;
      }
    }

    return false;
  } catch (error) {
    console.error("[RevenueCat] Error checking ASC key:", error);
    return false;
  }
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
