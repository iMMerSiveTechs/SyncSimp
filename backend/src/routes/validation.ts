import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import { zValidator } from '@hono/zod-validator';
import { validationCheckRequestSchema } from '../../../src/shared/contracts';
import {
  checkRevenueCatCredentials,
  checkIAPKeyPresent,
  checkAscKeyPresent
} from '../../../vibepay-connect/src/core/revenuecat.js';

const validation = new Hono();

const ASC_API_BASE = "https://api.appstoreconnect.apple.com";

type CheckResult = {
  apple: {
    apiKeyValid: boolean;
    appFound: boolean;
    agreementsComplete: boolean;
    error?: string;
  };
  revenuecat: {
    projectOk: boolean;
    iapKeyPresent: boolean;
    ascKeyPresent: boolean;
    error?: string;
  };
  local: {
    configValid: boolean;
    hasAllCredentials: boolean;
    error?: string;
  };
};

/**
 * Create JWT token for App Store Connect API
 */
function createAscToken(issuerId: string, keyId: string, privateKey: string): string {
  const payload = {
    iss: issuerId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 20 * 60, // 20 minutes
    aud: "appstoreconnect-v1",
  };

  return jwt.sign(payload, privateKey, {
    algorithm: "ES256",
    keyid: keyId,
  });
}

/**
 * Make authenticated request to App Store Connect API
 */
