import * as jwt from "jsonwebtoken";

const ASC_API_BASE = "https://api.appstoreconnect.apple.com";

type AppleCredentials = {
  ascIssuerId: string;
  ascKeyId: string;
  _privateKey: string;
};

function createAscToken(creds: AppleCredentials): string {
  const payload = {
    iss: creds.ascIssuerId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 20 * 60,
    aud: "appstoreconnect-v1",
  };

  return jwt.sign(payload, creds._privateKey, {
    algorithm: "ES256",
    keyid: creds.ascKeyId,
  });
}

async function requestAsc(
  creds: AppleCredentials,
  path: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const token = createAscToken(creds);
  const url = `${ASC_API_BASE}${path}`;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();

    // Special handling for 403 FORBIDDEN on inAppPurchases CREATE
    if (response.status === 403 && path.includes("/inAppPurchases") && method === "POST") {
      try {
        const errorJson = JSON.parse(errorText);
        const forbiddenError = errorJson.errors?.find(
          (e: any) => e.code === "FORBIDDEN_ERROR" && e.detail?.includes("does not allow 'CREATE'")
        );
        if (forbiddenError) {
          const detail = forbiddenError.detail || "";
          const title = forbiddenError.title || "Forbidden";
          let missingItem = "Unknown requirement";
          const relationshipMatch = detail.match(/relationship named '([^']+)'/);
          if (relationshipMatch) missingItem = relationshipMatch[1];
          throw new Error(`APPLE_ACCOUNT_SETUP_REQUIRED:${missingItem}:${title}:${detail}`);
        }
      } catch (e: any) {
        if (e instanceof Error && e.message.includes("APPLE_ACCOUNT_SETUP_REQUIRED")) throw e;
      }
    }

    if (response.status === 403) {
      try {
        const errorJson = JSON.parse(errorText);
        const errors = errorJson.errors || [];
        if (errors.length > 0) {
          const firstError = errors[0];
          throw new Error(`APPLE_403_ERROR:${firstError.code || "FORBIDDEN"}:${firstError.title || "Forbidden"}:${firstError.detail || "Access denied"}`);
        }
      } catch (e: any) {
        if (e instanceof Error && (e.message.includes("APPLE_403_ERROR") || e.message.includes("APPLE_ACCOUNT_SETUP_REQUIRED"))) throw e;
      }
    }

    throw new Error(`App Store Connect API error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function checkAppleCredentials(creds: AppleCredentials): Promise<boolean> {
  try {
    await requestAsc(creds, "/v1/apps?limit=1");
    return true;
  } catch {
    return false;
  }
}

export async function findApp(creds: AppleCredentials, bundleId: string): Promise<string | null> {
  try {
    const response = await requestAsc(creds, `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}`);
    if (response.data && response.data.length > 0) return response.data[0].id;
    return null;
  } catch {
    return null;
  }
}

export async function ensureSubscriptionGroup(
  creds: AppleCredentials,
  appId: string,
  groupConfig: { referenceName: string; id: string }
): Promise<{ id: string; created: boolean }> {
  try {
    const response = await requestAsc(creds, `/v1/apps/${appId}/subscriptionGroups`);
    const existing = response.data?.find((g: any) => g.attributes.referenceName === groupConfig.referenceName);
    if (existing) return { id: existing.id, created: false };
  } catch { /* continue to create */ }

  const response = await requestAsc(creds, "/v1/subscriptionGroups", "POST", {
    data: {
      type: "subscriptionGroups",
      attributes: { referenceName: groupConfig.referenceName },
      relationships: { app: { data: { type: "apps", id: appId } } },
    },
  });
  return { id: response.data.id, created: true };
}

export async function ensureIAP(
  creds: AppleCredentials,
  appId: string,
  plan: { appleProductId: string; displayName: string; type: string; duration?: string },
  subscriptionGroupId?: string
): Promise<{ id: string; created: boolean }> {
  const isSubscription = plan.type === "auto_renewable";

  try {
    if (isSubscription && subscriptionGroupId) {
      try {
        const response = await requestAsc(creds, `/v1/subscriptionGroups/${subscriptionGroupId}/subscriptions`);
        const existing = response.data?.find((sub: any) => sub.attributes.productId === plan.appleProductId);
        if (existing) return { id: existing.id, created: false };
      } catch { /* continue */ }

      const durationMap: Record<string, string> = {
        P1W: "ONE_WEEK", P1M: "ONE_MONTH", P2M: "TWO_MONTHS",
        P3M: "THREE_MONTHS", P6M: "SIX_MONTHS", P1Y: "ONE_YEAR",
      };
      const subscriptionPeriod = plan.duration ? (durationMap[plan.duration] || "ONE_MONTH") : "ONE_MONTH";

      const response = await requestAsc(creds, "/v1/subscriptions", "POST", {
        data: {
          type: "subscriptions",
          attributes: { productId: plan.appleProductId, name: plan.displayName, subscriptionPeriod, reviewNote: "Created by SyncSimp" },
          relationships: { group: { data: { type: "subscriptionGroups", id: subscriptionGroupId } } },
        },
      });
      return { id: response.data.id, created: true };
    } else {
      try {
        const response = await requestAsc(creds, `/v2/inAppPurchases?filter[app]=${appId}&filter[productId]=${encodeURIComponent(plan.appleProductId)}`);
        const existing = response.data?.find((iap: any) => iap.attributes.productId === plan.appleProductId);
        if (existing) return { id: existing.id, created: false };
      } catch { /* continue */ }

      let iapType = "NON_CONSUMABLE";
      if (plan.type === "consumable") iapType = "CONSUMABLE";

      const response = await requestAsc(creds, "/v2/inAppPurchases", "POST", {
        data: {
          type: "inAppPurchases",
          attributes: { productId: plan.appleProductId, name: plan.displayName, inAppPurchaseType: iapType, reviewNote: "Created by SyncSimp" },
          relationships: { app: { data: { type: "apps", id: appId } } },
        },
      });
      return { id: response.data.id, created: true };
    }
  } catch (error: any) {
    if (error.message?.includes("409") && error.message?.includes("DUPLICATE")) {
      return { id: "existing", created: false };
    }
    throw error;
  }
}

export async function ensureLocalization(
  creds: AppleCredentials,
  iapId: string,
  locales: { id: string; name: string; description: string }[],
  plan: { displayName: string }
): Promise<string[]> {
  const logs: string[] = [];
  for (const locale of locales) {
    try {
      const existing = await requestAsc(creds, `/v1/inAppPurchases/${iapId}/inAppPurchaseLocalizations?filter[locale]=${locale.id}`);
      if (existing.data && existing.data.length > 0) { logs.push(`Localization ${locale.id} already exists`); continue; }
      await requestAsc(creds, "/v1/inAppPurchaseLocalizations", "POST", {
        data: {
          type: "inAppPurchaseLocalizations",
          attributes: { locale: locale.id, name: locale.name, description: locale.description },
          relationships: { inAppPurchase: { data: { type: "inAppPurchases", id: iapId } } },
        },
      });
      logs.push(`Created localization for ${locale.id}`);
    } catch (error: any) {
      logs.push(`Failed to create localization ${locale.id}: ${error.message}`);
    }
  }
  return logs;
}

export async function ensurePriceSchedule(
  _creds: AppleCredentials,
  _iapId: string,
  price: { currency: string; amount: number },
  introOffer?: { type: string; duration: string }
): Promise<string[]> {
  const logs: string[] = [];
  logs.push(`Price scheduling is simplified - manual verification recommended`);
  logs.push(`Expected price: ${price.amount} ${price.currency}`);
  if (introOffer) logs.push(`Intro offer: ${introOffer.type} for ${introOffer.duration}`);
  return logs;
}

export async function ensureServerNotifications(
  _creds: AppleCredentials,
  _appId: string,
  url: string
): Promise<string[]> {
  return [
    `Server notification URL configuration is manual`,
    `Please configure this URL in App Store Connect:`,
    `  ${url}`,
  ];
}
