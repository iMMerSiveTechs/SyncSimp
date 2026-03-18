/**
 * Comprehensive error fixes for complete beginners
 * Every error has detailed step-by-step instructions
 */

export interface ErrorFix {
  title: string;
  description: string;
  steps: {
    number: number;
    instruction: string;
    details?: string;
    screenshot?: string; // Placeholder for future screenshots
  }[];
  commonMistakes?: string[];
  estimatedTime?: string;
  needsHelp?: string;
}

export const ERROR_FIXES: Record<string, ErrorFix> = {
  // ============================================
  // MISSING CREDENTIALS ERRORS
  // ============================================
  MISSING_APPLE_CREDENTIALS: {
    title: "Missing Apple Credentials",
    description: "You haven't entered your Apple App Store Connect API credentials yet. These are required to create in-app purchases in your app.",
    estimatedTime: "10-15 minutes",
    steps: [
      {
        number: 1,
        instruction: "Go back to Step 1 (Credentials)",
        details: "Tap the back button, then tap 'Step 1: Add Your Credentials' on your project screen"
      },
      {
        number: 2,
        instruction: "Open App Store Connect in your web browser",
        details: "Go to appstoreconnect.apple.com and sign in with your Apple account"
      },
      {
        number: 3,
        instruction: "Navigate to API Keys",
        details: "Click 'Users and Access' in the top menu, then click 'Keys' tab (or 'Integrations' → 'App Store Connect API')"
      },
      {
        number: 4,
        instruction: "Create a new API Key (if you don't have one)",
        details: "Click the '+' button next to 'Active'. Give it a name like 'SyncSimp API Key' and select 'App Manager' access. Click 'Generate'."
      },
      {
        number: 5,
        instruction: "Copy the Issuer ID",
        details: "At the top of the Keys page, you'll see 'Issuer ID' with a UUID like '12345678-1234-1234-1234-123456789abc'. Copy this entire ID."
      },
      {
        number: 6,
        instruction: "Copy the Key ID",
        details: "Find your API key in the list and copy the 10-character Key ID (looks like 'ABCD123456')"
      },
      {
        number: 7,
        instruction: "Download the P8 private key file",
        details: "Click 'Download API Key' button. This downloads a .p8 file - SAVE IT SAFELY, you can only download it once!"
      },
      {
        number: 8,
        instruction: "Enter all three values in Step 1",
        details: "Paste the Issuer ID and Key ID into the form, then tap 'Upload P8 File' and select the .p8 file you just downloaded"
      }
    ],
    commonMistakes: [
      "Using the wrong type of API key (needs to be 'App Manager' role)",
      "Confusing Key ID with Issuer ID (Key ID is 10 chars, Issuer ID is a UUID)",
      "Losing the P8 file (can only download once - if lost, create a new key)"
    ],
    needsHelp: "Tap 'Need Help?' button on the Credentials screen for visual guides with screenshots"
  },

  MISSING_REVENUECAT_CREDENTIALS: {
    title: "Missing RevenueCat Credentials",
    description: "You haven't entered your RevenueCat API key yet. This is required to set up subscriptions in RevenueCat.",
    estimatedTime: "15-20 minutes",
    steps: [
      {
        number: 1,
        instruction: "Create a RevenueCat account (if you don't have one)",
        details: "Go to app.revenuecat.com and sign up for a free account"
      },
      {
        number: 2,
        instruction: "Create a new project in RevenueCat",
        details: "Click 'Create new project' and give it a name (e.g., 'SyncSimp')"
      },
      {
        number: 3,
        instruction: "Add your iOS app to the project",
        details: "Click 'Add app' → Select 'iOS' → Enter your Bundle ID (MUST match exactly: com.YourCompany.AppName)"
      },
      {
        number: 4,
        instruction: "Get your RevenueCat API Key",
        details: "Go to Project Settings (gear icon) → API Keys → Click 'Create New Public API Key' → Give it a name → Copy the key (starts with 'sk_')"
      },
      {
        number: 5,
        instruction: "Enter the API key in Step 1",
        details: "Go back to Step 1 in SyncSimp and paste your RevenueCat API key"
      }
    ],
    commonMistakes: [
      "Using a secret key instead of public key (public keys start with 'sk_' or 'appl_')",
      "Bundle ID mismatch between RevenueCat and Apple",
      "Creating API key before adding the iOS app"
    ],
    needsHelp: "Tap 'Need Help?' button on the Credentials screen for visual guides"
  },

  // ============================================
  // APPLE CREDENTIAL VALIDATION ERRORS
  // ============================================
  APPLE_CREDENTIALS_INVALID: {
    title: "Apple Credentials Are Invalid",
    description: "The Apple API credentials you entered don't work. This usually means one of the three values (Issuer ID, Key ID, or P8 file) is incorrect.",
    estimatedTime: "5-10 minutes",
    steps: [
      {
        number: 1,
        instruction: "Double-check your Issuer ID",
        details: "In App Store Connect → Users and Access → Keys, verify the Issuer ID at the top matches what you entered (it's a UUID like '12345678-1234-...')"
      },
      {
        number: 2,
        instruction: "Verify your Key ID",
        details: "Check that the 10-character Key ID matches exactly (e.g., 'ABCD123456'). No spaces, correct capitalization."
      },
      {
        number: 3,
        instruction: "Confirm you uploaded the correct P8 file",
        details: "Make sure you uploaded the .p8 file that corresponds to this specific Key ID, not a different key"
      },
      {
        number: 4,
        instruction: "Check if the API key is still active",
        details: "In App Store Connect, confirm the key shows as 'Active' (not revoked). If revoked, create a new one."
      },
      {
        number: 5,
        instruction: "Verify the key has correct permissions",
        details: "The API key must have 'App Manager' role or higher. If not, create a new key with proper permissions."
      },
      {
        number: 6,
        instruction: "Re-enter all credentials in Step 1",
        details: "If still not working, delete all values and re-enter them carefully, paying attention to any extra spaces"
      }
    ],
    commonMistakes: [
      "Copy-pasting with extra spaces at the beginning or end",
      "Using a revoked API key",
      "Uploading wrong P8 file (if you have multiple keys)",
      "Key doesn't have sufficient permissions"
    ],
    needsHelp: "If you've triple-checked everything and it still fails, you may need to create a brand new API key in App Store Connect and start over"
  },

  // ============================================
  // APP NOT FOUND IN APP STORE CONNECT
  // ============================================
  APP_NOT_FOUND_IN_ASC: {
    title: "App Not Found in App Store Connect",
    description: "Your app doesn't exist in App Store Connect yet, or the Bundle ID doesn't match. You MUST create the app in App Store Connect before syncing.",
    estimatedTime: "10-15 minutes",
    steps: [
      {
        number: 1,
        instruction: "Register your Bundle ID in Apple Developer Portal FIRST",
        details: "Go to developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → Click '+' button"
      },
      {
        number: 2,
        instruction: "Select 'App IDs' and click Continue",
        details: "Choose 'App IDs' (not App Clips or other options)"
      },
      {
        number: 3,
        instruction: "Enter your Bundle ID details",
        details: "Description: Your app name. Bundle ID: EXACTLY what you entered in SyncSimp (e.g., com.YourCompany.AppName). Select 'Explicit' not 'Wildcard'."
      },
      {
        number: 4,
        instruction: "Enable In-App Purchase capability",
        details: "Scroll down to 'Capabilities' section and check the box next to 'In-App Purchase'. This is REQUIRED."
      },
      {
        number: 5,
        instruction: "Register the identifier",
        details: "Click 'Continue' then 'Register'. Wait for confirmation."
      },
      {
        number: 6,
        instruction: "Create app in App Store Connect",
        details: "Go to appstoreconnect.apple.com → Apps → Click the '+' button → Select 'New App'"
      },
      {
        number: 7,
        instruction: "Fill in app details",
        details: "Platform: iOS. Name: Your app name. Primary Language: English. Bundle ID: Select the one you just registered. SKU: Any unique identifier (e.g., 'app-001')"
      },
      {
        number: 8,
        instruction: "Create the app",
        details: "Click 'Create'. Your app is now registered! Wait a few seconds for it to propagate."
      },
      {
        number: 9,
        instruction: "Run validation check again",
        details: "Come back to SyncSimp and tap 'Run Validation Check' again. It should now find your app."
      }
    ],
    commonMistakes: [
      "Forgetting to register Bundle ID in Developer Portal before App Store Connect",
      "Bundle ID mismatch (different in SyncSimp vs App Store Connect)",
      "Forgetting to enable In-App Purchase capability",
      "Using a wildcard Bundle ID instead of explicit"
    ],
    needsHelp: "Bundle IDs are case-sensitive and must match EXACTLY everywhere. Double-check spelling and capitalization."
  },

  // ============================================
  // REVENUECAT CONNECTION ERRORS
  // ============================================
  REVENUECAT_CONNECTION_FAILED: {
    title: "RevenueCat Connection Failed",
    description: "Cannot connect to RevenueCat with the API key you provided. The key might be invalid, or the project doesn't exist.",
    estimatedTime: "5-10 minutes",
    steps: [
      {
        number: 1,
        instruction: "Verify your API key in RevenueCat",
        details: "Log into app.revenuecat.com → Click your project → Project Settings (gear icon) → API Keys"
      },
      {
        number: 2,
        instruction: "Check if the key is active",
        details: "Make sure the API key you're using shows as 'Active' and hasn't been deleted or revoked"
      },
      {
        number: 3,
        instruction: "Use a PUBLIC API key (not secret)",
        details: "You need a 'Public API Key' - these start with 'sk_' or 'appl_'. Do NOT use secret backend keys."
      },
      {
        number: 4,
        instruction: "Create a new API key if needed",
        details: "If your key is invalid, click 'Create New Public API Key' → Give it a name → Copy the full key"
      },
      {
        number: 5,
        instruction: "Update Step 1 with the correct key",
        details: "Go back to Step 1 in SyncSimp and paste the complete API key (the whole thing, no spaces)"
      },
      {
        number: 6,
        instruction: "Verify the project actually exists",
        details: "Make sure you're logged into the correct RevenueCat account and the project hasn't been deleted"
      }
    ],
    commonMistakes: [
      "Using the wrong type of API key (secret vs public)",
      "Copy-pasting only part of the key",
      "Using an old/revoked key",
      "Logged into wrong RevenueCat account"
    ],
    needsHelp: "If you just created your RevenueCat account, make sure you've created a project first"
  },

  // ============================================
  // MISSING IAP SHARED SECRET
  // ============================================
  MISSING_IAP_SECRET: {
    title: "Missing IAP Shared Secret in RevenueCat",
    description: "RevenueCat needs your App Store Connect Shared Secret to verify purchases. This is different from your API key.",
    estimatedTime: "5-10 minutes",
    steps: [
      {
        number: 1,
        instruction: "Get your Shared Secret from App Store Connect",
        details: "Go to appstoreconnect.apple.com → My Apps → Select your app → App Information (left sidebar)"
      },
      {
        number: 2,
        instruction: "Find the App-Specific Shared Secret",
        details: "Scroll down to 'App-Specific Shared Secret' section. If you see 'Generate', click it. Otherwise, click 'View' or 'Regenerate'."
      },
      {
        number: 3,
        instruction: "Copy the shared secret",
        details: "It's a long string of letters and numbers. Copy the entire thing."
      },
      {
        number: 4,
        instruction: "Add it to RevenueCat",
        details: "Go to app.revenuecat.com → Your project → Apps → Select your iOS app"
      },
      {
        number: 5,
        instruction: "Find the 'App Store Connect shared secret' field",
        details: "Scroll down to find this field. It might also be under 'Service credentials' or 'App settings'."
      },
      {
        number: 6,
        instruction: "Paste and save",
        details: "Paste your shared secret and click 'Save' or 'Update'"
      },
      {
        number: 7,
        instruction: "Wait 30 seconds, then run validation again",
        details: "Changes in RevenueCat take a moment to propagate. Wait briefly, then run the validation check again."
      }
    ],
    commonMistakes: [
      "Using the master shared secret instead of app-specific one (app-specific is recommended)",
      "Not saving after pasting the secret",
      "Pasting into wrong field (there might be multiple API-related fields)"
    ],
    needsHelp: "The shared secret is NOT the same as your API key. It's a separate value found in App Store Connect, not RevenueCat."
  },

  // ============================================
  // MISSING APP STORE CONNECT KEY IN REVENUECAT
  // ============================================
  MISSING_ASC_KEY_IN_REVENUECAT: {
    title: "Missing App Store Connect API Key in RevenueCat",
    description: "RevenueCat needs your Apple App Store Connect API credentials to sync subscription data. You need to add them to RevenueCat's settings.",
    estimatedTime: "5-10 minutes",
    steps: [
      {
        number: 1,
        instruction: "Get your App Store Connect API credentials",
        details: "You already have these! They're the same Issuer ID, Key ID, and P8 file you entered in SyncSimp Step 1."
      },
      {
        number: 2,
        instruction: "Open RevenueCat app settings",
        details: "Go to app.revenuecat.com → Your project → Apps → Select your iOS app"
      },
      {
        number: 3,
        instruction: "Find 'App Store Connect integration' section",
        details: "Scroll down to find 'App Store Connect API' or 'Service credentials' section"
      },
      {
        number: 4,
        instruction: "Enter Issuer ID",
        details: "Paste the same Issuer ID you used in SyncSimp (the UUID from App Store Connect)"
      },
      {
        number: 5,
        instruction: "Enter Key ID",
        details: "Paste the same 10-character Key ID"
      },
      {
        number: 6,
        instruction: "Upload the P8 file",
        details: "Click 'Upload' or 'Choose file' and select the same .p8 file you used in SyncSimp"
      },
      {
        number: 7,
        instruction: "Save the configuration",
        details: "Click 'Save' or 'Update' button. RevenueCat will test the connection."
      },
      {
        number: 8,
        instruction: "Run validation check again",
        details: "Come back to SyncSimp and tap 'Run Validation Check' again"
      }
    ],
    commonMistakes: [
      "Using a different API key in RevenueCat vs SyncSimp (they should be the same)",
      "Not clicking 'Save' after entering credentials",
      "Uploading wrong P8 file"
    ],
    needsHelp: "RevenueCat needs these credentials to automatically sync purchase data from Apple. It's the same API key you're using in SyncSimp."
  },

  // ============================================
  // CONFIGURATION ERRORS
  // ============================================
  MISSING_REVENUECAT_IDS: {
    title: "Missing RevenueCat Project or App ID",
    description: "You need to enter your RevenueCat Project ID and iOS App ID in Step 2 (Configuration).",
    estimatedTime: "3-5 minutes",
    steps: [
      {
        number: 1,
        instruction: "Go back to Step 2 (Configure Products)",
        details: "Tap the back button, then tap 'Step 2: Configure Products' on your project screen"
      },
      {
        number: 2,
        instruction: "Get your RevenueCat Project ID",
        details: "Go to app.revenuecat.com → Select your project → Click 'Project Settings' (gear icon) → Copy the 'Project ID' (looks like 'proj_abc123')"
      },
      {
        number: 3,
        instruction: "Get your RevenueCat iOS App ID",
        details: "Still in RevenueCat → Click 'Apps' in sidebar → Find your iOS app → Copy the 'App ID' (looks like 'app_abc123' or a UUID). This is NOT your Apple Bundle ID!"
      },
      {
        number: 4,
        instruction: "Enter both IDs in Step 2",
        details: "Paste the Project ID and iOS App ID into the form at the top of the Config Wizard screen"
      },
      {
        number: 5,
        instruction: "Tap 'Help' for visual guide",
        details: "If you're having trouble finding these IDs, tap the 'Help' button on the Config screen for screenshots"
      }
    ],
    commonMistakes: [
      "Confusing RevenueCat App ID with Apple Bundle ID (they're different!)",
      "Using the project name instead of project ID",
      "Not saving after entering the IDs"
    ],
    needsHelp: "The RevenueCat App ID is in the Apps section of RevenueCat, NOT in Apple. It's a unique identifier RevenueCat assigns."
  },

  // ============================================
  // GENERAL NETWORK/SYSTEM ERRORS
  // ============================================
  APPLE_ACCOUNT_SETUP_REQUIRED: {
    title: "Apple Account Setup Required",
    description: "Apple is blocking in-app purchase creation. Complete these 3 parts in App Store Connect to fix this.",
    estimatedTime: "15-30 minutes (one-time setup)",
    steps: [
      {
        number: 1,
        instruction: "PART 1: Sign Agreements & Add Banking/Tax",
        details: "Go to appstoreconnect.apple.com > Click 'Business' (top menu) > Sign 'Paid Applications Agreement' > Add Banking info > Complete Tax forms"
      },
      {
        number: 2,
        instruction: "PART 2: Fill in App Information",
        details: "Go to your app > 'App Information' > Add: Category, Age Rating, Privacy Policy URL, Support URL"
      },
      {
        number: 3,
        instruction: "PART 3: Add Basic Version Info",
        details: "Click your version (e.g. '1.0') > Add: App name, Description, Keywords (screenshots not required yet)"
      },
      {
        number: 4,
        instruction: "Run sync again",
        details: "Wait a few minutes for Apple to process, then tap 'Run Sync' again"
      }
    ],
    commonMistakes: [
      "Skipping the Privacy Policy URL (required for subscriptions)",
      "Not clicking 'Save' after changes",
      "Not waiting for Apple to process (takes 2-5 min)"
    ],
    needsHelp: "This is a one-time setup. Apple requires complete account and app info before allowing in-app purchase creation via API."
  },

  NETWORK_ERROR: {
    title: "Network Connection Error",
    description: "Cannot connect to Apple or RevenueCat servers. Check your internet connection.",
    estimatedTime: "2-5 minutes",
    steps: [
      {
        number: 1,
        instruction: "Check your internet connection",
        details: "Make sure you're connected to WiFi or cellular data and can access websites"
      },
      {
        number: 2,
        instruction: "Try running the validation check again",
        details: "Sometimes API servers have temporary hiccups. Wait 30 seconds and try again."
      },
      {
        number: 3,
        instruction: "Check if Apple or RevenueCat are having issues",
        details: "Visit developer.apple.com/system-status to see if App Store Connect is down"
      },
      {
        number: 4,
        instruction: "Restart the app if problem persists",
        details: "Force quit the Vibecode app and reopen it, then try the validation again"
      }
    ],
    commonMistakes: [
      "Running validation while on poor connection",
      "Firewall or VPN blocking API requests"
    ],
    needsHelp: "If you consistently can't connect, check if your work/school network blocks App Store Connect API"
  },

  // ============================================
  // EAS BUILD & SUBMISSION ERRORS
  // ============================================
  EAS_MISSING_CREDENTIALS: {
    title: "Missing App Store Connect API Credentials",
    description: "EAS needs your App Store Connect API credentials to submit your app. You must configure these in your EAS account.",
    estimatedTime: "10-15 minutes",
    steps: [
      {
        number: 1,
        instruction: "Get your App Store Connect API Key",
        details: "Go to appstoreconnect.apple.com → Users and Access → Keys → Create a new API key with 'App Manager' role or use an existing one"
      },
      {
        number: 2,
        instruction: "Download the P8 file",
        details: "Download the .p8 private key file (you can only download this once, so save it safely!)"
      },
      {
        number: 3,
        instruction: "Copy Key ID and Issuer ID",
        details: "Copy the 10-character Key ID and the Issuer ID (UUID format) from the Keys page"
      },
      {
        number: 4,
        instruction: "Add credentials to EAS",
        details: "Run 'eas credentials' in your terminal, select iOS, then 'App Store Connect API Key', and follow prompts to add Issuer ID, Key ID, and upload the P8 file"
      },
      {
        number: 5,
        instruction: "Try building again",
        details: "Once credentials are configured, run your build/submit command again"
      }
    ],
    commonMistakes: [
      "Using wrong API key role (must be 'App Manager' or higher)",
      "Losing the P8 file (can only download once)",
      "Not running 'eas credentials' to configure"
    ],
    needsHelp: "See EAS documentation: https://docs.expo.dev/submit/ios/#optional-uploading-your-app-to-testflight-and-the-app-store"
  },

  EAS_INVALID_BUNDLE_ID: {
    title: "Bundle ID Mismatch or Not Registered",
    description: "The bundle ID in your app.json doesn't match what's registered in App Store Connect, or the app doesn't exist yet.",
    estimatedTime: "10-15 minutes",
    steps: [
      {
        number: 1,
        instruction: "Check your bundle ID in app.json",
        details: "Open app.json or app.config.js and verify the 'ios.bundleIdentifier' value (e.g., 'com.yourcompany.appname')"
      },
      {
        number: 2,
        instruction: "Register the Bundle ID in Apple Developer Portal",
        details: "Go to developer.apple.com → Identifiers → Click '+' → Register an App ID with the EXACT bundle ID from your app.json. Enable 'In-App Purchase' capability if needed."
      },
      {
        number: 3,
        instruction: "Create the app in App Store Connect",
        details: "Go to appstoreconnect.apple.com → Apps → Click '+' → New App. Select the bundle ID you just registered."
      },
      {
        number: 4,
        instruction: "Fill in required app information",
        details: "Add app name, primary language, and other required fields. You don't need to fill everything to submit a build - just the basics."
      },
      {
        number: 5,
        instruction: "Try submitting again",
        details: "Wait 1-2 minutes for Apple's systems to sync, then run your submit command again"
      }
    ],
    commonMistakes: [
      "Bundle ID has typos or different capitalization",
      "Forgot to create the app in App Store Connect (just registering the ID isn't enough)",
      "Using a wildcard bundle ID instead of explicit"
    ],
    needsHelp: "Bundle IDs are case-sensitive and must match EXACTLY between app.json, Developer Portal, and App Store Connect"
  },

  EAS_INVALID_PROVISIONING: {
    title: "Provisioning Profile or Certificate Issue",
    description: "There's a problem with your provisioning profile or signing certificate. This usually happens when certificates expire or are misconfigured.",
    estimatedTime: "10-20 minutes",
    steps: [
      {
        number: 1,
        instruction: "Clear existing credentials",
        details: "Run 'eas credentials' → Select your project → iOS → 'Remove all credentials' to start fresh"
      },
      {
        number: 2,
        instruction: "Let EAS manage credentials automatically",
        details: "In eas.json, ensure 'credentialsSource: remote' is set under the iOS build profile. This lets EAS handle certificates for you."
      },
      {
        number: 3,
        instruction: "Revoke old certificates in Apple Developer Portal (if needed)",
        details: "Go to developer.apple.com → Certificates → Check for expired or duplicate certificates. Revoke old/expired ones."
      },
      {
        number: 4,
        instruction: "Rebuild with fresh credentials",
        details: "Run 'eas build --platform ios --clear-cache' to generate new certificates and provisioning profiles"
      },
      {
        number: 5,
        instruction: "If still failing, check Team ID",
        details: "Verify your Apple Team ID in app.json matches your actual team ID (found in developer.apple.com membership page)"
      }
    ],
    commonMistakes: [
      "Using expired certificates",
      "Manually managing credentials when EAS should do it",
      "Wrong Apple Team ID in configuration",
      "Certificate created for wrong bundle ID"
    ],
    needsHelp: "For most cases, letting EAS manage credentials automatically ('credentialsSource: remote') is easier than manual management"
  },

  EAS_MISSING_AGREEMENT: {
    title: "Apple Developer Program Agreements Not Signed",
    description: "You haven't accepted the latest Apple Developer Program agreements. This blocks submissions until you accept.",
    estimatedTime: "3-5 minutes",
    steps: [
      {
        number: 1,
        instruction: "Log into App Store Connect",
        details: "Go to appstoreconnect.apple.com and sign in"
      },
      {
        number: 2,
        instruction: "Look for the red banner at the top",
        details: "If there are pending agreements, you'll see a prominent red/orange banner saying 'Action Required' or 'Review Agreement'"
      },
      {
        number: 3,
        instruction: "Click the banner and review agreements",
        details: "Click the banner or go to Agreements, Tax, and Banking section → Read and accept all pending agreements"
      },
      {
        number: 4,
        instruction: "Wait a few minutes",
        details: "Apple's systems take 2-5 minutes to process the agreement acceptance"
      },
      {
        number: 5,
        instruction: "Try submitting again",
        details: "After waiting, run your submit command again"
      }
    ],
    commonMistakes: [
      "Not checking App Store Connect web interface (agreements aren't in developer.apple.com)",
      "Accepting agreements but not waiting for Apple to process",
      "Multiple team members needing to accept (check if you're Account Holder)"
    ],
    needsHelp: "Only the Account Holder role can accept legal agreements. If you're not the Account Holder, ask them to sign in and accept."
  },

  EAS_BUILD_FAILED: {
    title: "EAS Build Failed (Compilation Error)",
    description: "Your app failed to compile during the build process. This is usually a code or dependency issue.",
    estimatedTime: "15-45 minutes (depends on the error)",
    steps: [
      {
        number: 1,
        instruction: "Check the build logs",
        details: "Go to expo.dev → Your project → Builds → Click the failed build → Read the full error log to find the specific error"
      },
      {
        number: 2,
        instruction: "Common issues to look for",
        details: "Look for: missing dependencies (run 'npm install'), TypeScript errors, native module compatibility issues, or Xcode version mismatches"
      },
      {
        number: 3,
        instruction: "Test locally first",
        details: "Run 'npx expo run:ios' locally to catch build errors before submitting to EAS. Fix any errors that appear."
      },
      {
        number: 4,
        instruction: "Check Expo SDK compatibility",
        details: "Ensure all packages are compatible with your Expo SDK version. Run 'npx expo-doctor' to check for issues."
      },
      {
        number: 5,
        instruction: "Clear cache and rebuild",
        details: "Run 'eas build --platform ios --clear-cache' to rebuild with a clean slate"
      }
    ],
    commonMistakes: [
      "Not reading the full build log (the actual error is usually at the bottom)",
      "Using incompatible package versions",
      "Missing native dependencies or incorrect setup",
      "Outdated Xcode version on EAS servers"
    ],
    needsHelp: "Build logs are essential - always read the FULL log to find the actual error. Search for 'error:' or 'ERROR' in the logs."
  },

  EAS_SUBMIT_TIMEOUT: {
    title: "App Store Connect Upload Timeout",
    description: "The upload to App Store Connect timed out. This usually happens with large app files or slow connections.",
    estimatedTime: "5-10 minutes",
    steps: [
      {
        number: 1,
        instruction: "Check your app size",
        details: "Large apps (>200MB) can timeout. Check your build size in the EAS build page."
      },
      {
        number: 2,
        instruction: "Try submitting again",
        details: "Timeouts are often temporary. Simply run 'eas submit --platform ios' again with the same build ID."
      },
      {
        number: 3,
        instruction: "Use manual upload as fallback",
        details: "Download the .ipa file from EAS and use Transporter app (macOS) to manually upload to App Store Connect"
      },
      {
        number: 4,
        instruction: "Reduce app size if needed",
        details: "If this happens repeatedly, consider optimizing your app: compress images, remove unused assets, enable asset optimization in app.json"
      }
    ],
    commonMistakes: [
      "Giving up after first timeout (usually works on retry)",
      "Not enabling asset optimization in Expo config",
      "Including unnecessary large files in the build"
    ],
    needsHelp: "Transporter app is Apple's official tool for uploading .ipa files: https://apps.apple.com/us/app/transporter/id1450874784"
  },

  EAS_INVALID_VERSION: {
    title: "Version Number or Build Number Issue",
    description: "The version or build number in your app.json conflicts with an existing build in App Store Connect.",
    estimatedTime: "3-5 minutes",
    steps: [
      {
        number: 1,
        instruction: "Check your current version in app.json",
        details: "Open app.json and look at 'version' (e.g., '1.0.0') and 'ios.buildNumber' (e.g., '1')"
      },
      {
        number: 2,
        instruction: "Check App Store Connect for existing versions",
        details: "Go to appstoreconnect.apple.com → Your app → TestFlight or App Store → See what versions/builds already exist"
      },
      {
        number: 3,
        instruction: "Increment the build number",
        details: "In app.json, increase 'ios.buildNumber' by 1. For example, if it's '1', change it to '2'. Build numbers must always increase."
      },
      {
        number: 4,
        instruction: "Update version if releasing new features",
        details: "If this is a new release (not just a bug fix), also update 'version' (e.g., '1.0.0' → '1.0.1' or '1.1.0')"
      },
      {
        number: 5,
        instruction: "Rebuild and submit",
        details: "Run 'eas build --platform ios' again, then submit the new build"
      }
    ],
    commonMistakes: [
      "Forgetting that build numbers MUST always increase (can't reuse)",
      "Confusing version (1.0.0) with build number (1)",
      "Trying to upload the same build twice"
    ],
    needsHelp: "Build number is auto-incremented if you use 'eas build --auto-increment'. Version is what users see, build number is internal."
  },

  VIBECODE_BUNDLE_ID_OVERRIDE: {
    title: "Vibecode Overrode Your Bundle ID (Critical Issue)",
    description: "Vibecode's publish system auto-generates bundle IDs in the format 'com.vibecode.{appname}-{random}' and you CANNOT change it. This means your App Store Connect setup with a different bundle ID will never work. You must recreate everything using Vibecode's bundle ID.",
    estimatedTime: "30-60 minutes (complete redo)",
    steps: [
      {
        number: 1,
        instruction: "CRITICAL: Understand this is a Vibecode limitation",
        details: "Vibecode does NOT allow custom bundle IDs when using their publish system. The bundle ID 'com.vibecode.{appname}-{random}' is automatically assigned and cannot be changed through any Vibecode setting, ENV variable, or configuration."
      },
      {
        number: 2,
        instruction: "Find the exact Vibecode bundle ID from your build logs",
        details: "Look at your EAS build error logs and copy the EXACT bundle ID Vibecode generated (e.g., 'com.vibecode.syncsimp-aztxrv'). You'll need this exact string."
      },
      {
        number: 3,
        instruction: "Delete or abandon your existing App Store Connect app (if not submitted)",
        details: "If you haven't submitted your app to the App Store yet, you can delete it: Go to appstoreconnect.apple.com → Your App → App Information → Delete App. If you already submitted, you're stuck - the bundle ID can't be reused."
      },
      {
        number: 4,
        instruction: "Register Vibecode's bundle ID in Apple Developer Portal",
        details: "Go to developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → Click '+' → Select 'App IDs' → Enter the EXACT Vibecode bundle ID (e.g., com.vibecode.syncsimp-aztxrv) → Enable 'In-App Purchase' capability → Register"
      },
      {
        number: 5,
        instruction: "Create NEW app in App Store Connect with Vibecode's bundle ID",
        details: "Go to appstoreconnect.apple.com → Apps → '+' → New App → Platform: iOS → Name: Your app name → Bundle ID: Select the Vibecode bundle ID you just registered → SKU: any unique ID → Create"
      },
      {
        number: 6,
        instruction: "Update your app.json to match Vibecode's bundle ID (won't fix Vibecode, but keeps consistency)",
        details: "In app.json, change 'ios.bundleIdentifier' to match Vibecode's bundle ID. This won't fix the Vibecode publish system, but it keeps your local config consistent."
      },
      {
        number: 7,
        instruction: "If using RevenueCat/SyncSimp: Recreate with new bundle ID",
        details: "If you set up RevenueCat or used SyncSimp to configure in-app purchases, you need to: 1) Create a new app in RevenueCat with the Vibecode bundle ID, 2) Re-run SyncSimp configuration with the new bundle ID"
      },
      {
        number: 8,
        instruction: "Try publishing from Vibecode again",
        details: "Now that Apple has the Vibecode bundle ID registered, the publish should work. The build will still say 'com.vibecode.syncsimp-aztxrv' but Apple will accept it."
      }
    ],
    commonMistakes: [
      "Thinking you can change Vibecode's bundle ID (you can't - it's hardcoded)",
      "Trying ENV variables or settings to override (none exist)",
      "Not deleting the old App Store Connect app first (causes 'bundle ID already exists' errors)",
      "Forgetting to update RevenueCat and other services with the new bundle ID",
      "Not registering the EXACT bundle ID with the random suffix (e.g., missing '-aztxrv')"
    ],
    needsHelp: "This is a fundamental limitation of Vibecode's publish system. If you need a custom bundle ID, you cannot use Vibecode's publish feature. You would need to: 1) Eject from Vibecode, 2) Set up your own EAS account, 3) Configure your own bundle ID, 4) Publish through your own EAS setup. This defeats the purpose of Vibecode's automated publish system."
  },

  EAS_AUTHENTICATION_FAILED: {
    title: "App Store Connect Authentication Failed",
    description: "EAS couldn't authenticate with App Store Connect when trying to upload your app. This happens when your API credentials are missing, invalid, expired, or don't have the right permissions.",
    estimatedTime: "10-20 minutes",
    steps: [
      {
        number: 1,
        instruction: "Verify your App Store Connect API Key exists and is active",
        details: "Go to appstoreconnect.apple.com → Users and Access → Keys tab. Find your API key and confirm it shows as 'Active' (not revoked or expired)"
      },
      {
        number: 2,
        instruction: "Check the API Key has correct permissions",
        details: "Your API key MUST have 'App Manager' or 'Admin' role to upload builds. If it has a lesser role (like 'Developer' or 'Marketing'), it won't work. Create a new key with 'App Manager' role if needed."
      },
      {
        number: 3,
        instruction: "Get fresh credentials from App Store Connect",
        details: "If your key is old or you're unsure about it, create a NEW API key: Click '+' button → Name it (e.g., 'EAS Upload Key') → Select 'App Manager' access → Click 'Generate' → Download the P8 file immediately (you can only download once!)"
      },
      {
        number: 4,
        instruction: "Clear old credentials from EAS",
        details: "Run 'eas credentials' in your terminal → Select your project → iOS → 'App Store Connect API Key' → 'Remove credentials' to delete the old/broken credentials"
      },
      {
        number: 5,
        instruction: "Add the new credentials to EAS",
        details: "Still in 'eas credentials': Select 'App Store Connect API Key' → 'Add new credentials' → Enter Issuer ID (UUID from Keys page top), Key ID (10 characters), and upload the P8 file you just downloaded"
      },
      {
        number: 6,
        instruction: "Verify your Apple Developer account status",
        details: "Go to appstoreconnect.apple.com → Check for any red banners at the top. If you see 'Action Required' or agreement warnings, you must accept those first before uploads will work."
      },
      {
        number: 7,
        instruction: "Check if your Apple Developer Program membership is active",
        details: "Go to developer.apple.com → Account → Membership. Confirm your membership is 'Active' and not expired. Expired memberships block all uploads."
      },
      {
        number: 8,
        instruction: "Try submitting again with fresh credentials",
        details: "Run 'eas submit --platform ios' again. If you're still getting auth errors, double-check the Issuer ID and Key ID match EXACTLY (no typos or extra spaces)"
      }
    ],
    commonMistakes: [
      "Using an API key with insufficient permissions (needs 'App Manager' or 'Admin')",
      "API key was revoked but EAS still has the old credentials cached",
      "Typo in Issuer ID or Key ID when configuring EAS",
      "P8 file uploaded for a different API key than the Key ID entered",
      "Apple Developer Program membership expired",
      "Pending agreements in App Store Connect not accepted",
      "Using a key from a different Apple Developer team"
    ],
    needsHelp: "Authentication errors mean Apple is rejecting your credentials. The most common fix is creating a brand new API key with 'App Manager' role and adding it to EAS with 'eas credentials'. Make sure there are no pending agreements in App Store Connect."
  }
};