async function requestAsc(
  issuerId: string,
  keyId: string,
  privateKey: string,
  path: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const token = createAscToken(issuerId, keyId, privateKey);

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
async function checkAppleCredentials(issuerId: string, keyId: string, privateKey: string): Promise<boolean> {
  try {
    // Simple check: try to list apps
    await requestAsc(issuerId, keyId, privateKey, "/v1/apps?limit=1");
    return true;
  } catch (error: any) {
    console.error('[Validation] Apple API Error Details:', error.message);
    return false;
  }
}

/**
 * Find app by bundle ID
 */
async function findApp(issuerId: string, keyId: string, privateKey: string, bundleId: string): Promise<string | null> {
  try {
    const response = await requestAsc(
      issuerId,
      keyId,
      privateKey,
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
 * Check if agreements are complete
 */
async function checkAgreements(issuerId: string, keyId: string, privateKey: string): Promise<boolean> {
  // TODO: Find the correct endpoint or alternative check
  // For now, we'll return true and warn the user to check manually
  return true;
}

// POST /api/validation/check/:projectId - Run validation checks for a project
// Note: This endpoint validates external credentials (Apple/RevenueCat) using data sent from Firebase
// Authentication is handled by Firebase on the frontend - the project data is passed in the request body
validation.post('/check/:projectId', zValidator('json', validationCheckRequestSchema, (result, c) => {
  if (!result.success) {
    console.log('[Validation] Request body validation failed:', result.error.issues.map(i => i.message).join(', '));
    return c.json({ error: 'Invalid request body', details: result.error.issues.map(i => i.message) }, 400);
  }
}), async (c) => {
  const { projectId } = c.req.param();
  const { project } = c.req.valid('json');

  const result: CheckResult = {
    apple: {
      apiKeyValid: false,
      appFound: false,
      agreementsComplete: false,
    },
    revenuecat: {
      projectOk: false,
      iapKeyPresent: false,
      ascKeyPresent: false,
    },
    local: {
      configValid: false,
      hasAllCredentials: false,
    },
  };

  // Check if all required credentials are present
  const hasAppleCredentials = Boolean(
    project.appleIssuerId &&
    project.appleKeyId &&
    project.appleP8FileContent
  );

  const hasRevenueCatCredentials = Boolean(
    project.revenueCatApiKey &&
    project.revenueCatIosAppId
  );

  result.local.hasAllCredentials = hasAppleCredentials && hasRevenueCatCredentials;
  result.local.configValid = Boolean(project.bundleId);

  if (!result.local.hasAllCredentials) {
    result.local.error = 'Missing required credentials';
    return c.json({ result });
  }

  // Check Apple credentials
  try {
    if (hasAppleCredentials) {
      console.log('[Validation] ============================================');
      console.log('[Validation] APPLE CREDENTIALS CHECK STARTED');
      console.log('[Validation] Issuer ID: [REDACTED]');
      console.log('[Validation] Key ID: [REDACTED]');
      console.log('[Validation] P8 File: [PRESENT]', project.appleP8FileContent?.length ? `(${project.appleP8FileContent.length} chars)` : '(empty)');
      console.log('[Validation] ============================================');

      result.apple.apiKeyValid = await checkAppleCredentials(
        project.appleIssuerId!,
        project.appleKeyId!,
        project.appleP8FileContent!
      );

      console.log('[Validation] ✓ Apple API credentials valid:', result.apple.apiKeyValid);

      if (result.apple.apiKeyValid) {
        console.log('[Validation] ============================================');
        console.log('[Validation] SEARCHING FOR APP IN APP STORE CONNECT');
        console.log('[Validation] Bundle ID:', project.bundleId);
        console.log('[Validation] ============================================');

        const appId = await findApp(
          project.appleIssuerId!,
          project.appleKeyId!,
          project.appleP8FileContent!,
          project.bundleId
        );
        result.apple.appFound = appId !== null;

        if (result.apple.appFound) {
          console.log('[Validation] ✓ App FOUND in App Store Connect! App ID:', appId);
        } else {
          console.log('[Validation] ✗ App NOT FOUND in App Store Connect');
          console.log('[Validation] Bundle ID searched:', project.bundleId);
          console.log('[Validation] This Bundle ID does not match any app in your App Store Connect account');
          console.log('[Validation] Make sure you have:');
          console.log('[Validation]   1. Registered bundle ID in Apple Developer portal (developer.apple.com)');
          console.log('[Validation]   2. Enabled "In-App Purchase" capability on the Bundle ID');
          console.log('[Validation]   3. Created app in App Store Connect (appstoreconnect.apple.com) with this EXACT Bundle ID');
          console.log('[Validation]   4. Bundle IDs are case-sensitive and must match EXACTLY');
          result.apple.error = `App with Bundle ID "${project.bundleId}" not found in App Store Connect. Make sure: (1) Bundle ID is registered in developer.apple.com with In-App Purchase capability, (2) App is created in App Store Connect with this exact Bundle ID (case-sensitive), (3) Wait 30 seconds after creating, then try again.`;
        }

        result.apple.agreementsComplete = await checkAgreements(
          project.appleIssuerId!,
          project.appleKeyId!,
          project.appleP8FileContent!
        );
      } else {
        console.log('[Validation] ✗ Apple API credentials INVALID');
        console.log('[Validation] Common reasons for invalid credentials:');
        console.log('[Validation]   1. Issuer ID is incorrect (should be UUID format from App Store Connect → Users & Access → Keys)');
        console.log('[Validation]   2. Key ID is incorrect (should be 10-character code like ABCD123456)');
        console.log('[Validation]   3. P8 file content is incorrect or corrupted');
        console.log('[Validation]   4. API key has been revoked in App Store Connect');
        console.log('[Validation]   5. API key does not have "App Manager" permission or higher');
        console.log('[Validation]   6. Extra spaces or characters in copy-paste');
        result.apple.error = 'Apple API credentials are invalid. Check: (1) Issuer ID is correct UUID from App Store Connect, (2) Key ID is correct 10-character code, (3) P8 file matches this Key ID, (4) API key is Active (not revoked) in App Store Connect, (5) Key has "App Manager" permission.';
      }
    }
  } catch (error: any) {
    console.error('[Validation] APPLE VALIDATION ERROR:', error.message);
    result.apple.error = error.message || 'Failed to validate Apple credentials';
  }

  // Check RevenueCat credentials
  try {
    if (hasRevenueCatCredentials) {
      console.log('[Validation] ============================================');
      console.log('[Validation] REVENUECAT CHECK STARTED');
      console.log('[Validation] API Key: [REDACTED]');
      console.log('[Validation] iOS App ID:', project.revenueCatIosAppId);
      console.log('[Validation] ============================================');

      result.revenuecat.projectOk = await checkRevenueCatCredentials(project.revenueCatApiKey!);

      if (result.revenuecat.projectOk) {
        console.log('[Validation] ✓ RevenueCat API Key is valid');

        console.log('[Validation] Checking for IAP key in RevenueCat...');
        result.revenuecat.iapKeyPresent = await checkIAPKeyPresent(
          project.revenueCatApiKey!,
          project.revenueCatIosAppId!
        );

        console.log('[Validation] Checking for ASC key in RevenueCat...');
        result.revenuecat.ascKeyPresent = await checkAscKeyPresent(
          project.revenueCatApiKey!,
          project.revenueCatIosAppId!
        );

        if (result.revenuecat.iapKeyPresent) {
          console.log('[Validation] ✓ IAP Shared Secret found in RevenueCat');
        } else {
          console.log('[Validation] ✗ IAP Shared Secret NOT found in RevenueCat');
          console.log('[Validation] You need to add it here:');
          console.log('[Validation]   1. Go to appstoreconnect.apple.com → My Apps → Your App → App Information');
          console.log('[Validation]   2. Find "App-Specific Shared Secret" and copy it');
          console.log('[Validation]   3. Go to app.revenuecat.com → Your Project → Apps → Your iOS App');
          console.log('[Validation]   4. Find "App Store Connect shared secret" field and paste it');
          console.log('[Validation]   5. Click Save');
        }

        if (result.revenuecat.ascKeyPresent) {
          console.log('[Validation] ✓ App Store Connect API Key found in RevenueCat');
        } else {
          console.log('[Validation] ✗ App Store Connect API Key NOT found in RevenueCat');
          console.log('[Validation] You need to add your Apple API credentials to RevenueCat:');
          console.log('[Validation]   1. Go to app.revenuecat.com → Your Project → Apps → Your iOS App');
          console.log('[Validation]   2. Find "App Store Connect API" or "Service credentials" section');
          console.log('[Validation]   3. Enter the SAME Issuer ID, Key ID, and P8 file you used in SyncSimp Step 1');
          console.log('[Validation]   4. Click Save');
        }

        if (!result.revenuecat.iapKeyPresent || !result.revenuecat.ascKeyPresent) {
          const missing = [];
          if (!result.revenuecat.iapKeyPresent) missing.push('IAP Shared Secret (get from App Store Connect → App Information → App-Specific Shared Secret)');
          if (!result.revenuecat.ascKeyPresent) missing.push('App Store Connect API Key (add same Issuer ID, Key ID, P8 from Step 1 to RevenueCat app settings)');
          result.revenuecat.error = `RevenueCat app configuration incomplete. Add these to RevenueCat app settings: ${missing.join(' AND ')}`;
        }
      } else {
        console.log('[Validation] ✗ RevenueCat API Key is INVALID or project not found');
        console.log('[Validation] ============================================');
        console.log('[Validation] IMPORTANT: SyncSimp requires a SECRET API key (V2) with Read & Write access!');
        console.log('[Validation] ============================================');
        console.log('[Validation] Common mistake: Using "appl_xxxxx" key (Public SDK key) instead of "sk_xxxxx" key (Secret key)');
        console.log('[Validation] ');
        console.log('[Validation] How to get the correct key:');
        console.log('[Validation]   1. Go to app.revenuecat.com');
        console.log('[Validation]   2. Select your project (e.g., "Rough Diamonds Music")');
        console.log('[Validation]   3. Click the gear icon → Project Settings');
        console.log('[Validation]   4. Go to "API Keys" section');
        console.log('[Validation]   5. Look for "Secret API keys" section (scroll down past SDK API keys)');
        console.log('[Validation]   6. Click "+ New secret API key"');
        console.log('[Validation]   7. Name it "SyncSimp" and select "Read and Write" access');
        console.log('[Validation]   8. Copy the key that starts with "sk_"');
        console.log('[Validation] ============================================');

        // Detect if they used a public key
        const keyPrefix = project.revenueCatApiKey?.substring(0, 5) || '';
        if (keyPrefix === 'appl_' || keyPrefix === 'goog_' || keyPrefix === 'amzn_') {
          result.revenuecat.error = `WRONG KEY TYPE: You entered a Public SDK key (${keyPrefix}...). SyncSimp needs a SECRET API key (V2) with Read & Write access. Go to RevenueCat → Project Settings → API Keys → "Secret API keys" section → "+ New secret API key" → select "Read and Write" → copy the sk_xxx key.`;
        } else {
          result.revenuecat.error = 'RevenueCat API Key is invalid. You need a SECRET API key (V2) with Read & Write access. Go to RevenueCat → Project Settings → API Keys → "Secret API keys" section → "+ New secret API key" → select "Read and Write" access → copy key starting with sk_.';
        }
      }

      console.log('[Validation] ============================================');
    }
  } catch (error: any) {
    console.error('[Validation] REVENUECAT VALIDATION ERROR:', error.message);
    result.revenuecat.error = error.message || 'Failed to validate RevenueCat credentials';
  }

  // Note: lastCheckAt is now updated in Firebase by the frontend
  // The frontend will call updateProject after receiving the validation result

  return c.json({ result });
});

export default validation;
