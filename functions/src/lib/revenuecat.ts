const RC_API_BASE = "https://api.revenuecat.com/v2";

async function requestRc(apiKey: string, path: string, method: string = "GET", body?: any): Promise<any> {
  const options: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(`${RC_API_BASE}${path}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RevenueCat API error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function checkRevenueCatCredentials(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.revenuecat.com/v2/projects", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    return response.status === 200 || response.status === 404;
  } catch {
    return false;
  }
}

export async function checkIAPKeyPresent(apiKey: string, iosAppId: string): Promise<boolean> {
  try {
    const projectsResponse = await fetch("https://api.revenuecat.com/v2/projects", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!projectsResponse.ok) return false;
    const projectsData = await projectsResponse.json();

    for (const project of projectsData.items || []) {
      const appsResponse = await fetch(`https://api.revenuecat.com/v2/projects/${project.id}/apps`, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      });
      if (!appsResponse.ok) continue;
      const appsData = await appsResponse.json();
      const app = (appsData.items || []).find((a: any) => a.id === iosAppId);
      if (app) return app.app_store_shared_secret !== null && app.app_store_shared_secret !== undefined;
    }
    return false;
  } catch {
    return false;
  }
}

export async function checkAscKeyPresent(apiKey: string, iosAppId: string): Promise<boolean> {
  try {
    const projectsResponse = await fetch("https://api.revenuecat.com/v2/projects", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!projectsResponse.ok) return false;
    const projectsData = await projectsResponse.json();

    for (const project of projectsData.items || []) {
      const appsResponse = await fetch(`https://api.revenuecat.com/v2/projects/${project.id}/apps`, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      });
      if (!appsResponse.ok) continue;
      const appsData = await appsResponse.json();
      const app = (appsData.items || []).find((a: any) => a.id === iosAppId);
      if (app) return app.app_store_connect_api_key_id !== null && app.app_store_connect_api_key_id !== undefined;
    }
    return false;
  } catch {
    return false;
  }
}

export async function ensureEntitlements(
  apiKey: string,
  entitlements: { id: string; displayName: string; description: string }[],
  projectId: string
): Promise<string[]> {
  const logs: string[] = [];
  for (const entitlement of entitlements) {
    try {
      const existing = await requestRc(apiKey, `/projects/${projectId}/entitlements/${entitlement.id}`).catch(() => null);
      if (existing) { logs.push(`Entitlement '${entitlement.id}' already exists`); continue; }
      await requestRc(apiKey, `/projects/${projectId}/entitlements`, "POST", {
        lookup_key: entitlement.id,
        display_name: entitlement.displayName,
      });
      logs.push(`Created entitlement '${entitlement.id}'`);
    } catch (error: any) {
      logs.push(`Error with entitlement '${entitlement.id}': ${error.message}`);
    }
  }
  return logs;
}

export async function ensureOfferings(
  apiKey: string,
  offerings: { id: string; displayName: string; description?: string; primary?: boolean }[],
  projectId: string
): Promise<string[]> {
  const logs: string[] = [];
  for (const offering of offerings) {
    try {
      const existing = await requestRc(apiKey, `/projects/${projectId}/offerings/${offering.id}`).catch(() => null);
      if (existing) { logs.push(`Offering '${offering.id}' already exists`); continue; }
      await requestRc(apiKey, `/projects/${projectId}/offerings`, "POST", {
        lookup_key: offering.id,
        display_name: offering.displayName,
        description: offering.description || "",
        is_current: offering.primary || false,
      });
      logs.push(`Created offering '${offering.id}'`);
    } catch (error: any) {
      logs.push(`Error with offering '${offering.id}': ${error.message}`);
    }
  }
  return logs;
}

export async function ensureProductMapping(
  apiKey: string,
  plan: { id: string; appleProductId: string; entitlement: string; rc: { offering: string; packageId: string } },
  projectId: string,
  iosAppId: string
): Promise<string[]> {
  const logs: string[] = [];
  try {
    await requestRc(apiKey, `/projects/${projectId}/apps/${iosAppId}/products`, "POST", {
      store_product_id: plan.appleProductId, store: "app_store",
    });
    logs.push(`Configured product '${plan.appleProductId}'`);

    await requestRc(apiKey, `/projects/${projectId}/offerings/${plan.rc.offering}/packages`, "POST", {
      lookup_key: plan.rc.packageId, display_name: plan.id, position: 0,
      products: [{ store_product_id: plan.appleProductId, store: "app_store" }],
    });
    logs.push(`Attached '${plan.appleProductId}' to package '${plan.rc.packageId}'`);

    await requestRc(apiKey, `/projects/${projectId}/products/${plan.appleProductId}/entitlements`, "POST", {
      entitlement: plan.entitlement,
    });
    logs.push(`Attached entitlement '${plan.entitlement}' to product`);
  } catch (error: any) {
    logs.push(`Error mapping product '${plan.id}': ${error.message}`);
  }
  return logs;
}
