import type { SyncSimpCredentials } from './credentials.js';

const RC_BASE_URL = 'https://api.revenuecat.com/v1';

/**
 * RevenueCat API Client
 * Uses Bearer token authentication
 */

async function requestRC(
  creds: SyncSimpCredentials['revenuecat'],
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  const url = `${RC_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${creds.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RevenueCat API error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function checkRevenueCatCredentials(creds: SyncSimpCredentials['revenuecat']): Promise<boolean> {
  try {
    // Try to list projects to validate credentials
    await requestRC(creds, '/projects');
    return true;
  } catch (error) {
    return false;
  }
}

export async function checkIAPKeyPresent(
  creds: SyncSimpCredentials['revenuecat'],
  iosAppId: string
): Promise<boolean> {
  // TODO: Check if IAP key is uploaded to RevenueCat
  // This may not be directly exposed via API
  return false;
}

export async function checkAscKeyPresent(
  creds: SyncSimpCredentials['revenuecat'],
  iosAppId: string
): Promise<boolean> {
  // TODO: Check if ASC key is registered with RevenueCat
  // This may not be directly exposed via API
  return false;
}

export async function ensureEntitlements(
  creds: SyncSimpCredentials['revenuecat'],
  entitlements: Array<{ id: string; displayName: string; description: string }>,
  projectId: string
): Promise<string[]> {
  const logs: string[] = [];

  for (const entitlement of entitlements) {
    try {
      // Check if entitlement exists
      const existing = await requestRC(creds, `/projects/${projectId}/entitlements/${entitlement.id}`).catch(() => null);

      if (existing) {
        logs.push(`Entitlement "${entitlement.id}" (found)`);
      } else {
        // Create entitlement
        await requestRC(creds, `/projects/${projectId}/entitlements`, 'POST', {
          lookup_key: entitlement.id,
          display_name: entitlement.displayName
        });
        logs.push(`Entitlement "${entitlement.id}" (created)`);
      }
    } catch (error) {
      logs.push(`Entitlement "${entitlement.id}" (error: ${(error as Error).message})`);
    }
  }

  return logs;
}

export async function ensureOfferings(
  creds: SyncSimpCredentials['revenuecat'],
  offerings: Array<{ id: string; displayName: string; description?: string; primary?: boolean; packages: any[] }>,
  projectId: string
): Promise<string[]> {
  const logs: string[] = [];

  for (const offering of offerings) {
    try {
      // Check if offering exists
      const existing = await requestRC(creds, `/projects/${projectId}/offerings/${offering.id}`).catch(() => null);

      if (existing) {
        logs.push(`Offering "${offering.id}" (found)`);
      } else {
        // Create offering
        await requestRC(creds, `/projects/${projectId}/offerings`, 'POST', {
          lookup_key: offering.id,
          display_name: offering.displayName,
          is_current: offering.primary || false
        });
        logs.push(`Offering "${offering.id}" (created)`);
      }
    } catch (error) {
      logs.push(`Offering "${offering.id}" (error: ${(error as Error).message})`);
    }
  }

  return logs;
}

export async function ensureProductMapping(
  creds: SyncSimpCredentials['revenuecat'],
  plan: any,
  projectId: string,
  iosAppId: string
): Promise<string> {
  try {
    // Create or update product
    await requestRC(creds, `/projects/${projectId}/apps/${iosAppId}/products`, 'POST', {
      store_product_id: plan.appleProductId,
      type: plan.type === 'auto_renewable' ? 'subscription' : 'non-subscription'
    });

    // Attach to entitlement
    await requestRC(
      creds,
      `/projects/${projectId}/entitlements/${plan.entitlement}/products/${plan.appleProductId}`,
      'POST',
      {}
    );

    // Add to offering package
    await requestRC(
      creds,
      `/projects/${projectId}/offerings/${plan.rc.offering}/packages`,
      'POST',
      {
        lookup_key: plan.rc.packageId,
        display_name: plan.displayName,
        product_ids: {
          ios: plan.appleProductId
        }
      }
    );

    return `Product "${plan.id}" (mapped)`;
  } catch (error) {
    return `Product "${plan.id}" (error: ${(error as Error).message})`;
  }
}
