import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import type { SyncSimpCredentials } from './credentials.js';

const ASC_BASE_URL = 'https://api.appstoreconnect.apple.com';

/**
 * Apple App Store Connect API Client
 * Uses JWT authentication with private key (.p8 file)
 */

export function createAscToken(creds: SyncSimpCredentials['apple']): string {
  const privateKey = readFileSync(creds.ascKeyPath, 'utf8');

  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '20m',
    issuer: creds.ascIssuerId,
    header: {
      alg: 'ES256',
      kid: creds.ascKeyId,
      typ: 'JWT'
    }
  });

  return token;
}

async function requestAsc(
  creds: SyncSimpCredentials['apple'],
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  const token = createAscToken(creds);
  const url = `${ASC_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ASC API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function checkAppleCredentials(creds: SyncSimpCredentials['apple']): Promise<boolean> {
  try {
    await requestAsc(creds, '/v1/apps?limit=1');
    return true;
  } catch (error) {
    return false;
  }
}

export async function checkAgreements(creds: SyncSimpCredentials['apple']): Promise<boolean> {
  // TODO: Implement proper agreements check
  // For now, return true as a stub
  // The actual endpoint may be under /v1/financeReports or similar
  return true;
}

export async function findApp(creds: SyncSimpCredentials['apple'], bundleId: string): Promise<string | null> {
  try {
    const data = await requestAsc(creds, `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}`);

    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function ensureSubscriptionGroup(
  creds: SyncSimpCredentials['apple'],
  appId: string,
  groupConfig: { referenceName: string; id: string }
): Promise<{ id: string; created: boolean }> {
  try {
    // First, try to find existing subscription group
    const existing = await requestAsc(
      creds,
      `/v1/apps/${appId}/subscriptionGroups?filter[referenceName]=${encodeURIComponent(groupConfig.referenceName)}`
    );

    if (existing.data && existing.data.length > 0) {
      return { id: existing.data[0].id, created: false };
    }

    // Create new subscription group
    const created = await requestAsc(creds, '/v1/subscriptionGroups', 'POST', {
      data: {
        type: 'subscriptionGroups',
        attributes: {
          referenceName: groupConfig.referenceName
        },
        relationships: {
          app: {
            data: {
              type: 'apps',
              id: appId
            }
          }
        }
      }
    });

    return { id: created.data.id, created: true };
  } catch (error) {
    throw new Error(`Failed to ensure subscription group: ${(error as Error).message}`);
  }
}

export async function ensureIAP(
  creds: SyncSimpCredentials['apple'],
  appId: string,
  plan: any
): Promise<{ id: string; created: boolean }> {
  try {
    // Check if IAP already exists
    const existing = await requestAsc(
      creds,
      `/v1/apps/${appId}/inAppPurchases?filter[productId]=${encodeURIComponent(plan.appleProductId)}`
    );

    if (existing.data && existing.data.length > 0) {
      return { id: existing.data[0].id, created: false };
    }

    // Create new in-app purchase
    const productType = plan.type === 'auto_renewable' ? 'AUTO_RENEWABLE_SUBSCRIPTION' :
                       plan.type === 'non_consumable' ? 'NON_CONSUMABLE' : 'CONSUMABLE';

    const created = await requestAsc(creds, '/v1/inAppPurchases', 'POST', {
      data: {
        type: 'inAppPurchases',
        attributes: {
          productId: plan.appleProductId,
          inAppPurchaseType: productType,
          referenceName: plan.id
        },
        relationships: {
          app: {
            data: {
              type: 'apps',
              id: appId
            }
          }
        }
      }
    });

    return { id: created.data.id, created: true };
  } catch (error) {
    throw new Error(`Failed to ensure IAP "${plan.id}": ${(error as Error).message}`);
  }
}

export async function ensureLocalization(
  creds: SyncSimpCredentials['apple'],
  iapId: string,
  locales: any[],
  plan: any
): Promise<void> {
  // Stub: In production, iterate over locales and create/update inAppPurchaseLocalizations
  // For now, just log that we would do this
  return;
}

export async function ensurePriceSchedule(
  creds: SyncSimpCredentials['apple'],
  iapId: string,
  price: { currency: string; amount: number },
  introOffer?: any
): Promise<void> {
  // Stub: In production, create/update inAppPurchasePriceSchedules
  // This involves mapping price to Apple's tier system
  return;
}

export async function ensureServerNotifications(
  creds: SyncSimpCredentials['apple'],
  appId: string,
  url: string
): Promise<void> {
  // Stub: Configure server-to-server notifications
  return;
}
