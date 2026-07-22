import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import * as yaml from 'js-yaml';
import { zValidator } from '@hono/zod-validator';
import { syncRunRequestSchema } from '../../../src/shared/contracts';
import {
  ensureSubscriptionGroup,
  ensureIAP,
  ensureLocalization,
  ensurePriceSchedule,
  ensureServerNotifications,
  findApp
} from '../lib/apple.js';
import {
  ensureEntitlements,
  ensureOfferings,
  ensureProductMapping
} from '../lib/revenuecat.js';

const sync = new Hono();

const ASC_API_BASE = "https://api.appstoreconnect.apple.com";

type SyncStep = {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  logs?: string[];
  fix?: {
    title: string;
    steps: string[];
    estimatedTime: string;
  };
};

type SyncConfig = {
  app: {
    name: string;
    bundleId: string;
  };
  apple: {
    subscriptionGroup: {
      id: string;
      referenceName: string;
    };
    locales: Array<{
      id: string;
      name: string;
      description: string;
    }>;
  };
  revenuecat: {
    projectId: string;
    iosAppId: string;
  };
  entitlements: Array<{
    id: string;
    displayName: string;
    description: string;
  }>;
  offerings: Array<{
    id: string;
    displayName: string;
    description?: string;
    primary?: boolean;
  }>;
  plans: Array<{
    id: string;
    planId: string;
    displayName: string;
    appleProductId: string;
    type: string;
    duration?: string;
    entitlement: string;
    price: {
      currency: string;
      amount: number;
    };
    introOffer?: {
      type: string;
      duration: string;
    };
    rc: {
      offering: string;
      packageId: string;
    };
  }>;
  notifications?: {
    revenuecat?: {
      appleServerNotificationUrl?: string;
    };
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

// Helper to create credentials object for vibepay-connect functions
function createAppleCredentials(issuerId: string, keyId: string, privateKey: string) {
  return {
    ascIssuerId: issuerId,
    ascKeyId: keyId,
    ascKeyPath: '', // Not used, we pass privateKey directly
    iapKeyPath: '', // Not used
    _privateKey: privateKey, // Store it here for our custom functions
  };
}

// POST /api/sync/run/:projectId - Run sync for a project
// Note: Authentication is handled by Firebase on the frontend - project data is passed in request body
sync.post('/run/:projectId', zValidator('json', syncRunRequestSchema, (result, c) => {
  if (!result.success) {
    // Map failed field paths back to targeted, actionable fix guidance
    const failedFields = new Set(result.error.issues.map(i => i.path[i.path.length - 1]));
    console.log('[Sync] Request validation failed for fields:', [...failedFields].join(', '));

    const appleFields = ['appleIssuerId', 'appleKeyId', 'appleP8FileContent'];
    const revenueCatFields = ['revenueCatApiKey', 'revenueCatProjectId', 'revenueCatIosAppId'];

    if (appleFields.some(f => failedFields.has(f))) {
      return c.json({
        error: 'Missing or invalid Apple credentials',
        fix: {
          title: 'Add Apple Credentials (Step 1)',
          steps: [
            'Go back to Step 1: Credentials',
            'Enter your Apple Issuer ID (from App Store Connect > Users & Access > Keys)',
            'Enter your Apple Key ID (10-character code)',
            'Upload your P8 file (the private key file you downloaded)',
            'Make sure the API key has "App Manager" permission',
            'Save and return to Step 4',
          ],
          estimatedTime: '5 minutes',
        },
      }, 400);
    }

    if (revenueCatFields.some(f => failedFields.has(f))) {
      return c.json({
        error: 'Missing RevenueCat credentials',
        fix: {
          title: 'Add RevenueCat Credentials (Step 1 & 2)',
          steps: [
            'Go to app.revenuecat.com and select your project',
            'Get SECRET API Key: Project Settings (gear icon) > API Keys > "Secret API keys" section > + New secret API key > Read & Write access > copy sk_xxx key',
            'Get Project ID: Click gear icon next to project name > copy "Project ID: proj_xxxxx"',
            'Get iOS App ID: Apps (left sidebar) > click your iOS app > copy "App ID: app_xxxxx"',
            'Enter all three values in SyncSimp Step 1 and Step 2',
            'IMPORTANT: Use the sk_xxx secret key, NOT the appl_xxx public key',
          ],
          estimatedTime: '5 minutes',
        },
      }, 400);
    }

    if (failedFields.has('configYaml')) {
      return c.json({
        error: 'Missing YAML configuration',
        fix: {
          title: 'Configure Products (Step 2)',
          steps: [
            'Go to Step 2: Configure Products',
            'Add at least one subscription product',
            'Enter product name, price, and trial days (optional)',
            'Save the configuration',
            'Return to Step 4 and run sync',
          ],
          estimatedTime: '3 minutes',
        },
      }, 400);
    }

    // Fallback for any other validation failure (e.g. missing bundleId)
    return c.json({
      error: 'Invalid request body',
      fix: {
        title: 'Missing Required Fields',
        steps: result.error.issues.map(i => `${i.path[i.path.length - 1]}: ${i.message}`),
        estimatedTime: '5 minutes',
      },
    }, 400);
  }
}), async (c) => {
  const { projectId } = c.req.param();
  const { project } = c.req.valid('json') as any;

  console.log('[Sync] ============================================');
  console.log('[Sync] SYNC STARTED');
  console.log('[Sync] Project ID:', projectId);
  console.log('[Sync] Project name:', project.name);
  console.log('[Sync] Bundle ID:', project.bundleId);
  console.log('[Sync] ============================================');

  // Check if user has premium entitlement via RevenueCat
  const revenueCatApiKey = process.env.EXPO_PUBLIC_VIBECODE_REVENUECAT_APPLE_KEY || process.env.EXPO_PUBLIC_VIBECODE_REVENUECAT_TEST_KEY;
  const firebaseUserId = project.userId;

  if (revenueCatApiKey && firebaseUserId) {
    try {
      console.log('[Sync] Checking RevenueCat entitlements for user:', firebaseUserId);
      const subscriberResponse = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${firebaseUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${revenueCatApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (subscriberResponse.ok) {
        const subscriberData = await subscriberResponse.json();
        const entitlements = subscriberData.subscriber?.entitlements || {};
        const hasPremium = entitlements.premium?.expires_date
          ? new Date(entitlements.premium.expires_date) > new Date()
          : false;

        console.log('[Sync] User has premium:', hasPremium);

        if (!hasPremium) {
          console.log('[Sync] User does not have premium entitlement, blocking sync');
          return c.json({
            error: 'Premium subscription required',
            message: 'Please upgrade to a paid plan to run syncs.',
            needsUpgrade: true,
            fix: {
              title: 'Subscription Required',
              steps: [
                'Go to Settings tab in the app',
                'Tap "Manage Subscription"',
                'Choose a plan (Monthly, Yearly, or Lifetime)',
                'Complete the purchase',
                'Return here and run sync again'
              ],
              estimatedTime: '2 minutes'
            }
          }, 403);
        }
      } else {
        console.log('[Sync] Unable to verify subscription, allowing sync');
      }
    } catch (error) {
      console.log('[Sync] Error checking RevenueCat entitlements:', error);
    }
  } else {
    console.log('[Sync] RevenueCat not configured or no user ID, allowing sync');
  }

  // Parse config (input already validated by zValidator)
  let config: SyncConfig;
  try {
    config = yaml.load(project.configYaml) as SyncConfig;
    console.log('[Sync] Parsed YAML config successfully');
    console.log('[Sync] Products to sync:', config.plans?.length || 0);
  } catch (error: any) {
    console.log('[Sync] Failed to parse YAML:', error.message);
    return c.json({
      error: `Invalid YAML configuration: ${error.message}`,
      fix: {
        title: 'Fix Configuration',
        steps: [
          'Go to Step 2: Configure Products',
          'Delete any invalid products',
          'Add products again using the form',
          'Make sure all required fields are filled',
          'Save and try sync again'
        ],
        estimatedTime: '3 minutes'
      }
    }, 400);
  }

  const steps: SyncStep[] = [];
  let hasError = false;

  try {
    // Step 1: Preflight Check
    console.log('[Sync] Starting preflight check...');
    steps.push({ name: 'Preflight Check', status: 'running', message: 'Validating configuration...', logs: [] });

    // Verify app exists
    const appId = await findApp(
      createAppleCredentials(project.appleIssuerId, project.appleKeyId, project.appleP8FileContent) as any,
      config.app.bundleId
    );

    if (!appId) {
      console.log('[Sync] App NOT FOUND in App Store Connect');
      console.log('[Sync] Bundle ID searched:', config.app.bundleId);

      steps[0] = {
        name: 'Preflight Check',
        status: 'error',
        message: `App not found for bundle ID: ${config.app.bundleId}`,
        logs: [
          `Bundle ID "${config.app.bundleId}" does not exist in App Store Connect`,
          'This could mean:',
          '1. App has not been created in App Store Connect yet',
          '2. Bundle ID is misspelled or has wrong case',
          '3. Apple credentials are for a different Apple Developer account'
        ],
        fix: {
          title: 'Create App in App Store Connect',
          steps: [
            `Go to appstoreconnect.apple.com`,
            `Click "My Apps" > "+" > "New App"`,
            `Select iOS platform`,
            `Enter your app name`,
            `Select Bundle ID: ${config.app.bundleId}`,
            `If Bundle ID is not in dropdown, first register it at developer.apple.com > Certificates, Identifiers & Profiles > Identifiers`,
            `Enter SKU (can be same as bundle ID)`,
            `Click "Create"`,
            `Wait 30 seconds, then run sync again`
          ],
          estimatedTime: '10 minutes'
        }
      };
      hasError = true;
      throw new Error('App not found');
    }

    console.log('[Sync] App FOUND! App ID:', appId);
    steps[0] = {
      name: 'Preflight Check',
      status: 'success',
      message: 'All checks passed',
      logs: [`Found app: ${config.app.bundleId} (ID: ${appId})`]
    };

    // Step 2: Apple App Store Connect
    console.log('[Sync] Creating products in App Store Connect...');
    steps.push({ name: 'Apple App Store Connect', status: 'running', message: 'Creating products...', logs: [] });
    const appleLogs: string[] = [];

    // Ensure subscription group
    const subGroup = await ensureSubscriptionGroup(
      createAppleCredentials(project.appleIssuerId, project.appleKeyId, project.appleP8FileContent) as any,
      appId,
      config.apple.subscriptionGroup
    );

    appleLogs.push(
      `Subscription group '${config.apple.subscriptionGroup.referenceName}' ${
        subGroup.created ? 'created' : 'found'
      }`
    );
    console.log('[Sync]', appleLogs[appleLogs.length - 1]);

    // Process each plan
    for (const plan of config.plans) {
      console.log('[Sync] Processing product:', plan.appleProductId);

      const iap = await ensureIAP(
        createAppleCredentials(project.appleIssuerId, project.appleKeyId, project.appleP8FileContent) as any,
        appId,
        {
          appleProductId: plan.appleProductId,
          displayName: plan.displayName,
          type: plan.type,
          duration: plan.duration,
        },
        plan.type === 'auto_renewable' ? subGroup.id : undefined
      );

      appleLogs.push(
        `Product '${plan.appleProductId}' ${iap.created ? 'created' : 'found'}`
      );
      console.log('[Sync]', appleLogs[appleLogs.length - 1]);

      // Localizations
      const locLogs = await ensureLocalization(
        createAppleCredentials(project.appleIssuerId, project.appleKeyId, project.appleP8FileContent) as any,
        iap.id,
        config.apple.locales,
        plan
      );
      appleLogs.push(...locLogs);

      // Price schedule
      const priceLogs = await ensurePriceSchedule(
        createAppleCredentials(project.appleIssuerId, project.appleKeyId, project.appleP8FileContent) as any,
        iap.id,
        plan.price,
        plan.introOffer
      );
      appleLogs.push(...priceLogs);
    }

    // Server notifications
    const notifUrl =
      config.notifications?.revenuecat?.appleServerNotificationUrl ||
      `https://api.revenuecat.com/v1/projects/${config.revenuecat.projectId}/apple-server-notifications`;

    const notifLogs = await ensureServerNotifications(
      createAppleCredentials(project.appleIssuerId, project.appleKeyId, project.appleP8FileContent) as any,
      appId,
      notifUrl
    );
    appleLogs.push(...notifLogs);

    steps[1] = {
      name: 'Apple App Store Connect',
      status: 'success',
      message: `${config.plans.length} products configured`,
      logs: appleLogs,
    };

    // Step 3: RevenueCat Setup
    console.log('[Sync] Configuring RevenueCat...');
    steps.push({ name: 'RevenueCat Setup', status: 'running', message: 'Configuring entitlements...', logs: [] });
    const rcLogs: string[] = [];

    // Ensure entitlements
    const entitlementLogs = await ensureEntitlements(
      project.revenueCatApiKey,
      config.entitlements,
      config.revenuecat.projectId
    );
    rcLogs.push(...entitlementLogs);

    // Ensure offerings
    const offeringLogs = await ensureOfferings(
      project.revenueCatApiKey,
      config.offerings,
      config.revenuecat.projectId
    );
    rcLogs.push(...offeringLogs);

    // Map products
    for (const plan of config.plans) {
      const productLogs = await ensureProductMapping(
        project.revenueCatApiKey,
        plan as any,
        config.revenuecat.projectId,
        config.revenuecat.iosAppId
      );
      rcLogs.push(...productLogs);
    }

    steps[2] = {
      name: 'RevenueCat Setup',
      status: 'success',
      message: 'Offerings configured',
      logs: rcLogs,
    };

    // Step 4: Finalize
    console.log('[Sync] Finalizing...');
    steps.push({ name: 'Finalize', status: 'running', message: 'Completing sync...', logs: [] });

    steps[3] = {
      name: 'Finalize',
      status: 'success',
      message: 'Sync complete!',
      logs: ['All products and offerings configured successfully'],
    };

    console.log('[Sync] ============================================');
    console.log('[Sync] SYNC COMPLETED SUCCESSFULLY');
    console.log('[Sync] ============================================');

    return c.json({ success: true, steps });

  } catch (error: any) {
    console.log('[Sync] ============================================');
    console.log('[Sync] SYNC FAILED');
    console.log('[Sync] Error:', error.message);
    console.log('[Sync] ============================================');

    // Update last step to error if exists
    if (steps.length > 0 && steps[steps.length - 1].status === 'running') {
      const lastStep = steps[steps.length - 1];

      // Add contextual fix instructions based on the error
      let fix = lastStep.fix;
      if (!fix) {
        // Detect common error patterns and provide specific fixes
        const errorMsg = error.message?.toLowerCase() || '';

        if (errorMsg.includes('app not found')) {
          fix = {
            title: 'Create App in App Store Connect',
            steps: [
              'Go to appstoreconnect.apple.com',
              'Click "My Apps" > "+" > "New App"',
              'Create app with your Bundle ID',
              'Wait 30 seconds, then try sync again'
            ],
            estimatedTime: '10 minutes'
          };
        } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
          fix = {
            title: 'Complete Apple Account Setup',
            steps: [
              'Go to appstoreconnect.apple.com',
              'Click "Business" at top of page',
              'Sign "Paid Applications Agreement"',
              'Complete Banking and Tax info',
              'Go to your app > App Information > fill ALL required fields',
              'Create app version 1.0 with basic info',
              'Try sync again'
            ],
            estimatedTime: '15-30 minutes'
          };
        } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          fix = {
            title: 'Fix API Credentials',
            steps: [
              'Your Apple API credentials are invalid or expired',
              'Go to App Store Connect > Users & Access > Keys',
              'Verify your API key is Active (not Revoked)',
              'Make sure the key has "App Manager" permission',
              'Download a fresh P8 file and re-upload it in Step 1',
              'Double-check Issuer ID and Key ID are correct'
            ],
            estimatedTime: '5 minutes'
          };
        } else if (errorMsg.includes('revenuecat') || errorMsg.includes('entitlement')) {
          fix = {
            title: 'Fix RevenueCat Configuration',
            steps: [
              'Go to app.revenuecat.com',
              'Verify you are using a SECRET API key (sk_xxx), not public key (appl_xxx)',
              'Check Project ID and iOS App ID are correct',
              'Make sure App Store Connect API credentials are added to RevenueCat app settings'
            ],
            estimatedTime: '5 minutes'
          };
        } else {
          fix = {
            title: 'General Troubleshooting',
            steps: [
              'Check the error message above for specific details',
              'Verify all credentials in Step 1',
              'Run Step 3: Validation to check what is failing',
              'Make sure your Apple Developer account is in good standing',
              'If error persists, try creating fresh API credentials'
            ],
            estimatedTime: '10-15 minutes'
          };
        }
      }

      steps[steps.length - 1] = {
        ...lastStep,
        status: 'error',
        message: error.message || 'An error occurred',
        fix
      };
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const safeErrorMessage = isProduction
      ? (hasError ? 'Sync failed due to configuration issue' : 'An internal error occurred during sync')
      : (error.message || 'An error occurred');
    return c.json({ success: false, error: safeErrorMessage, steps }, hasError ? 400 : 500);
  }
});

export default sync;
