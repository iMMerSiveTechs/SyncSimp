import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as yaml from "js-yaml";
import {
  findApp,
  ensureSubscriptionGroup,
  ensureIAP,
  ensureLocalization,
  ensurePriceSchedule,
  ensureServerNotifications,
} from "./lib/apple";
import {
  checkRevenueCatCredentials,
  checkIAPKeyPresent,
  checkAscKeyPresent,
  ensureEntitlements,
  ensureOfferings,
  ensureProductMapping,
} from "./lib/revenuecat";
import { checkAppleCredentials } from "./lib/apple";

admin.initializeApp();
const db = admin.firestore();

// ============================================
// Types
// ============================================

type SyncStep = {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message: string;
  logs?: string[];
  fix?: { title: string; steps: string[]; estimatedTime: string };
};

type SyncConfig = {
  app: { name: string; bundleId: string };
  apple: {
    subscriptionGroup: { id: string; referenceName: string };
    locales: Array<{ id: string; name: string; description: string }>;
  };
  revenuecat: { projectId: string; iosAppId: string };
  entitlements: Array<{ id: string; displayName: string; description: string }>;
  offerings: Array<{ id: string; displayName: string; description?: string; primary?: boolean }>;
  plans: Array<{
    id: string; planId: string; displayName: string; appleProductId: string;
    type: string; duration?: string; entitlement: string;
    price: { currency: string; amount: number };
    introOffer?: { type: string; duration: string };
    rc: { offering: string; packageId: string };
  }>;
  notifications?: { revenuecat?: { appleServerNotificationUrl?: string } };
};

function makeCreds(project: any) {
  return { ascIssuerId: project.appleIssuerId, ascKeyId: project.appleKeyId, _privateKey: project.appleP8FileContent };
}

function getSyncErrorFix(errorMsg: string) {
  const lower = errorMsg.toLowerCase();
  if (lower.includes("app not found")) {
    return { title: "Create App in App Store Connect", steps: ["Go to appstoreconnect.apple.com", 'Click "My Apps" > "+" > "New App"', "Create app with your Bundle ID", "Wait 30 seconds, then try sync again"], estimatedTime: "10 minutes" };
  } else if (lower.includes("403") || lower.includes("forbidden")) {
    return { title: "Complete Apple Account Setup", steps: ["Go to appstoreconnect.apple.com", 'Click "Business" at top of page', 'Sign "Paid Applications Agreement"', "Complete Banking and Tax info", "Fill ALL required fields in App Information", "Try sync again"], estimatedTime: "15-30 minutes" };
  } else if (lower.includes("401") || lower.includes("unauthorized")) {
    return { title: "Fix API Credentials", steps: ["Go to App Store Connect > Users & Access > Keys", "Verify your API key is Active (not Revoked)", 'Make sure the key has "App Manager" permission', "Download a fresh P8 file and re-upload in Step 1"], estimatedTime: "5 minutes" };
  } else if (lower.includes("revenuecat") || lower.includes("entitlement")) {
    return { title: "Fix RevenueCat Configuration", steps: ["Go to app.revenuecat.com", "Verify you are using a SECRET API key (sk_xxx)", "Check Project ID and iOS App ID are correct"], estimatedTime: "5 minutes" };
  }
  return { title: "General Troubleshooting", steps: ["Check the error message for details", "Verify all credentials in Step 1", "Run Step 3: Validation to check what is failing"], estimatedTime: "10-15 minutes" };
}

// ============================================
// runSync Cloud Function
// ============================================