// Helper function to get the right error fix based on the validation result
export function getErrorFixForValidationResult(
  checkName: string,
  errorMessage: string
): ErrorFix | null {
  const lowerError = errorMessage.toLowerCase();

  // ============================================
  // EAS BUILD & SUBMISSION ERRORS (Priority check)
  // ============================================

  // Vibecode bundle ID override - Check this FIRST before authentication
  // This detects when Expo/Vibecode is using com.vibecode.* bundle ID
  if (lowerError.includes("com.vibecode.") ||
      (checkName.toLowerCase().includes("vibecode") && lowerError.includes("bundle"))) {
    return ERROR_FIXES.VIBECODE_BUNDLE_ID_OVERRIDE;
  }

  // Authentication failure - MUST check before general credentials check
  if ((lowerError.includes("failed to authenticate") ||
       lowerError.includes("failure to authenticate") ||
       lowerError.includes("authentication failed") ||
       lowerError.includes("authenticationerrordomain") ||
       (lowerError.includes("authenticate") && lowerError.includes("session"))) &&
      (lowerError.includes("app store") || lowerError.includes("altool") || lowerError.includes("upload"))) {
    return ERROR_FIXES.EAS_AUTHENTICATION_FAILED;
  }

  // Missing App Store Connect credentials for EAS
  if (lowerError.includes("credentials") &&
      (lowerError.includes("app store connect") || lowerError.includes("asc api") || lowerError.includes("submit"))) {
    return ERROR_FIXES.EAS_MISSING_CREDENTIALS;
  }

  // Bundle ID issues
  if (lowerError.includes("bundle") &&
      (lowerError.includes("identifier") || lowerError.includes("id") || lowerError.includes("mismatch"))) {
    return ERROR_FIXES.EAS_INVALID_BUNDLE_ID;
  }

  // Provisioning/certificate issues
  if (lowerError.includes("provisioning") ||
      lowerError.includes("certificate") ||
      lowerError.includes("signing") ||
      (lowerError.includes("profile") && lowerError.includes("invalid"))) {
    return ERROR_FIXES.EAS_INVALID_PROVISIONING;
  }

  // Agreement issues
  if (lowerError.includes("agreement") ||
      lowerError.includes("terms") ||
      (lowerError.includes("pending") && lowerError.includes("action"))) {
    return ERROR_FIXES.EAS_MISSING_AGREEMENT;
  }

  // Build failures
  if ((lowerError.includes("build") && lowerError.includes("failed")) ||
      lowerError.includes("compilation") ||
      lowerError.includes("compile error")) {
    return ERROR_FIXES.EAS_BUILD_FAILED;
  }

  // Timeout issues
  if (lowerError.includes("timeout") || lowerError.includes("timed out")) {
    return ERROR_FIXES.EAS_SUBMIT_TIMEOUT;
  }

  // Version/build number conflicts
  if ((lowerError.includes("version") || lowerError.includes("build number")) &&
      (lowerError.includes("exists") || lowerError.includes("duplicate") || lowerError.includes("conflict"))) {
    return ERROR_FIXES.EAS_INVALID_VERSION;
  }

  // ============================================
  // SYNCSIMP VALIDATION ERRORS
  // ============================================

  // Apple Account Setup Required (403 FORBIDDEN on IAP creation)
  if (errorMessage.includes("APPLE_ACCOUNT_SETUP_REQUIRED") ||
      errorMessage.includes("APPLE ACCOUNT SETUP REQUIRED") ||
      errorMessage.includes("Paid Applications Agreement") ||
      errorMessage.includes("Banking") && errorMessage.includes("Tax") ||
      (errorMessage.includes("does not allow 'CREATE'") && errorMessage.includes("inAppPurchases"))) {
    return ERROR_FIXES.APPLE_ACCOUNT_SETUP_REQUIRED;
  }

  // Apple Credentials
  if (checkName === "Apple Credentials") {
    if (errorMessage.includes("Missing credentials") || errorMessage.includes("missing credentials")) {
      return ERROR_FIXES.MISSING_APPLE_CREDENTIALS;
    }
    if (errorMessage.includes("invalid") || errorMessage.includes("Invalid")) {
      return ERROR_FIXES.APPLE_CREDENTIALS_INVALID;
    }
  }

  // App Store Connect
  if (checkName === "App Store Connect") {
    if (errorMessage.includes("not found") || errorMessage.includes("Not found")) {
      return ERROR_FIXES.APP_NOT_FOUND_IN_ASC;
    }
  }

  // RevenueCat Connection
  if (checkName === "RevenueCat Connection") {
    if (errorMessage.includes("Missing") || errorMessage.includes("missing")) {
      return ERROR_FIXES.MISSING_REVENUECAT_CREDENTIALS;
    }
    // Match any failure-related messages
    if (
      errorMessage.includes("Connection failed") ||
      errorMessage.includes("connection failed") ||
      errorMessage.includes("failed") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("not exist")
    ) {
      return ERROR_FIXES.REVENUECAT_CONNECTION_FAILED;
    }
  }

  // Configuration Valid - this combines multiple checks, so show a comprehensive fix
  if (checkName === "Configuration Valid") {
    // Check for specific issues first
    if (errorMessage.includes("IAP") || errorMessage.includes("Shared Secret")) {
      return ERROR_FIXES.MISSING_IAP_SECRET;
    }
    if (errorMessage.includes("ASC") || errorMessage.includes("App Store Connect key")) {
      return ERROR_FIXES.MISSING_ASC_KEY_IN_REVENUECAT;
    }
    // If it mentions RevenueCat connection but not the specific keys, it's probably the API key
    if (errorMessage.includes("RevenueCat connection")) {
      return ERROR_FIXES.REVENUECAT_CONNECTION_FAILED;
    }
    if (errorMessage.includes("RevenueCat")) {
      return ERROR_FIXES.MISSING_REVENUECAT_IDS;
    }
    // For general configuration failures, show the RevenueCat connection fix as default
    return ERROR_FIXES.REVENUECAT_CONNECTION_FAILED;
  }

  // Network errors
  if (lowerError.includes("network") || lowerError.includes("connection")) {
    return ERROR_FIXES.NETWORK_ERROR;
  }

  return null;
}