export const runSync = onCall({ timeoutSeconds: 120, memory: "512MiB" }, async (request) => {
  // Verify auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in to run sync");
  }

  const { projectId } = request.data as { projectId: string };
  if (!projectId) {
    throw new HttpsError("invalid-argument", "projectId is required");
  }

  // Read project from Firestore
  const projectDoc = await db.doc(`projects/${projectId}`).get();
  if (!projectDoc.exists) {
    throw new HttpsError("not-found", "Project not found");
  }

  const project = projectDoc.data()!;
  if (project.userId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Not your project");
  }

  // Premium check via RevenueCat
  const revenueCatSdkKey = process.env.REVENUECAT_SDK_KEY;
  if (revenueCatSdkKey && request.auth.uid) {
    try {
      const subscriberResponse = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${request.auth.uid}`,
        { headers: { Authorization: `Bearer ${revenueCatSdkKey}`, "Content-Type": "application/json" } }
      );
      if (subscriberResponse.ok) {
        const subscriberData = await subscriberResponse.json();
        const entitlements = subscriberData.subscriber?.entitlements || {};
        const premiumEntitlement = entitlements.premium;
        const hasPremium = premiumEntitlement
          ? (premiumEntitlement.expires_date === null || new Date(premiumEntitlement.expires_date) > new Date())
          : false;
        if (!hasPremium) {
          throw new HttpsError("permission-denied", JSON.stringify({
            error: "Premium subscription required",
            needsUpgrade: true,
            fix: { title: "Subscription Required", steps: ["Go to Settings", "Tap Manage Subscription", "Choose a plan", "Complete purchase", "Return and run sync again"], estimatedTime: "2 minutes" },
          }));
        }
      }
    } catch (e: any) {
      if (e instanceof HttpsError) throw e;
      // If RevenueCat check fails, allow sync
    }
  }

  // Validate credentials
  if (!project.appleIssuerId || !project.appleKeyId || !project.appleP8FileContent) {
    throw new HttpsError("failed-precondition", JSON.stringify({
      error: "Missing Apple credentials",
      fix: { title: "Add Apple Credentials (Step 1)", steps: ["Go to Step 1: Credentials", "Enter Issuer ID, Key ID, and upload P8 file", "Save and return to Step 4"], estimatedTime: "5 minutes" },
    }));
  }

  if (project.appleP8FileContent.length < 200) {
    throw new HttpsError("failed-precondition", JSON.stringify({
      error: "P8 file appears invalid",
      fix: { title: "Re-upload P8 File", steps: ["Go to Step 1: Credentials", "Download fresh P8 from App Store Connect > Keys", "Upload the new P8 file"], estimatedTime: "5 minutes" },
    }));
  }

  if (!project.revenueCatApiKey || !project.revenueCatProjectId || !project.revenueCatIosAppId) {
    throw new HttpsError("failed-precondition", JSON.stringify({
      error: "Missing RevenueCat credentials",
      fix: { title: "Add RevenueCat Credentials", steps: ["Go to app.revenuecat.com", "Get SECRET API Key (sk_xxx), Project ID, and iOS App ID", "Enter in Step 1 and Step 2"], estimatedTime: "5 minutes" },
    }));
  }

  if (!project.configYaml) {
    throw new HttpsError("failed-precondition", JSON.stringify({
      error: "Missing YAML configuration",
      fix: { title: "Configure Products (Step 2)", steps: ["Go to Step 2", "Add products", "Save configuration"], estimatedTime: "3 minutes" },
    }));
  }

  // Parse config
  let config: SyncConfig;
  try {
    config = yaml.load(project.configYaml) as SyncConfig;
  } catch (error: any) {
    throw new HttpsError("failed-precondition", JSON.stringify({
      error: `Invalid YAML: ${error.message}`,
      fix: { title: "Fix Configuration", steps: ["Go to Step 2", "Delete invalid products", "Re-add them", "Save"], estimatedTime: "3 minutes" },
    }));
  }

  const steps: SyncStep[] = [];
  const creds = makeCreds(project);

  try {
    // Step 1: Preflight
    steps.push({ name: "Preflight Check", status: "running", message: "Validating..." });
    const appId = await findApp(creds, config.app.bundleId);
    if (!appId) {
      steps[0] = {
        name: "Preflight Check", status: "error",
        message: `App not found for bundle ID: ${config.app.bundleId}`,
        fix: { title: "Create App in App Store Connect", steps: ["Go to appstoreconnect.apple.com", `Create app with Bundle ID: ${config.app.bundleId}`, "Wait 30 seconds, then retry"], estimatedTime: "10 minutes" },
      };
      return { success: false, steps };
    }
    steps[0] = { name: "Preflight Check", status: "success", message: "All checks passed", logs: [`Found app: ${config.app.bundleId} (ID: ${appId})`] };

    // Step 2: Apple App Store Connect
    steps.push({ name: "Apple App Store Connect", status: "running", message: "Creating products..." });
    const appleLogs: string[] = [];

    const subGroup = await ensureSubscriptionGroup(creds, appId, config.apple.subscriptionGroup);
    appleLogs.push(`Subscription group '${config.apple.subscriptionGroup.referenceName}' ${subGroup.created ? "created" : "found"}`);

    for (const plan of config.plans) {
      const iap = await ensureIAP(creds, appId, {
        appleProductId: plan.appleProductId, displayName: plan.displayName, type: plan.type, duration: plan.duration,
      }, plan.type === "auto_renewable" ? subGroup.id : undefined);
      appleLogs.push(`Product '${plan.appleProductId}' ${iap.created ? "created" : "found"}`);

      const locLogs = await ensureLocalization(creds, iap.id, config.apple.locales, plan);
      appleLogs.push(...locLogs);

      const priceLogs = await ensurePriceSchedule(creds, iap.id, plan.price, plan.introOffer);
      appleLogs.push(...priceLogs);
    }

    const notifUrl = config.notifications?.revenuecat?.appleServerNotificationUrl ||
      `https://api.revenuecat.com/v1/projects/${config.revenuecat.projectId}/apple-server-notifications`;
    const notifLogs = await ensureServerNotifications(creds, appId, notifUrl);
    appleLogs.push(...notifLogs);

    steps[1] = { name: "Apple App Store Connect", status: "success", message: `${config.plans.length} products configured`, logs: appleLogs };

    // Step 3: RevenueCat
    steps.push({ name: "RevenueCat Setup", status: "running", message: "Configuring entitlements..." });
    const rcLogs: string[] = [];

    const entLogs = await ensureEntitlements(project.revenueCatApiKey, config.entitlements, config.revenuecat.projectId);
    rcLogs.push(...entLogs);
    const offLogs = await ensureOfferings(project.revenueCatApiKey, config.offerings, config.revenuecat.projectId);
    rcLogs.push(...offLogs);
    for (const plan of config.plans) {
      const prodLogs = await ensureProductMapping(project.revenueCatApiKey, plan as any, config.revenuecat.projectId, config.revenuecat.iosAppId);
      rcLogs.push(...prodLogs);
    }

    steps[2] = { name: "RevenueCat Setup", status: "success", message: "Offerings configured", logs: rcLogs };

    // Step 4: Finalize
    steps.push({ name: "Finalize", status: "success", message: "Sync complete!", logs: ["All products and offerings configured successfully"] });

    // Update Firestore
    await db.doc(`projects/${projectId}`).update({
      syncStatus: "success",
      lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncError: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, steps };
  } catch (error: any) {
    if (steps.length > 0 && steps[steps.length - 1].status === "running") {
      steps[steps.length - 1] = {
        ...steps[steps.length - 1],
        status: "error",
        message: error.message || "An error occurred",
        fix: getSyncErrorFix(error.message || ""),
      };
    }

    await db.doc(`projects/${projectId}`).update({
      syncStatus: "error",
      lastSyncError: error.message || "Unknown error",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: false, error: error.message, steps };
  }
});

// ============================================
// checkValidation Cloud Function
// ============================================

export const checkValidation = onCall({ timeoutSeconds: 60, memory: "256MiB" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { projectId } = request.data as { projectId: string };
  if (!projectId) {
    throw new HttpsError("invalid-argument", "projectId is required");
  }

  const projectDoc = await db.doc(`projects/${projectId}`).get();
  if (!projectDoc.exists) {
    throw new HttpsError("not-found", "Project not found");
  }

  const project = projectDoc.data()!;
  if (project.userId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Not your project");
  }

  const result = {
    apple: { apiKeyValid: false, appFound: false, agreementsComplete: false, error: undefined as string | undefined },
    revenuecat: { projectOk: false, iapKeyPresent: false, ascKeyPresent: false, error: undefined as string | undefined },
    local: { configValid: false, hasAllCredentials: false, error: undefined as string | undefined },
  };

  const hasAppleCreds = Boolean(project.appleIssuerId && project.appleKeyId && project.appleP8FileContent);
  const hasRcCreds = Boolean(project.revenueCatApiKey && project.revenueCatIosAppId);

  result.local.hasAllCredentials = hasAppleCreds && hasRcCreds;
  result.local.configValid = Boolean(project.bundleId);

  if (!result.local.hasAllCredentials) {
    result.local.error = "Missing required credentials";
    return { result };
  }

  // Apple checks
  if (hasAppleCreds) {
    try {
      const creds = makeCreds(project);
      result.apple.apiKeyValid = await checkAppleCredentials(creds);

      if (result.apple.apiKeyValid) {
        const appId = await findApp(creds, project.bundleId);
        result.apple.appFound = appId !== null;
        if (!result.apple.appFound) {
          result.apple.error = `App with Bundle ID "${project.bundleId}" not found in App Store Connect.`;
        }
        result.apple.agreementsComplete = true; // Manual check
      } else {
        result.apple.error = "Apple API credentials are invalid. Check Issuer ID, Key ID, and P8 file.";
      }
    } catch (error: any) {
      result.apple.error = error.message || "Failed to validate Apple credentials";
    }
  }

  // RevenueCat checks
  if (hasRcCreds) {
    try {
      result.revenuecat.projectOk = await checkRevenueCatCredentials(project.revenueCatApiKey);

      if (result.revenuecat.projectOk) {
        result.revenuecat.iapKeyPresent = await checkIAPKeyPresent(project.revenueCatApiKey, project.revenueCatIosAppId);
        result.revenuecat.ascKeyPresent = await checkAscKeyPresent(project.revenueCatApiKey, project.revenueCatIosAppId);

        if (!result.revenuecat.iapKeyPresent || !result.revenuecat.ascKeyPresent) {
          const missing = [];
          if (!result.revenuecat.iapKeyPresent) missing.push("IAP Shared Secret");
          if (!result.revenuecat.ascKeyPresent) missing.push("App Store Connect API Key");
          result.revenuecat.error = `Missing in RevenueCat app settings: ${missing.join(" AND ")}`;
        }
      } else {
        const keyPrefix = project.revenueCatApiKey?.substring(0, 5) || "";
        if (keyPrefix === "appl_" || keyPrefix === "goog_") {
          result.revenuecat.error = `WRONG KEY TYPE: You used a Public SDK key (${keyPrefix}...). Need a SECRET key (sk_xxx).`;
        } else {
          result.revenuecat.error = "RevenueCat API Key is invalid. Need SECRET key (sk_xxx) with Read & Write access.";
        }
      }
    } catch (error: any) {
      result.revenuecat.error = error.message || "Failed to validate RevenueCat credentials";
    }
  }

  // Update lastCheckAt in Firestore
  await db.doc(`projects/${projectId}`).update({
    lastCheckAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { result };
});
